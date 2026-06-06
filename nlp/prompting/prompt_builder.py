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
        # ── A) IDENTITAS & SCOPE ───────────────────────────────────────────
        'Anda adalah Asisten AI Predictive Maintenance "Lapis AI" untuk '
        "fasilitas industri PT Tirta Segar (dikembangkan oleh PT Kainosoph).\n"
        "Anda HANYA menjawab pertanyaan seputar kondisi mesin, pemeliharaan, "
        "SOP, dan data teknis dari dokumen yang tersedia.\n"
        "Gunakan Bahasa Indonesia yang profesional, ringkas, dan mudah "
        "dipahami teknisi.\n\n"
        # ── B) ATURAN PENGGUNAAN KONTEKS (PALING KRITIS) ──────────────────
        "ATURAN PENGGUNAAN KONTEKS (WAJIB DIPATUHI):\n"
        "1. Gunakan HANYA informasi dari konteks yang diberikan di bawah.\n"
        "2. Jika ada Log ID (format ML-XXXX) di konteks → WAJIB sebut di jawaban.\n"
        "3. Jika ada angka downtime, biaya, atau tanggal di konteks → gunakan "
        "angka yang PERSIS sama. DILARANG membulatkan atau mengubah angka.\n"
        "4. Jika konteks mengandung informasi PARTIAL (sebagian ada, sebagian "
        "tidak) → jawab bagian yang ada, lalu nyatakan secara eksplisit "
        "bagian mana yang tidak ditemukan di dokumen.\n"
        "5. DILARANG menambahkan detail teknis, angka, atau nama komponen "
        "yang tidak ada di konteks yang diberikan.\n\n"
        # ── C) ATURAN FALLBACK (OUT-OF-CONTEXT) ───────────────────────────
        "ATURAN FALLBACK:\n"
        "Jika pertanyaan sama sekali tidak berkaitan dengan konteks yang "
        "diberikan, WAJIB jawab dengan format ini persis:\n"
        '"Pertanyaan ini berada di luar cakupan dokumen yang tersedia di '
        "sistem Lapis AI. Sistem ini hanya dapat menjawab pertanyaan "
        "seputar pemeliharaan mesin, SOP, dan data teknis fasilitas "
        "PT Tirta Segar. Silakan hubungi supervisor atau tim teknis "
        'untuk pertanyaan di luar cakupan ini."\n\n'
        # ── D) FORMAT JAWABAN WAJIB ───────────────────────────────────────
        "FORMAT JAWABAN WAJIB (struktur ketat, tidak boleh disingkat):\n\n"
        "ANALISIS\n"
        "[Ringkasan kondisi berdasarkan HANYA data di konteks. "
        "Jika ada Log ID → sebut. Jika ada tanggal → sebut. "
        "Jika ada angka downtime/biaya → gunakan angka persis.]\n\n"
        "REKOMENDASI\n"
        "[Minimal satu rekomendasi dengan prefix wajib:]\n"
        "- [SEGERA] untuk tindakan dalam 24 jam\n"
        "- [7 HARI] untuk tindakan dalam 1 minggu\n"
        "- [PREVENTIF] untuk tindakan pencegahan rutin\n"
        'Jika tidak cukup informasi: "[INFO] Data tidak cukup untuk '
        'rekomendasi spesifik."\n\n'
        "REFERENSI\n"
        "[Daftar sumber yang digunakan dengan format:\n"
        '"- [Referensi N]: [deskripsi singkat sumber]"\n'
        'Jika tidak ada referensi: "- Tidak ada referensi dokumen yang '
        'relevan."]\n\n'
        # ── E) PRIORITAS KONTEKS ──────────────────────────────────────────
        "PRIORITAS KONTEKS (urutan kepentingan):\n"
        "1. [KONDISI REAL-TIME] — data sensor langsung, prioritas tertinggi\n"
        "2. [TIMELINE PEMELIHARAAN] — detail event dengan Log ID dan angka\n"
        "3. [SUMMARY] — ringkasan bulanan\n"
        "4. [METADATA] — data agregat"
    )

    def __init__(self, config_path: str = "nlp/configs/config.yaml") -> None:
        """Load config dan inisialisasi parameter builder."""
        with open(config_path, "r", encoding="utf-8") as f:
            self.config: Dict = yaml.safe_load(f)

        self.logger            = logging.getLogger(self.__class__.__name__)
        self.max_context_chars = 8000  # raised from 5000 for broad queries

    # ── Formatters ─────────────────────────────────────────────────────────────

    def _format_retrieved_context(self, results: List[RetrievalResult]) -> str:
        """Format retrieved chunks menjadi blok konteks historis bernomor."""
        if not results:
            return "Tidak ada data historis yang relevan ditemukan."

        # Deteksi apakah ini hasil broad retrieval (machine_index)
        is_machine_index = any(
            getattr(r, 'retrieval_method', '') == 'machine_index'
            for r in results
        )

        if is_machine_index:
            # Group by doc_id untuk broad query — lebih compact
            return self._format_grouped_context(results)

        lines       = ["[KONTEKS HISTORIS & DOKUMEN RELEVAN]"]
        total_chars = 0

        for i, result in enumerate(results, 1):
            if total_chars > self.max_context_chars:
                break

            text = result.text_content

            # Ekstrak section_name dan doc_id dari chunk_id atau payload
            section_label = "DOKUMEN"
            doc_id_label  = result.chunk_id or ""
            if hasattr(result, "chunk_type") and result.chunk_type:
                section_label = result.chunk_type.upper().replace("_", " ")
            # Coba parse doc_id dari chunk_id (format: "doc_id__chunk_XXXX")
            if "__" in doc_id_label:
                doc_id_label = doc_id_label.split("__")[0]

            source = f"(Doc ID: {doc_id_label} | Score: {result.score:.3f})"
            entry  = (
                f"\n--- Referensi {i} [{section_label}] ---\n"
                f"{text}\n{source}"
            )
            lines.append(entry)
            total_chars += len(entry)

        return "\n".join(lines)

    def _format_grouped_context(self, results: List[RetrievalResult]) -> str:  
        """Format broad retrieval results grouped by doc_id — compact layout."""
        from collections import OrderedDict                              

        # Group chunks by doc_id                                         
        groups: OrderedDict = OrderedDict()                              
        for r in results:                                                
            doc_id = r.chunk_id.split("__")[0] if "__" in r.chunk_id else r.chunk_id  
            groups.setdefault(doc_id, []).append(r)                       

        # Header eksplisit: sebutkan SETIAP dokumen agar LLM tidak skip  
        doc_names = list(groups.keys())                                  
        doc_list  = ", ".join(                                           
            f"{i}. {name}" for i, name in enumerate(doc_names, 1)        
        )                                                                
        lines = [                                                        
            f"[DATA DARI {len(groups)} DOKUMEN — WAJIB sebutkan "        
            f"SEMUA {len(groups)} dokumen dalam jawaban]\n"              
            f"DAFTAR LENGKAP: {doc_list}\n"                              
            f"INSTRUKSI: Jawab berdasarkan SETIAP dokumen di atas. "     
            f"Jangan skip satupun."                                      
        ]                                                                
        total_chars = 0                                                  

        for i, (doc_id, chunks) in enumerate(groups.items(), 1):          
            if total_chars > self.max_context_chars:                       
                break                                                    
            combined_text = "\n".join(c.text_content for c in chunks)     
            entry = f"\n=== [{i}/{len(groups)}] {doc_id} ===\n{combined_text}"  
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
            "Ikuti format ANALISIS / REKOMENDASI / REFERENSI seperti yang "
            "ditetapkan dalam system prompt. Gunakan HANYA data dari "
            "konteks di atas.\n"
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
