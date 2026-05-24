"""Smart NLP Router untuk Lapis AI RAG Pipeline."""

import logging
import re
import yaml
from dataclasses import asdict, dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


# ── Logging Setup ──────────────────────────────────────────────────────────────

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


# ── Enum ───────────────────────────────────────────────────────────────────────


class QueryMode(Enum):
    """Mode klasifikasi query berdasarkan scope dan konteks."""
    GENERAL          = "general"
    MACHINE_SPECIFIC = "machine_specific"
    HISTORICAL       = "historical"
    MULTI_MACHINE    = "multi_machine"


# ── Dataclass ──────────────────────────────────────────────────────────────────


@dataclass
class RouterResult:
    """Hasil analisis routing — siap dikonsumsi oleh retriever."""

    mode           : QueryMode
    machine_ids    : List[str]       # [] jika general
    chunk_types    : List[str]       # [] jika tidak difilter
    doc_types      : List[str]       # [] jika tidak difilter
    min_priority   : Optional[int]   # None jika tidak difilter
    time_refs      : List[str]       # ["Juli 2025"] jika ada
    keywords       : List[str]       # kata kunci teknis terdeteksi
    expanded_query : str             # query yang sudah diperkaya
    confidence     : float           # 0.0–1.0

    def to_dict(self) -> Dict:
        """Serialisasi RouterResult ke plain dict."""
        d = asdict(self)
        d["mode"] = self.mode.value  # Enum → string
        return d

    def has_machine_filter(self) -> bool:
        """Return True jika ada filter machine_id spesifik."""
        return len(self.machine_ids) > 0

    def is_emergency_priority(self) -> bool:
        """Return True jika query memerlukan pencarian prioritas emergency."""
        return self.min_priority is not None and self.min_priority >= 3


# ── Router Class ───────────────────────────────────────────────────────────────


class QueryRouter:
    """Analisis query mentah dan hasilkan parameter pencarian terstruktur."""

    def __init__(self, config_path: str = "nlp/configs/config.yaml") -> None:
        """Load config, setup logger, dan inisialisasi semua pattern deteksi."""
        with open(config_path, "r", encoding="utf-8") as f:
            self.config: Dict = yaml.safe_load(f)

        self.logger = logging.getLogger(self.__class__.__name__)

        # ── Regex Patterns ─────────────────────────────────────────────────────
        self.MACHINE_PATTERN: str = r"\bM-?\d{2}\b"

        self.TIME_PATTERNS: List[str] = [
            (
                r"\b(januari|februari|maret|april|mei|juni|juli|agustus|"
                r"september|oktober|november|desember)\s+\d{4}\b"
            ),
            r"\bM-?(\d{2})\b(?=\s*(lalu|kemarin|terakhir))",
            r"\b(bulan\s+lalu|minggu\s+lalu|kemarin|terbaru|terakhir)\b",
        ]

        # Pre-compile time patterns untuk efisiensi
        self._time_re = [
            re.compile(p, re.IGNORECASE) for p in self.TIME_PATTERNS
        ]

        # ── Keyword Lists ──────────────────────────────────────────────────────
        self.EMERGENCY_KEYWORDS: List[str] = [
            "emergency", "darurat", "kritis", "critical", "mati total",
            "berhenti", "shutdown", "short circuit", "kebakaran",
            "overheat", "meledak", "asap",
        ]

        self.MAINTENANCE_KEYWORDS: List[str] = [
            "ganti", "penggantian", "corrective", "perbaikan",
            "kerusakan", "rusak", "bearing", "seal", "belt",
            "motor", "sensor", "filter", "valve", "pump",
        ]

        self.SOP_KEYWORDS: List[str] = [
            "sop", "prosedur", "langkah", "cara", "bagaimana",
            "instruksi", "manual", "panduan", "keselamatan",
            "loto", "apd", "safety", "batas", "threshold",
            "spesifikasi", "teknis",
        ]

    # ── Extraction Helpers ─────────────────────────────────────────────────────

    def extract_machine_ids(self, text: str) -> List[str]:
        """Ekstrak semua machine_id dari teks menggunakan regex, return sorted list."""
        raw_matches = re.findall(self.MACHINE_PATTERN, text, re.IGNORECASE)
        normalized: set = set()
        for m in raw_matches:
            # Normalisasi: "M01" → "M-01", "M-1" → "M-01"
            digits = re.sub(r"[^0-9]", "", m)
            normalized.add(f"M-{digits.zfill(2)}")
        return sorted(normalized)

    def extract_time_refs(self, text: str) -> List[str]:
        """Ekstrak referensi waktu (bulan, kata relatif) dari teks."""
        found: List[str] = []
        for pattern in self._time_re:
            matches = pattern.findall(text)
            for m in matches:
                # findall bisa return tuple jika ada group → ambil elemen pertama
                token = m[0] if isinstance(m, tuple) else m
                if token and token not in found:
                    found.append(token)
        return found

    def detect_keywords(
        self, text: str, keyword_list: List[str]
    ) -> List[str]:
        """Deteksi kata kunci teknis dari keyword_list yang muncul dalam teks."""
        text_lower = text.lower()
        return [kw for kw in keyword_list if kw in text_lower]

    # ── Classification ─────────────────────────────────────────────────────────

    def classify_mode(
        self, text: str, machine_ids: List[str]
    ) -> Tuple[QueryMode, float]:
        """Klasifikasikan mode query dan hitung confidence score."""
        text_lower = text.lower()
        time_refs  = self.extract_time_refs(text)

        if len(machine_ids) > 1:
            return QueryMode.MULTI_MACHINE, 0.95

        if len(machine_ids) == 1:
            if time_refs:
                return QueryMode.HISTORICAL, 0.90
            return QueryMode.MACHINE_SPECIFIC, 0.95

        # len(machine_ids) == 0
        sop_hits = self.detect_keywords(text_lower, self.SOP_KEYWORDS)
        if sop_hits:
            return QueryMode.GENERAL, 0.85

        if time_refs:
            return QueryMode.HISTORICAL, 0.75

        return QueryMode.GENERAL, 0.70

    def build_chunk_type_filter(
        self, text: str, mode: QueryMode
    ) -> List[str]:
        """Tentukan chunk_type filter berdasarkan konten query dan mode."""
        text_lower  = text.lower()
        chunk_types: List[str] = []

        if self.detect_keywords(text_lower, self.EMERGENCY_KEYWORDS):
            chunk_types.append("event_emergency")

        if self.detect_keywords(text_lower, self.MAINTENANCE_KEYWORDS):
            chunk_types.extend(["event_corrective", "event_emergency"])

        if (self.detect_keywords(text_lower, self.SOP_KEYWORDS)
                and mode == QueryMode.GENERAL):
            chunk_types.extend([
                "specification", "procedure",
                "troubleshooting", "safety", "prose",
            ])

        if "summary" in text_lower or "ringkasan" in text_lower:
            chunk_types.append("machine_summary")

        return list(set(chunk_types))

    def build_doc_type_filter(
        self, text: str, mode: QueryMode
    ) -> List[str]:
        """Tentukan doc_type filter berdasarkan mode dan konten query."""
        text_lower = text.lower()

        if (mode == QueryMode.GENERAL
                and self.detect_keywords(text_lower, self.SOP_KEYWORDS)):
            return ["manual", "sop", "knowledge_base"]

        if mode == QueryMode.MACHINE_SPECIFIC:
            return []  # ambil dari semua doc_type

        return []

    def expand_query(
        self, query: str, machine_ids: List[str], mode: QueryMode
    ) -> str:
        """Perkaya query dengan konteks tambahan untuk meningkatkan kualitas embedding."""
        expanded = query

        if mode == QueryMode.MACHINE_SPECIFIC and machine_ids:
            machine_str = ", ".join(machine_ids)
            expanded = expanded + f" mesin {machine_str} pemeliharaan"

        if mode == QueryMode.GENERAL:
            expanded = expanded + " prosedur operasional standar"

        return expanded.strip()

    # ── Main Entry Point ───────────────────────────────────────────────────────

    def route(
        self,
        query: str,
        machine_ids_hint: Optional[List[str]] = None,
    ) -> RouterResult:
        """Entry point utama — analisis query dan return RouterResult lengkap."""
        self.logger.info("Routing query: '%s...'", query[:60])

        # Ekstrak machine_ids dari teks query
        machine_ids_from_text = self.extract_machine_ids(query)

        # Gabungkan dengan hint dari UI jika ada
        if machine_ids_hint:
            combined = set(machine_ids_from_text) | set(machine_ids_hint)
            machine_ids = sorted(combined)
        else:
            machine_ids = machine_ids_from_text

        time_refs = self.extract_time_refs(query)
        mode, confidence = self.classify_mode(query, machine_ids)

        chunk_types = self.build_chunk_type_filter(query, mode)
        doc_types   = self.build_doc_type_filter(query, mode)
        expanded    = self.expand_query(query, machine_ids, mode)

        # min_priority: tidak difilter — biarkan chunk_type filter yang bekerja
        min_priority: Optional[int] = None

        # Kumpulkan semua keyword yang terdeteksi
        emergency_kw   = self.detect_keywords(query, self.EMERGENCY_KEYWORDS)
        maintenance_kw = self.detect_keywords(query, self.MAINTENANCE_KEYWORDS)
        sop_kw         = self.detect_keywords(query, self.SOP_KEYWORDS)
        keywords       = emergency_kw + maintenance_kw + sop_kw

        self.logger.info(
            "Route result: mode=%s | machines=%s | confidence=%.2f",
            mode.value,
            machine_ids,
            confidence,
        )

        return RouterResult(
            mode           = mode,
            machine_ids    = machine_ids,
            chunk_types    = chunk_types,
            doc_types      = doc_types,
            min_priority   = min_priority,
            time_refs      = time_refs,
            keywords       = keywords,
            expanded_query = expanded,
            confidence     = confidence,
        )


# ── Entry Point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    router = QueryRouter()

    test_queries = [
        ("Apa yang terjadi pada M-01 bulan Agustus 2025?", None),
        ("Kenapa M-07 sering mengalami short circuit?", None),
        ("Bagaimana prosedur LOTO sebelum membuka panel?", None),
        ("Bandingkan kondisi M-01 dan M-02 tahun ini", None),
        ("Apa penyebab bearing aus?", ["M-03"]),  # machine_ids_hint dari UI
    ]

    print("=== SMART NLP ROUTER TEST ===\n")
    for query, hint in test_queries:
        result = router.route(query, machine_ids_hint=hint)
        print(f"Query     : {query}")
        print(f"Mode      : {result.mode.value}")
        print(f"Machines  : {result.machine_ids}")
        print(f"ChunkTyp  : {result.chunk_types}")
        print(f"DocTypes  : {result.doc_types}")
        print(f"TimeRefs  : {result.time_refs}")
        print(f"Expanded  : {result.expanded_query}")
        print(f"Confidence: {result.confidence:.2f}")
        print("-" * 50)
