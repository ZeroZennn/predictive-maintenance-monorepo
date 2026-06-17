"""Embedding model wrapper untuk Lapis AI RAG Pipeline."""

import json
import logging
import time
import yaml
from pathlib import Path
from typing import Dict, List, Optional, Union

import numpy as np
from sentence_transformers import SentenceTransformer


# ── Logging Setup ──────────────────────────────────────────────────────────────

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


# ── Embedding Model ────────────────────────────────────────────────────────────


class EmbeddingModel:
    """Singleton wrapper SentenceTransformer untuk dense embedding Lapis AI."""

    # ── Singleton state (class-level, bukan instance) ──────────────────────────
    _instance: Optional["EmbeddingModel"] = None
    _model: Optional[SentenceTransformer] = None

    def __init__(self, config_path: str = "nlp/configs/config.yaml") -> None:
        """Load config dan inisialisasi parameter embedding dari config.yaml."""
        with open(config_path, "r", encoding="utf-8") as f:
            config: Dict = yaml.safe_load(f)

        self.logger = logging.getLogger(self.__class__.__name__)

        emb_cfg = config["embedding"]
        self.primary_model   = emb_cfg["primary_model"]
        self.fallback_model  = emb_cfg["fallback_model"]
        self.batch_size      = emb_cfg["batch_size"]
        self.query_prefix    = emb_cfg["query_prefix"]
        self.passage_prefix  = emb_cfg["passage_prefix"]
        self.dimension       = emb_cfg["dimension"]
        self.backend         = emb_cfg.get("backend", "torch")

        self.model_name: Optional[str] = None  # diisi saat load_model()
        self._loaded: bool = False

    # ── Singleton Factory ──────────────────────────────────────────────────────

    @classmethod
    def get_instance(
        cls, config_path: str = "nlp/configs/config.yaml"
    ) -> "EmbeddingModel":
        """Return singleton instance — model hanya di-load sekali selama runtime."""
        if cls._instance is None:
            cls._instance = cls(config_path)
        return cls._instance

    # ── Model Loading ──────────────────────────────────────────────────────────

    def load_model(self) -> None:
        """Load model dari HuggingFace ke memori; idempoten jika sudah loaded."""
        if self._loaded:
            self.logger.debug("Model already loaded (%s) — skipping.", self.model_name)
            return

        self.logger.info("Loading embedding model: %s", self.primary_model)
        t_start = time.time()

        try:
            import torch
            # Limit PyTorch CPU threads to prevent OOM and CPU thrashing
            torch.set_num_threads(4)
            self.logger.info("PyTorch CPU threads restricted to 4")
            
            kwargs = {}
            if self.backend == "onnx":
                kwargs["backend"] = "onnx"

            self.__class__._model = SentenceTransformer(self.primary_model, **kwargs)
            self.model_name = self.primary_model
            self._loaded = True
            elapsed = time.time() - t_start
            self.logger.info(
                "Model loaded in %.1fs | dim=%d | batch_size=%d",
                elapsed,
                self.dimension,
                self.batch_size,
            )

        except Exception as primary_err:
            self.logger.warning(
                "Primary model '%s' failed (%s) — trying fallback '%s'.",
                self.primary_model,
                primary_err,
                self.fallback_model,
            )
            try:
                kwargs = {}
                if self.backend == "onnx":
                    kwargs["backend"] = "onnx"
                self.__class__._model = SentenceTransformer(self.fallback_model, **kwargs)
                self.model_name = self.fallback_model
                self._loaded = True
                elapsed = time.time() - t_start
                self.logger.info(
                    "Using fallback model: %s | loaded in %.1fs",
                    self.fallback_model,
                    elapsed,
                )
            except Exception as fallback_err:
                self.logger.error(
                    "Fallback model '%s' also failed: %s",
                    self.fallback_model,
                    fallback_err,
                )
                raise RuntimeError(
                    f"Could not load any embedding model. "
                    f"Primary: {primary_err} | Fallback: {fallback_err}"
                ) from fallback_err

    # ── Prefix Management ──────────────────────────────────────────────────────

    def _add_prefix(self, texts: List[str], is_query: bool = False) -> List[str]:
        """Tambahkan e5 instruction prefix ke setiap teks sesuai peran (query/passage)."""
        prefix = self.query_prefix if is_query else self.passage_prefix
        return [f"{prefix}{text}" for text in texts]

    # ── Core Embedding Methods ─────────────────────────────────────────────────

    def embed_texts(
        self,
        texts: List[str],
        is_query: bool = False,
        show_progress: bool = False,
    ) -> np.ndarray:
        """Embed list teks dan return numpy array shape (N, dimension)."""
        self.load_model()

        texts_with_prefix = self._add_prefix(texts, is_query)

        vectors: np.ndarray = self._model.encode(  # type: ignore[union-attr]
            texts_with_prefix,
            batch_size=self.batch_size,
            show_progress_bar=show_progress,
            normalize_embeddings=True,   # cosine similarity ready
            convert_to_numpy=True,
        )

        self.logger.info(
            "Embedded %d text(s) | shape=%s | is_query=%s",
            len(texts),
            vectors.shape,
            is_query,
        )
        return vectors

    def embed_single(self, text: str, is_query: bool = False) -> np.ndarray:
        """Embed satu teks dan return numpy array shape (dimension,)."""
        result = self.embed_texts([text], is_query=is_query)
        return result[0]

    def embed_chunks(self, chunks: List[Dict]) -> List[Dict]:
        """Embed list of chunk dicts (in-place) dan tambahkan field 'embedding'."""
        texts = [c["text_content"] for c in chunks]
        vectors = self.embed_texts(texts, is_query=False, show_progress=True)

        for i, chunk in enumerate(chunks):
            chunk["embedding"] = vectors[i].tolist()

        self.logger.info("Embedded %d chunks successfully.", len(chunks))
        return chunks

    def embed_query(self, query: str) -> np.ndarray:
        """Embed query user dengan query prefix dan return normalized vector."""
        return self.embed_single(query, is_query=True)

    # ── Introspection ──────────────────────────────────────────────────────────

    def get_model_info(self) -> Dict:
        """Return metadata tentang model yang sedang aktif."""
        return {
            "model_name"    : self.model_name or "not loaded",
            "dimension"     : self.dimension,
            "batch_size"    : self.batch_size,
            "is_loaded"     : self._loaded,
            "query_prefix"  : self.query_prefix,
            "passage_prefix": self.passage_prefix,
        }


# ── Module-level Helper ────────────────────────────────────────────────────────


def load_all_chunks(processed_dir: str = "nlp/data/processed") -> List[Dict]:
    """Load semua *.chunks.json dari processed_dir ke satu flat list."""
    logger = logging.getLogger("load_all_chunks")
    chunk_files = sorted(Path(processed_dir).glob("*.chunks.json"))

    if not chunk_files:
        logger.warning("No *.chunks.json files found in '%s'.", processed_dir)
        return []

    all_chunks: List[Dict] = []
    for path in chunk_files:
        try:
            with open(path, "r", encoding="utf-8") as f:
                data: List[Dict] = json.load(f)
            all_chunks.extend(data)
            logger.debug("Loaded %d chunks from %s", len(data), path.name)
        except (json.JSONDecodeError, OSError) as err:
            logger.error("Failed to load '%s': %s", path.name, err)

    logger.info(
        "load_all_chunks: %d file(s) → %d total chunks.",
        len(chunk_files),
        len(all_chunks),
    )
    return all_chunks


# ── Entry Point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import json  # noqa: F811 — re-import untuk kejelasan di main block

    print("=== LAPIS AI — EMBEDDING PIPELINE TEST ===\n")

    # Init + load model
    embedder = EmbeddingModel()
    embedder.load_model()

    # Info model
    info = embedder.get_model_info()
    print(f"Model     : {info['model_name']}")
    print(f"Dimension : {info['dimension']}")
    print(f"Batch size: {info['batch_size']}\n")

    # Test embed single query
    test_query = "Apa yang terjadi pada M-01 saat terjadi emergency?"
    q_vec = embedder.embed_query(test_query)
    print(f"Query embedding shape : {q_vec.shape}")
    print(f"Query embedding norm  : {float(np.linalg.norm(q_vec)):.4f} (harus ~1.0)\n")

    # Test embed sample chunks (5 pertama saja)
    all_chunks = load_all_chunks()
    sample = all_chunks[:5]
    embedded = embedder.embed_chunks(sample)
    print(f"Sample chunks embedded: {len(embedded)}")
    if embedded:
        print(f"First chunk vector dim: {len(embedded[0]['embedding'])}")
    print(f"\n✅ Embedding test PASSED")
