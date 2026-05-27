import json
import os

notebook = {
    "nbformat": 4,
    "nbformat_minor": 4,
    "metadata": {
        "language_info": {
            "name": "python"
        }
    },
    "cells": []
}

def add_markdown(text):
    notebook["cells"].append({
        "cell_type": "markdown",
        "metadata": {},
        "source": [line + "\n" for line in text.split("\n")]
    })

def add_code(text):
    notebook["cells"].append({
        "cell_type": "code",
        "metadata": {},
        "outputs": [],
        "execution_count": None,
        "source": [line + "\n" for line in text.split("\n")]
    })

# BAGIAN 0
add_markdown("""# Lapis AI — Demonstrasi RAG Pipeline
## Modul NLP: Dari Dokumen ke Sistem Tanya-Jawab Berbasis AI
Notebook ini menunjukkan pipeline RAG untuk sistem Predictive Maintenance, mencakup 7 tahap dari parsing PDF hingga simulasi query end-to-end.""")

add_code("""import subprocess
import sys

print("Memulai instalasi library...")
subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "PyMuPDF", "sentence-transformers", "qdrant-client", "rank-bm25", "pyyaml", "-q"])
print("Instalasi selesai.")""")

add_code("""import pdfplumber
import fitz
import re, json, time, os
import numpy as np
from pathlib import Path
from collections import Counter
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchAny
from rank_bm25 import BM25Okapi

print("Konfirmasi: Semua import berhasil.")""")

# BAGIAN 1
add_markdown("""## Bagian 1: Konfigurasi dan Data
Notebook mendukung dua mode — jika file PDF tersedia maka akan dibaca langsung, jika tidak maka sistem menggunakan data dummy yang sudah tertanam di notebook.""")

add_code("""CONFIG = {
    "embedding_model": "intfloat/multilingual-e5-large",
    "vector_dim": 1024,
    "collection_name": "lapis_ai_demo",
    "batch_size": 16,
    "top_k": 5
}

PDF_LAPORAN = "nlp/data/raw/Laporan_Pemeliharaan_Bulanan_M01_M20.pdf"
PDF_MANUAL  = "nlp/data/raw/Buku_Manual_M01.pdf"

print("Ketersediaan file:")
print("PDF_LAPORAN:", "Ada" if os.path.exists(PDF_LAPORAN) else "Tidak Ada")
print("PDF_MANUAL:", "Ada" if os.path.exists(PDF_MANUAL) else "Tidak Ada")""")

add_code("""# Data dummy fallback
FALLBACK_CHUNKS = [
    {"chunk_id": "CHK-M01-2025-08-001", "chunk_type": "event_emergency", "text_content": "[EVENT_EMERGENCY | M-01 | Agustus 2025] Tanggal: 02/08/2025 | Log: ML-0119 | Kejadian: Kegagalan sistem pendingin kritis | Downtime: 21.6 jam | Part Diganti: Motor | Biaya: Rp 49,643,133", "machine_ids": ["M-01"], "source_doc": "LAP-BUNDLE"},
    {"chunk_id": "CHK-M01-2025-08-005", "chunk_type": "event_emergency", "text_content": "[EVENT_EMERGENCY | M-01 | Agustus 2025] Tanggal: 26/08/2025 | Log: ML-0447 | Kejadian: Short circuit pada panel kontrol | Downtime: 33.5 jam | Part Diganti: Bearing | Biaya: Rp 31,560,747", "machine_ids": ["M-01"], "source_doc": "LAP-BUNDLE"},
    {"chunk_id": "CHK-M01-2025-10-001", "chunk_type": "event_emergency", "text_content": "[EVENT_EMERGENCY | M-01 | Oktober 2025] Tanggal: 10/10/2025 | Log: ML-0205 | Kejadian: Kegagalan sistem pendingin kritis | Downtime: 38.0 jam | Part Diganti: Bearing | Biaya: Rp 13,678,071", "machine_ids": ["M-01"], "source_doc": "LAP-BUNDLE"},
    
    {"chunk_id": "CHK-M01-2025-07-001", "chunk_type": "event_corrective", "text_content": "[EVENT_CORRECTIVE | M-01 | Juli 2025] Tanggal: 01/07/2025 | Log: ML-0383 | Kejadian: Sensor rusak, ganti sensor baru | Downtime: 17.7 jam | Part Diganti: Motor | Biaya: Rp 3,306,114", "machine_ids": ["M-01"], "source_doc": "LAP-BUNDLE"},
    {"chunk_id": "CHK-M01-2025-07-007", "chunk_type": "event_corrective", "text_content": "[EVENT_CORRECTIVE | M-01 | Juli 2025] Tanggal: 31/07/2025 | Log: ML-0105 | Kejadian: Bearing aus, perlu penggantian | Downtime: 20.3 jam | Part Diganti: Seal | Biaya: Rp 4,531,286", "machine_ids": ["M-01"], "source_doc": "LAP-BUNDLE"},
    {"chunk_id": "CHK-M01-2025-08-004", "chunk_type": "event_corrective", "text_content": "[EVENT_CORRECTIVE | M-01 | Agustus 2025] Tanggal: 16/08/2025 | Log: ML-0189 | Kejadian: Kebocoran pressure line, ganti seal | Downtime: 15.8 jam | Part Diganti: Motor | Biaya: Rp 3,385,783", "machine_ids": ["M-01"], "source_doc": "LAP-BUNDLE"},
    
    {"chunk_id": "CHK-M01-2025-07-002", "chunk_type": "event_preventive", "text_content": "[EVENT_PREVENTIVE | M-01 | Juli 2025] Tanggal: 11/07/2025 | Log: ML-0084 | Kejadian: Kalibrasi sensor, bersihkan filter | Downtime: 5.2 jam | Part Diganti: Sensor | Biaya: Rp 1,252,610", "machine_ids": ["M-01"], "source_doc": "LAP-BUNDLE"},
    {"chunk_id": "CHK-M01-2025-07-003", "chunk_type": "event_preventive", "text_content": "[EVENT_PREVENTIVE | M-01 | Juli 2025] Tanggal: 12/07/2025 | Log: ML-0095 | Kejadian: Ganti filter udara, cek bearing | Downtime: 4.3 jam | Part Diganti: Bearing | Biaya: Rp 904,478", "machine_ids": ["M-01"], "source_doc": "LAP-BUNDLE"},
    
    {"chunk_id": "CHK-SUM-M01-001", "chunk_type": "machine_summary", "text_content": "[MACHINE_SUMMARY | M-01] Ringkasan performa mesin M-01 menunjukkan 5 kali kejadian downtime dengan total 120 jam bulan ini.", "machine_ids": ["M-01"], "source_doc": "LAP-BUNDLE"},
    {"chunk_id": "CHK-SUM-M02-001", "chunk_type": "machine_summary", "text_content": "[MACHINE_SUMMARY | M-02] Ringkasan performa mesin M-02 menunjukkan 2 kali kejadian downtime ringan.", "machine_ids": ["M-02"], "source_doc": "LAP-BUNDLE"},
    
    {"chunk_id": "CHK-DOC-BUKU_MAN-002", "chunk_type": "specification", "text_content": "[SPECIFICATION | M-01 | MANUAL] 2. Spesifikasi Teknis & Batas Operasional (Threshold): - Suhu Operasional (Temperature): Normal: 65°C - 75°C Batas Peringatan (Warning): 80°C Batas Kritis (Critical/Shut-off): >95°C", "machine_ids": ["M-01"], "source_doc": "Buku_Manual_M01.pdf"},
    {"chunk_id": "CHK-DOC-BUKU_MAN-005", "chunk_type": "safety", "text_content": "[SAFETY | M-01 | MANUAL] 5. Keselamatan Kerja & Prosedur Darurat: - APD Wajib: Teknisi wajib menggunakan sarung tangan tahan panas, pelindung telinga (earmuff), dan sepatu safety.", "machine_ids": ["M-01"], "source_doc": "Buku_Manual_M01.pdf"},
    
    {"chunk_id": "CHK-DOC-BUKU_MAN-006", "chunk_type": "procedure", "text_content": "[PROCEDURE | M-01 | MANUAL] Lakukan pengecekan sabuk transmisi setiap 500 jam kerja untuk mencegah keausan.", "machine_ids": ["M-01"], "source_doc": "Buku_Manual_M01.pdf"},
    {"chunk_id": "CHK-M02-2025-07-003", "chunk_type": "event_corrective", "text_content": "[EVENT_CORRECTIVE | M-02 | Juli 2025] Tanggal: 25/07/2025 | Log: ML-0266 | Kejadian: Motor overheat, ganti komponen pendingin | Downtime: 12.8 jam | Part Diganti: Belt | Biaya: Rp 7,067,223", "machine_ids": ["M-02"], "source_doc": "LAP-BUNDLE"},
    {"chunk_id": "CHK-M02-2025-08-001", "chunk_type": "event_preventive", "text_content": "[EVENT_PREVENTIVE | M-02 | Agustus 2025] Tanggal: 22/08/2025 | Log: ML-0220 | Kejadian: Cek electrical connection | Downtime: 2.8 jam | Part Diganti: Valve | Biaya: Rp 1,726,686", "machine_ids": ["M-02"], "source_doc": "LAP-BUNDLE"}
]

lap_json = "nlp/data/processed/LAP-BUNDLE.chunks.json"
doc_json = "nlp/data/processed/DOC-BUKU_MAN.chunks.json"

DUMMY_CHUNKS = []

if os.path.exists(lap_json) and os.path.exists(doc_json):
    with open(lap_json, "r", encoding="utf-8") as f:
        lap_data = json.load(f)
    with open(doc_json, "r", encoding="utf-8") as f:
        doc_data = json.load(f)
        
    emergency = [c for c in lap_data if c.get("chunk_type") == "event_emergency"][:3]
    corrective = [c for c in lap_data if c.get("chunk_type") == "event_corrective"][:3]
    preventive = [c for c in lap_data if c.get("chunk_type") == "event_preventive"][:2]
    
    # machine_summary mungkin tidak ada di file, jadi ambil dari fallback
    summary = [c for c in FALLBACK_CHUNKS if c.get("chunk_type") == "machine_summary"][:2]
    manual = [c for c in doc_data if c.get("chunk_type") in ["specification", "safety"]][:2]
    
    DUMMY_CHUNKS = emergency + corrective + preventive + summary + manual
else:
    DUMMY_CHUNKS = FALLBACK_CHUNKS[:12]

if len(DUMMY_CHUNKS) < 12:
    DUMMY_CHUNKS = FALLBACK_CHUNKS[:15]

tipe_counts = Counter(c.get("chunk_type", "unknown") for c in DUMMY_CHUNKS)
jml_str = str(len(DUMMY_CHUNKS))
print("Total DUMMY_CHUNKS: " + jml_str)
print("Distribusi tipe:")
for k, v in dict(tipe_counts).items():
    print("- " + str(k) + ": " + str(v))""")

# BAGIAN 2
add_markdown("""## Bagian 2: Parsing Dokumen PDF
`pdfplumber` digunakan sebagai parser utama karena kemampuannya mengekstrak tabel secara terstruktur. `PyMuPDF` digunakan sebagai alternatif jika pdfplumber gagal. Tabel diekstrak terpisah dari teks narasi.""")

add_code("""def parse_pdf(filepath):
    try:
        text_content = []
        tables_content = []
        with pdfplumber.open(filepath) as pdf:
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    text_content.append(page_text)
                
                page_tables = page.extract_tables()
                if page_tables:
                    for t in page_tables:
                        tables_content.append({"page": i + 1, "data": t})
                        
        return {
            "text": "\\n".join(text_content),
            "tables": tables_content,
            "pages": len(pdf.pages),
            "method": "pdfplumber"
        }
    except Exception as e:
        print("pdfplumber gagal, menggunakan fallback PyMuPDF:", e)
        text_content = []
        try:
            doc = fitz.open(filepath)
            for page in doc:
                text_content.append(page.get_text())
            return {
                "text": "\\n".join(text_content),
                "tables": [],
                "pages": len(doc),
                "method": "pymupdf"
            }
        except Exception as e2:
            print("PyMuPDF juga gagal:", e2)
            return None

def clean_text(raw_text):
    text = raw_text.replace('\\r\\n', '\\n').replace('\\r', '\\n')
    lines = text.split('\\n')
    
    cleaned_lines = []
    for line in lines:
        line_str = line.strip()
        if not line_str:
            cleaned_lines.append("")
            continue
        if line_str.isdigit():
            continue
        if len(line_str) < 3:
            continue
        cleaned_lines.append(line_str)
        
    final_text = re.sub(r'\\n{2,}', '\\n', '\\n'.join(cleaned_lines)).strip()
    return final_text""")

add_code("""laporan_data = None
if os.path.exists(PDF_LAPORAN):
    laporan_data = parse_pdf(PDF_LAPORAN)
    if laporan_data:
        laporan_data["text"] = clean_text(laporan_data["text"])
        metode_str = str(laporan_data['method'])
        pages_str = str(laporan_data['pages'])
        tabel_str = str(len(laporan_data['tables']))
        panjang_str = str(len(laporan_data['text']))
        
        print("Metode parser : " + metode_str)
        print("Jumlah halaman: " + pages_str)
        print("Jumlah tabel  : " + tabel_str)
        print("Panjang teks  : " + panjang_str + " karakter")
        print("3 baris pertama teks:")
        print("\\n".join(laporan_data["text"].split("\\n")[:3]))
else:
    print("Pesan: File PDF_LAPORAN tidak tersedia. Data dummy akan digunakan.")
    laporan_data = None""")

# BAGIAN 3
add_markdown("""## Bagian 3: Pemecahan Teks Menjadi Unit Informasi
Setiap baris tabel pemeliharaan diperlakukan sebagai satu unit informasi yang mandiri. Setiap unit dilengkapi metadata berupa identitas mesin, bulan kejadian, jenis perawatan, dan nomor halaman sumber yang digunakan untuk menampilkan kutipan di antarmuka pengguna.""")

add_code("""MONTH_MAP = {
    "januari": 1, "februari": 2, "maret": 3, "april": 4, "mei": 5, "juni": 6,
    "juli": 7, "agustus": 8, "september": 9, "oktober": 10, "november": 11, "desember": 12
}

def normalize_header(h):
    if not isinstance(h, str):
        return h
    return h.replace('\\n', ' ').strip()

def parse_bulan(text):
    parts = str(text).strip().split()
    if len(parts) >= 2:
        bulan_str = parts[0].lower()
        tahun_str = parts[1]
        if bulan_str in MONTH_MAP and tahun_str.isdigit():
            return MONTH_MAP[bulan_str], int(tahun_str)
    return None, None

def build_context_map(clean_text):
    contexts = []
    current_machine = None
    
    for line in clean_text.split('\\n'):
        m_match = re.search(r'Mesin\\s+(M-\\d{2})', line, re.IGNORECASE)
        if m_match:
            current_machine = m_match.group(1).upper()
            
        b_match = re.search(r'Bulan:\\s*([a-zA-Z]+)\\s+(\\d{4})', line, re.IGNORECASE)
        if b_match and current_machine:
            bulan_str = b_match.group(1)
            tahun_str = b_match.group(2)
            gabungan = bulan_str + " " + tahun_str
            idx, yr = parse_bulan(gabungan)
            if idx and yr:
                contexts.append({
                    "machine_id": current_machine,
                    "month_label": bulan_str.capitalize() + " " + str(yr),
                    "month_index": idx,
                    "year": yr
                })
    return contexts""")

add_code("""def chunk_from_tables(tables, contexts, source_doc):
    PRIORITAS = {"emergency": 3, "corrective": 2, "preventive": 1}
    TIPE_MAP = {
        "emergency": "event_emergency",
        "corrective": "event_corrective",
        "preventive": "event_preventive"
    }
    
    chunks = []
    counter = 1
    
    for index, tbl_info in enumerate(tables):
        if index >= len(contexts):
            continue
            
        ctx = contexts[index]
        table_data = tbl_info.get("data", [])
        if not table_data or len(table_data) < 2:
            continue
            
        headers = [normalize_header(h) for h in table_data[0]]
        
        for row in table_data[1:]:
            if not row or len(row) != len(headers):
                continue
                
            row_dict = dict(zip(headers, row))
            
            tanggal = row_dict.get("Tanggal", "")
            tipe = str(row_dict.get("Tipe", "")).lower()
            
            if not tanggal or not tipe:
                continue
                
            tipe_valid = None
            for key in TIPE_MAP:
                if key in tipe:
                    tipe_valid = key
                    break
            
            if not tipe_valid:
                continue
                
            machine = ctx["machine_id"]
            year = ctx["year"]
            month_idx = ctx["month_index"]
            
            idx_str = str(month_idx).zfill(2)
            cnt_str = str(counter).zfill(3)
            chunk_id = "CHK-" + machine + "-" + str(year) + "-" + idx_str + "-" + cnt_str
            counter += 1
            
            TIPE_UPPER = TIPE_MAP[tipe_valid].upper()
            month_label = ctx["month_label"]
            
            log_id = row_dict.get("Log ID", "")
            kejadian = row_dict.get("Kejadian", "")
            downtime = row_dict.get("Downtime (Jam)", "")
            part = row_dict.get("Part Diganti", "")
            biaya = row_dict.get("Biaya (Rp)", "")
            
            text_content = (
                "[" + TIPE_UPPER + " | " + machine + " | " + month_label + "] "
                "Tanggal: " + str(tanggal) + " | "
                "Log: " + str(log_id) + " | "
                "Kejadian: " + str(kejadian) + " | "
                "Downtime: " + str(downtime) + " jam | "
                "Part Diganti: " + str(part) + " | "
                "Biaya: " + str(biaya)
            )
            
            chunk = {
                "chunk_id": chunk_id,
                "chunk_type": TIPE_MAP[tipe_valid],
                "text_content": text_content,
                "machine_ids": [machine],
                "source_doc": source_doc,
                "priority": PRIORITAS.get(tipe_valid, 1),
                "month_label": month_label,
                "month_index": month_idx,
                "year": year
            }
            chunks.append(chunk)
            
    return chunks""")

add_code("""ACTIVE_CHUNKS = []

if laporan_data is not None and len(laporan_data.get("tables", [])) > 0:
    contexts = build_context_map(laporan_data["text"])
    chunks = chunk_from_tables(laporan_data["tables"], contexts, "Laporan_Pemeliharaan_Bulanan_M01_M20.pdf")
    
    if chunks:
        jml_chunk = str(len(chunks))
        print("Total chunk dari PDF: " + jml_chunk)
        tipe_dist = Counter(c["chunk_type"] for c in chunks)
        print("Distribusi tipe:", dict(tipe_dist))
        
        for c in chunks:
            if c["chunk_type"] == "event_emergency":
                print("\\nContoh Chunk Emergency:")
                print(json.dumps(c, indent=2))
                break
                
        ACTIVE_CHUNKS = chunks
    else:
        print("Gagal mengekstrak chunk dari tabel, fallback ke DUMMY_CHUNKS.")
        ACTIVE_CHUNKS = DUMMY_CHUNKS
        print("Menggunakan " + str(len(ACTIVE_CHUNKS)) + " chunk dummy.")
else:
    ACTIVE_CHUNKS = DUMMY_CHUNKS
    print("Menggunakan " + str(len(ACTIVE_CHUNKS)) + " chunk dummy karena PDF tidak dibaca atau tidak memiliki tabel.")""")

# BAGIAN 4
add_markdown("""## Bagian 4: Mengubah Teks Menjadi Vektor Numerik
Model `multilingual-e5-large` digunakan untuk merepresentasikan teks ke dalam vektor.
- Mendukung Bahasa Indonesia secara native
- Menghasilkan vektor berdimensi 1024
- Menggunakan instruction prefix: `passage:` untuk dokumen dan `query:` untuk pertanyaan pengguna
- Vektor dinormalisasi agar siap untuk perhitungan kemiripan kosinus

**Catatan:** Proses pemuatan model membutuhkan waktu beberapa menit pada pertama kali dijalankan karena model berukuran sekitar 2.2 GB harus diunduh terlebih dahulu.""")

add_code("""model_name = CONFIG["embedding_model"]
print("Memuat model " + model_name + " ... (Proses ini memakan waktu pada awal unduhan)")
model = SentenceTransformer(model_name)
print("Model berhasil dimuat.")
dummy_encode = model.encode("test")
print("Dimensi output vektor: " + str(len(dummy_encode)))""")

add_code("""def embed_passages(texts, batch_size):
    prefixed_texts = ["passage: " + t for t in texts]
    embeddings = model.encode(
        prefixed_texts,
        batch_size=batch_size,
        normalize_embeddings=True,
        show_progress_bar=True,
        convert_to_numpy=True
    )
    return embeddings

def embed_query(query_text):
    prefixed_query = "query: " + query_text
    embedding = model.encode(
        prefixed_query,
        normalize_embeddings=True,
        convert_to_numpy=True
    )
    return embedding""")

add_code("""demo_chunks = ACTIVE_CHUNKS[:3]
demo_texts = [c["text_content"] for c in demo_chunks]
demo_embeddings = embed_passages(demo_texts, batch_size=CONFIG["batch_size"])

print("\\nBentuk array hasil embedding: " + str(demo_embeddings.shape))
norm_val = np.linalg.norm(demo_embeddings[0])
str_norm = str(round(norm_val, 4))
print("Norma vektor pertama: " + str_norm + " (mendekati 1.0)")

query_demo = "Kejadian darurat pada mesin M-01"
query_emb = embed_query(query_demo)
print("Dimensi query: " + str(query_emb.shape))

print("\\nSkor Kemiripan (Dot Product):")
similarities = np.dot(demo_embeddings, query_emb)
for i, chunk in enumerate(demo_chunks):
    score = similarities[i]
    tipe_chk = chunk['chunk_type']
    skor_str = str(round(score, 4))
    print("Chunk " + str(i+1) + " | Skor: " + skor_str + " | Tipe: " + tipe_chk)""")

# BAGIAN 5
add_markdown("""## Bagian 5: Menyimpan dan Mencari di Basis Data Vektor
Database biasa mencari kecocokan persis, vector database mencari berdasarkan kemiripan makna. Qdrant digunakan dalam mode in-memory untuk demonstrasi ini sehingga tidak memerlukan server terpisah.""")

add_code("""print("Inisialisasi Qdrant Client (in-memory)...")
client = QdrantClient(":memory:")

if client.collection_exists(collection_name=CONFIG["collection_name"]):
    client.delete_collection(collection_name=CONFIG["collection_name"])
client.create_collection(
    collection_name=CONFIG["collection_name"],
    vectors_config=VectorParams(
        size=CONFIG["vector_dim"],
        distance=Distance.COSINE
    )
)
print("Collection berhasil dibuat.")""")

add_code("""print("Menyimpan chunk ke Qdrant...")
start_time = time.time()

all_texts = [c["text_content"] for c in ACTIVE_CHUNKS]
all_embeddings = embed_passages(all_texts, batch_size=CONFIG["batch_size"])

points = []
for idx, chunk in enumerate(ACTIVE_CHUNKS):
    payload = {k: v for k, v in chunk.items() if k != "embedding"}
    point = PointStruct(
        id=idx,
        vector=all_embeddings[idx].tolist(),
        payload=payload
    )
    points.append(point)

client.upsert(
    collection_name=CONFIG["collection_name"],
    points=points
)

end_time = time.time()
durasi = str(round(end_time - start_time, 2))
jml_points = str(len(points))
print("\\nBerhasil menyimpan " + jml_points + " point dalam " + durasi + " detik.")""")

add_code("""def search(query, top_k, machine_ids=None, chunk_types=None):
    query_vector = embed_query(query)
    
    conditions = []
    if machine_ids:
        conditions.append(
            FieldCondition(
                key="machine_ids", 
                match=MatchAny(any=machine_ids)
            )
        )
        
    if chunk_types:
        conditions.append(
            FieldCondition(
                key="chunk_type", 
                match=MatchAny(any=chunk_types)
            )
        )
        
    query_filter = Filter(must=conditions) if conditions else None
    
    response = client.query_points(
        collection_name=CONFIG["collection_name"],
        query=query_vector.tolist(),
        query_filter=query_filter,
        limit=top_k
    )
    
    formatted_results = []
    for hit in response.points:
        payload = hit.payload
        formatted_results.append({
            "chunk_id": payload.get("chunk_id"),
            "score": hit.score,
            "chunk_type": payload.get("chunk_type"),
            "machine_ids": payload.get("machine_ids"),
            "source_doc": payload.get("source_doc"),
            "source_page": payload.get("source_page"),
            "text_content": payload.get("text_content")
        })
        
    return formatted_results""")

add_code("""print("Demo Pencarian 1: Tanpa Filter")
res1 = search("Kejadian darurat mesin M-01", top_k=3)
for i, r in enumerate(res1, 1):
    teks_awal = r['text_content']
    short_text = teks_awal[:80] + ("..." if len(teks_awal) > 80 else "")
    skor_str = str(round(r['score'], 4))
    print(str(i) + ". Skor: " + skor_str + " | ID: " + str(r['chunk_id']) + " | Tipe: " + str(r['chunk_type']))
    print("   Teks: " + short_text)

print("\\nDemo Pencarian 2: Dengan Filter (M-01 & event_emergency)")
res2 = search("Kejadian darurat mesin M-01", top_k=3, machine_ids=["M-01"], chunk_types=["event_emergency"])
for i, r in enumerate(res2, 1):
    teks_awal = r['text_content']
    short_text = teks_awal[:80] + ("..." if len(teks_awal) > 80 else "")
    skor_str = str(round(r['score'], 4))
    print(str(i) + ". Skor: " + skor_str + " | ID: " + str(r['chunk_id']) + " | Tipe: " + str(r['chunk_type']))
    print("   Teks: " + short_text)""")

# BAGIAN 6
add_markdown("""## Bagian 6: Pencarian Hibrida (Semantik dan Kata Kunci)
Pencarian semantik unggul untuk memahami makna tetapi kurang akurat untuk kata teknis spesifik seperti kode mesin (M-01) atau kode log (ML-0058). BM25 ditambahkan untuk menangani kasus ini. Hasil keduanya digabungkan menggunakan teknik Reciprocal Rank Fusion (RRF).

Rumus RRF:
skor_rrf = jumlah(1 dibagi (k ditambah peringkat))
dengan nilai k default adalah 60.""")

add_code("""def bm25_search(query, chunks, top_k):
    tokenized_corpus = [c["text_content"].lower().split() for c in chunks]
    bm25 = BM25Okapi(tokenized_corpus)
    
    tokenized_query = query.lower().split()
    scores = bm25.get_scores(tokenized_query)
    
    top_indices = np.argsort(scores)[::-1][:top_k]
    
    results = []
    for idx in top_indices:
        if scores[idx] > 0:
            results.append({
                "index": int(idx),
                "bm25_score": float(scores[idx]),
                "chunk": chunks[idx]
            })
    return results

def rrf_fusion(dense_results, sparse_results, k=60, top_k=5):
    rrf_scores = {}
    chunk_map = {}
    
    for rank, res in enumerate(dense_results):
        cid = res["chunk_id"]
        if cid not in rrf_scores:
            rrf_scores[cid] = 0
            chunk_map[cid] = res
        rrf_scores[cid] += 1 / (k + rank + 1)
        
    for rank, res in enumerate(sparse_results):
        cid = res["chunk"]["chunk_id"]
        if cid not in rrf_scores:
            rrf_scores[cid] = 0
            chunk_map[cid] = res["chunk"]
        rrf_scores[cid] += 1 / (k + rank + 1)
        
    sorted_items = sorted(rrf_scores.items(), key=lambda item: item[1], reverse=True)
    
    final_results = []
    for cid, score in sorted_items[:top_k]:
        final_results.append({
            "chunk_id": cid,
            "rrf_score": score,
            "data": chunk_map[cid]
        })
        
    return final_results""")

add_code("""test_query = "Short circuit panel kontrol ML-0058"
print("Query Hibrida: " + test_query + "\\n")

dense_results = search(test_query, top_k=20)
sparse_results = bm25_search(test_query, ACTIVE_CHUNKS, top_k=20)
hybrid_results = rrf_fusion(dense_results, sparse_results, k=60, top_k=5)

def print_row(m, pos, cid, score):
    m_pad = m + " " * (10 - len(m))
    pos_pad = str(pos) + " " * (6 - len(str(pos)))
    cid_pad = str(cid) + " " * (20 - len(str(cid)))
    score_str = str(round(score, 4))
    print(m_pad + " | " + pos_pad + " | " + cid_pad + " | " + score_str)

print("Metode     | Posisi | chunk_id             | Skor")
print("-----------|--------|----------------------|-------")
for i, res in enumerate(dense_results[:3]):
    print_row("Dense", i+1, res["chunk_id"], res["score"])
for i, res in enumerate(sparse_results[:3]):
    print_row("BM25", i+1, res["chunk"]["chunk_id"], res["bm25_score"])
for i, res in enumerate(hybrid_results[:3]):
    print_row("Hybrid", i+1, res["chunk_id"], res["rrf_score"])

print("\\nPenjelasan: Hybrid search lebih baik untuk query yang memiliki kode teknis "
      "seperti ML-0058 karena dapat menemukan kecocokan kata pasti melalui BM25 "
      "sekaligus memahami konteks kemiripan melalui Dense Vector.")""")

# BAGIAN 7
add_markdown("""## Bagian 7: Simulasi Pipeline RAG Lengkap
Dalam sistem Lapis AI sesungguhnya, konteks yang ditemukan akan digabungkan dengan data sensor langsung dari Redis dan dikirim ke LLM (Claude atau Gemini) untuk menghasilkan jawaban. Di sini LLM tidak dipanggil, tetapi prompt yang akan dikirim ditampilkan secara lengkap sehingga alurnya tetap terlihat jelas.

== SYSTEM PROMPT ==
Anda adalah asisten AI Predictive Maintenance Lapis AI.
Jawab berdasarkan konteks yang diberikan. Jika informasi
tidak tersedia di konteks, katakan tidak ditemukan.

== USER PROMPT ==
[KONDISI REAL-TIME]
{data sensor langsung}

[KONTEKS HISTORIS]
{potongan teks yang ditemukan}

[PERTANYAAN]
{pertanyaan teknisi}""")

add_code("""def simulate_rag(query, machine_ids=None, chunk_types=None, top_k=3):
    mesin_target = machine_ids[0] if machine_ids else "UMUM"
    live_context = {
        "machine_id": mesin_target,
        "status": "warning",
        "temperature_c": 87.3,
        "vibration_mms": 0.82,
        "pressure_psi": 103.1,
        "rul_days": 12,
        "ml_prediction": "butuh_perawatan"
    }
    
    results = search(query, top_k=top_k, machine_ids=machine_ids, chunk_types=chunk_types)
    
    live_context_str = json.dumps(live_context, indent=2)
    
    retrieved_texts = []
    citations = []
    for i, r in enumerate(results, 1):
        teks = str(r['text_content'])
        doc = str(r.get('source_doc', 'Unknown'))
        retrieved_texts.append("[" + str(i) + "] [Sumber: " + doc + "]\\n" + teks)
        citations.append({
            "source_doc": doc,
            "page": r.get("source_page"),
            "chunk_id": r["chunk_id"],
            "score": round(r["score"], 4)
        })
        
    if retrieved_texts:
        retrieved_str = "\\n\\n".join(retrieved_texts)
    else:
        retrieved_str = "Tidak ada dokumen relevan ditemukan."
    
    full_prompt = (
        "== SYSTEM PROMPT ==\\n"
        "Anda adalah asisten AI Predictive Maintenance Lapis AI.\\n"
        "Jawab berdasarkan konteks yang diberikan. Jika informasi\\n"
        "tidak tersedia di konteks, katakan tidak ditemukan.\\n\\n"
        "== USER PROMPT ==\\n"
        "[KONDISI REAL-TIME]\\n" + live_context_str + "\\n\\n"
        "[KONTEKS HISTORIS]\\n" + retrieved_str + "\\n\\n"
        "[PERTANYAAN]\\n" + str(query)
    )
    
    print("=" * 60)
    print("PROMPT YANG AKAN DIKIRIM KE LLM")
    print("=" * 60)
    print(full_prompt)
    print("\\n" + "=" * 60)
    print("METADATA KUTIPAN")
    print("=" * 60)
    print(json.dumps(citations, indent=2))
    
    return {
        "query": query,
        "citations": citations,
        "live_context": live_context,
        "chunks_found": len(results),
        "note": "LLM simulation complete. No real API call made."
    }""")

add_code("""print("Demo 1: Teknisi bertanya tentang kondisi M-01")
simulate_rag(
    query="Apa yang harus dilakukan jika M-01 mengalami overheat?",
    machine_ids=["M-01"],
    chunk_types=None,
    top_k=3
)""")

add_code("""print("Demo 2: Pencarian prosedur keselamatan")
simulate_rag(
    query="Prosedur keselamatan sebelum membuka panel motor",
    machine_ids=None,
    chunk_types=None,
    top_k=3
)""")

add_code("""print("Demo 3: Riwayat kerusakan berdasarkan tipe")
simulate_rag(
    query="Mesin mana yang mengalami short circuit?",
    machine_ids=None,
    chunk_types=["event_emergency"],
    top_k=3
)""")

# BAGIAN 8
add_markdown("""## Ringkasan Pipeline

| Tahap | Nama | Teknologi | Output |
|---|---|---|---|
| 1 | Konfigurasi & Data | Python | Environment siap |
| 2 | Parsing PDF | pdfplumber / PyMuPDF | Teks bersih & tabel |
| 3 | Chunking | Regex & Aturan Logika | List dict chunk |
| 4 | Embedding | SentenceTransformers | Vektor 1024-dim |
| 5 | Vector Database | Qdrant In-Memory | Penyimpanan terstruktur |
| 6 | Hybrid Search | BM25 + Qdrant + RRF | Hasil terurut akurat |
| 7 | Simulasi LLM | String Formatting | Prompt untuk AI |

Dalam sistem Lapis AI sesungguhnya, pipeline ini berjalan sebagai microservice FastAPI yang terintegrasi dengan modul backend (pengelola data sensor Redis), modul machine learning (prediksi kondisi mesin), dan antarmuka pengguna (tampilan kutipan dokumen dan jawaban AI).""")

add_code("""print("=" * 55)
print("  STATISTIK AKHIR PIPELINE")
print("=" * 55)

jml_chunk_akhir = str(len(ACTIVE_CHUNKS))
dim_str = str(CONFIG["vector_dim"])
mod_str = str(CONFIG["embedding_model"])

print("Total chunk tersedia: " + jml_chunk_akhir)
tipe_counts = Counter(c.get("chunk_type", "unknown") for c in ACTIVE_CHUNKS)
print("Distribusi tipe chunk:")
for k, v in dict(tipe_counts).items():
    print("- " + str(k) + ": " + str(v))
    
print("Dimensi vektor yang digunakan: " + dim_str)
print("Nama model embedding: " + mod_str)
print("Mode basis data vektor: in-memory (Qdrant)")
print("Jumlah titik tersimpan di vector database: " + jml_chunk_akhir)

print("\\n--- HASIL QUERY TEST OTOMATIS ---")
test_queries = [
    "Kejadian darurat M-01",
    "Batas suhu kritis mesin",
    "Prosedur penggantian bearing"
]

print("Query                     | Skor   | Tipe Chunk Ditemukan")
print("-" * 55)
for q in test_queries:
    res = search(q, top_k=1)
    q_pad = q + " " * (25 - len(q))
    if res:
        skor_str = str(round(res[0]["score"], 4))
        tipe_str = res[0]["chunk_type"]
        skor_pad = skor_str + " " * (6 - len(skor_str))
        print(q_pad + " | " + skor_pad + " | " + str(tipe_str))
    else:
        print(q_pad + " | N/A    | N/A")""")

with open(r"c:\KULIAH\predictive-maintenance-monorepo\nlp\Lapis_AI_RAG_Pipeline_Demo.ipynb", "w", encoding="utf-8") as f:
    json.dump(notebook, f, indent=1, ensure_ascii=False)
