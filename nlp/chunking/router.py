"""
router.py — Lapis AI Universal Chunker Router
==============================================
Simplified router: semua dokumen diproses oleh AdaptiveChunker.
AdaptiveChunker mendeteksi strategi chunking secara otomatis
berdasarkan ContentSignals — tidak ada routing manual per doc_type.
"""

import logging
import yaml
from pathlib import Path
from typing import Dict, List

from nlp.chunking.adaptive_chunker import AdaptiveChunker, BaseChunk

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


class ChunkerRouter:
    """
    Thin wrapper di atas AdaptiveChunker.
    Dipertahankan untuk backward compatibility dengan
    pipeline yang memanggil ChunkerRouter.route() atau route_all().
    """

    def __init__(self, config_path: str = "nlp/configs/config.yaml") -> None:
        with open(config_path, "r", encoding="utf-8") as f:
            self.config = yaml.safe_load(f)
        self.processed_dir = Path(self.config["paths"]["data_processed"])
        self.logger = logging.getLogger("ChunkerRouter")
        self.chunker = AdaptiveChunker(config_path)
        self.logger.info("ChunkerRouter ready — using AdaptiveChunker.")

    def route(self, doc_id: str) -> List[BaseChunk]:
        """Route satu dokumen ke AdaptiveChunker."""
        return self.chunker.chunk(doc_id)

    def route_all(self) -> Dict[str, List[BaseChunk]]:
        """Route semua dokumen ke AdaptiveChunker."""
        return self.chunker.chunk_all()


if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO,
                        format="%(asctime)s - %(levelname)s - %(message)s")
    router = ChunkerRouter()
    results = router.route_all()
    total = sum(len(v) for v in results.values())
    print(f"\nTotal documents : {len(results)}")
    print(f"Total chunks    : {total}\n")
