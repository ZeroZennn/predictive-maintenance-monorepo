"""
adaptive_chunker.py — Lapis AI Universal Adaptive Chunker
==========================================================
Layer 3: Chunking adaptif berdasarkan ContentSignals dari Layer 2.

Tiga strategi:
1. section_based          — potong di [BRACKET HEADER]
2. header_based           — potong di ## Markdown Header
3. semantic_sliding_window — potong berdasarkan perubahan topik (default)

Model embedding diload SEKALI di __init__ dan dipakai ulang.
"""

import re
import logging
import json
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import uuid

import numpy as np
import yaml
from sentence_transformers import SentenceTransformer

from nlp.chunking.content_analyzer import ContentAnalyzer, ContentSignals

logger = logging.getLogger(__name__)


@dataclass
class BaseChunk:
    """
    Unit chunk universal — tidak ada field yang spesifik template.
    Metadata disimpan di dict bebas agar extensible.
    """
    chunk_id: str
    doc_id: str
    text: str
    chunk_index: int
    strategy_used: str           # section_based | header_based | semantic_sliding_window
    section_name: Optional[str]  # nama section jika ada, None jika tidak
    char_count: int
    metadata: Dict = field(default_factory=dict)
    # metadata berisi: machine_ids, periods, log_ids, language, source_file, dll.
    # diisi dari DocumentMetadata hasil ingestion


class AdaptiveChunker:
    """
    Chunker universal yang memilih strategi berdasarkan ContentSignals.
    Tidak ada asumsi format — bekerja untuk dokumen apapun.
    """

    # Regex untuk potong di section bracket
    _BRACKET_SPLIT = re.compile(r"(?=^\[([A-Z][A-Z\s_]{2,})\])", re.MULTILINE)

    # Regex untuk potong di markdown header
    _MARKDOWN_SPLIT = re.compile(r"(?=^#{1,4}\s+\S)", re.MULTILINE)

    def __init__(self, config_path: str = "nlp/configs/config.yaml") -> None:
        with open(config_path, "r", encoding="utf-8") as f:
            self.config: Dict = yaml.safe_load(f)

        embedding_cfg = self.config.get("embedding", {})
        self.model_name = embedding_cfg.get(
            "primary_model", "intfloat/multilingual-e5-large"
        )
        self.passage_prefix = embedding_cfg.get("passage_prefix", "passage: ")
        self.query_prefix = embedding_cfg.get("query_prefix", "query: ")

        # Config chunking
        chunking_cfg = self.config.get("chunking", {})
        self.chunk_size_target = chunking_cfg.get("chunk_size_target", 200)
        self.chunk_size_min = chunking_cfg.get("chunk_size_min", 50)
        self.chunk_size_max = chunking_cfg.get("chunk_size_max", 400)
        self.similarity_threshold = chunking_cfg.get("similarity_threshold", 0.75)
        self.overlap_percentage = chunking_cfg.get("overlap_percentage", 0.2)

        self.processed_dir = Path(self.config["paths"]["data_processed"])
        self.analyzer = ContentAnalyzer()

        logger.info("Loading embedding model: %s", self.model_name)
        self.model = SentenceTransformer(self.model_name)
        logger.info("AdaptiveChunker ready.")

    # ── Public API ─────────────────────────────────────────────────────────────

    def chunk(self, doc_id: str) -> List[BaseChunk]:
        """
        Entry point utama.
        Baca clean text + metadata dari processed_dir,
        analisis sinyal, pilih strategi, return chunks.
        """
        text = self._load_text(doc_id)
        if not text:
            logger.warning("No text found for doc_id='%s'", doc_id)
            return []

        doc_meta = self._load_metadata(doc_id)
        signals = self.analyzer.analyze(text)

        logger.info(
            "doc_id='%s' → strategy='%s' | sections=%s",
            doc_id, signals.recommended_strategy, signals.detected_sections
        )

        if signals.recommended_strategy == "section_based":
            chunks = self._chunk_by_sections(text, doc_id, signals)
        elif signals.recommended_strategy == "header_based":
            chunks = self._chunk_by_headers(text, doc_id, signals)
        else:
            chunks = self._chunk_semantic_sliding_window(text, doc_id, signals)

        # Inject metadata dari ingestion ke setiap chunk
        for chunk in chunks:
            chunk.metadata.update({
                "source_file": doc_meta.get("source_file", ""),
                "detected_machine_ids": doc_meta.get("detected_machine_ids", []),
                "detected_periods": doc_meta.get("detected_periods", []),
                "detected_log_ids": doc_meta.get("detected_log_ids", []),
                "detected_language": doc_meta.get("detected_language", "unknown"),
            })

        # Simpan chunks ke disk
        self._save_chunks(doc_id, chunks)

        logger.info(
            "✅ '%s' → %d chunks via '%s'",
            doc_id, len(chunks), signals.recommended_strategy
        )
        return chunks

    def chunk_all(self) -> Dict[str, List[BaseChunk]]:
        """Proses semua dokumen di processed_dir."""
        meta_files = sorted(self.processed_dir.glob("*.meta.json"))
        if not meta_files:
            logger.warning("No .meta.json files found.")
            return {}

        logger.info("Found %d document(s) to chunk.", len(meta_files))
        results: Dict[str, List[BaseChunk]] = {}

        for meta_file in meta_files:
            doc_id = meta_file.name.replace(".meta.json", "")
            try:
                results[doc_id] = self.chunk(doc_id)
            except Exception as e:
                logger.error("Failed to chunk '%s': %s", doc_id, e)
                results[doc_id] = []

        total = sum(len(v) for v in results.values())
        logger.info(
            "chunk_all complete — %d docs | %d total chunks", len(results), total
        )
        return results

    # ── Strategy 1: Section-Based ──────────────────────────────────────────────

    def _chunk_by_sections(
        self, text: str, doc_id: str, signals: ContentSignals
    ) -> List[BaseChunk]:
        """
        Potong teks di batas [BRACKET SECTION].
        Setiap section menjadi satu atau lebih chunks
        tergantung panjangnya.
        """
        parts = self._BRACKET_SPLIT.split(text)
        chunks: List[BaseChunk] = []
        chunk_index = 0

        # Gabungkan kembali header dengan kontennya
        i = 0
        while i < len(parts):
            part = parts[i].strip()
            if not part:
                i += 1
                continue

            # Deteksi nama section dari bracket
            section_match = re.match(r"^\[([A-Z][A-Z\s_]{2,})\]", part)
            section_name = section_match.group(1) if section_match else None

            # Jika section terlalu panjang → pecah lagi dengan sliding window
            if len(part) > self.chunk_size_max * 3:
                sub_chunks = self._sliding_window_on_text(
                    part, doc_id, chunk_index, signals, section_name
                )
                chunks.extend(sub_chunks)
                chunk_index += len(sub_chunks)
            else:
                if len(part) >= self.chunk_size_min:
                    chunks.append(self._make_chunk(
                        doc_id, part, chunk_index,
                        "section_based", section_name
                    ))
                    chunk_index += 1
            i += 1

        return chunks

    # ── Strategy 2: Header-Based ───────────────────────────────────────────────

    def _chunk_by_headers(
        self, text: str, doc_id: str, signals: ContentSignals
    ) -> List[BaseChunk]:
        """
        Potong teks di batas ## Markdown Header.
        Setiap header + kontennya menjadi satu chunk.
        """
        parts = self._MARKDOWN_SPLIT.split(text)
        chunks: List[BaseChunk] = []
        chunk_index = 0

        for part in parts:
            part = part.strip()
            if not part or len(part) < self.chunk_size_min:
                continue

            # Ekstrak nama header sebagai section_name
            header_match = re.match(r"^#{1,4}\s+(.+)", part)
            section_name = header_match.group(1).strip() if header_match else None

            if len(part) > self.chunk_size_max * 3:
                sub_chunks = self._sliding_window_on_text(
                    part, doc_id, chunk_index, signals, section_name
                )
                chunks.extend(sub_chunks)
                chunk_index += len(sub_chunks)
            else:
                chunks.append(self._make_chunk(
                    doc_id, part, chunk_index,
                    "header_based", section_name
                ))
                chunk_index += 1

        return chunks

    # ── Strategy 3: Semantic Sliding Window ───────────────────────────────────

    def _chunk_semantic_sliding_window(
        self, text: str, doc_id: str, signals: ContentSignals
    ) -> List[BaseChunk]:
        """
        Potong teks berdasarkan perubahan topik semantik.
        Menggunakan cosine similarity antar embedding kalimat.
        Ini adalah strategi default universal.
        """
        return self._sliding_window_on_text(
            text, doc_id, 0, signals, section_name=None
        )

    def _sliding_window_on_text(
        self,
        text: str,
        doc_id: str,
        start_index: int,
        signals: ContentSignals,
        section_name: Optional[str],
    ) -> List[BaseChunk]:
        """
        Core semantic sliding window algorithm.
        Dapat dipanggil dari strategi manapun untuk teks yang panjang.
        """
        # Split ke kalimat
        sentences = self._split_sentences(text)
        if not sentences:
            return []

        if len(sentences) == 1:
            return [self._make_chunk(
                doc_id, sentences[0], start_index,
                "semantic_sliding_window", section_name
            )]

        # Embed semua kalimat sekaligus (batch)
        prefixed = [f"{self.passage_prefix}{s}" for s in sentences]
        embeddings = self.model.encode(
            prefixed,
            batch_size=32,
            normalize_embeddings=True,
            show_progress_bar=False,
        )

        # Hitung cosine similarity antar kalimat berurutan
        # (sudah dinormalisasi → dot product = cosine similarity)
        similarities = [
            float(np.dot(embeddings[i], embeddings[i + 1]))
            for i in range(len(embeddings) - 1)
        ]

        # Tentukan batas chunk: similarity di bawah threshold = topik berganti
        chunk_boundaries = [0]
        current_size = len(sentences[0])

        for i, sim in enumerate(similarities):
            next_sentence = sentences[i + 1]
            would_exceed = current_size + len(next_sentence) > self.chunk_size_max

            # Potong jika: topik berganti DAN chunk sudah cukup besar
            # ATAU chunk sudah terlalu besar
            topic_shift = sim < self.similarity_threshold
            min_size_met = current_size >= self.chunk_size_min

            if (topic_shift and min_size_met) or would_exceed:
                chunk_boundaries.append(i + 1)
                current_size = len(next_sentence)
            else:
                current_size += len(next_sentence)

        chunk_boundaries.append(len(sentences))

        # Bangun chunks dari boundaries
        chunks: List[BaseChunk] = []
        overlap_sentences = max(1, int(len(sentences) * self.overlap_percentage * 0.1))

        for b in range(len(chunk_boundaries) - 1):
            start = max(0, chunk_boundaries[b] - (overlap_sentences if b > 0 else 0))
            end = chunk_boundaries[b + 1]
            chunk_text = " ".join(sentences[start:end]).strip()

            if len(chunk_text) >= self.chunk_size_min:
                chunks.append(self._make_chunk(
                    doc_id, chunk_text,
                    start_index + len(chunks),
                    "semantic_sliding_window",
                    section_name
                ))

        return chunks

    # ── Helpers ────────────────────────────────────────────────────────────────

    def _split_sentences(self, text: str) -> List[str]:
        """Split teks ke kalimat. Fallback ke paragraf jika terlalu sedikit kalimat."""
        # Split by sentence-ending punctuation
        raw = re.split(r"(?<=[.!?])\s+", text)
        sentences = [s.strip() for s in raw if len(s.strip()) >= 10]

        # Jika terlalu sedikit kalimat, split by newline
        if len(sentences) < 3:
            raw = text.split("\n")
            sentences = [s.strip() for s in raw if len(s.strip()) >= 10]

        return sentences

    def _make_chunk(
        self,
        doc_id: str,
        text: str,
        index: int,
        strategy: str,
        section_name: Optional[str],
    ) -> BaseChunk:
        """Factory method untuk membuat BaseChunk."""
        return BaseChunk(
            chunk_id=f"{doc_id}__chunk_{index:04d}_{uuid.uuid4().hex[:6]}",
            doc_id=doc_id,
            text=text.strip(),
            chunk_index=index,
            strategy_used=strategy,
            section_name=section_name,
            char_count=len(text.strip()),
            metadata={},
        )

    def _load_text(self, doc_id: str) -> str:
        """Baca clean text dari processed_dir."""
        txt_path = self.processed_dir / f"{doc_id}.clean.txt"
        if not txt_path.exists():
            logger.warning("Clean text not found: %s", txt_path)
            return ""
        return txt_path.read_text(encoding="utf-8")

    def _load_metadata(self, doc_id: str) -> Dict:
        """Baca metadata JSON dari processed_dir."""
        meta_path = self.processed_dir / f"{doc_id}.meta.json"
        if not meta_path.exists():
            return {}
        with open(meta_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _save_chunks(self, doc_id: str, chunks: List[BaseChunk]) -> None:
        """Simpan chunks ke disk sebagai JSON."""
        output_path = self.processed_dir / f"{doc_id}.chunks.json"
        data = [asdict(c) for c in chunks]
        output_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )


if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO,
                        format="%(asctime)s - %(levelname)s - %(message)s")

    chunker = AdaptiveChunker()

    # Jika ada argument, chunk doc_id spesifik
    if len(sys.argv) > 1:
        doc_id = sys.argv[1]
        chunks = chunker.chunk(doc_id)
        print(f"\n=== {doc_id}: {len(chunks)} chunks ===")
        for c in chunks[:3]:
            print(f"\n[{c.chunk_index}] section={c.section_name} "
                  f"| strategy={c.strategy_used} | chars={c.char_count}")
            print(f"  {c.text[:120]}...")
    else:
        # Chunk semua dokumen
        results = chunker.chunk_all()
        print("\n=== ADAPTIVE CHUNKER SUMMARY ===")
        total = sum(len(v) for v in results.values())
        strategies = {}
        for chunks in results.values():
            for c in chunks:
                strategies[c.strategy_used] = strategies.get(
                    c.strategy_used, 0) + 1
        print(f"Total documents : {len(results)}")
        print(f"Total chunks    : {total}")
        print(f"Strategy breakdown:")
        for strategy, count in sorted(strategies.items()):
            print(f"  {strategy:35s}: {count}")
        print("=================================\n")
