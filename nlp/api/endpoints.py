"""FastAPI route handlers untuk Lapis AI NLP API."""

import logging
import os
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


# ── Router & Logger ────────────────────────────────────────────────────────────

router = APIRouter()
logger = logging.getLogger("endpoints")

# ── Singleton Component State ──────────────────────────────────────────────────

_pipeline  : Optional[RetrievalPipeline]  = None
_fetcher   : Optional[LiveContextFetcher] = None
_builder   : Optional[PromptBuilder]      = None
_llm       : Optional[LLMInterface]       = None
_extractor : CitationExtractor            = CitationExtractor()
_start_time: float                        = time.time()


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


async def _run_ingest_background(
    document_id: str,
    file_path  : str,
    filename   : str,
    doc_type   : Optional[str],
) -> None:
    """Proses ingest dokumen di background thread — copy, chunk, embed, upsert."""
    _log = logging.getLogger("endpoints.ingest.background")
    _log.info("Background ingest dimulai: %s (id=%s)", filename, document_id)

    try:
        import shutil
        import yaml
        from pathlib import Path

        with open("nlp/configs/config.yaml", "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)
        raw_dir = Path(config["paths"]["data_raw"])

        # Copy file ke raw_dir
        dest = raw_dir / filename
        shutil.copy2(file_path, dest)
        _log.info("File di-copy ke: %s", dest)

        # Ingestion
        from nlp.ingestion import DocumentIngestionPipeline
        ingestion      = DocumentIngestionPipeline()
        doc_metadata   = ingestion.process_single_file(dest)

        if doc_metadata is None:
            _log.error("Ingestion gagal untuk %s", filename)
            return

        # Chunking
        from nlp.chunking.router import ChunkerRouter
        chunk_router = ChunkerRouter()
        chunks       = chunk_router.route(doc_metadata.doc_id)

        if not chunks:
            _log.warning("Tidak ada chunk yang dihasilkan dari %s", filename)
            return

        # Embedding + Upsert
        embedder = EmbeddingModel.get_instance()
        embedder.load_model()
        embedded = embedder.embed_chunks([c.to_dict() for c in chunks])

        vs = VectorStore()
        upserted = vs.upsert_chunks(embedded)

        _log.info(
            "Ingest selesai: %s | %d chunks | %d upserted",
            filename, len(chunks), upserted,
        )

    except Exception as e:
        _log.error("Background ingest error untuk %s: %s", filename, e, exc_info=True)


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

    background_tasks.add_task(
        _run_ingest_background,
        request.document_id,
        request.file_path,
        request.filename,
        request.doc_type,
    )

    _log.info(
        "Ingest accepted: %s (id=%s)", request.filename, request.document_id
    )

    return IngestResponse(
        document_id = request.document_id,
        status      = "accepted",
        message     = f"Dokumen '{request.filename}' diterima dan sedang diproses",
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

        # Cek LLM
        _, _, _, llm, _ = get_components()
        llm_provider    = llm.primary_provider
        if llm.primary_provider == "nvidia" and not llm.nvidia_key:
            llm_status = "mock"
        elif llm.primary_provider == "google" and not llm.google_key:
            llm_status = "mock"
        elif llm.primary_provider == "anthropic" and not llm.anthropic_key:
            llm_status = "mock"
        else:
            llm_status = "ok"

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
