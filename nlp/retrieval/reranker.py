"""Cross-encoder reranker untuk Lapis AI RAG Pipeline."""

import logging
import time
import yaml
from pathlib import Path
from typing import Any, Dict, List, Optional

from sentence_transformers import CrossEncoder

from nlp.retrieval.retriever import RetrievalResult


# ── Logging Setup ──────────────────────────────────────────────────────────────

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


# ── Reranker Class ─────────────────────────────────────────────────────────────


class CrossEncoderReranker:
    """Cross-encoder reranker yang meningkatkan presisi hasil retrieval sebelum ke LLM."""

    def __init__(self, config_path: str = "nlp/configs/config.yaml") -> None:
        """Load config dan inisialisasi parameter reranker (model belum di-load)."""
        with open(config_path, "r", encoding="utf-8") as f:
            config: Dict = yaml.safe_load(f)

        self.logger      = logging.getLogger(self.__class__.__name__)
        self.model_name  : str = config["retrieval"]["reranker_model"]
        self.top_k_final : int = config["retrieval"]["top_k_final"]

        self._model  = None   # lazy load
        self._loaded : bool = False

    # ── Model Loading ──────────────────────────────────────────────────────────

    def load_model(self) -> None:
        """Load cross-encoder model dari HuggingFace (lazy — hanya sekali)."""
        if self._loaded:
            return

        self.logger.info("Loading reranker: %s", self.model_name)
        t_start = time.time()

        self._model  = CrossEncoder(self.model_name)
        self._loaded = True

        elapsed = time.time() - t_start
        self.logger.info("Reranker loaded in %.1fs", elapsed)

    # ── Core Reranking ─────────────────────────────────────────────────────────

    def rerank(
        self,
        query  : str,
        results: List[RetrievalResult],
        top_k  : Optional[int] = None,
    ) -> List[RetrievalResult]:
        """Re-rank hasil retrieval dengan cross-encoder dan return top_k terbaik."""
        if not results:
            return []

        self.load_model()
        top_k = top_k or self.top_k_final

        # Pasangkan setiap (query, text_content) untuk cross-encoder
        pairs = [(query, r.text_content) for r in results]

        # Batch predict — return numpy array of float
        ce_scores = self._model.predict(pairs)  # type: ignore[union-attr]

        # Gabungkan skor dengan result, urutkan descending
        scored = sorted(zip(ce_scores, results), key=lambda x: x[0], reverse=True)

        # Update score di setiap RetrievalResult dengan skor cross-encoder
        reranked: List[RetrievalResult] = []
        for ce_score, result in scored[:top_k]:
            result.score = float(ce_score)
            reranked.append(result)

        if scored:
            self.logger.info(
                "Reranked %d → %d | top score: %.4f",
                len(results),
                top_k,
                float(scored[0][0]),
            )

        return reranked

    def rerank_with_fallback(
        self,
        query  : str,
        results: List[RetrievalResult],
        top_k  : Optional[int] = None,
    ) -> List[RetrievalResult]:
        """Rerank dengan fallback graceful — jika gagal, gunakan urutan skor asli."""
        try:
            return self.rerank(query, results, top_k)
        except Exception as e:
            self.logger.warning(
                "Reranker failed, using original order: %s", e
            )
            top_k = top_k or self.top_k_final
            return sorted(results, key=lambda r: r.score, reverse=True)[:top_k]

    # ── Introspection ──────────────────────────────────────────────────────────

    def get_model_info(self) -> Dict[str, Any]:
        """Return metadata model reranker yang aktif."""
        return {
            "model_name" : self.model_name,
            "is_loaded"  : self._loaded,
            "top_k_final": self.top_k_final,
            "type"       : "cross-encoder",
        }


# ── Entry Point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    from nlp.retrieval.retriever import HybridRetriever
    from nlp.retrieval.query_router import QueryRouter

    print("=== LAPIS AI — RERANKER TEST ===\n")

    retriever = HybridRetriever()
    reranker  = CrossEncoderReranker()

    test_cases = [
        {
            "query": "Apa yang terjadi pada M-01 saat emergency?",
            "hint" : ["M-01"],
        },
        {
            "query": "Prosedur keselamatan LOTO sebelum perbaikan",
            "hint" : None,
        },
    ]

    for tc in test_cases:
        print("Query:", repr(tc["query"]))

        # Retrieve
        raw_results, route = retriever.retrieve_with_query(tc["query"], tc["hint"])

        print("Before rerank (" + str(len(raw_results)) + " results):")
        for i, r in enumerate(raw_results[:3], 1):
            print(f"  [{i}] rrf={r.score:.4f} | {r.chunk_id} | {r.chunk_type}")

        # Rerank (dengan fallback agar tidak crash jika model belum tersedia)
        reranked = reranker.rerank_with_fallback(tc["query"], raw_results)

        print("\nAfter rerank (top " + str(len(reranked)) + "):")
        for i, r in enumerate(reranked, 1):
            print(f"  [{i}] ce_score={r.score:.4f} | {r.chunk_id}")
            print(f"       type={r.chunk_type} | machine={r.machine_ids}")
            print(f"       text={r.text_content[:80]}...")

        print("-" * 55)
