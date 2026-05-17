"""Prompt assembler untuk Lapis AI RAG Pipeline."""

import logging
import yaml
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from nlp.prompting.live_context import LiveContextData
from nlp.retrieval.retriever import RetrievalResult


# ── Logging Setup ──────────────────────────────────────────────────────────────

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


# ── Dataclass ──────────────────────────────────────────────────────────────────


@dataclass
class PromptPackage:
    """Paket prompt lengkap siap dikirim ke LLM API."""

    system_prompt   : str
    user_prompt     : str
    live_context    : Optional[str] = None
    retrieved_texts : List[str] = field(default_factory=list)
    citations_used  : List[Dict] = field(default_factory=list)
    has_live_context: bool = False
    query           : str = ""

    def to_messages(self) -> List[Dict[str, str]]:
        """Format menjadi list messages untuk LLM API (system + user)."""
        return [
            {"role": "system", "content": self.system_prompt},
            {"role": "user",   "content": self.user_prompt},
        ]


# ── Prompt Builder ─────────────────────────────────────────────────────────────


class PromptBuilder:
    """Rakit semua komponen (live context, retrieved chunks, history) menjadi PromptPackage."""

    SYSTEM_PROMPT_TEMPLATE: str = (
        'Anda adalah Asisten AI Predictive Maintenance "Lapis AI" untuk\n'
        "fasilitas industri PT Tirta Segar. Anda membantu teknisi dalam:\n"
        "- Menganalisis kondisi mesin berdasarkan data historis dan real-time\n"
        "- Mengidentifikasi pola anomali dan risiko kegagalan\n"
        "- Memberikan rekomendasi tindakan perawatan yang tepat\n\n"
        "ATURAN WAJIB:\n"
        "1. SELALU prioritaskan informasi dari [KONDISI REAL-TIME] jika tersedia\n"
        "2. Dukung setiap klaim dengan referensi ke sumber yang diberikan\n"
        "3. ZERO HALLUCINATION: jika informasi tidak ada di konteks,\n"
        '   jawab dengan: "Informasi tidak ditemukan dalam dokumen yang tersedia."\n'
        "4. Berikan rekomendasi dalam format yang jelas:\n"
        "   [SEGERA] untuk tindakan dalam 24 jam\n"
        "   [7 HARI] untuk tindakan dalam seminggu\n"
        "   [PREVENTIF] untuk tindakan pencegahan rutin\n"
        "5. Gunakan Bahasa Indonesia yang profesional dan mudah dipahami teknisi"
    )

    def __init__(self, config_path: str = "nlp/configs/config.yaml") -> None:
        """Load config dan inisialisasi parameter builder."""
        with open(config_path, "r", encoding="utf-8") as f:
            self.config: Dict = yaml.safe_load(f)

        self.logger            = logging.getLogger(self.__class__.__name__)
        self.max_context_chars = 3000

    # ── Formatters ─────────────────────────────────────────────────────────────

    def _format_retrieved_context(self, results: List[RetrievalResult]) -> str:
        """Format retrieved chunks menjadi blok konteks historis bernomor."""
        if not results:
            return "Tidak ada data historis yang relevan ditemukan."

        lines       = ["[KONTEKS HISTORIS & DOKUMEN RELEVAN]"]
        total_chars = 0

        for i, result in enumerate(results, 1):
            if total_chars > self.max_context_chars:
                break
            text   = result.text_content
            source = (
                f"(Sumber: {result.source_doc} | Hal. {result.source_page})"
            )
            entry = f"\n--- Referensi {i} ---\n{text}\n{source}"
            lines.append(entry)
            total_chars += len(entry)

        return "\n".join(lines)

    def _format_history(self, history: Optional[List[Dict]]) -> str:
        """Format chat history menjadi blok riwayat percakapan (max 6 pesan terakhir)."""
        if not history:
            return ""

        lines = ["[RIWAYAT PERCAKAPAN SEBELUMNYA]"]
        for msg in history[-6:]:
            role    = "Teknisi" if msg.get("role") == "user" else "Asisten"
            content = str(msg.get("content", ""))[:200]
            lines.append(f"{role}: {content}")

        return "\n".join(lines)

    # ── Main Builder ───────────────────────────────────────────────────────────

    def build(
        self,
        query            : str,
        results          : List[RetrievalResult],
        live_context_data: Optional[List[LiveContextData]] = None,
        history          : Optional[List[Dict]] = None,
    ) -> PromptPackage:
        """Rakit semua komponen menjadi PromptPackage siap kirim ke LLM."""
        # Format setiap bagian
        retrieved_context = self._format_retrieved_context(results)
        history_text      = self._format_history(history)

        has_live_ctx = bool(live_context_data)
        live_text    = ""
        if has_live_ctx:
            live_text = "\n".join(
                lc.to_prompt_text() for lc in live_context_data  # type: ignore[union-attr]
            )

        # Susun user_prompt dalam urutan prioritas
        parts: List[str] = []

        if has_live_ctx and live_text:
            parts.append(f"## [KONDISI REAL-TIME]\n{live_text}\n")

        parts.append(f"{retrieved_context}\n")

        if history_text:
            parts.append(f"{history_text}\n")

        parts.append(f"## [PERTANYAAN TEKNISI]\n{query}\n")

        parts.append(
            "## [FORMAT JAWABAN]\n"
            "Berikan jawaban dengan struktur:\n"
            "- ANALISIS: (ringkasan kondisi berdasarkan data di atas)\n"
            "- REKOMENDASI: [SEGERA/7 HARI/PREVENTIF] (tindakan spesifik)\n"
            "- REFERENSI: (sebutkan sumber dokumen yang digunakan)\n"
        )

        user_prompt = "\n".join(parts)

        # Kumpulkan citations dari results
        citations = [
            {
                "chunk_id"  : r.chunk_id,
                "source_doc": r.source_doc,
                "page"      : r.source_page,
                "doc_type"  : r.doc_type,
                "relevance" : round(r.score, 4),
            }
            for r in results
        ]

        self.logger.info(
            "PromptPackage built | chunks=%d | has_live=%s | history=%d",
            len(results),
            has_live_ctx,
            len(history) if history else 0,
        )

        return PromptPackage(
            system_prompt    = self.SYSTEM_PROMPT_TEMPLATE,
            user_prompt      = user_prompt,
            live_context     = live_text or None,
            retrieved_texts  = [r.text_content for r in results],
            citations_used   = citations,
            has_live_context = has_live_ctx,
            query            = query,
        )
