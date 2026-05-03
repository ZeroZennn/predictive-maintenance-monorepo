"""Base chunker interface untuk Lapis AI RAG Pipeline."""

import json
import logging
import re
from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml


# ── Dataclass ──────────────────────────────────────────────────────────────────


@dataclass
class BaseChunk:
    """Representasi satu chunk dokumen dengan metadata lengkap untuk RAG pipeline."""

    # ── Universal Fields (wajib semua doc type) ────────────────────────────────
    chunk_id: str
    doc_type: str                   # maintenance_report | manual | sop | schema | unknown
    source_doc: str                 # nama file asal tanpa ekstensi
    source_page: int                # nomor halaman PDF — WAJIB untuk citation Frontend
    chunk_type: str                 # tipe chunk spesifik per doc_type
    text_content: str               # teks final yang akan di-embed
    machine_ids: List[str]          # ["M-01"] atau ["ALL"] jika dokumen umum
    priority: int                   # 1=low, 2=medium, 3=high (Emergency=3)

    # ── Optional Fields (None jika tidak relevan) ──────────────────────────────
    month_label: Optional[str] = None           # "Juli 2025" — hanya maintenance
    month_index: Optional[int] = None           # 1–12
    year: Optional[int] = None
    section: Optional[str] = None              # nama section dokumen
    log_id: Optional[str] = None               # "ML-0383" — hanya maintenance
    event_type: Optional[str] = None           # Emergency | Corrective | Preventive
    downtime_hours: Optional[float] = None
    cost_idr: Optional[str] = None
    part_codes: Optional[List[str]] = field(default=None)
    thresholds: Optional[Dict[str, Any]] = field(default=None)
    extra_metadata: Optional[Dict[str, Any]] = field(default=None)

    # ── Concrete Methods ───────────────────────────────────────────────────────

    def to_dict(self) -> Dict:
        """Serialisasi chunk ke dictionary menggunakan dataclasses.asdict."""
        return asdict(self)

    def to_embedding_text(self) -> str:
        """Return teks yang akan di-embed; hook point untuk override oleh subclass."""
        return self.text_content

    def get_citation(self) -> Dict[str, Any]:
        """Return dict citation card yang siap dikonsumsi Frontend."""
        return {
            "source_doc": self.source_doc,
            "source_page": self.source_page,
            "doc_type": self.doc_type,
            "chunk_id": self.chunk_id,
            "machine_ids": self.machine_ids,
        }


# ── Abstract Base Class ────────────────────────────────────────────────────────


class BaseChunker(ABC):
    """Abstract base class yang wajib dipatuhi semua chunker Lapis AI."""

    def __init__(self, config_path: str = "nlp/configs/config.yaml") -> None:
        """Load config, setup logger, dan inisialisasi path dari config."""
        with open(config_path, "r", encoding="utf-8") as f:
            self.config: Dict = yaml.safe_load(f)

        # Logger per subclass — nama logger mengikuti nama class turunan
        logging.basicConfig(
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        )
        self.logger = logging.getLogger(self.__class__.__name__)

        self.processed_dir = Path(self.config["paths"]["data_processed"])

    # ── Abstract Methods ───────────────────────────────────────────────────────

    @abstractmethod
    def chunk(self, doc_id: str) -> List[BaseChunk]:
        """Proses dokumen dan return list of chunks. Wajib diimplementasi subclass."""
        ...

    @abstractmethod
    def get_statistics(self, chunks: List[BaseChunk]) -> Dict[str, Any]:
        """Return statistik chunks. Wajib diimplementasi subclass."""
        ...

    # ── Concrete Utility Methods ───────────────────────────────────────────────

    def save_chunks(self, chunks: List[BaseChunk], doc_id: str) -> Path:
        """Simpan chunks ke JSON file di processed_dir."""
        output_path = self.processed_dir / f"{doc_id}.chunks.json"
        data = [chunk.to_dict() for chunk in chunks]
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        self.logger.info("Saved %d chunks → %s", len(chunks), output_path)
        return output_path

    def load_clean_text(self, doc_id: str) -> str:
        """Load clean text dari processed_dir/{doc_id}.clean.txt."""
        path = self.processed_dir / f"{doc_id}.clean.txt"
        if not path.exists():
            raise FileNotFoundError(f"Clean text not found: {path}")
        return path.read_text(encoding="utf-8")

    def load_tables(self, doc_id: str) -> List[Dict]:
        """Load tables JSON dari processed_dir/{doc_id}.tables.json."""
        path = self.processed_dir / f"{doc_id}.tables.json"
        if not path.exists():
            self.logger.warning("No tables file found: %s", path)
            return []
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def load_metadata(self, doc_id: str) -> Dict:
        """Load document metadata dari processed_dir/{doc_id}.meta.json."""
        path = self.processed_dir / f"{doc_id}.meta.json"
        if not path.exists():
            raise FileNotFoundError(f"Metadata not found: {path}")
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def detect_machine_ids(
        self, text: str, filename: str = ""
    ) -> List[str]:
        """Deteksi machine_id dari teks dan nama file menggunakan regex."""
        pattern = r"M[-_]?\d{2}"
        found: set = set()

        # Cari di filename
        found.update(re.findall(pattern, filename, re.IGNORECASE))

        # Cari di 500 karakter pertama teks (area header dokumen)
        found.update(re.findall(pattern, text[:500], re.IGNORECASE))

        # Normalisasi format: "M01" / "M_01" → "M-01"
        normalized: List[str] = []
        for m in found:
            m_clean = re.sub(r"M_?(\d{2})", r"M-\1", m.upper())
            normalized.append(m_clean)

        return sorted(set(normalized)) if normalized else ["ALL"]
