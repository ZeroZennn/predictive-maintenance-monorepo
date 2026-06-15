"""Prompt assembler untuk Lapis AI RAG Pipeline."""

import logging
import yaml
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from nlp.prompting.live_context import LiveContextData
from nlp.retrieval.retriever import RetrievalResult

from nlp.retrieval.intent_classifier import IntentClassifier, QueryIntent, IntentResult
from nlp.prompting.assistant_identity import (
    IDENTITY_RESPONSE,
    OUT_OF_SCOPE_RESPONSE,
    SYSTEM_DESCRIPTION,
    ASSISTANT_NAME,
)
from nlp.embeddings.vector_store import VectorStore


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
        # ── A) IDENTITAS ───────────────────────────────────────────────────
        "Kamu adalah PRAM (PRIME Reliability & Maintenance Assistant), "
        "asisten AI untuk sistem PRIME milik PT Kainosoph.\n"
        "PRAM dirancang untuk membantu teknisi dan supervisor dalam "
        "operasional dan pemeliharaan mesin industri.\n"
        "Berbicara dalam Bahasa Indonesia yang profesional, hangat, "
        "dan mudah dipahami teknisi lapangan.\n\n"
        # ── B) CARA MERESPONS BERDASARKAN JENIS QUERY ─────────────────────
        "CARA MERESPONS:\n\n"
        "Untuk sapaan, perkenalan, atau pertanyaan tentang dirimu "
        "(contoh: 'halo', 'siapa kamu', 'kamu bisa apa'):\n"
        "→ Respons ramah dan singkat. Perkenalkan dirimu sebagai PRAM. "
        "Tawarkan bantuan terkait mesin dan pemeliharaan.\n\n"
        "Untuk pertanyaan di luar konteks mesin dan pemeliharaan "
        "(contoh: cuaca, berita, hal umum):\n"
        "→ Tolak dengan sopan, jelaskan bahwa kamu hanya bisa membantu "
        "seputar mesin, pemeliharaan, SOP, dan data teknis PT Kainosoph. "
        "Arahkan ke supervisor atau tim teknis.\n\n"
        "Untuk pertanyaan teknis tentang mesin, pemeliharaan, "
        "SOP, kondisi, atau riwayat:\n"
        "→ Jawab langsung berdasarkan konteks yang tersedia. "
        "Sertakan rekomendasi tindakan secara natural di dalam jawaban "
        "jika relevan — bukan sebagai header terpisah. "
        "Sebutkan sumber referensi di akhir secara ringkas.\n\n"
        "Untuk pertanyaan lanjutan dalam satu sesi:\n"
        "→ Gunakan riwayat percakapan sebagai konteks. "
        "Jawab koheren tanpa mengulang informasi yang sudah disampaikan.\n\n"
        # ── C) ATURAN FORMAT JAWABAN DINAMIS ──────────────────────────────
        "FORMAT JAWABAN:\n"
        "- JANGAN gunakan header kaku seperti 'ANALISIS:', 'REKOMENDASI:', "
        "'REFERENSI:' sebagai judul section terpisah.\n"
        "- Jawaban mengalir natural seperti penjelasan seorang ahli.\n"
        "- Panjang jawaban proporsional dengan kompleksitas pertanyaan:\n"
        "  • Pertanyaan sederhana/sapaan → 1-3 kalimat\n"
        "  • Pertanyaan teknis spesifik → beberapa paragraf\n"
        "  • Pertanyaan kompleks/multi-aspek → jawaban terstruktur "
        "dengan poin-poin jika membantu kejelasan\n"
        "- Rekomendasi tindakan boleh menggunakan label urgensi jika relevan:\n"
        "  • [SEGERA] untuk tindakan dalam 24 jam\n"
        "  • [7 HARI] untuk tindakan dalam 1 minggu\n"
        "  • [PREVENTIF] untuk tindakan pencegahan rutin\n"
        "- Jika ada referensi dokumen, sebutkan di akhir secara singkat.\n\n"
        # ── D) ATURAN PENGGUNAAN DATA (WAJIB DIPATUHI) ────────────────────
        "ATURAN DATA:\n"
        "1. Gunakan HANYA informasi dari konteks yang diberikan.\n"
        "2. Jika ada Log ID (format ML-XXXX) → sebut di jawaban.\n"
        "3. Angka downtime, biaya, tanggal → gunakan PERSIS dari konteks, "
        "DILARANG membulatkan atau mengubah.\n"
        "4. Jika konteks partial → jawab bagian yang ada, nyatakan "
        "eksplisit bagian mana yang tidak ditemukan.\n"
        "5. DILARANG menambahkan detail teknis atau angka yang tidak "
        "ada di konteks.\n"
        "6. Jika tidak ada konteks relevan sama sekali → nyatakan bahwa "
        "informasi tidak tersedia dalam sistem, sarankan cek langsung "
        "ke dokumen atau supervisor.\n\n"
        # ── E) PRIORITAS KONTEKS ──────────────────────────────────────────
        "PRIORITAS KONTEKS:\n"
        "1. [KONDISI REAL-TIME] — data sensor langsung, prioritas tertinggi\n"
        "2. [TIMELINE PEMELIHARAAN] — event dengan Log ID dan angka\n"
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
        historical_context: Optional[str] = None,
    ) -> PromptPackage:
        """Rakit semua komponen menjadi PromptPackage siap kirim ke LLM."""
        # Format setiap bagian
        retrieved_context = self._format_retrieved_context(results)
        history_text      = self._format_history(history)

        has_live_ctx = bool(live_context_data)
        live_text    = ""
        if has_live_ctx:
            if len(live_context_data) > 5:
                # Format compact table for fleet-wide queries
                lines = ["[KONDISI REAL-TIME SEMUA MESIN]"]
                lines.append("| Mesin | Status | ML Prediksi | Suhu (°C) | Getaran | Tekanan | RUL (hari) | Alert Aktif |")
                lines.append("|-------|--------|-------------|-----------|---------|---------|------------|-------------|")
                for lc in live_context_data:
                    alerts = ", ".join(lc.active_alerts) if lc.active_alerts else "-"
                    rul = f"{lc.rul_days:.1f}" if lc.rul_days is not None else "N/A"
                    suhu = f"{lc.temperature_c}" if lc.temperature_c is not None else "N/A"
                    getaran = f"{lc.vibration_mms}" if lc.vibration_mms is not None else "N/A"
                    tekanan = f"{lc.pressure_psi}" if lc.pressure_psi is not None else "N/A"
                    lines.append(
                        f"| {lc.machine_id} | {lc.status} | {lc.ml_prediction} | {suhu} | {getaran} | {tekanan} | {rul} | {alerts} |"
                    )
                live_text = "\n".join(lines)
            else:
                live_text = "\n".join(
                    lc.to_prompt_text() for lc in live_context_data  # type: ignore[union-attr]
                )

        # Susun user_prompt dalam urutan prioritas
        parts: List[str] = []

        if has_live_ctx and live_text:
            parts.append(f"## [KONDISI REAL-TIME]\n{live_text}\n")

        if historical_context:
            parts.append(f"## [RIWAYAT DATA MESIN]\n{historical_context}\n")

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

    def build_dynamic_response(
        self,
        query: str,
        intent_result: IntentResult,
        vector_store: VectorStore | None = None,
    ) -> dict:
        """
        Shortcircuit handler untuk intent yang tidak butuh LLM/retrieval.
        
        Returns dict dengan keys:
            - shortcircuit: bool — True jika tidak perlu lanjut ke LLM
            - response: str | None — response langsung jika shortcircuit
            - intent: str — nama intent
            - normalized_query: str — query yang sudah dinormalisasi
        
        Jika shortcircuit=False, caller harus lanjutkan ke retrieval + LLM normal.
        """
        intent = intent_result.intent
        machine_id = intent_result.extracted_machine_id

        # ── IDENTITY ──────────────────────────────────────────────────────────
        if intent == QueryIntent.IDENTITY:
            return {
                "shortcircuit": True,
                "response": IDENTITY_RESPONSE,
                "intent": intent.value,
                "normalized_query": intent_result.normalized_query,
            }

        # ── SYSTEM INFO ───────────────────────────────────────────────────────
        if intent == QueryIntent.SYSTEM_INFO:
            return {
                "shortcircuit": True,
                "response": SYSTEM_DESCRIPTION,
                "intent": intent.value,
                "normalized_query": intent_result.normalized_query,
            }

        # ── OFF TOPIC ─────────────────────────────────────────────────────────
        if intent == QueryIntent.OFF_TOPIC:
            return {
                "shortcircuit": True,
                "response": OUT_OF_SCOPE_RESPONSE,
                "intent": intent.value,
                "normalized_query": intent_result.normalized_query,
            }

        # ── DOCUMENT INQUIRY ──────────────────────────────────────────────────
        if intent == QueryIntent.DOCUMENT_INQUIRY:
            if vector_store is None:
                return {
                    "shortcircuit": True,
                    "response": "Maaf, saya tidak dapat mengakses informasi dokumen saat ini.",
                    "intent": intent.value,
                    "normalized_query": intent_result.normalized_query,
                }
            
            stats = vector_store.get_document_stats(machine_id=machine_id)
            total = stats["total_documents"]
            docs  = stats["documents"]

            if machine_id:
                if total == 0:
                    response = (
                        f"Tidak ditemukan dokumen yang berhubungan dengan mesin "
                        f"{machine_id} dalam sistem PRIME."
                    )
                else:
                    doc_list = "\n".join(f"  {i+1}. {d}" for i, d in enumerate(docs))
                    response = (
                        f"Terdapat **{total} dokumen** yang berhubungan dengan "
                        f"mesin {machine_id} dalam sistem PRIME:\n\n{doc_list}"
                    )
            else:
                if total == 0:
                    response = "Belum ada dokumen yang terindeks dalam sistem PRIME."
                else:
                    doc_list = "\n".join(f"  {i+1}. {d}" for i, d in enumerate(docs[:20]))
                    more = f"\n  ... dan {total - 20} dokumen lainnya." if total > 20 else ""
                    response = (
                        f"Terdapat **{total} dokumen** yang sudah terindeks "
                        f"dalam sistem PRIME:\n\n{doc_list}{more}"
                    )

            return {
                "shortcircuit": True,
                "response": response,
                "intent": intent.value,
                "normalized_query": intent_result.normalized_query,
            }

        # ── MACHINE QUICK, ANALYTICAL, FOLLOW_UP → lanjut ke LLM ─────────────
        return {
            "shortcircuit": False,
            "response": None,
            "intent": intent.value,
            "normalized_query": intent_result.normalized_query,
        }
