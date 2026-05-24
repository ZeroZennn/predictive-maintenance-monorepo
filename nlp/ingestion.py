"""
ingestion.py — Lapis AI NLP Pipeline: Fase 1 Document Ingestion
================================================================
Mengekstrak teks dan tabel dari PDF laporan pemeliharaan,
membersihkan teks, dan menyimpan output terstruktur ke disk.
"""

import json
import logging
import re
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import pdfplumber
import fitz  # PyMuPDF — fallback extractor
import yaml


# ── Logging Setup ──────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# ── Dataclass ──────────────────────────────────────────────────────────────────


@dataclass
class DocumentMetadata:
    """Metadata lengkap satu dokumen yang telah diproses."""

    doc_id: str
    doc_type: str                      # maintenance_report | knowledge_base | schema | api_contract
    source_file: str                   # nama file asli
    month: Optional[str]              # "M01" s/d "M20", atau range "M01-M20", atau None
    machine_ids: List[str] = field(default_factory=list)    # diisi saat chunking
    anomaly_flags: List[str] = field(default_factory=list)  # diisi saat chunking
    page_count: int = 0
    extraction_method: str = "pdfplumber"  # pdfplumber | pymupdf | ocr
    extracted_at: str = ""            # ISO 8601 timestamp
    has_tables: bool = False
    table_count: int = 0


# ── Pipeline Class ─────────────────────────────────────────────────────────────


class DocumentIngestionPipeline:
    """Pipeline ingestion dokumen PDF untuk Lapis AI NLP."""

    def __init__(self, config_path: str = "nlp/configs/config.yaml") -> None:
        """Load konfigurasi, setup logger, dan siapkan direktori output."""
        with open(config_path, "r", encoding="utf-8") as f:
            self.config: Dict = yaml.safe_load(f)

        self.raw_dir = Path(self.config["paths"]["data_raw"])
        self.processed_dir = Path(self.config["paths"]["data_processed"])
        self.processed_dir.mkdir(parents=True, exist_ok=True)

        logger.info("DocumentIngestionPipeline initialized.")
        logger.info("  raw_dir      : %s", self.raw_dir)
        logger.info("  processed_dir: %s", self.processed_dir)

    # ── Inference Helpers ──────────────────────────────────────────────────────

    def infer_doc_type(self, filename: str) -> str:
        """Infer tipe dokumen berdasarkan nama file."""
        lower = filename.lower()
        if "laporan" in lower:
            return "maintenance_report"
        if "knowledge" in lower:
            return "knowledge_base"
        if "schema" in lower or "data_schema" in lower:
            return "schema"
        if "api" in lower or "contract" in lower:
            return "api_contract"
        if any(kw in lower for kw in ["manual", "buku", "handbook", "panduan_mesin"]):
            return "manual"
        if any(kw in lower for kw in ["sop", "prosedur", "standard_operating"]):
            return "sop"
        return "unknown"

    def infer_month(self, filename: str) -> Optional[str]:
        """Ekstrak kode bulan (M01–M20) dari nama file, atau range jika lebih dari satu."""
        matches = re.findall(r"M(\d{2})", filename)
        if not matches:
            return None
        # Deduplikasi dan format ulang
        months = [f"M{m}" for m in dict.fromkeys(matches)]  # preserve order, dedup
        if len(months) == 1:
            return months[0]
        # Lebih dari satu bulan → tampilkan sebagai range min–max
        return f"{min(months)}-{max(months)}"

    def generate_doc_id(self, filename: str, doc_type: str) -> str:
        """Buat doc_id unik berdasarkan tipe dokumen dan bulan."""
        if doc_type == "maintenance_report":
            month = self.infer_month(filename)
            if month is None:
                return f"LAP-{Path(filename).stem[:8].upper()}"
            if "-" in month:  # range seperti M01-M20
                return "LAP-BUNDLE"
            return f"LAP-{month}"
        if doc_type == "knowledge_base":
            return "KB-001"
        if doc_type == "schema":
            return "SCH-001"
        if doc_type == "api_contract":
            return "API-001"
        return f"DOC-{Path(filename).stem[:8].upper()}"

    # ── Extraction Methods ─────────────────────────────────────────────────────

    def extract_with_pdfplumber(
        self, pdf_path: Path
    ) -> Tuple[str, List[Dict], int]:
        """Ekstrak teks dan tabel dari PDF menggunakan pdfplumber (metode utama)."""
        pages_text: List[str] = []
        tables: List[Dict] = []

        with pdfplumber.open(pdf_path) as pdf:
            page_count = len(pdf.pages)
            for page_num, page in enumerate(pdf.pages, start=1):
                # ── Teks ──
                text = page.extract_text()
                if not text or not text.strip():
                    logger.warning(
                        "Page %d of '%s' yielded no text — skipping.",
                        page_num,
                        pdf_path.name,
                    )
                else:
                    pages_text.append(text)

                # ── Tabel ──
                try:
                    raw_tables = page.extract_tables()
                    if raw_tables:
                        for tbl in raw_tables:
                            tables.append({"page": page_num, "data": tbl})
                except Exception as tbl_err:
                    logger.warning(
                        "Table extraction failed on page %d: %s", page_num, tbl_err
                    )

        combined_text = "\n\n".join(pages_text)
        return combined_text, tables, page_count

    def extract_with_pymupdf(self, pdf_path: Path) -> Tuple[str, int]:
        """Ekstrak teks dari PDF menggunakan PyMuPDF sebagai fallback."""
        pages_text: List[str] = []

        doc = fitz.open(str(pdf_path))
        page_count = doc.page_count
        for page in doc:
            text = page.get_text("text")
            if text and text.strip():
                pages_text.append(text)
        doc.close()

        combined_text = "\n\n".join(pages_text)
        return combined_text, page_count

    # ── Text Cleaning ──────────────────────────────────────────────────────────

    def clean_text(self, raw_text: str) -> str:
        """Bersihkan teks hasil ekstraksi PDF dari noise dan artefak format."""
        # Step 1: Normalisasi linebreak
        text = raw_text.replace("\r\n", "\n").replace("\r", "\n")

        # Step 2: Fix broken paragraphs
        # Jika baris diakhiri huruf kecil/angka DAN baris berikutnya dimulai
        # huruf kecil → gabungkan dengan spasi (bukan newline baru)
        text = re.sub(r"([a-z0-9,;])\n([a-z])", r"\1 \2", text)

        # Step 3: Hapus baris yang HANYA berisi angka (nomor halaman)
        lines = text.split("\n")
        lines = [ln for ln in lines if not re.fullmatch(r"\s*\d+\s*", ln)]

        # Step 4: Hapus baris yang panjangnya < 3 karakter (noise)
        lines = [ln for ln in lines if len(ln.strip()) >= 3 or ln.strip() == ""]

        # Step 5: Collapse multiple blank lines → satu blank line
        text = "\n".join(lines)
        text = re.sub(r"\n{3,}", "\n\n", text)

        # Step 6: Strip leading/trailing whitespace per baris
        text = "\n".join(ln.rstrip() for ln in text.split("\n"))

        return text.strip()

    # ── Single-file Processor ──────────────────────────────────────────────────

    def process_single_file(self, pdf_path: Path) -> Optional[DocumentMetadata]:
        """Proses satu file PDF: ekstrak, bersihkan, dan simpan output."""
        logger.info("Processing: %s", pdf_path.name)

        filename = pdf_path.name
        doc_type = self.infer_doc_type(filename)
        month = self.infer_month(filename)
        doc_id = self.generate_doc_id(filename, doc_type)
        extracted_at = datetime.now(timezone.utc).isoformat()

        clean_text = ""
        tables: List[Dict] = []
        page_count = 0
        extraction_method = "pdfplumber"

        try:
            # Coba pdfplumber terlebih dahulu
            raw_text, tables, page_count = self.extract_with_pdfplumber(pdf_path)
            clean_text = self.clean_text(raw_text)

        except Exception as plumber_err:
            logger.warning(
                "pdfplumber failed for '%s': %s — falling back to PyMuPDF.",
                filename,
                plumber_err,
            )
            try:
                extraction_method = "pymupdf"
                raw_text, page_count = self.extract_with_pymupdf(pdf_path)
                clean_text = self.clean_text(raw_text)

            except Exception as fitz_err:
                logger.error(
                    "PyMuPDF also failed for '%s': %s", filename, fitz_err
                )
                return None

        table_count = len(tables)
        has_tables = table_count > 0

        metadata = DocumentMetadata(
            doc_id=doc_id,
            doc_type=doc_type,
            source_file=filename,
            month=month,
            machine_ids=[],
            anomaly_flags=[],
            page_count=page_count,
            extraction_method=extraction_method,
            extracted_at=extracted_at,
            has_tables=has_tables,
            table_count=table_count,
        )

        try:
            # Simpan clean text
            txt_path = self.processed_dir / f"{doc_id}.clean.txt"
            txt_path.write_text(clean_text, encoding="utf-8")

            # Simpan metadata sebagai JSON
            meta_path = self.processed_dir / f"{doc_id}.meta.json"
            meta_path.write_text(
                json.dumps(asdict(metadata), ensure_ascii=False, indent=2),
                encoding="utf-8",
            )

            # Simpan tabel jika ada
            if has_tables:
                tables_path = self.processed_dir / f"{doc_id}.tables.json"
                tables_path.write_text(
                    json.dumps(tables, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )

            logger.info(
                "✅ Done: %s | Pages: %d | Tables: %d",
                doc_id,
                page_count,
                table_count,
            )

        except OSError as io_err:
            logger.error("Failed to write output for '%s': %s", doc_id, io_err)
            return None

        return metadata

    # ── Batch Processor ────────────────────────────────────────────────────────

    def process_all(self) -> List[DocumentMetadata]:
        """Scan semua PDF di raw_dir, proses satu per satu, dan simpan summary."""
        pdf_files = sorted(self.raw_dir.glob("*.pdf"))

        if not pdf_files:
            logger.warning("No PDF files found in %s", self.raw_dir)
            return []

        logger.info("Found %d PDF file(s) to process.", len(pdf_files))

        results: List[DocumentMetadata] = []
        failed = 0

        for pdf_path in pdf_files:
            metadata = self.process_single_file(pdf_path)
            if metadata is not None:
                results.append(metadata)
            else:
                failed += 1

        # Simpan summary
        summary = {
            "total_files": len(pdf_files),
            "successful": len(results),
            "failed": failed,
            "documents": [m.doc_id for m in results],
            "processed_at": datetime.now(timezone.utc).isoformat(),
        }
        summary_path = self.processed_dir / "ingestion_summary.json"
        summary_path.write_text(
            json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        logger.info(
            "Ingestion complete — %d/%d successful. Summary: %s",
            len(results),
            len(pdf_files),
            summary_path,
        )

        return results


# ── Entry Point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    pipeline = DocumentIngestionPipeline()
    processed = pipeline.process_all()

    print("\n" + "=" * 60)
    print(f"  LAPIS AI — Ingestion Summary")
    print("=" * 60)
    print(f"  Documents processed : {len(processed)}")
    for doc in processed:
        print(
            f"  [{doc.doc_id}]  {doc.source_file}  |  "
            f"pages={doc.page_count}  tables={doc.table_count}  "
            f"method={doc.extraction_method}"
        )
    print("=" * 60 + "\n")
