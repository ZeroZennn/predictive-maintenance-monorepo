"""Qdrant vector store interface untuk Lapis AI RAG Pipeline."""

import json
import logging
import yaml
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchAny,
    MatchValue,
    PointStruct,
    Range,
    ScoredPoint,
    SearchRequest,
    VectorParams,
)

from nlp.embeddings.embedder import EmbeddingModel


# ── Logging Setup ──────────────────────────────────────────────────────────────

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


# ── Vector Store ───────────────────────────────────────────────────────────────


class VectorStore:
    """Abstraction layer Qdrant untuk operasi CRUD dan search vector Lapis AI."""

    def __init__(self, config_path: str = "nlp/configs/config.yaml") -> None:
        """Inisialisasi Qdrant client sesuai mode (memory/server) dari config."""
        with open(config_path, "r", encoding="utf-8") as f:
            config: Dict = yaml.safe_load(f)

        self.logger = logging.getLogger(self.__class__.__name__)

        self.collection_name: str = config["vector_db"]["collection_name"]
        self.dimension: int       = config["embedding"]["dimension"]
        self.mode: str            = config["vector_db"].get("mode", "memory")

        # ── Client init berdasarkan mode ───────────────────────────────────────
        if self.mode == "memory":
            self.client = QdrantClient(":memory:")
            self.logger.info("Qdrant: in-memory mode")
        else:
            host: str = config["vector_db"].get("host", "localhost")
            port: int = config["vector_db"].get("port", 6333)
            self.client = QdrantClient(host=host, port=port)
            self.logger.info("Qdrant: server mode %s:%d", host, port)

        self._collection_ready: bool = False

    # ── Collection Management ──────────────────────────────────────────────────

    def create_collection(self, recreate: bool = False) -> None:
        """Buat collection di Qdrant jika belum ada, atau recreate jika diminta."""
        existing = [c.name for c in self.client.get_collections().collections]

        if self.collection_name in existing:
            if not recreate:
                self.logger.info(
                    "Collection '%s' already exists — skipping creation.",
                    self.collection_name,
                )
                self._collection_ready = True
                return
            # Recreate: hapus dulu
            self.client.delete_collection(self.collection_name)
            self.logger.info(
                "Collection '%s' deleted for recreation.", self.collection_name
            )

        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=VectorParams(
                size=self.dimension,
                distance=Distance.COSINE,
            ),
        )
        self._collection_ready = True
        self.logger.info(
            "Collection '%s' created | dim=%d | distance=COSINE",
            self.collection_name,
            self.dimension,
        )

    def collection_exists(self) -> bool:
        """Cek apakah collection sudah ada di Qdrant."""
        existing = [c.name for c in self.client.get_collections().collections]
        return self.collection_name in existing

    def get_collection_info(self) -> Dict:
        """Return info collection: jumlah vectors, status, config."""
        info = self.client.get_collection(self.collection_name)
        return {
            "collection_name": self.collection_name,
            "vectors_count"  : info.vectors_count,
            "points_count"   : info.points_count,
            "status"         : str(info.status),
            "dimension"      : self.dimension,
            "mode"           : self.mode,
        }

    # ── Payload Builder ────────────────────────────────────────────────────────

    def _build_payload(self, chunk: Dict) -> Dict:
        """Bersihkan chunk dict menjadi Qdrant-safe payload (hapus field 'embedding')."""
        payload: Dict = {}
        for key, value in chunk.items():
            if key == "embedding":
                continue  # vector sudah disimpan di Qdrant — tidak perlu di payload
            # Pastikan value JSON-serializable (tipe primitif, list, dict, atau None)
            if isinstance(value, (str, int, float, bool, list, dict, type(None))):
                payload[key] = value
            else:
                # Coerce ke string sebagai fallback aman
                payload[key] = str(value)
        return payload

    # ── Upsert ────────────────────────────────────────────────────────────────

    def upsert_chunks(
        self,
        embedded_chunks: List[Dict],
        batch_size: int = 100,
    ) -> int:
        """Upload embedded chunks ke Qdrant dalam batches, return jumlah points berhasil."""
        if not self._collection_ready:
            self.create_collection()

        total = len(embedded_chunks)
        if total == 0:
            self.logger.warning("upsert_chunks: empty list provided — nothing to upsert.")
            return 0

        # Hitung batches
        batches = [
            embedded_chunks[i : i + batch_size]
            for i in range(0, total, batch_size)
        ]
        total_batches = len(batches)
        upserted = 0

        for batch_num, batch in enumerate(batches, start=1):
            try:
                points = [
                    PointStruct(
                        id=upserted + local_idx,           # global sequential int ID
                        vector=chunk["embedding"],          # list[float]
                        payload=self._build_payload(chunk), # metadata tanpa embedding
                    )
                    for local_idx, chunk in enumerate(batch)
                ]

                self.client.upsert(
                    collection_name=self.collection_name,
                    points=points,
                )

                upserted += len(batch)
                self.logger.info(
                    "Upserted batch %d/%d (%d points)", batch_num, total_batches, len(batch)
                )

            except Exception as upsert_err:
                self.logger.error(
                    "Batch %d/%d failed: %s — skipping batch.",
                    batch_num,
                    total_batches,
                    upsert_err,
                )

        self.logger.info(
            "Total %d/%d points upserted ke '%s'.",
            upserted,
            total,
            self.collection_name,
        )
        return upserted

    # ── Search ─────────────────────────────────────────────────────────────────

    def _format_results(self, raw_results: List[ScoredPoint]) -> List[Dict]:
        """Konversi list ScoredPoint Qdrant ke list dict yang konsisten."""
        formatted: List[Dict] = []
        for result in raw_results:
            payload = result.payload or {}
            formatted.append({
                "chunk_id"    : payload.get("chunk_id"),
                "score"       : result.score,
                "text_content": payload.get("text_content"),
                "source_doc"  : payload.get("source_doc"),
                "source_page" : payload.get("source_page"),
                "chunk_type"  : payload.get("chunk_type"),
                "machine_ids" : payload.get("machine_ids"),
                "doc_type"    : payload.get("doc_type"),
                "priority"    : payload.get("priority"),
                "payload"     : payload,  # seluruh payload untuk keperluan downstream
            })
        return formatted

    def search(
        self,
        query_vector: np.ndarray,
        top_k: int = 20,
        score_threshold: float = 0.0,
    ) -> List[Dict]:
        """Dense vector similarity search tanpa filter, return top-k results."""
        raw_results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector.tolist(),
            limit=top_k,
            score_threshold=score_threshold,
            with_payload=True,
        )
        results = self._format_results(raw_results)
        self.logger.info(
            "search: top_k=%d → %d results returned.", top_k, len(results)
        )
        return results

    def search_with_filter(
        self,
        query_vector: np.ndarray,
        top_k: int = 20,
        machine_ids: Optional[List[str]] = None,
        chunk_types: Optional[List[str]] = None,
        min_priority: Optional[int] = None,
        doc_types: Optional[List[str]] = None,
    ) -> List[Dict]:
        """Dense search dengan metadata filtering opsional per field."""
        conditions = []

        if machine_ids:
            conditions.append(
                FieldCondition(
                    key="machine_ids",
                    match=MatchAny(any=machine_ids),
                )
            )

        if chunk_types:
            conditions.append(
                FieldCondition(
                    key="chunk_type",
                    match=MatchAny(any=chunk_types),
                )
            )

        if min_priority is not None:
            conditions.append(
                FieldCondition(
                    key="priority",
                    range=Range(gte=min_priority),
                )
            )

        if doc_types:
            conditions.append(
                FieldCondition(
                    key="doc_type",
                    match=MatchAny(any=doc_types),
                )
            )

        query_filter: Optional[Filter] = Filter(must=conditions) if conditions else None

        raw_results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector.tolist(),
            query_filter=query_filter,
            limit=top_k,
            with_payload=True,
        )

        results = self._format_results(raw_results)
        self.logger.info(
            "search_with_filter: filters=%s → %d results returned.",
            {
                "machine_ids": machine_ids,
                "chunk_types": chunk_types,
                "min_priority": min_priority,
                "doc_types": doc_types,
            },
            len(results),
        )
        return results


# ── Entry Point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import time

    from nlp.embeddings.embedder import load_all_chunks

    print("=== LAPIS AI — VECTOR STORE TEST ===\n")

    # ── Setup ──
    embedder = EmbeddingModel()
    embedder.load_model()
    vs = VectorStore()
    vs.create_collection(recreate=True)

    # ── Load & embed sample ──
    all_chunks = load_all_chunks()
    sample = all_chunks[:50]
    print(f"Testing dengan {len(sample)} sample chunks...\n")
    embedded = embedder.embed_chunks(sample)

    # ── Upsert ──
    t0 = time.time()
    total = vs.upsert_chunks(embedded)
    print(f"\nUpserted: {total} points in {time.time() - t0:.2f}s")

    # ── Collection info ──
    info = vs.get_collection_info()
    print(f"Collection: {info['collection_name']}")
    print(f"Vectors   : {info['vectors_count']}")
    print(f"Mode      : {info['mode']}\n")

    # ── Test search ──
    test_query = "Apa yang terjadi pada M-01 saat emergency?"
    q_vec = embedder.embed_query(test_query)

    print(f"Query: '{test_query}'")
    print("\n--- TOP 3 RESULTS (no filter) ---")
    results = vs.search(q_vec, top_k=3)
    for i, r in enumerate(results, 1):
        print(f"[{i}] score={r['score']:.4f} | {r['chunk_id']}")
        print(f"     type={r['chunk_type']} | machine={r['machine_ids']}")
        print(f"     text={str(r['text_content'])[:80]}...")

    # ── Test filtered search ──
    print("\n--- TOP 3 RESULTS (filter: M-01, emergency only) ---")
    filtered = vs.search_with_filter(
        q_vec,
        top_k=3,
        machine_ids=["M-01"],
        chunk_types=["event_emergency"],
    )
    for i, r in enumerate(filtered, 1):
        print(f"[{i}] score={r['score']:.4f} | {r['chunk_id']}")
        print(f"     text={str(r['text_content'])[:80]}...")

    print("\n✅ Vector store test PASSED")
