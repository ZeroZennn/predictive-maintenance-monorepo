"""Concrete chunker untuk dokumen maintenance_report Lapis AI RAG Pipeline."""

import json
import re
from collections import Counter
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from nlp.chunking.base_chunker import BaseChunk, BaseChunker


# ── Dataclass ──────────────────────────────────────────────────────────────────


@dataclass
class MaintenanceChunk(BaseChunk):
    """Chunk spesifik untuk dokumen maintenance report."""


# ── Chunker Class ──────────────────────────────────────────────────────────────


class MaintenanceChunker(BaseChunker):
    """Concrete chunker untuk memproses laporan pemeliharaan bulanan menjadi chunks."""

    def __init__(self, config_path: str = "nlp/configs/config.yaml") -> None:
        """Inisialisasi chunker dengan lookup maps untuk bulan, event, dan tipe chunk."""
        super().__init__(config_path)

        self.MONTH_MAP: Dict[str, int] = {
            "januari": 1, "februari": 2, "maret": 3, "april": 4,
            "mei": 5, "juni": 6, "juli": 7, "agustus": 8,
            "september": 9, "oktober": 10, "november": 11, "desember": 12,
        }

        self.EVENT_PRIORITY: Dict[str, int] = {
            "emergency": 3,
            "corrective": 2,
            "preventive": 1,
        }

        self.CHUNK_TYPE_MAP: Dict[str, str] = {
            "emergency": "event_emergency",
            "corrective": "event_corrective",
            "preventive": "event_preventive",
        }

    # ── Parsing Helpers ────────────────────────────────────────────────────────

    def normalize_header(self, header: str) -> str:
        """Bersihkan newline dan whitespace berlebih dari header kolom tabel."""
        if header is None:
            return ""
        return " ".join(header.replace("\n", " ").split())

    def build_context_map(self, clean_text: str) -> List[Dict]:
        """Bangun mapping urutan context (machine+month) dari clean text."""
        contexts: List[Dict] = []
        current_machine: Optional[str] = None
        current_month: Optional[str] = None

        # Pola: "Mesin M-01" atau "Mesin M01"
        machine_pattern = re.compile(r"Mesin\s+(M[-_]?\d{2})", re.IGNORECASE)
        # Pola: "Bulan: Juli 2025" atau "Bulan : Juli 2025"
        month_pattern = re.compile(
            r"Bulan\s*[:]\s*(\w+)\s+(\d{4})", re.IGNORECASE
        )

        for line in clean_text.splitlines():
            # Cek machine
            machine_match = machine_pattern.search(line)
            if machine_match:
                raw_id = machine_match.group(1)
                # Normalisasi ke "M-01"
                current_machine = re.sub(r"M_?(\d{2})", r"M-\1", raw_id.upper())
                current_month = None  # reset bulan saat mesin baru ditemukan
                continue

            # Cek bulan
            month_match = month_pattern.search(line)
            if month_match:
                month_name = month_match.group(1).lower()
                year_str = month_match.group(2)
                month_index = self.MONTH_MAP.get(month_name)
                if month_index and current_machine:
                    current_month = f"{month_match.group(1).capitalize()} {year_str}"
                    contexts.append({
                        "machine_id": current_machine,
                        "month_label": current_month,
                        "month_index": month_index,
                        "year": int(year_str),
                    })
                continue

        self.logger.info("Built %d context(s) from clean text.", len(contexts))
        return contexts

    def parse_cost(self, cost_str: str) -> str:
        """Normalisasi string biaya dari PDF; tambahkan prefix 'Rp' jika perlu."""
        if not cost_str or not cost_str.strip():
            return "N/A"
        cleaned = " ".join(cost_str.replace("\n", " ").split())
        if "Rp" not in cleaned and re.fullmatch(r"[\d.,\s]+", cleaned):
            cleaned = f"Rp {cleaned}"
        return cleaned

    def parse_downtime(self, downtime_str: str) -> Optional[float]:
        """Parse string downtime ke float; return None jika tidak bisa di-parse."""
        try:
            if not downtime_str or not downtime_str.strip():
                return None
            numbers = re.findall(r"[\d.]+", downtime_str.strip())
            return float(numbers[0]) if numbers else None
        except (ValueError, IndexError):
            return None

    # ── Chunk Builders ─────────────────────────────────────────────────────────

    def create_event_chunk(
        self,
        row: Dict[str, str],
        context: Dict,
        source_page: int,
        row_index: int,
        source_doc: str,
    ) -> Optional[MaintenanceChunk]:
        """Buat satu MaintenanceChunk dari satu baris tabel maintenance."""
        tanggal  = row.get("Tanggal", "").strip()
        log_id   = row.get("Log ID", "").strip()
        tipe     = row.get("Tipe", "").strip()
        catatan  = row.get("Catatan Teknisi", "").strip()
        downtime = row.get("Downtime (Jam)", "").strip()
        part     = row.get("Part Replaced", "").strip()
        cost     = row.get("Cost (IDR)", "").strip()

        # Skip baris kosong
        if not tanggal or not tipe:
            return None

        tipe_lower = tipe.lower()
        chunk_type = self.CHUNK_TYPE_MAP.get(tipe_lower, "event_preventive")
        priority   = self.EVENT_PRIORITY.get(tipe_lower, 1)

        machine_id  = context["machine_id"]
        month_index = context["month_index"]
        year        = context["year"]

        chunk_id = (
            f"CHK-{machine_id.replace('-', '')}"
            f"-{year}-{month_index:02d}-{row_index:03d}"
        )

        downtime_float = self.parse_downtime(downtime)
        cost_str       = self.parse_cost(cost)

        text_content = (
            f"[{chunk_type.upper()} | {machine_id} | {context['month_label']}] "
            f"Tanggal: {tanggal} | Log: {log_id} | "
            f"Kejadian: {catatan} | "
            f"Downtime: {downtime_float if downtime_float is not None else 'N/A'} jam | "
            f"Part Diganti: {part or 'N/A'} | "
            f"Biaya: {cost_str}"
        )

        return MaintenanceChunk(
            # Universal fields
            chunk_id=chunk_id,
            doc_type="maintenance_report",
            source_doc=source_doc,
            source_page=source_page,
            chunk_type=chunk_type,
            text_content=text_content,
            machine_ids=[machine_id],
            priority=priority,
            # Optional fields
            month_label=context["month_label"],
            month_index=month_index,
            year=year,
            log_id=log_id,
            event_type=tipe,
            downtime_hours=downtime_float,
            cost_idr=cost_str,
            extra_metadata={
                "tanggal": tanggal,
                "part_replaced": part,
            },
        )

    def create_summary_chunk(
        self,
        machine_id: str,
        events: List[MaintenanceChunk],
        source_doc: str,
    ) -> MaintenanceChunk:
        """Buat summary chunk agregasi semua events untuk satu mesin."""
        total_events     = len(events)
        emergency_count  = sum(1 for e in events if e.chunk_type == "event_emergency")
        corrective_count = sum(1 for e in events if e.chunk_type == "event_corrective")
        preventive_count = sum(1 for e in events if e.chunk_type == "event_preventive")

        total_downtime = sum(
            e.downtime_hours for e in events if e.downtime_hours is not None
        )

        parts_list = [
            e.extra_metadata["part_replaced"]
            for e in events
            if e.extra_metadata and e.extra_metadata.get("part_replaced")
        ]
        most_replaced = (
            Counter(parts_list).most_common(1)[0][0] if parts_list else "N/A"
        )

        months_active = sorted(
            set(e.month_label for e in events if e.month_label)
        )

        text_content = (
            f"[MACHINE_SUMMARY | {machine_id}] "
            f"Total events: {total_events} | "
            f"Emergency: {emergency_count} | "
            f"Corrective: {corrective_count} | "
            f"Preventive: {preventive_count} | "
            f"Total downtime: {total_downtime:.1f} jam | "
            f"Part paling sering diganti: {most_replaced} | "
            f"Aktif pada: {', '.join(months_active)}"
        )

        return MaintenanceChunk(
            chunk_id=f"CHK-{machine_id.replace('-', '')}-SUMMARY",
            doc_type="maintenance_report",
            source_doc=source_doc,
            source_page=0,
            chunk_type="machine_summary",
            text_content=text_content,
            machine_ids=[machine_id],
            priority=2,
            extra_metadata={
                "total_events": total_events,
                "emergency_count": emergency_count,
                "total_downtime": round(total_downtime, 1),
                "months_active": months_active,
            },
        )

    # ── Abstract Method Implementations ────────────────────────────────────────

    def chunk(self, doc_id: str = "LAP-BUNDLE") -> List[BaseChunk]:
        """Implementasi abstract method — proses dokumen maintenance jadi chunks."""
        self.logger.info("Starting chunking for doc_id='%s'", doc_id)

        # a. Load artefak hasil ingestion
        tables   = self.load_tables(doc_id)
        clean_text = self.load_clean_text(doc_id)
        metadata = self.load_metadata(doc_id)
        source_doc = metadata.get("source_file", doc_id)

        # b. Bangun konteks per tabel
        contexts = self.build_context_map(clean_text)

        all_chunks: List[BaseChunk] = []

        # c. Loop tabel
        for table_index, table_data in enumerate(tables):
            if table_index >= len(contexts):
                self.logger.warning(
                    "No context for table index %d — skipping.", table_index
                )
                continue

            context  = contexts[table_index]
            page_num = table_data.get("page", 0)
            rows     = table_data.get("data", [])

            if not rows or len(rows) < 2:
                self.logger.warning(
                    "Table %d on page %d has no data rows — skipping.",
                    table_index,
                    page_num,
                )
                continue

            # Normalisasi header
            headers = [self.normalize_header(h or "") for h in rows[0]]

            # Loop data rows
            for row_index, raw_row in enumerate(rows[1:], start=1):
                try:
                    # Pad/truncate row agar panjangnya sama dengan headers
                    padded = list(raw_row) + [""] * (len(headers) - len(raw_row))
                    row_dict = dict(zip(headers, padded))

                    event_chunk = self.create_event_chunk(
                        row_dict, context, page_num, row_index, doc_id
                    )
                    if event_chunk is not None:
                        all_chunks.append(event_chunk)

                except Exception as row_err:
                    self.logger.error(
                        "Error processing row %d in table %d: %s",
                        row_index,
                        table_index,
                        row_err,
                    )
                    continue

        # d. Group events by machine, buat summary per mesin
        machine_events: Dict[str, List[MaintenanceChunk]] = {}
        for chunk in all_chunks:
            if isinstance(chunk, MaintenanceChunk):
                mid = chunk.machine_ids[0] if chunk.machine_ids else "ALL"
                machine_events.setdefault(mid, []).append(chunk)

        for machine_id, events in machine_events.items():
            summary = self.create_summary_chunk(machine_id, events, source_doc)
            all_chunks.append(summary)

        # e. Simpan dan log statistik
        self.save_chunks(all_chunks, doc_id)
        stats = self.get_statistics(all_chunks)
        self.logger.info(
            "Chunking complete — total=%d | by_type=%s",
            stats["total"],
            dict(stats["by_type"]),
        )

        return all_chunks

    def get_statistics(self, chunks: List[BaseChunk]) -> Dict[str, Any]:
        """Return statistik lengkap chunks yang dihasilkan."""
        avg_len = (
            sum(len(c.text_content) for c in chunks) / len(chunks)
            if chunks else 0.0
        )

        emergency_machines = sorted(
            set(
                c.machine_ids[0]
                for c in chunks
                if c.chunk_type == "event_emergency" and c.machine_ids
            )
        )

        return {
            "total": len(chunks),
            "by_type": Counter(c.chunk_type for c in chunks),
            "by_machine": Counter(
                c.machine_ids[0] for c in chunks if c.machine_ids
            ),
            "avg_text_length": round(avg_len, 1),
            "emergency_machines": emergency_machines,
        }


# ── Entry Point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    chunker = MaintenanceChunker()
    chunks  = chunker.chunk("LAP-BUNDLE")
    stats   = chunker.get_statistics(chunks)

    # Counter tidak serialisable langsung — convert ke dict
    stats_serializable = {
        **stats,
        "by_type": dict(stats["by_type"]),
        "by_machine": dict(stats["by_machine"]),
    }
    print(json.dumps(stats_serializable, ensure_ascii=False, indent=2))
