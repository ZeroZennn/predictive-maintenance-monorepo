"""Hybrid retriever (Dense + BM25 + RRF) untuk Lapis AI RAG Pipeline."""

import json
import logging
import yaml
from collections import defaultdict
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from rank_bm25 import BM25Okapi

from nlp.embeddings.embedder import EmbeddingModel
from nlp.embeddings.vector_store import VectorStore
from nlp.retrieval.query_router import QueryMode, RouterResult


# ── Logging Setup ──────────────────────────────────────────────────────────────

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


# ── Dataclass ──────────────────────────────────────────────────────────────────


@dataclass
class RetrievalResult:
    """Satu chunk hasil retrieval dengan skor dense, BM25, dan RRF."""

    chunk_id        : str
    score           : float                           # skor final
    dense_score     : Optional[float] = None
    bm25_score      : Optional[float] = None
    rrf_score       : Optional[float] = None
    chunk_type      : str = ""
    machine_ids     : List[str] = field(default_factory=list)
    source_doc      : str = ""
    source_page     : int = 0
    doc_type        : str = ""
    priority        : int = 1
    text_content    : str = ""
    retrieval_method: str = "hybrid"   # "dense" | "bm25" | "hybrid"

    def to_dict(self) -> Dict:
        """Serialisasi RetrievalResult ke plain dict."""
        return asdict(self)

    def get_citation(self) -> Dict:
        """Return citation card untuk Frontend."""
        return {
            "source_doc": self.source_doc,
            "page"      : self.source_page,
            "chunk_id"  : self.chunk_id,
            "doc_type"  : self.doc_type,
            "relevance" : round(self.score, 4),
        }


# ── Retriever Class ────────────────────────────────────────────────────────────


class HybridRetriever:
    """Dense + BM25 hybrid retriever dengan Reciprocal Rank Fusion."""

    def __init__(self, config_path: str = "nlp/configs/config.yaml") -> None:
        """Inisialisasi retriever dengan config, embedder, dan vector store."""
        with open(config_path, "r", encoding="utf-8") as f:
            self.config: Dict = yaml.safe_load(f)

        self.config_path = config_path
        self.logger = logging.getLogger(self.__class__.__name__)

        ret = self.config["retrieval"]
        self.top_k_dense  : int = ret["top_k_dense"]
        self.top_k_sparse : int = ret["top_k_sparse"]
        self.top_k_rrf    : int = ret["top_k_after_rrf"]
        self.top_k_final  : int = ret["top_k_final"]
        self.rrf_k        : int = ret["rrf_k"]

        self.embedder     = EmbeddingModel.get_instance(config_path)
        self.vector_store = VectorStore(config_path)

        # BM25 lazy state
        self._bm25_index  = None
        self._bm25_chunks : Optional[List[Dict]] = None
        self._all_chunks  : Optional[List[Dict]] = None

    # ── Data Loading ───────────────────────────────────────────────────────────

    def _load_all_chunks(self) -> List[Dict]:
        """Load semua chunks dari processed_dir ke flat list (cached)."""
        if self._all_chunks is not None:
            return self._all_chunks

        processed_dir = Path(self.config["paths"]["data_processed"])
        chunk_files   = sorted(processed_dir.glob("*.chunks.json"))

        if not chunk_files:
            self.logger.warning(
                "No *.chunks.json found in '%s'. BM25 index will be empty.",
                processed_dir,
            )
            self._all_chunks = []
            return self._all_chunks

        all_chunks: List[Dict] = []
        for path in chunk_files:
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data: List[Dict] = json.load(f)
                all_chunks.extend(data)
            except (json.JSONDecodeError, OSError) as err:
                self.logger.error("Failed to load '%s': %s", path.name, err)

        self.logger.info(
            "_load_all_chunks: %d file(s) → %d chunks total.",
            len(chunk_files),
            len(all_chunks),
        )
        self._all_chunks = all_chunks
        return self._all_chunks

    # ── BM25 Index ─────────────────────────────────────────────────────────────

    def _build_bm25_index(self) -> None:
        """Bangun BM25 index (lazy — hanya dieksekusi sekali)."""
        if self._bm25_index is not None:
            return

        chunks = self._load_all_chunks()
        if not chunks:
            self.logger.warning("Empty chunk list — BM25 index not built.")
            return

        corpus = [c["text_content"].lower().split() for c in chunks]
        self._bm25_index  = BM25Okapi(corpus)
        self._bm25_chunks = chunks
        self.logger.info("BM25 index built: %d documents.", len(corpus))

    # ── Dense Search ───────────────────────────────────────────────────────────

    def _dense_search(
        self,
        query: str,
        router_result: RouterResult,
        top_k: int,
    ) -> List[Dict]:
        """Dense vector search di Qdrant dengan filter dari RouterResult."""
        try:
            self.embedder.load_model()
            query_vec = self.embedder.embed_query(query)

            machine_ids  = router_result.machine_ids  or None
            chunk_types  = router_result.chunk_types  or None
            doc_types    = router_result.doc_types    or None
            min_priority = router_result.min_priority

            results = self.vector_store.search_with_filter(
                query_vector=query_vec,
                top_k=top_k,
                machine_ids=machine_ids,
                chunk_types=chunk_types,
                min_priority=min_priority,
                doc_types=doc_types,
            )

            # Tambahkan field dense_score untuk tracking
            for r in results:
                r["dense_score"] = r.get("score", 0.0)

            self.logger.info("Dense search → %d results.", len(results))
            return results

        except Exception as err:
            self.logger.warning(
                "Dense search failed (collection mungkin belum diisi): %s", err
            )
            return []

    # ── BM25 Search ────────────────────────────────────────────────────────────

    def _bm25_search(
        self,
        query: str,
        router_result: RouterResult,
        top_k: int,
    ) -> List[Dict]:
        """BM25 sparse search dengan post-filter dari RouterResult."""
        self._build_bm25_index()

        if self._bm25_index is None or not self._bm25_chunks:
            self.logger.warning("BM25 index unavailable — returning empty.")
            return []

        query_tokens = query.lower().split()
        scores       = self._bm25_index.get_scores(query_tokens)

        # Ambil kandidat lebih banyak sebelum filter
        candidate_n  = top_k * 3
        ranked_idx   = sorted(
            range(len(scores)), key=lambda i: scores[i], reverse=True
        )[:candidate_n]

        max_score = scores[ranked_idx[0]] if ranked_idx else 1.0
        if max_score == 0:
            max_score = 1.0

        # Bangun filter sets dari router_result
        machine_filter    = set(router_result.machine_ids)
        chunk_type_filter = set(router_result.chunk_types)
        doc_type_filter   = set(router_result.doc_types)

        filtered: List[Dict] = []
        for idx in ranked_idx:
            chunk = self._bm25_chunks[idx]

            # ── Post-filter ────────────────────────────────────────────────────
            if machine_filter:
                chunk_machines = set(chunk.get("machine_ids") or [])
                if not chunk_machines.intersection(machine_filter):
                    continue

            if chunk_type_filter:
                if chunk.get("chunk_type") not in chunk_type_filter:
                    continue

            if doc_type_filter:
                if chunk.get("doc_type") not in doc_type_filter:
                    continue

            bm25_norm = float(scores[idx]) / max_score
            result    = {
                "chunk_id"    : chunk.get("chunk_id", ""),
                "score"       : bm25_norm,
                "bm25_score"  : bm25_norm,
                "text_content": chunk.get("text_content", ""),
                "source_doc"  : chunk.get("source_doc", ""),
                "source_page" : chunk.get("source_page", 0),
                "chunk_type"  : chunk.get("chunk_type", ""),
                "machine_ids" : chunk.get("machine_ids") or [],
                "doc_type"    : chunk.get("doc_type", ""),
                "priority"    : chunk.get("priority", 1),
                "payload"     : chunk,
            }
            filtered.append(result)
            if len(filtered) >= top_k:
                break

        self.logger.info("BM25 search → %d results (after filter).", len(filtered))
        return filtered

    # ── RRF Fusion ─────────────────────────────────────────────────────────────

    def _rrf_fusion(
        self,
        dense_results: List[Dict],
        bm25_results : List[Dict],
        top_k        : int,
    ) -> List[Dict]:
        """Reciprocal Rank Fusion — gabungkan dense dan BM25 rankings."""
        rrf_scores    : Dict[str, float] = defaultdict(float)
        chunk_registry: Dict[str, Dict]  = {}

        # Kontribusi dense
        for rank, r in enumerate(dense_results):
            cid = r["chunk_id"]
            rrf_scores[cid]    += 1.0 / (self.rrf_k + rank + 1)
            chunk_registry[cid] = r

        # Kontribusi BM25
        for rank, r in enumerate(bm25_results):
            cid = r["chunk_id"]
            rrf_scores[cid] += 1.0 / (self.rrf_k + rank + 1)
            if cid not in chunk_registry:
                chunk_registry[cid] = r
            else:
                # Update bm25_score jika chunk sudah ada dari dense
                chunk_registry[cid]["bm25_score"] = r.get("bm25_score")

        # Urutkan berdasarkan RRF score
        top_ids = sorted(rrf_scores, key=lambda k: rrf_scores[k], reverse=True)[:top_k]

        fused: List[Dict] = []
        for cid in top_ids:
            data = chunk_registry[cid].copy()
            data["rrf_score"]        = rrf_scores[cid]
            data["score"]            = rrf_scores[cid]
            data["retrieval_method"] = "hybrid"
            fused.append(data)

        self.logger.info("RRF fusion → %d results.", len(fused))
        return fused

    # ── Main Retrieve ──────────────────────────────────────────────────────────

    def retrieve(
        self,
        query        : str,
        router_result: RouterResult,
        use_hybrid   : bool = True,
    ) -> List[RetrievalResult]:
        """Entry point retrieval — hybrid (default) atau dense-only."""
        self.logger.info(
            "Retrieving for mode=%s | use_hybrid=%s",
            router_result.mode.value,
            use_hybrid,
        )

        # Expanded query untuk embedding; query asli untuk BM25
        embed_query = router_result.expanded_query or query

        if use_hybrid:
            dense_results = self._dense_search(
                embed_query, router_result, self.top_k_dense
            )
            bm25_results  = self._bm25_search(
                query, router_result, self.top_k_sparse
            )
            raw_results   = self._rrf_fusion(
                dense_results, bm25_results, self.top_k_rrf
            )
            retrieval_method = "hybrid"
        else:
            raw_results      = self._dense_search(
                embed_query, router_result, self.top_k_final
            )
            for r in raw_results:
                r["retrieval_method"] = "dense"
            retrieval_method = "dense"

        # Potong ke top_k_final
        raw_results = raw_results[: self.top_k_final]

        # Convert ke RetrievalResult
        results: List[RetrievalResult] = []
        for r in raw_results:
            results.append(RetrievalResult(
                chunk_id        = r.get("chunk_id", ""),
                score           = float(r.get("score", 0.0)),
                dense_score     = r.get("dense_score"),
                bm25_score      = r.get("bm25_score"),
                rrf_score       = r.get("rrf_score"),
                chunk_type      = r.get("chunk_type", ""),
                machine_ids     = r.get("machine_ids") or [],
                source_doc      = r.get("source_doc", ""),
                source_page     = int(r.get("source_page") or 0),
                doc_type        = r.get("doc_type", ""),
                priority        = int(r.get("priority") or 1),
                text_content    = r.get("text_content", ""),
                retrieval_method= r.get("retrieval_method", retrieval_method),
            ))

        self.logger.info(
            "Retrieved %d chunks | method=%s", len(results), retrieval_method
        )
        return results

    def retrieve_with_query(
        self,
        raw_query       : str,
        machine_ids_hint: Optional[List[str]] = None,
    ) -> Tuple[List[RetrievalResult], RouterResult]:
        """Convenience method: route + retrieve dalam satu panggilan."""
        # Import di dalam method untuk menghindari circular import
        from nlp.retrieval.query_router import QueryRouter

        router        = QueryRouter(self.config_path)
        router_result = router.route(raw_query, machine_ids_hint)
        results       = self.retrieve(raw_query, router_result)
        return results, router_result


# ── Entry Point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    from nlp.retrieval.query_router import QueryRouter

    print("=== LAPIS AI — HYBRID RETRIEVER TEST ===\n")

    retriever = HybridRetriever()
    router    = QueryRouter()

    test_cases = [
        {
            "query" : "Apa yang terjadi pada M-01 saat emergency?",
            "hint"  : ["M-01"],
            "expect": "event_emergency M-01",
        },
        {
            "query" : "Bagaimana prosedur LOTO dan keselamatan?",
            "hint"  : None,
            "expect": "safety manual",
        },
        {
            "query" : "Short circuit ML-0058 panel kontrol",
            "hint"  : None,
            "expect": "kode teknis spesifik",
        },
    ]

    for tc in test_cases:
        print(f"Query: '{tc['query']}'")
        results, route = retriever.retrieve_with_query(tc["query"], tc["hint"])
        print(f"Mode    : {route.mode.value}")
        print(f"Results : {len(results)} chunks")
        for i, r in enumerate(results[:3], 1):
            print(f"  [{i}] score={r.score:.4f} | {r.chunk_id}")
            print(f"       type={r.chunk_type} | machine={r.machine_ids}")
            print(f"       method={r.retrieval_method}")
        print("-" * 55)
