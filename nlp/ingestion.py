"""
ingestion.py — Lapis AI Universal Document Ingestion
=====================================================
Layer 1: Extract text dari file apapun, simpan clean text + metadata.
Tidak ada asumsi format. Metadata diekstrak dari konten, bukan nama file.
"""

import json
import logging
import re
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import pdfplumber
import fitz
import yaml

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@dataclass
class DocumentMetadata:
    doc_id: str                          # hash pendek dari nama file
    source_file: str                     # nama file asli
    file_type: str                       # pdf | txt | docx
    page_count: int = 0
    extraction_method: str = "pdfplumber"
    extracted_at: str = ""
    has_tables: bool = False
    table_count: int = 0
    char_count: int = 0
    # Content-based metadata (diekstrak dari teks, bukan nama file)
    detected_machine_ids: List[str] = field(default_factory=list)
    detected_periods: List[str] = field(default_factory=list)
    detected_log_ids: List[str] = field(default_factory=list)
    detected_language: str = "unknown"  # "id" | "en" | "mixed"


class DocumentIngestionPipeline:

    def __init__(self, config_path: str = "nlp/configs/config.yaml") -> None:
        with open(config_path, "r", encoding="utf-8") as f:
            self.config: Dict = yaml.safe_load(f)
        self.raw_dir = Path(self.config["paths"]["data_raw"])
        self.processed_dir = Path(self.config["paths"]["data_processed"])
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        logger.info("UniversalIngestionPipeline initialized.")
        logger.info("  raw_dir      : %s", self.raw_dir)
        logger.info("  processed_dir: %s", self.processed_dir)

    def make_doc_id(self, filename: str) -> str:
        """
        Buat doc_id dari nama file — bersih, tanpa asumsi konten.
        Contoh: 'Laporan_M-01_Juli_2025.pdf' → 'Laporan_M-01_Juli_2025'
        """
        return Path(filename).stem

    def extract_content_metadata(self, text: str) -> Dict:
        """
        Ekstrak metadata dari ISI TEKS menggunakan regex.
        Tidak pernah crash — semua hasil bisa berupa list kosong.
        """
        # Machine IDs: pola M-01 sampai M-20, atau M01-M20
        machine_ids = list(set(re.findall(r"\bM-?\d{2}\b", text)))
        machine_ids = [m.replace("M", "M-").replace("M--", "M-") 
                      for m in machine_ids]
        machine_ids = sorted(set(machine_ids))

        # Periode: bulan + tahun dalam Bahasa Indonesia atau Inggris
        bulan_id = (r"Januari|Februari|Maret|April|Mei|Juni|"
                   r"Juli|Agustus|September|Oktober|November|Desember")
        bulan_en = (r"January|February|March|April|May|June|"
                   r"July|August|September|October|November|December")
        periods = re.findall(
            rf"\b(?:{bulan_id}|{bulan_en})\s+\d{{4}}\b", text
        )
        periods = sorted(set(periods))

        # Log IDs: pola ML-XXXX
        log_ids = sorted(set(re.findall(r"\bML-\d{4}\b", text)))

        # Deteksi bahasa sederhana berdasarkan stopword dominan
        id_words = len(re.findall(
            r"\b(yang|dan|di|dari|untuk|dengan|adalah|pada|ini|itu)\b",
            text, re.IGNORECASE
        ))
        en_words = len(re.findall(
            r"\b(the|and|of|to|in|is|for|with|this|that)\b",
            text, re.IGNORECASE
        ))
        if id_words > en_words * 2:
            language = "id"
        elif en_words > id_words * 2:
            language = "en"
        else:
            language = "mixed"

        return {
            "detected_machine_ids": machine_ids,
            "detected_periods": periods,
            "detected_log_ids": log_ids,
            "detected_language": language,
        }

    def extract_with_pdfplumber(
        self, pdf_path: Path
    ) -> Tuple[str, List[Dict], int]:
        """Ekstrak teks dan tabel dari PDF menggunakan pdfplumber."""
        pages_text: List[str] = []
        tables: List[Dict] = []

        with pdfplumber.open(pdf_path) as pdf:
            page_count = len(pdf.pages)
            for page_num, page in enumerate(pdf.pages, start=1):
                text = page.extract_text()
                if text and text.strip():
                    pages_text.append(text)
                try:
                    raw_tables = page.extract_tables()
                    if raw_tables:
                        for tbl in raw_tables:
                            tables.append({"page": page_num, "data": tbl})
                except Exception as tbl_err:
                    logger.warning(
                        "Table extraction failed page %d: %s", page_num, tbl_err
                    )

        return "\n\n".join(pages_text), tables, page_count

    def extract_with_pymupdf(self, pdf_path: Path) -> Tuple[str, int]:
        """Fallback extractor menggunakan PyMuPDF."""
        doc = fitz.open(str(pdf_path))
        pages_text = []
        for page in doc:
            text = page.get_text("text")
            if text and text.strip():
                pages_text.append(text)
        doc.close()
        return "\n\n".join(pages_text), doc.page_count

    def clean_text(self, raw_text: str) -> str:
        """Bersihkan teks dari noise — universal, tidak ada aturan format spesifik."""
        text = raw_text.replace("\r\n", "\n").replace("\r", "\n")
        text = re.sub(r"([a-z0-9,;])\n([a-z])", r"\1 \2", text)
        lines = text.split("\n")
        lines = [ln for ln in lines if not re.fullmatch(r"\s*\d+\s*", ln)]
        lines = [ln for ln in lines if len(ln.strip()) >= 3 or ln.strip() == ""]
        text = "\n".join(lines)
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = "\n".join(ln.rstrip() for ln in text.split("\n"))
        return text.strip()

    def process_single_file(self, pdf_path: Path) -> Optional[DocumentMetadata]:
        """Proses satu file PDF: ekstrak, bersihkan, simpan output."""
        logger.info("Processing: %s", pdf_path.name)

        filename = pdf_path.name
        doc_id = self.make_doc_id(filename)
        extracted_at = datetime.now(timezone.utc).isoformat()

        clean_text_content = ""
        tables: List[Dict] = []
        page_count = 0
        extraction_method = "pdfplumber"

        try:
            raw_text, tables, page_count = self.extract_with_pdfplumber(pdf_path)
            clean_text_content = self.clean_text(raw_text)
        except Exception as plumber_err:
            logger.warning(
                "pdfplumber failed for '%s': %s — trying PyMuPDF.",
                filename, plumber_err
            )
            try:
                extraction_method = "pymupdf"
                raw_text, page_count = self.extract_with_pymupdf(pdf_path)
                clean_text_content = self.clean_text(raw_text)
            except Exception as fitz_err:
                logger.error("PyMuPDF also failed for '%s': %s", filename, fitz_err)
                return None

        # Ekstrak metadata dari konten
        content_meta = self.extract_content_metadata(clean_text_content)

        metadata = DocumentMetadata(
            doc_id=doc_id,
            source_file=filename,
            file_type=pdf_path.suffix.lstrip(".").lower(),
            page_count=page_count,
            extraction_method=extraction_method,
            extracted_at=extracted_at,
            has_tables=len(tables) > 0,
            table_count=len(tables),
            char_count=len(clean_text_content),
            detected_machine_ids=content_meta["detected_machine_ids"],
            detected_periods=content_meta["detected_periods"],
            detected_log_ids=content_meta["detected_log_ids"],
            detected_language=content_meta["detected_language"],
        )

        try:
            txt_path = self.processed_dir / f"{doc_id}.clean.txt"
            txt_path.write_text(clean_text_content, encoding="utf-8")

            meta_path = self.processed_dir / f"{doc_id}.meta.json"
            meta_path.write_text(
                json.dumps(asdict(metadata), ensure_ascii=False, indent=2),
                encoding="utf-8",
            )

            if tables:
                tables_path = self.processed_dir / f"{doc_id}.tables.json"
                tables_path.write_text(
                    json.dumps(tables, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )

            logger.info(
                "✅ %s | pages=%d | tables=%d | machines=%s | periods=%s | lang=%s",
                doc_id, page_count, len(tables),
                content_meta["detected_machine_ids"],
                content_meta["detected_periods"],
                content_meta["detected_language"],
            )

        except OSError as io_err:
            logger.error("Failed to write output for '%s': %s", doc_id, io_err)
            return None

        return metadata

    def process_all(self) -> List[DocumentMetadata]:
        """Scan semua PDF di raw_dir dan proses satu per satu."""
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
            "Ingestion complete — %d/%d successful.", len(results), len(pdf_files)
        )
        return results


if __name__ == "__main__":
    pipeline = DocumentIngestionPipeline()
    processed = pipeline.process_all()

    print("\n" + "=" * 60)
    print("  LAPIS AI — Universal Ingestion Summary")
    print("=" * 60)
    print(f"  Documents processed : {len(processed)}")
    for doc in processed:
        print(
            f"  [{doc.doc_id[:30]:30s}] "
            f"pages={doc.page_count:3d} | "
            f"tables={doc.table_count:3d} | "
            f"lang={doc.detected_language} | "
            f"machines={doc.detected_machine_ids[:3]}"
        )
    print("=" * 60 + "\n")
