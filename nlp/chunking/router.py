"""
ChunkerRouter — Smart dispatcher untuk Lapis AI RAG Pipeline.
Tambahkan doc_type baru cukup dengan extend ROUTING_MAP.
"""

import json
import logging
import yaml
from pathlib import Path
from typing import Any, Dict, List, Optional, Type

from nlp.chunking.base_chunker import BaseChunk, BaseChunker
from nlp.chunking.maintenance_chunker import MaintenanceChunker
from nlp.chunking.prose_chunker import ProseChunker


# ── Logging Setup ──────────────────────────────────────────────────────────────

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


# ProseChunker diimport langsung dari nlp/chunking/prose_chunker.py
# Stub yang sebelumnya ada di sini telah digantikan oleh implementasi penuh.


# ── Router ─────────────────────────────────────────────────────────────────────


class ChunkerRouter:
    """Smart dispatcher yang memetakan doc_type ke chunker yang tepat."""

    # ── Routing Map — satu-satunya tempat yang perlu diubah saat tambah doc_type ──
    ROUTING_MAP: Dict[str, Type[BaseChunker]] = {
        "maintenance_report": MaintenanceChunker,
        "knowledge_base"    : ProseChunker,
        "schema"            : ProseChunker,
        "api_contract"      : ProseChunker,
        "sop"               : ProseChunker,
        "manual"            : ProseChunker,
        "unknown"           : ProseChunker,
    }

    def __init__(self, config_path: str = "nlp/configs/config.yaml") -> None:
        """Load config, setup logger, dan inisialisasi path processed_dir."""
        with open(config_path, "r", encoding="utf-8") as f:
            self.config: Dict = yaml.safe_load(f)

        self.config_path   = config_path
        self.processed_dir = Path(self.config["paths"]["data_processed"])

        self.logger = logging.getLogger("ChunkerRouter")
        self.logger.info(
            "ChunkerRouter ready — %d doc_type(s) registered.",
            len(self.ROUTING_MAP),
        )

    # ── Core Dispatch Methods ──────────────────────────────────────────────────

    def get_doc_type(self, doc_id: str) -> str:
        """Baca doc_type dari file metadata JSON dokumen."""
        meta_path = self.processed_dir / f"{doc_id}.meta.json"
        if not meta_path.exists():
            self.logger.warning(
                "Metadata not found for doc_id='%s' (%s). "
                "Falling back to doc_type='unknown'.",
                doc_id,
                meta_path,
            )
            return "unknown"

        with open(meta_path, "r", encoding="utf-8") as f:
            metadata: Dict = json.load(f)

        return metadata.get("doc_type", "unknown")

    def get_chunker(self, doc_type: str) -> BaseChunker:
        """Ambil instance chunker yang tepat berdasarkan doc_type."""
        chunker_class = self.ROUTING_MAP.get(doc_type)

        if chunker_class is None:
            self.logger.warning(
                "doc_type='%s' tidak dikenal di ROUTING_MAP. "
                "Menggunakan ProseChunker sebagai fallback.",
                doc_type,
            )
            chunker_class = ProseChunker

        self.logger.info(
            "Routing doc_type='%s' → %s", doc_type, chunker_class.__name__
        )
        return chunker_class(self.config_path)

    def route(self, doc_id: str) -> List[BaseChunk]:
        """Entry point utama — route doc_id ke chunker yang tepat dan return chunks."""
        doc_type = self.get_doc_type(doc_id)
        chunker  = self.get_chunker(doc_type)

        self.logger.info(
            "Processing doc_id='%s' | doc_type='%s'", doc_id, doc_type
        )

        chunks = chunker.chunk(doc_id)

        self.logger.info(
            "Completed '%s' → %d chunks produced.", doc_id, len(chunks)
        )
        return chunks

    def route_all(self) -> Dict[str, List[BaseChunk]]:
        """Route semua dokumen di processed_dir sekaligus dan kumpulkan hasilnya."""
        meta_files = sorted(self.processed_dir.glob("*.meta.json"))

        if not meta_files:
            self.logger.warning(
                "No .meta.json files found in %s. "
                "Pastikan ingestion sudah dijalankan terlebih dahulu.",
                self.processed_dir,
            )
            return {}

        self.logger.info(
            "Found %d document(s) to route.", len(meta_files)
        )

        results: Dict[str, List[BaseChunk]] = {}

        for meta_file in meta_files:
            # Hapus suffix .meta.json → dapat doc_id
            doc_id = meta_file.name.replace(".meta.json", "")
            try:
                results[doc_id] = self.route(doc_id)
            except Exception as err:
                self.logger.error(
                    "Failed to process doc_id='%s': %s", doc_id, err
                )
                results[doc_id] = []

        total_chunks = sum(len(v) for v in results.values())
        self.logger.info(
            "route_all complete — %d doc(s) processed | %d total chunks.",
            len(results),
            total_chunks,
        )
        return results

    # ── Introspection ──────────────────────────────────────────────────────────

    def get_routing_summary(self) -> Dict[str, Any]:
        """Return info tentang routing map yang aktif saat ini."""
        return {
            "registered_doc_types": list(self.ROUTING_MAP.keys()),
            "chunker_classes": {
                k: v.__name__ for k, v in self.ROUTING_MAP.items()
            },
            "total_doc_types": len(self.ROUTING_MAP),
        }


# ── Entry Point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    router = ChunkerRouter()

    # ── Routing summary ──
    summary = router.get_routing_summary()
    print("\n=== LAPIS AI CHUNKER ROUTER ===")
    print(f"Registered doc types: {summary['total_doc_types']}")
    for dt, cls in summary["chunker_classes"].items():
        print(f"  {dt:25s} → {cls}")

    # ── Proses semua dokumen ──
    print("\n=== PROCESSING ALL DOCUMENTS ===")
    results = router.route_all()

    # ── Final summary ──
    print("\n=== FINAL SUMMARY ===")
    total_chunks = sum(len(v) for v in results.values())
    for doc_id, chunks in results.items():
        print(f"  {doc_id}: {len(chunks)} chunks")
    print(f"\nTotal chunks produced: {total_chunks}")
