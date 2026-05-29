"""Citation extractor dan formatter untuk Lapis AI NLP API."""

import logging
from typing import List

from nlp.api.schemas import CitationItem, LiveContextSnapshot
from nlp.prompting.live_context import LiveContextData
from nlp.retrieval.retriever import RetrievalResult


class CitationExtractor:
    """Konversi RetrievalResult dan LiveContextData ke schema API."""

    def __init__(self) -> None:
        """Setup logger."""
        self.logger = logging.getLogger(self.__class__.__name__)

    def extract_citations(
        self, results: List[RetrievalResult]
    ) -> List[CitationItem]:
        """Konversi RetrievalResult list menjadi CitationItem list dengan dedup."""
        if not results:
            return []

        # Dedup: per chunk_id ambil skor tertinggi
        seen: dict = {}
        for r in results:
            cid = r.chunk_id
            if cid not in seen or r.score > seen[cid].score:
                seen[cid] = r

        citations: List[CitationItem] = []
        for r in seen.values():
            citations.append(CitationItem(
                source_doc = r.source_doc or "", 
                page       = r.source_page or 0, 
                chunk_id   = r.chunk_id or "", 
                doc_type   = r.doc_type or "",
                relevance  = round(float(r.score), 4),
            ))

        # Urutkan berdasarkan relevansi descending
        citations.sort(key=lambda c: c.relevance, reverse=True)
        return citations

    def format_live_context_snapshot(
        self, live_data: List[LiveContextData]
    ) -> List[LiveContextSnapshot]:
        """Konversi LiveContextData list ke LiveContextSnapshot list."""
        if not live_data:
            return []

        return [
            LiveContextSnapshot(
                machine_id    = lc.machine_id,
                status        = lc.status,
                temperature_c = lc.temperature_c,
                vibration_mms = lc.vibration_mms,
                pressure_psi  = lc.pressure_psi,
                rpm           = lc.rpm,
                ml_prediction = lc.ml_prediction,
                rul_days      = lc.rul_days,
                active_alerts = lc.active_alerts,
                data_source   = lc.data_source,
            )
            for lc in live_data
        ]

    def determine_confidence(
        self,
        results          : List[RetrievalResult],
        live_context_used: bool,
    ) -> str:
        """Tentukan confidence level berdasarkan kualitas retrieval.

        Cross-encoder reranker menghasilkan raw logit score (bukan cosine similarity).
        Threshold disesuaikan: score > -3 = relevan tinggi, > -7 = relevan moderat.
        """
        if not results:
            return "low"

        top_score = results[0].score if results else 0.0

        # Cross-encoder logit thresholds (range biasanya -15 sampai +5)
        if live_context_used and top_score > -3.0:
            return "high"
        if top_score > -7.0 or live_context_used:
            return "medium"
        return "low"
