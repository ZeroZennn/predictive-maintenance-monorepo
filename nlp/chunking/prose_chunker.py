"""Prose chunker untuk dokumen naratif: manual, SOP, knowledge base."""

import json
import re
from collections import Counter
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from nlp.chunking.base_chunker import BaseChunk, BaseChunker


# ── Dataclass ──────────────────────────────────────────────────────────────────


@dataclass
class ProseChunk(BaseChunk):
    """Chunk untuk dokumen naratif/prose."""


# ── Chunker Class ──────────────────────────────────────────────────────────────


class ProseChunker(BaseChunker):
    """Concrete chunker untuk memproses dokumen naratif menjadi section-based chunks."""

    def __init__(self, config_path: str = "nlp/configs/config.yaml") -> None:
        """Inisialisasi chunker dengan pattern deteksi section, threshold, dan part code."""
        super().__init__(config_path)

        # Urutan PENTING: cek dari paling spesifik ke paling umum
        self.SECTION_PATTERNS: List[Tuple[str, str]] = [
            (r"(?i)(keselamat|darurat|emergency|loto|apd|safety)", "safety"),
            (r"(?i)(troubleshoot|gangguan|gejala|perbaikan|solusi)", "troubleshooting"),
            (r"(?i)(prosedur|langkah|instruksi|cara|steps?|inspeksi)", "procedure"),
            (r"(?i)(spesifikasi|teknis|threshold|batas|parameter|operasional)", "specification"),
            (r"(?i)(deskripsi|umum|overview|pengantar|tentang|introduction)", "description"),
        ]

        self.THRESHOLD_PATTERNS: List[str] = [
            r"(?i)(suhu|temperature)[^\n]*?(\d+\.?\d*)\s*°?[Cc]",
            r"(?i)(getaran|vibration)[^\n]*?(\d+\.?\d*)\s*mm/s",
            r"(?i)(tekanan|pressure)[^\n]*?(\d+\.?\d*)\s*[Pp][Ss][Ii]",
            r"(?i)(rpm|kecepatan)[^\n]*?(\d+\.?\d*)",
        ]

        # Kunci threshold berdasarkan urutan THRESHOLD_PATTERNS
        self._THRESHOLD_KEYS: List[str] = [
            "temperature_critical",
            "vibration_critical",
            "pressure_critical",
            "rpm_standard",
        ]

        self.PART_CODE_PATTERN: str = r"(?i)\b([A-Z]{2,6}-[A-Z0-9]{2,8})\b"

    # ── Detection Helpers ──────────────────────────────────────────────────────

    def detect_section_type(self, section_text: str) -> str:
        """Deteksi chunk_type dari konten section menggunakan SECTION_PATTERNS."""
        preview = section_text[:300]
        for pattern, chunk_type in self.SECTION_PATTERNS:
            if re.search(pattern, preview):
                return chunk_type
        return "prose"

    def extract_thresholds(self, text: str) -> Dict[str, Any]:
        """Ekstrak nilai threshold operasional dari teks specification."""
        thresholds: Dict[str, Any] = {}
        for key, pattern in zip(self._THRESHOLD_KEYS, self.THRESHOLD_PATTERNS):
            match = re.search(pattern, text)
            if match:
                try:
                    # Grup 2 selalu berisi nilai numerik
                    thresholds[key] = float(match.group(2))
                except (IndexError, ValueError):
                    thresholds[key] = match.group(0).strip()
        return thresholds

    def extract_part_codes(self, text: str) -> List[str]:
        """Ekstrak part codes (format: XXX-YYY) dari teks."""
        matches = re.findall(self.PART_CODE_PATTERN, text)
        return sorted(set(m.upper() for m in matches))

    # ── Section Splitting ──────────────────────────────────────────────────────

    def split_into_sections(self, clean_text: str) -> List[Dict]:
        """Pecah teks menjadi sections berdasarkan numbered headers."""
        HEADER_PATTERN = r"^(\d+\.\s+.+)$"

        # re.split dengan capturing group → header masuk ke hasil
        parts = re.split(HEADER_PATTERN, clean_text, flags=re.MULTILINE)

        sections: List[Dict] = []

        if len(parts) == 1:
            # Tidak ada header ditemukan sama sekali — treat sebagai satu section
            self.logger.debug(
                "No numbered headers found — treating entire text as one section."
            )
            return [{"header": "Konten Utama", "content": clean_text.strip(), "section_number": None}]

        # parts = [preamble, header1, content1, header2, content2, ...]
        preamble = parts[0].strip()
        if preamble and len(preamble) >= 20:
            sections.append({
                "header": "Pendahuluan",
                "content": preamble,
                "section_number": 0,
            })

        # Iterasi pasangan (header, content)
        for i in range(1, len(parts) - 1, 2):
            header  = parts[i].strip()
            content = parts[i + 1].strip() if (i + 1) < len(parts) else ""

            # Ambil angka di depan header untuk section_number
            num_match = re.match(r"^(\d+)\.", header)
            section_number = int(num_match.group(1)) if num_match else None

            sections.append({
                "header": header,
                "content": content,
                "section_number": section_number,
            })

        self.logger.debug("split_into_sections → %d section(s) found.", len(sections))
        return sections

    # ── Text Builder ───────────────────────────────────────────────────────────

    def build_chunk_text(
        self,
        header: str,
        content: str,
        machine_ids: List[str],
        doc_type: str,
    ) -> str:
        """Bangun text_content final yang akan di-embed."""
        if len(machine_ids) == 1:
            machine_str = machine_ids[0]
        elif len(machine_ids) > 1:
            machine_str = "MULTI"
        else:
            machine_str = "ALL"

        chunk_type_upper = self.detect_section_type(content).upper()
        # Trim content agar embedding tidak meledak
        trimmed_content = content[:800]

        return (
            f"[{chunk_type_upper} | {machine_str} | {doc_type.upper()}] "
            f"{header}: {trimmed_content}"
        )

    # ── Abstract Method Implementations ────────────────────────────────────────

    def chunk(self, doc_id: str) -> List[BaseChunk]:
        """Implementasi abstract method — proses dokumen prose menjadi chunks."""
        self.logger.info("Starting ProseChunker for doc_id='%s'", doc_id)

        # a. Load artefak hasil ingestion
        metadata   = self.load_metadata(doc_id)
        source_doc = metadata.get("source_file", doc_id)
        doc_type   = metadata.get("doc_type", "unknown")

        # b. Load teks bersih
        clean_text = self.load_clean_text(doc_id)

        # c. Deteksi machine_ids dari teks + nama file
        machine_ids = self.detect_machine_ids(clean_text, source_doc)

        # d. Pecah teks menjadi sections
        sections = self.split_into_sections(clean_text)

        # e. Load tabel (jika ada, misal tabel troubleshooting di manual)
        tables = self.load_tables(doc_id)
        if tables:
            self.logger.info(
                "doc_id='%s' contains %d table(s) — tabel diabaikan oleh ProseChunker "
                "(gunakan MaintenanceChunker untuk data tabular).",
                doc_id,
                len(tables),
            )

        chunks: List[BaseChunk] = []

        # f. Buat chunk per section
        for idx, section in enumerate(sections):
            header  = section["header"]
            content = section["content"]

            if len(content.strip()) < 20:
                self.logger.debug(
                    "Section '%s' (idx=%d) too short (%d chars) — skipping.",
                    header,
                    idx,
                    len(content.strip()),
                )
                continue

            chunk_type  = self.detect_section_type(header + " " + content)
            thresholds  = self.extract_thresholds(content) if chunk_type == "specification" else {}
            part_codes  = self.extract_part_codes(content)

            # Estimasi halaman berdasarkan urutan section
            source_page = idx + 1

            chunk_id = f"CHK-{doc_id.upper()}-{idx:03d}"

            text_content = self.build_chunk_text(header, content, machine_ids, doc_type)

            prose_chunk = ProseChunk(
                # Universal fields
                chunk_id=chunk_id,
                doc_type=doc_type,
                source_doc=source_doc,
                source_page=source_page,
                chunk_type=chunk_type,
                text_content=text_content,
                machine_ids=machine_ids,
                priority=2,
                # Optional fields
                section=header,
                thresholds=thresholds if thresholds else None,
                part_codes=part_codes if part_codes else None,
                extra_metadata={
                    "section_number": section.get("section_number"),
                    "content_length": len(content),
                },
            )
            chunks.append(prose_chunk)

        # g. Simpan dan log
        self.save_chunks(chunks, doc_id)
        stats = self.get_statistics(chunks)
        self.logger.info(
            "ProseChunker complete for '%s' — total=%d | by_type=%s",
            doc_id,
            stats["total"],
            stats["by_type"],
        )

        return chunks

    def get_statistics(self, chunks: List[BaseChunk]) -> Dict[str, Any]:
        """Return statistik chunks prose."""
        avg_len = (
            int(sum(len(c.text_content) for c in chunks) / len(chunks))
            if chunks else 0
        )
        return {
            "total": len(chunks),
            "by_type": dict(Counter(c.chunk_type for c in chunks)),
            "by_machine": dict(
                Counter(c.machine_ids[0] for c in chunks if c.machine_ids)
            ),
            "has_thresholds": sum(1 for c in chunks if c.thresholds),
            "has_part_codes": sum(1 for c in chunks if c.part_codes),
            "avg_text_length": avg_len,
        }


# ── Entry Point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    chunker = ProseChunker()
    chunks  = chunker.chunk("DOC-BUKU_MAN")
    stats   = chunker.get_statistics(chunks)

    print(json.dumps(stats, indent=2, ensure_ascii=False))

    print("\nSample chunk:")
    if chunks:
        s = chunks[0]
        print(f"  chunk_id   : {s.chunk_id}")
        print(f"  chunk_type : {s.chunk_type}")
        print(f"  machine_ids: {s.machine_ids}")
        print(f"  thresholds : {s.thresholds}")
        print(f"  part_codes : {s.part_codes}")
        print(f"  text_content: {s.text_content[:150]}...")
