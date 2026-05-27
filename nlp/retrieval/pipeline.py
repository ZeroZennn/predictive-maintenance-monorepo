"""Retrieval pipeline orchestrator untuk Lapis AI RAG Pipeline."""

import logging
from typing import Any, Dict, List, Optional, Tuple

from nlp.retrieval.query_router import QueryRouter, RouterResult
from nlp.retrieval.retriever import HybridRetriever, RetrievalResult
from nlp.retrieval.reranker import CrossEncoderReranker


# ── Logging Setup ──────────────────────────────────────────────────────────────

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


# ── Orchestrator ───────────────────────────────────────────────────────────────


class RetrievalPipeline:
    """Orchestrator: Router → Retriever → Reranker dalam satu panggilan."""

    def __init__(self, config_path: str = "nlp/configs/config.yaml") -> None:
        """Inisialisasi semua komponen retrieval."""
        self.logger      = logging.getLogger("RetrievalPipeline")
        self.config_path = config_path
        self.router      = QueryRouter(config_path)
        self.retriever   = HybridRetriever(config_path)
        self.reranker    = CrossEncoderReranker(config_path)

    def run(
        self,
        query           : str,
        machine_ids_hint: Optional[List[str]] = None,
        use_reranker    : bool = True,
        use_hybrid      : bool = True,
    ) -> Tuple[List[RetrievalResult], RouterResult]:
        """Jalankan full retrieval pipeline dan return (results, router_result)."""
        # Step 1: Route
        router_result = self.router.route(query, machine_ids_hint)
        self.logger.info(
            "Route: mode=%s machines=%s confidence=%.2f",
            router_result.mode.value,
            router_result.machine_ids,
            router_result.confidence,
        )

        # Step 2: Retrieve
        raw_results = self.retriever.retrieve(
            query, router_result, use_hybrid=use_hybrid
        )

        if not raw_results:
            self.logger.warning(
                "No results from retriever for query: %s", query[:60]
            )
            return [], router_result

        # Step 3: Rerank (opsional)
        if use_reranker:
            final_results = self.reranker.rerank_with_fallback(query, raw_results)
        else:
            final_results = raw_results

        self.logger.info(
            "Pipeline complete: %d results | top score=%.4f",
            len(final_results),
            final_results[0].score if final_results else 0.0,
        )
        return final_results, router_result

    def get_citations(
        self, results: List[RetrievalResult]
    ) -> List[Dict[str, Any]]:
        """Format results menjadi citation cards siap dikonsumsi Frontend."""
        return [r.get_citation() for r in results]

    def get_context_text(
        self,
        results   : List[RetrievalResult],
        max_chunks: int = 5,
        separator : str = "\n\n---\n\n",
    ) -> str:
        """Gabungkan text_content top results menjadi satu blok konteks untuk LLM."""
        selected = results[:max_chunks]
        parts: List[str] = []
        for i, r in enumerate(selected, 1):
            header = (
                f"[{i}] {r.chunk_type.upper()} | "
                f"{', '.join(r.machine_ids) or 'ALL'} | "
                f"{r.source_doc} hal.{r.source_page}"
            )
            parts.append(f"{header}\n{r.text_content}")
        return separator.join(parts)

    def run_and_format(
        self,
        query           : str,
        machine_ids_hint: Optional[List[str]] = None,
        use_reranker    : bool = True,
        use_hybrid      : bool = True,
        max_context     : int  = 5,
    ) -> Dict[str, Any]:
        """
        Convenience method — jalankan pipeline dan return dict siap pakai LLM.
        Return: {results, router_result, context_text, citations, meta}
        """
        results, router_result = self.run(
            query, machine_ids_hint, use_reranker, use_hybrid
        )
        return {
            "results"       : [r.to_dict() for r in results],
            "router_result" : router_result.to_dict(),
            "context_text"  : self.get_context_text(results, max_context),
            "citations"     : self.get_citations(results),
            "meta": {
                "total_results"  : len(results),
                "query_mode"     : router_result.mode.value,
                "machine_ids"    : router_result.machine_ids,
                "used_reranker"  : use_reranker,
                "used_hybrid"    : use_hybrid,
                "top_score"      : round(results[0].score, 4) if results else 0.0,
            },
        }


# ── Entry Point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import json

    print("=== LAPIS AI — RETRIEVAL PIPELINE TEST ===\n")

    pipeline = RetrievalPipeline()

    test_cases = [
        {
            "query": "Apa yang terjadi pada M-01 saat emergency?",
            "hint" : ["M-01"],
        },
        {
            "query": "Prosedur keselamatan LOTO sebelum perbaikan",
            "hint" : None,
        },
        {
            "query": "Bandingkan kondisi M-01 dan M-02",
            "hint" : None,
        },
    ]

    for tc in test_cases:
        print("Query:", repr(tc["query"]))
        output = pipeline.run_and_format(
            tc["query"],
            machine_ids_hint=tc["hint"],
            use_reranker=True,
            use_hybrid=True,
        )

        meta = output["meta"]
        print(f"  Mode     : {meta['query_mode']}")
        print(f"  Machines : {meta['machine_ids']}")
        print(f"  Results  : {meta['total_results']}")
        print(f"  Top score: {meta['top_score']}")

        print("\n  [Context preview — 200 chars]")
        print(" ", output["context_text"][:200].replace("\n", " "), "...")

        print("\n  [Citations]")
        for c in output["citations"]:
            print(f"    {c['chunk_id']} | {c['source_doc']} p.{c['page']} | rel={c['relevance']}")

        print("-" * 60)
