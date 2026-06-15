"""Pydantic schemas untuk Lapis AI NLP API."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ══════════════════════════════════════════════════════════════════════════════
# REQUEST SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════


class ChatMessage(BaseModel):
    """Satu pesan dalam riwayat percakapan."""

    role   : str  # "user" | "assistant"
    content: str


class QueryRequest(BaseModel):
    """Request query dari teknisi ke NLP pipeline."""

    query       : str = Field(
        ...,
        min_length  = 1,
        max_length  = 2000,
        description = "Pertanyaan dari teknisi",
    )
    machine_ids : Optional[List[str]] = Field(
        default     = None,
        description = "Filter mesin, contoh: ['M-01']",
    )
    session_id  : Optional[str] = Field(
        default     = None,
        description = "ID sesi percakapan",
    )
    history     : Optional[List[ChatMessage]] = Field(
        default     = None,
        description = "Riwayat percakapan (max 6 pesan terakhir)",
    )
    mode        : Optional[str] = Field(
        default     = "auto",
        description = "auto|general|machine_specific",
    )
    use_reranker: bool = Field(default=True)
    use_hybrid  : bool = Field(default=True)


class IngestRequest(BaseModel):
    """Request ingest dokumen baru dari Backend."""

    document_id: str = Field(
        ...,
        description = "ID dokumen dari Backend DB",
    )
    file_path  : str = Field(
        ...,
        description = "Absolute path ke file PDF/DOCX/TXT",
    )
    filename   : str = Field(
        ...,
        description = "Nama file asli",
    )
    doc_type   : Optional[str] = Field(
        default     = None,
        description = "Jika None, NLP akan detect otomatis",
    )


# ══════════════════════════════════════════════════════════════════════════════
# RESPONSE SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════


class CitationItem(BaseModel):
    """Satu item referensi dokumen yang digunakan dalam jawaban."""

    source_doc: str
    page      : int
    chunk_id  : str
    doc_type  : str
    relevance : float


class LiveContextSnapshot(BaseModel):
    """Snapshot kondisi real-time satu mesin."""

    machine_id    : str
    status        : str
    temperature_c : Optional[float] = None
    vibration_mms : Optional[float] = None
    pressure_psi  : Optional[float] = None
    rpm           : Optional[float] = None
    ml_prediction : str = "unknown"
    rul_days      : Optional[float] = None
    active_alerts : List[str] = []
    data_source   : str = "mock"


class QueryResponse(BaseModel):
    """Respons lengkap pipeline RAG untuk satu query teknisi."""

    query_id          : str
    query             : str
    answer            : str
    action_suggestions: List[str] = []
    citations         : List[CitationItem] = []
    context_texts     : List[str] = []
    live_context_used : bool = False
    live_context_data : Optional[List[LiveContextSnapshot]] = None
    mode              : str = "general"
    provider_used     : str = ""
    model_used        : str = ""
    confidence        : str = "medium"   # "low" | "medium" | "high"
    latency_ms        : int = 0
    session_id        : Optional[str] = None
    timestamp         : str = ""

    class Config:
        protected_namespaces = ()
        json_schema_extra = {
            "example": {
                "query_id"          : "QRY-20260517-001",
                "query"             : "Apa kondisi M-02 saat ini?",
                "answer"            : "ANALISIS: M-02 dalam kondisi kritis...",
                "action_suggestions": ["[SEGERA] Hentikan operasi M-02"],
                "citations"         : [
                    {
                        "source_doc": "LAP-BUNDLE",
                        "page"      : 3,
                        "chunk_id"  : "CHK-M02-2025-08-004",
                        "doc_type"  : "maintenance_report",
                        "relevance" : 0.92,
                    }
                ],
                "live_context_used" : True,
                "mode"              : "machine_specific",
                "provider_used"     : "nvidia",
                "model_used"        : "deepseek-ai/deepseek-v4-flash",
                "confidence"        : "high",
                "latency_ms"        : 2500,
            }
        }


class IngestResponse(BaseModel):
    """Respons setelah request ingest dokumen diterima."""

    document_id  : str
    status       : str              # "accepted" | "processing" | "ready" | "failed"
    message      : str
    chunks_count : Optional[int] = None
    doc_type     : Optional[str] = None
    processed_at : Optional[str] = None
    error_message: Optional[str] = None


class HealthResponse(BaseModel):
    """Respons health check seluruh komponen NLP pipeline."""

    status          : str     # "ok" | "degraded" | "error"
    vector_db       : str     # "ok" | "error"
    embedding_model : str     # "loaded" | "not_loaded"
    llm_provider    : str     # nama provider aktif
    llm_status      : str     # "ok" | "error" | "mock"
    chunks_indexed  : int   = 0
    uptime_seconds  : float = 0.0
    version         : str   = "1.0.0"


class ErrorResponse(BaseModel):
    """Respons error standar untuk semua endpoint."""

    error : str
    detail: Optional[str] = None
    code  : int = 500
