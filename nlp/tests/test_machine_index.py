"""Quick test for Machine Summary Index logic."""
import json
import os

all_chunks = []
for f in sorted(os.listdir("nlp/data/processed")):
    if f.endswith(".chunks.json"):
        with open(f"nlp/data/processed/{f}", encoding="utf-8") as fp:
            all_chunks.extend(json.load(fp))

# Simulate the metadata mapping from _load_all_chunks
for c in all_chunks:
    meta = c.get("metadata", {})
    m_ids = meta.get("detected_machine_ids", [])
    c["machine_ids"] = m_ids if m_ids else ["ALL"]

# Simulate _build_machine_summary
ms = {}
for c in all_chunks:
    section = (c.get("section_name") or "").upper()
    if section not in ("METADATA", "SUMMARY"):
        continue
    for mid in c.get("machine_ids", []):
        if mid == "ALL":
            continue
        ms.setdefault(mid, []).append(c)

for mid in ms:
    ms[mid].sort(key=lambda x: x.get("doc_id", ""))

print(f"Total machines indexed: {len(ms)}")
print(f"M-01 summary chunks: {len(ms.get('M-01', []))}")
print(f"M-02 summary chunks: {len(ms.get('M-02', []))}")
print()

print("M-01 index contents:")
for c in ms.get("M-01", []):
    print(f"  {c.get('doc_id','?'):45s} | {c.get('section_name','?'):10s} | {c.get('char_count',0)} chars")

print()
total_chars = sum(c.get("char_count", 0) for c in ms.get("M-01", []))
print(f"Total M-01 summary chars: {total_chars}")

print("\nM-02 index contents:")
for c in ms.get("M-02", []):
    print(f"  {c.get('doc_id','?'):45s} | {c.get('section_name','?'):10s} | {c.get('char_count',0)} chars")

# Test broad query detection
print()
BROAD = {"kapan saja", "berapa kali", "daftar", "riwayat",
         "semua maintenance", "semua pemeliharaan", "history",
         "selama ini", "sejauh ini", "track record", "pernah",
         "catatan", "log maintenance", "semua kejadian"}
AGG = {"ringkasan", "total", "summary", "rangkum", "berapa kali",
       "sepanjang", "seluruh", "agregasi", "statistik"}

queries = [
    "kapan saja M-01 dilakukan maintenance?",
    "riwayat perawatan M-02",
    "apa yang terjadi saat emergency M-01?",
    "berapa batas suhu kritis mesin?",
    "daftar semua kejadian M-01",
]
for q in queries:
    ql = q.lower()
    is_broad = any(kw in ql for kw in BROAD) or any(kw in ql for kw in AGG)
    print(f"  broad={is_broad} | {q}")
