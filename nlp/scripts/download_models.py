"""Pre-download HuggingFace models during Docker build."""
import sys

print("=" * 60)
print("PRE-DOWNLOADING HUGGINGFACE MODELS")
print("=" * 60)

print("[1/2] Downloading intfloat/multilingual-e5-base ...")
try:
    from sentence_transformers import SentenceTransformer
    SentenceTransformer("intfloat/multilingual-e5-base")
    print("  [OK] multilingual-e5-base downloaded successfully")
except Exception as e:
    print(f"  [FATAL] Failed to download e5-base: {e}", file=sys.stderr)
    sys.exit(1)

print("[2/2] Downloading cross-encoder/ms-marco-MiniLM-L-6-v2 ...")
try:
    from sentence_transformers import CrossEncoder
    CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    print("  [OK] ms-marco-MiniLM-L-6-v2 downloaded successfully")
except Exception as e:
    print(f"  [FATAL] Failed to download reranker: {e}", file=sys.stderr)
    sys.exit(1)

print("=" * 60)
print("MODEL PRE-DOWNLOAD COMPLETE")
print("=" * 60)
