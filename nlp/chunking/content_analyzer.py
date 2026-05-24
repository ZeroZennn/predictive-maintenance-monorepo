"""
content_analyzer.py — Lapis AI Universal Content Analyzer
==========================================================
Layer 2: Deteksi sinyal struktur dari teks mentah.
Output: ContentSignals — digunakan AdaptiveChunker untuk
memilih strategi chunking yang paling tepat.

Prinsip: analisis berdasarkan BUKTI dari konten, bukan asumsi
tentang nama file atau tipe dokumen.
"""

import re
import logging
from dataclasses import dataclass, field
from typing import List, Optional

logger = logging.getLogger(__name__)


@dataclass
class ContentSignals:
    """
    Kumpulan sinyal struktural yang terdeteksi dari teks.
    Digunakan AdaptiveChunker untuk memilih strategi chunking.
    """
    # --- Sinyal Struktur ---
    has_section_headers: bool = False
    # True jika ada pola [HEADER], ## Header, atau HEADER: di awal baris

    has_bracket_sections: bool = False
    # True jika ada pola [METADATA], [SUMMARY], [TIMELINE], dll.
    # Sinyal paling kuat untuk section-based chunking

    has_markdown_headers: bool = False
    # True jika ada pola ## atau ### di awal baris

    has_numbered_lists: bool = False
    # True jika ada pola "1.", "2.", "a.", "b." di awal baris

    has_tables: bool = False
    # True jika ada pola | col | col | atau tabel ASCII

    # --- Sinyal Konten ---
    has_dates: bool = False
    # True jika ada pola tanggal (dd/mm/yyyy, yyyy-mm-dd, dll.)

    has_log_ids: bool = False
    # True jika ada pola kode log seperti ML-XXXX

    has_machine_refs: bool = False
    # True jika ada referensi mesin M-XX

    has_currency: bool = False
    # True jika ada pola Rp atau IDR

    # --- Metrik Tekstual ---
    avg_sentence_length: float = 0.0
    # Rata-rata panjang kalimat dalam karakter

    avg_paragraph_length: float = 0.0
    # Rata-rata panjang paragraf dalam karakter

    total_chars: int = 0
    total_paragraphs: int = 0
    total_sentences: int = 0

    # --- Sinyal Bahasa ---
    detected_language: str = "unknown"
    # "id" | "en" | "mixed"

    # --- Sinyal Section ---
    detected_sections: List[str] = field(default_factory=list)
    # Nama-nama section yang terdeteksi, contoh: ["METADATA", "SUMMARY", "TIMELINE"]

    # --- Strategi Rekomendasi ---
    recommended_strategy: str = "semantic_sliding_window"
    # Diisi oleh analyzer setelah evaluasi semua sinyal


class ContentAnalyzer:
    """
    Menganalisis teks mentah dan menghasilkan ContentSignals.
    Tidak ada state — setiap call ke analyze() independen.
    """

    # Pola section bracket: [METADATA], [SUMMARY], [TIMELINE], dll.
    _BRACKET_SECTION = re.compile(
        r"^\[([A-Z][A-Z\s_]{2,})\]", re.MULTILINE
    )

    # Pola markdown header: ## Title atau ### Title
    _MARKDOWN_HEADER = re.compile(
        r"^#{1,4}\s+\S", re.MULTILINE
    )

    # Pola numbered list: "1.", "2.", "a.", "b." di awal baris
    _NUMBERED_LIST = re.compile(
        r"^\s{0,4}(?:\d{1,2}\.|\w\.)\s+\S", re.MULTILINE
    )

    # Pola tabel ASCII atau markdown
    _TABLE_ROW = re.compile(
        r"^\|.+\|", re.MULTILINE
    )

    # Pola tanggal
    _DATE = re.compile(
        r"\b\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4}\b"
        r"|\b\d{4}[/\-\.]\d{2}[/\-\.]\d{2}\b"
    )

    # Pola log ID
    _LOG_ID = re.compile(r"\bML-\d{4}\b")

    # Pola machine ref
    _MACHINE_REF = re.compile(r"\bM-\d{2}\b")

    # Pola currency
    _CURRENCY = re.compile(r"\bRp\.?\s*\d|IDR\s*\d", re.IGNORECASE)

    # Stopword untuk deteksi bahasa
    _ID_STOPWORDS = re.compile(
        r"\b(yang|dan|di|dari|untuk|dengan|adalah|pada|ini|itu|"
        r"telah|akan|dapat|dalam|juga|oleh|ke|atau|tidak|sudah)\b",
        re.IGNORECASE
    )
    _EN_STOPWORDS = re.compile(
        r"\b(the|and|of|to|in|is|for|with|this|that|"
        r"was|are|has|have|been|it|at|by|from|on|an)\b",
        re.IGNORECASE
    )

    def analyze(self, text: str) -> ContentSignals:
        """
        Analisis teks dan kembalikan ContentSignals.
        Entry point utama — tidak pernah raise exception.
        """
        if not text or not text.strip():
            logger.warning("ContentAnalyzer: empty text received.")
            return ContentSignals()

        signals = ContentSignals()

        try:
            self._detect_structure(text, signals)
            self._detect_content_signals(text, signals)
            self._compute_text_metrics(text, signals)
            self._detect_language(text, signals)
            self._recommend_strategy(signals)
        except Exception as e:
            logger.error("ContentAnalyzer error: %s — using defaults.", e)

        return signals

    def _detect_structure(self, text: str, signals: ContentSignals) -> None:
        """Deteksi sinyal struktural dari teks."""

        # Bracket sections [HEADER]
        bracket_matches = self._BRACKET_SECTION.findall(text)
        if bracket_matches:
            signals.has_bracket_sections = True
            signals.has_section_headers = True
            signals.detected_sections = list(dict.fromkeys(bracket_matches))

        # Markdown headers
        if self._MARKDOWN_HEADER.search(text):
            signals.has_markdown_headers = True
            signals.has_section_headers = True

        # Numbered lists
        if self._NUMBERED_LIST.search(text):
            signals.has_numbered_lists = True

        # Tables
        table_rows = self._TABLE_ROW.findall(text)
        if len(table_rows) >= 2:  # minimal 2 baris agar tidak false positive
            signals.has_tables = True

    def _detect_content_signals(self, text: str, signals: ContentSignals) -> None:
        """Deteksi sinyal berbasis konten spesifik domain."""
        signals.has_dates = bool(self._DATE.search(text))
        signals.has_log_ids = bool(self._LOG_ID.search(text))
        signals.has_machine_refs = bool(self._MACHINE_REF.search(text))
        signals.has_currency = bool(self._CURRENCY.search(text))

    def _compute_text_metrics(self, text: str, signals: ContentSignals) -> None:
        """Hitung metrik statistik teks."""
        signals.total_chars = len(text)

        # Paragraf = blok teks dipisah oleh baris kosong
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
        signals.total_paragraphs = len(paragraphs)
        if paragraphs:
            signals.avg_paragraph_length = (
                sum(len(p) for p in paragraphs) / len(paragraphs)
            )

        # Kalimat = split by . ! ? dengan minimal 10 karakter
        sentences = re.split(r"(?<=[.!?])\s+", text)
        sentences = [s for s in sentences if len(s.strip()) >= 10]
        signals.total_sentences = len(sentences)
        if sentences:
            signals.avg_sentence_length = (
                sum(len(s) for s in sentences) / len(sentences)
            )

    def _detect_language(self, text: str, signals: ContentSignals) -> None:
        """Deteksi bahasa dominan dari teks."""
        id_count = len(self._ID_STOPWORDS.findall(text))
        en_count = len(self._EN_STOPWORDS.findall(text))

        if id_count > en_count * 2:
            signals.detected_language = "id"
        elif en_count > id_count * 2:
            signals.detected_language = "en"
        else:
            signals.detected_language = "mixed"

    def _recommend_strategy(self, signals: ContentSignals) -> None:
        """
        Rekomendasikan strategi chunking berdasarkan kombinasi sinyal.
        Prioritas dari paling spesifik ke paling general.
        """
        # Prioritas 1: Ada section marker eksplisit [HEADER]
        # → section-based chunking adalah yang paling akurat
        if signals.has_bracket_sections:
            signals.recommended_strategy = "section_based"
            return

        # Prioritas 2: Ada markdown headers
        # → potong di batas header
        if signals.has_markdown_headers:
            signals.recommended_strategy = "header_based"
            return

        # Prioritas 3: Konten pendek dengan log IDs dan tanggal
        # → kemungkinan log terstruktur, potong per entry
        if (signals.has_log_ids and signals.has_dates
                and signals.avg_paragraph_length < 300):
            signals.recommended_strategy = "paragraph_based"
            return

        # Prioritas 4: Paragraf panjang (artikel, jurnal, manual)
        # → semantic sliding window adalah yang paling robust
        if signals.avg_paragraph_length > 500:
            signals.recommended_strategy = "semantic_sliding_window"
            return

        # Default: semantic sliding window untuk semua kasus lain
        signals.recommended_strategy = "semantic_sliding_window"


if __name__ == "__main__":
    # Quick self-test
    analyzer = ContentAnalyzer()

    sample_texts = {
        "Laporan dengan sections": """
[METADATA]
Machine_ID: M-01
Periode: Juli 2025

[SUMMARY]
Laporan pemeliharaan bulanan untuk Mesin M-01.

[TIMELINE PEMELIHARAAN]
01/07/2025 (Log ID: ML-0383): Corrective. Biaya Rp 3.306.114.
""",
        "Teks artikel bebas": """
Predictive maintenance adalah strategi pemeliharaan yang menggunakan
data sensor untuk memprediksi kapan mesin akan mengalami kegagalan.
Pendekatan ini berbeda dari preventive maintenance yang terjadwal.
""",
        "Dokumen markdown": """
## Pendahuluan
Sistem ini dirancang untuk memantau kondisi mesin secara real-time.

### Komponen Utama
1. Sensor suite
2. Data pipeline
3. ML model
"""
    }

    print("\n=== CONTENT ANALYZER SELF-TEST ===")
    for name, text in sample_texts.items():
        signals = analyzer.analyze(text)
        print(f"\n[{name}]")
        print(f"  Strategy   : {signals.recommended_strategy}")
        print(f"  Sections   : {signals.detected_sections}")
        print(f"  Has bracket: {signals.has_bracket_sections}")
        print(f"  Has MD hdr : {signals.has_markdown_headers}")
        print(f"  Has logs   : {signals.has_log_ids}")
        print(f"  Language   : {signals.detected_language}")
        print(f"  Avg para   : {signals.avg_paragraph_length:.0f} chars")
    print("\n=== DONE ===\n")
