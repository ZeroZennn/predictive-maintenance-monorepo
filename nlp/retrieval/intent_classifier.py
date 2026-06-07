"""
Intent Classifier untuk PRAM.
Klasifikasikan query ke intent sebelum masuk retrieval pipeline.
Tidak menggunakan LLM — pure keyword + heuristic untuk kecepatan.
"""
from __future__ import annotations
import re
from enum import Enum
from dataclasses import dataclass
from typing import Optional

from nlp.prompting.assistant_identity import (
    IDENTITY_KEYWORDS,
    SYSTEM_INFO_KEYWORDS,
    DOCUMENT_INQUIRY_KEYWORDS,
)


class QueryIntent(str, Enum):
    IDENTITY         = "identity"          # "siapa kamu?"
    SYSTEM_INFO      = "system_info"       # "apa yang bisa kamu lakukan?"
    DOCUMENT_INQUIRY = "document_inquiry"  # "ada berapa dokumen M-01?"
    OFF_TOPIC        = "off_topic"         # "cuaca hari ini?"
    MACHINE_QUICK    = "machine_quick"     # "apa itu M-01?"
    MACHINE_ANALYTICAL = "machine_analytical"  # query panjang/kompleks
    FOLLOW_UP        = "follow_up"         # ada history + query pendek


@dataclass
class IntentResult:
    intent: QueryIntent
    confidence: float          # 0.0 - 1.0
    extracted_machine_id: Optional[str] = None   # e.g. "M-01"
    normalized_query: str = ""                   # query setelah normalisasi typo


# ── Normalisasi Typo ───────────────────────────────────────────────────────────

# Pattern untuk machine ID yang salah tulis
_MACHINE_ID_PATTERNS = [
    (r'\bm[-_\s]?(\d{1,2})\b', r'M-\1'),     # m01, m-01, m_01, m 01 → M-01
    (r'\bmesin\s+(\d{1,2})\b', r'M-\1'),      # mesin 1 → M-01 (tidak sempurna tapi helpful)
]

# Singkatan umum teknisi
_ABBREVIATIONS = {
    "gmn": "bagaimana",
    "gimana": "bagaimana",
    "knp": "kenapa",
    "krn": "karena",
    "utk": "untuk",
    "dgn": "dengan",
    "yg": "yang",
    "sdh": "sudah",
    "blm": "belum",
    "hrs": "harus",
    "prawatan": "perawatan",
    "prawaran": "perawatan",
    "pemliharaan": "pemeliharaan",
    "mntenance": "maintenance",
    "maintnance": "maintenance",
}


def normalize_query(query: str) -> str:
    """Normalisasi typo dan singkatan umum pada query."""
    normalized = query.strip()
    
    # Expand singkatan
    words = normalized.split()
    words = [_ABBREVIATIONS.get(w.lower(), w) for w in words]
    normalized = " ".join(words)
    
    # Fix machine ID format (case-insensitive)
    for pattern, replacement in _MACHINE_ID_PATTERNS:
        normalized = re.sub(pattern, replacement, normalized, flags=re.IGNORECASE)
    
    # Hapus karakter aneh tapi pertahankan alfanumerik, spasi, tanda baca penting
    normalized = re.sub(r'[^\w\s\-\?\.\,]', ' ', normalized)
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    
    return normalized


def extract_machine_id(query: str) -> Optional[str]:
    """Ekstrak machine ID dari query. Return first match atau None."""
    pattern = r'\bM-(\d{1,2})\b'
    match = re.search(pattern, query, flags=re.IGNORECASE)
    if match:
        num = match.group(1).zfill(2)  # M-1 → M-01
        return f"M-{num}"
    return None


# ── Off-topic Detection ────────────────────────────────────────────────────────

_OFF_TOPIC_PATTERNS = [
    r'^(halo|hai|hi|hello|hey|hei|p?agi|siang|sore|malam)\b',
    r'^(apa kabar|how are you|what\'s up)',
    r'\b(cuaca|weather|berita|news|olahraga|bola|film|musik|lagu)\b',
    r'\b(presiden|politik|ekonomi|saham|crypto|bitcoin)\b',
    r'\b(resep|masak|makanan|restoran)\b',
    r'^(ok|oke|iya|ya|tidak|nope|yes|no|thanks|terima kasih|makasih)\s*$',
    r'^[\W\s]+$',  # hanya simbol/spasi
]

_IN_SCOPE_PATTERNS = [
    r'\bM-\d{1,2}\b',           # ada machine ID
    r'\b(mesin|machine)\b',
    r'\b(maintenance|pemeliharaan|perawatan|perbaikan|servis)\b',
    r'\b(SOP|prosedur|LOTO|langkah)\b',
    r'\b(sensor|suhu|vibrasi|tekanan|RPM|bearing|belt|komponen)\b',
    r'\b(RUL|warning|critical|alert|kerusakan|emergency)\b',
    r'\b(dokumen|laporan|manual|file)\b',
    r'\b(downtime|biaya|cost|part|spare)\b',
]


def _matches_any(text: str, patterns: list) -> bool:
    text_lower = text.lower()
    return any(re.search(p, text_lower) for p in patterns)


def _matches_keywords(text: str, keywords: list) -> bool:
    text_lower = text.lower()
    return any(kw in text_lower for kw in keywords)


# ── Main Classifier ────────────────────────────────────────────────────────────

class IntentClassifier:
    """
    Klasifikasikan query ke QueryIntent tanpa LLM.
    Urutan pengecekan: identity → system_info → document_inquiry 
                       → off_topic → machine intents
    """

    def classify(
        self,
        query: str,
        history: list | None = None,
    ) -> IntentResult:
        """
        Klasifikasikan query dan return IntentResult.
        
        Args:
            query: raw query dari user
            history: list of {"role": str, "content": str} atau None
        """
        normalized = normalize_query(query)
        machine_id = extract_machine_id(normalized)
        query_lower = normalized.lower()
        has_history = bool(history and len(history) > 0)

        # ── 1. Identity ───────────────────────────────────────────────────────
        if _matches_keywords(query_lower, IDENTITY_KEYWORDS):
            return IntentResult(
                intent=QueryIntent.IDENTITY,
                confidence=0.95,
                extracted_machine_id=None,
                normalized_query=normalized,
            )

        # ── 2. System Info ────────────────────────────────────────────────────
        if _matches_keywords(query_lower, SYSTEM_INFO_KEYWORDS):
            return IntentResult(
                intent=QueryIntent.SYSTEM_INFO,
                confidence=0.95,
                extracted_machine_id=None,
                normalized_query=normalized,
            )

        # ── 3. Document Inquiry ───────────────────────────────────────────────
        if _matches_keywords(query_lower, DOCUMENT_INQUIRY_KEYWORDS):
            return IntentResult(
                intent=QueryIntent.DOCUMENT_INQUIRY,
                confidence=0.90,
                extracted_machine_id=machine_id,
                normalized_query=normalized,
            )

        # ── 4. Off-topic ──────────────────────────────────────────────────────
        is_off_topic = _matches_any(normalized, _OFF_TOPIC_PATTERNS)
        is_in_scope  = _matches_any(normalized, _IN_SCOPE_PATTERNS)

        if is_off_topic and not is_in_scope:
            return IntentResult(
                intent=QueryIntent.OFF_TOPIC,
                confidence=0.85,
                extracted_machine_id=None,
                normalized_query=normalized,
            )

        # ── 5. Follow-up (ada history + query pendek) ─────────────────────────
        if has_history and len(normalized.split()) <= 15 and not machine_id:
            return IntentResult(
                intent=QueryIntent.FOLLOW_UP,
                confidence=0.75,
                extracted_machine_id=machine_id,
                normalized_query=normalized,
            )

        # ── 6. Machine Quick vs Analytical ───────────────────────────────────
        word_count = len(normalized.split())
        is_quick = (
            word_count <= 8
            and not any(w in query_lower for w in [
                "kapan", "kenapa", "bagaimana", "berapa", "bandingkan",
                "semua", "seluruh", "historis", "riwayat", "tren"
            ])
        )

        intent = QueryIntent.MACHINE_QUICK if is_quick else QueryIntent.MACHINE_ANALYTICAL
        return IntentResult(
            intent=intent,
            confidence=0.70,
            extracted_machine_id=machine_id,
            normalized_query=normalized,
        )
