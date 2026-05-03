"""Full embedding pipeline — embed semua chunks ke Qdrant."""
import json
import time
import sys
import os

sys.path.insert(0, '.')

from nlp.embeddings.embedder import EmbeddingModel, load_all_chunks
from nlp.embeddings.vector_store import VectorStore

def run_full_pipeline():
    print("=" * 60)
    print("  LAPIS AI — FULL EMBEDDING PIPELINE")
    print("=" * 60)

    # 1. Load model
    print("\n[1/4] Loading embedding model...")
    embedder = EmbeddingModel.get_instance()
    embedder.load_model()
    info = embedder.get_model_info()
    print(f"      Model     : {info['model_name']}")
    print(f"      Dimension : {info['dimension']}")

    # 2. Load all chunks
    print("\n[2/4] Loading all chunks...")
    all_chunks = load_all_chunks()
    print(f"      Total chunks: {len(all_chunks)}")

    by_type = {}
    for c in all_chunks:
        t = c.get('chunk_type', 'unknown')
        by_type[t] = by_type.get(t, 0) + 1
    for t, n in sorted(by_type.items()):
        print(f"      {t:25s}: {n}")

    # 3. Embed all chunks
    print(f"\n[3/4] Embedding {len(all_chunks)} chunks...")
    t0 = time.time()
    embedded_chunks = embedder.embed_chunks(all_chunks)
    elapsed = time.time() - t0
    print(f"      Done in {elapsed:.1f}s")
    print(f"      Speed: {len(all_chunks)/elapsed:.1f} chunks/sec")

    # 4. Upsert to Qdrant
    print(f"\n[4/4] Upserting to Qdrant...")
    vs = VectorStore()
    vs.create_collection(recreate=True)
    t0 = time.time()
    total = vs.upsert_chunks(embedded_chunks)
    elapsed = time.time() - t0
    print(f"      Upserted: {total} points in {elapsed:.2f}s")

    print("\n" + "=" * 60)
    print("  PIPELINE COMPLETE")
    print("=" * 60)
    return vs, embedder

def run_retrieval_tests(vs, embedder):
    print("\n" + "=" * 60)
    print("  RETRIEVAL QUALITY TEST (5 queries)")
    print("=" * 60)

    test_cases = [
        {
            "query"   : "Apa saja emergency event pada mesin M-01?",
            "filter"  : {"machine_ids": ["M-01"], "chunk_types": ["event_emergency"]},
            "expect"  : "event_emergency M-01"
        },
        {
            "query"   : "Berapa batas kritis suhu mesin M-01?",
            "filter"  : {"machine_ids": ["M-01"], "doc_types": ["manual"]},
            "expect"  : "specification manual"
        },
        {
            "query"   : "Mesin mana yang paling sering mengalami emergency?",
            "filter"  : {"chunk_types": ["machine_summary"]},
            "expect"  : "machine_summary"
        },
        {
            "query"   : "Prosedur keselamatan dan LOTO saat perbaikan",
            "filter"  : {"doc_types": ["manual"]},
            "expect"  : "safety procedure"
        },
        {
            "query"   : "Bearing aus perlu penggantian corrective maintenance",
            "filter"  : {"chunk_types": ["event_corrective"]},
            "expect"  : "event_corrective bearing"
        },
    ]

    all_pass = True
    for i, tc in enumerate(test_cases, 1):
        print(f"\n[Test {i}] {tc['query'][:55]}...")
        q_vec = embedder.embed_query(tc['query'])
        results = vs.search_with_filter(q_vec, top_k=3, **tc['filter'])
        if results:
            r = results[0]
            score = r['score']
            chunk_type = r['chunk_type']
            machines = r['machine_ids']
            text_preview = r['text_content'][:70]
            print(f"  Top-1 score : {score:.4f}")
            print(f"  chunk_type  : {chunk_type}")
            print(f"  machine_ids : {machines}")
            print(f"  preview     : {text_preview}...")
            if score >= 0.70:
                print(f"  Status      : ✅ PASS (score >= 0.70)")
            else:
                print(f"  Status      : ⚠️  LOW SCORE (< 0.70)")
                all_pass = False
        else:
            print(f"  Status      : ❌ NO RESULTS")
            all_pass = False

    print("\n" + "=" * 60)
    final = "✅ ALL TESTS PASSED" if all_pass else "⚠️  SOME TESTS NEED REVIEW"
    print(f"  {final}")
    print("=" * 60)

if __name__ == "__main__":
    vs, embedder = run_full_pipeline()
    run_retrieval_tests(vs, embedder)
