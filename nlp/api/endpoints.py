"""FastAPI route handlers untuk Lapis AI NLP API."""

import asyncio
import logging
import os
import threading
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException

from nlp.api.citation import CitationExtractor
from nlp.api.schemas import (
    CitationItem,
    ErrorResponse,
    HealthResponse,
    IngestRequest,
    IngestResponse,
    LiveContextSnapshot,
    QueryRequest,
    QueryResponse,
)
from nlp.embeddings.embedder import EmbeddingModel, load_all_chunks
from nlp.embeddings.vector_store import VectorStore
from nlp.prompting.live_context import LiveContextFetcher
from nlp.prompting.llm_interface import LLMInterface
from nlp.prompting.prompt_builder import PromptBuilder
from nlp.retrieval.pipeline import RetrievalPipeline
from nlp.retrieval.intent_classifier import IntentClassifier


# ── Singleton Component State ──────────────────────────────────────────────────

_pipeline  : Optional[RetrievalPipeline]  = None
_fetcher   : Optional[LiveContextFetcher] = None
_builder   : Optional[PromptBuilder]      = None
_llm       : Optional[LLMInterface]       = None
_extractor : CitationExtractor            = CitationExtractor()
_start_time: float                        = time.time()

_intent_classifier = IntentClassifier()
_prompt_builder_instance = PromptBuilder()


# ── Router & Logger ────────────────────────────────────────────────────────────

router = APIRouter()
logger = logging.getLogger("endpoints")


def get_components():
    """Lazy init semua komponen — hanya dibuat sekali selama lifetime service."""
    global _pipeline, _fetcher, _builder, _llm

    if _pipeline is None:
        logger.info("Initializing RetrievalPipeline...")
        _pipeline = RetrievalPipeline()

    if _fetcher is None:
        logger.info("Initializing LiveContextFetcher...")
        _fetcher = LiveContextFetcher()

    if _builder is None:
        logger.info("Initializing PromptBuilder...")
        _builder = PromptBuilder()

    if _llm is None:
        logger.info("Initializing LLMInterface...")
        _llm = LLMInterface()

    return _pipeline, _fetcher, _builder, _llm, _extractor


# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 1 — QUERY
# ══════════════════════════════════════════════════════════════════════════════


@router.post(
    "/query",
    response_model = QueryResponse,
    summary        = "Query RAG Pipeline",
    description    = "Terima pertanyaan teknisi, return jawaban + citations",
)
async def query_endpoint(request: QueryRequest) -> QueryResponse:
    """Handle query dari teknisi melalui Backend."""
    _log = logging.getLogger("endpoints.query")

    # ── Intent Classification & Shortcircuit ──────────────────────────────
    intent_result = _intent_classifier.classify(
        query=request.query,
        history=request.history or [],
    )
    
    if intent_result.intent.value in (
        "document_inquiry",
    ):
        try:
            vs = VectorStore()
        except Exception:
            vs = None
        
        sc = _prompt_builder_instance.build_dynamic_response(
            query=request.query,
            intent_result=intent_result,
            vector_store=vs,
        )
        
        if sc["shortcircuit"]:
            return {
                "query_id": f"QRY-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-SC",
                "query": request.query,
                "answer": sc["response"],
                "action_suggestions": [],
                "citations": [],
                "live_context_used": False,
                "live_context_data": [],
                "mode": sc["intent"],
                "provider_used": "shortcircuit",
                "model_used": "none",
                "confidence": "high",
                "latency_ms": 0,
                "session_id": getattr(request, "session_id", None),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
    # ── End Shortcircuit — lanjut ke retrieval pipeline normal ────────────

    pipeline, fetcher, builder, llm, extractor = get_components()

    query_id = (
        f"QRY-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        f"-{str(uuid.uuid4())[:4].upper()}"
    )

    try:
        t0 = time.time()

        # 1. Retrieval
        machine_ids = request.machine_ids or []
        results, route = pipeline.run(
            query            = request.query,
            machine_ids_hint = machine_ids if machine_ids else None,
            use_reranker     = request.use_reranker,
            use_hybrid       = request.use_hybrid,
        )

        # 2. Live Context
        live_data: list = []
        live_context_used = False
        if machine_ids:
            live_data         = [fetcher.fetch(mid) for mid in machine_ids]
            live_context_used = any(lc.should_inject() for lc in live_data)

        # 3. Build prompt
        history_dicts = [
            {"role": m.role, "content": m.content}
            for m in (request.history or [])
        ]
        prompt_pkg = builder.build(
            query             = request.query,
            results           = results,
            live_context_data = live_data if live_context_used else None,
            history           = history_dicts if history_dicts else None,
            historical_context= getattr(request, "historical_context", None),
        )

        # 4. Generate LLM response
        llm_response = llm.generate(prompt_pkg)

        # 5. Format output
        citations      = extractor.extract_citations(results)
        live_snapshots = extractor.format_live_context_snapshot(live_data)
        confidence     = extractor.determine_confidence(results, live_context_used)
        total_latency  = int((time.time() - t0) * 1000)

        _log.info(
            "Query OK | id=%s | mode=%s | results=%d | latency=%dms",
            query_id, route.mode.value, len(results), total_latency,
        )

        return QueryResponse(
            query_id           = query_id,
            query              = request.query,
            answer             = llm_response.answer,
            action_suggestions = llm_response.action_suggestions,
            citations          = citations,
            live_context_used  = live_context_used,
            live_context_data  = live_snapshots if live_snapshots else None,
            mode               = route.mode.value,
            provider_used      = llm_response.provider_used,
            model_used         = llm_response.model_used,
            confidence         = confidence,
            latency_ms         = total_latency,
            session_id         = request.session_id,
            timestamp          = datetime.now(timezone.utc).isoformat(),
        )

    except Exception as e:
        _log.error("Query endpoint error: %s", e, exc_info=True)
        raise HTTPException(
            status_code = 500,
            detail      = f"Pipeline error: {str(e)}",
        )


# ══════════════════════════════════════════════════════════════════════════════
# BACKGROUND INGEST TASK
# ══════════════════════════════════════════════════════════════════════════════

# ── Callback Helper ────────────────────────────────────────────────────────────


def _do_callback(document_id: str, status: str, chunks_count: int = 0, error: str = "") -> None:
    """Sync HTTP PATCH ke backend — dipanggil dalam thread executor."""
    import httpx

    backend_url  = os.getenv("BACKEND_URL", "http://host.docker.internal:3000")
    internal_key = os.getenv("INTERNAL_API_KEY", "")
    url          = f"{backend_url}/api/admin/documents/{document_id}/status"
    payload      = {"status": status, "chunks_count": chunks_count}
    if error:
        payload["error"] = error

    try:
        # Gunakan httpx karena lebih robust menangani IPv4/IPv6 fallback di Docker Desktop
        with httpx.Client(timeout=10.0) as client:
            resp = client.patch(
                url,
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "X-Internal-Key": internal_key,
                },
            )
            resp.raise_for_status()
            logging.getLogger("endpoints.callback").info(
                "Callback OK: %s → %s (%d)", document_id, status, resp.status_code
            )
    except Exception as cb_err:
        logging.getLogger("endpoints.callback").error(
            "Callback GAGAL: %s → %s | %s", document_id, status, cb_err
        )


async def _callback_backend(
    document_id: str,
    status     : str,
    chunks_count: int = 0,
    error      : str  = "",
) -> None:
    """Async wrapper — jalankan HTTP callback di thread agar tidak block event loop."""
    await asyncio.to_thread(_do_callback, document_id, status, chunks_count, error)


def _adaptive_chunk_to_embed_dict(chunk) -> dict:
    """Convert adaptive_chunker.BaseChunk → format dict yang diharapkan embed_chunks."""
    meta = chunk.metadata or {}
    return {
        "chunk_id"    : chunk.chunk_id,
        "doc_type"    : meta.get("doc_type", "unknown"),
        "source_doc"  : meta.get("source_file", chunk.doc_id),
        "source_page" : meta.get("source_page", 1),
        "chunk_type"  : chunk.strategy_used,
        "text_content": chunk.text,
        "machine_ids" : meta.get("detected_machine_ids", ["ALL"]),
        "priority"    : 2,
        "section"     : chunk.section_name,
        "chunk_index" : chunk.chunk_index,
        "char_count"  : chunk.char_count,
        "language"    : meta.get("detected_language", "id"),
    }


import queue

_ingest_queue = queue.Queue()
_worker_thread: Optional[threading.Thread] = None
_worker_lock = threading.Lock()

def _ingest_worker() -> None:
    """Worker thread tunggal untuk memproses antrean ingestion secara sekuensial."""
    _log = logging.getLogger("endpoints.ingest.worker")
    _log.info("Background ingest worker thread started.")
    
    while True:
        try:
            task = _ingest_queue.get()
            if task is None:
                break
                
            document_id, file_path, filename, doc_type = task
            _log.info("Worker processing task: %s (id=%s)", filename, document_id)
            
            try:
                import shutil
                import yaml
                import gc
                from pathlib import Path

                with open("nlp/configs/config.yaml", "r", encoding="utf-8") as f:
                    config = yaml.safe_load(f)
                raw_dir = Path(config["paths"]["data_raw"])

                # Copy file ke raw_dir
                dest = raw_dir / filename
                src  = Path(file_path).resolve()
                if src.resolve() != dest.resolve():
                    shutil.copy2(file_path, dest)
                    _log.info("File di-copy ke: %s", dest)
                else:
                    _log.info("File sudah ada di raw_dir, skip copy: %s", dest)

                # Ingestion
                from nlp.ingestion import DocumentIngestionPipeline
                ingestion      = DocumentIngestionPipeline()
                doc_metadata   = ingestion.process_single_file(dest)

                if doc_metadata is None:
                    _log.error("Ingestion gagal untuk %s", filename)
                    _do_callback(document_id, "failed", error="Failed to parse document")
                    continue

                # Chunking
                from nlp.chunking.router import ChunkerRouter
                chunk_router = ChunkerRouter()
                chunks       = chunk_router.route(doc_metadata.doc_id)

                if not chunks:
                    _log.warning("Tidak ada chunk yang dihasilkan dari %s", filename)
                    _do_callback(document_id, "failed", error="No chunks generated")
                    continue

                # Embedding + Upsert
                embedder = EmbeddingModel.get_instance()
                embedder.load_model()
                embedded = embedder.embed_chunks(
                    [_adaptive_chunk_to_embed_dict(c) for c in chunks]
                )

                vs = VectorStore()
                upserted = vs.upsert_chunks(embedded)

                _log.info(
                    "Ingest selesai: %s | %d chunks | %d upserted",
                    filename, len(chunks), upserted,
                )
                _do_callback(document_id, "ready", chunks_count=upserted)

            except Exception as e:
                _log.error("Ingest worker task error untuk %s: %s", filename, e, exc_info=True)
                _do_callback(document_id, "failed", error=str(e))
                
            finally:
                gc.collect()
                _ingest_queue.task_done()
                
        except Exception as queue_err:
            _log.error("Fatal queue worker error: %s", queue_err)


def start_ingest_worker_if_needed() -> None:
    global _worker_thread
    with _worker_lock:
        if _worker_thread is None or not _worker_thread.is_alive():
            _worker_thread = threading.Thread(target=_ingest_worker, name="IngestWorkerThread", daemon=True)
            _worker_thread.start()


# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 2 — INGEST
# ══════════════════════════════════════════════════════════════════════════════


@router.post(
    "/ingest",
    response_model = IngestResponse,
    summary        = "Ingest dokumen baru",
    description    = "Terima dokumen dari Backend, proses ke vector DB di background",
)
async def ingest_endpoint(
    request         : IngestRequest,
    background_tasks: BackgroundTasks,
) -> IngestResponse:
    """Terima dokumen dari Backend dan proses di background task."""
    _log = logging.getLogger("endpoints.ingest")

    if not os.path.exists(request.file_path):
        raise HTTPException(
            status_code = 404,
            detail      = f"File tidak ditemukan: {request.file_path}",
        )

    start_ingest_worker_if_needed()
    _ingest_queue.put((
        request.document_id,
        request.file_path,
        request.filename,
        request.doc_type,
    ))

    _log.info(
        "Ingest accepted into queue: %s (id=%s)", request.filename, request.document_id
    )

    return IngestResponse(
        document_id = request.document_id,
        status      = "accepted",
        message     = f"Dokumen '{request.filename}' diterima dan sedang diproses dalam antrean",
    )


# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 3 — HEALTH CHECK
# ══════════════════════════════════════════════════════════════════════════════


@router.get(
    "/health",
    response_model = HealthResponse,
    summary        = "Health check NLP service",
)
async def health_endpoint() -> HealthResponse:
    """Return status semua komponen NLP service."""
    _log = logging.getLogger("endpoints.health")

    try:
        # Cek vector DB
        pipeline_inst, _, _, _, _ = get_components()
        vs             = pipeline_inst.retriever.vector_store
        collection_ok  = vs.collection_exists()
        chunks_count   = 0
        if collection_ok:
            info         = vs.get_collection_info()
            chunks_count = info.get("points_count") or 0

        # Cek embedding model
        embedder     = EmbeddingModel.get_instance()
        model_status = "loaded" if embedder._loaded else "not_loaded"

        # Cek LLM — OpenAI sebagai provider aktif
        _, _, _, llm, _ = get_components()
        llm_provider = getattr(llm, 'primary_provider', 'openai')
        openai_key   = os.environ.get('OPENAI_API_KEY', '')
        llm_status   = 'ok' if openai_key else 'mock'

        uptime = time.time() - _start_time

        return HealthResponse(
            status          = "ok" if collection_ok else "degraded",
            vector_db       = "ok" if collection_ok else "error",
            embedding_model = model_status,
            llm_provider    = llm_provider,
            llm_status      = llm_status,
            chunks_indexed  = chunks_count,
            uptime_seconds  = round(uptime, 1),
            version         = "1.0.0",
        )

    except Exception as e:
        _log.error("Health check error: %s", e)
        return HealthResponse(
            status          = "error",
            vector_db       = "error",
            embedding_model = "error",
            llm_provider    = "unknown",
            llm_status      = "error",
        )
