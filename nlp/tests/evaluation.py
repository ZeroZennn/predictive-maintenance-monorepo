"""
Evaluation Lapis AI RAG Pipeline menggunakan RAGAS framework.

Cara pakai:
    # Full (15 kasus)
    python -m nlp.tests.evaluation full

    # Quick test (5 kasus pertama)
    python -m nlp.tests.evaluation quick
"""

import json
import logging
import os
import sys
import time
import requests
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict

import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

from dotenv import load_dotenv
load_dotenv()

# ── RAGAS ──────────────────────────────────────────────────────────────────────
from ragas import evaluate
from ragas.dataset_schema import SingleTurnSample, EvaluationDataset
from ragas.run_config import RunConfig

import ragas.metrics.collections as _col
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall,
    answer_correctness,
    answer_similarity,
)

# Monkey patch untuk singleton metrics di koleksi
_col.faithfulness = faithfulness
_col.answer_relevancy = answer_relevancy
_col.context_precision = context_precision
_col.context_recall = context_recall
_col.answer_correctness = answer_correctness
_col.answer_similarity = answer_similarity

from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    format="%(asctime)s  %(levelname)s  %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("lapis_eval")

# ══════════════════════════════════════════════════════════════════════════════
# DATASETS
# ══════════════════════════════════════════════════════════════════════════════

QUICK_DATASET = [
    {
        "case_id": "Q1",
        "question": "Berapa total biaya maintenance mesin M-01 pada bulan Juli 2025?",
        "ground_truth": "Berdasarkan laporan pemeliharaan, total biaya maintenance mesin M-01 pada bulan Juli 2025 adalah sebesar Rp 18.434.465 dengan total 7 aktivitas pemeliharaan.",
        "machine_ids": ["M-01"]
    },
    {
        "case_id": "Q2",
        "question": "Berapa total downtime mesin M-01 pada bulan Agustus 2025?",
        "ground_truth": "Total downtime mesin M-01 pada bulan Agustus 2025 mencapai 100.7 jam. Hal ini disebabkan oleh 6 aktivitas pemeliharaan yang berpusat pada komponen Seal dan Motor.",
        "machine_ids": ["M-01"]
    },
    {
        "case_id": "Q3",
        "question": "Apa komponen utama yang menjadi masalah pada pemeliharaan mesin M-01 di bulan September 2025?",
        "ground_truth": "Berdasarkan laporan bulan September 2025, masalah utama pemeliharaan mesin M-01 berpusat pada komponen Sensor dan Belt.",
        "machine_ids": ["M-01"]
    },
    {
        "case_id": "Q4",
        "question": "Berapa banyak aktivitas pemeliharaan Preventive dan Corrective pada mesin M-01 di bulan November 2025?",
        "ground_truth": "Pada bulan November 2025, terjadi total 5 aktivitas pemeliharaan pada mesin M-01, yang terdiri dari 2 tindakan Preventive dan 1 tindakan Corrective.",
        "machine_ids": ["M-01"]
    },
    {
        "case_id": "Q5",
        "question": "Berapa batas kritis suhu operasional (temperature) pada mesin M-01?",
        "ground_truth": "Batas kritis (Critical/Shut-off) suhu operasional pada mesin M-01 adalah >95°C, yang dapat menyebabkan risiko overheat pada motor.",
        "machine_ids": ["M-01"]
    },
]

FULL_DATASET = QUICK_DATASET + [
    {
        "case_id": "F1",
        "question": "Berapa total biaya maintenance M-02 selama bulan November 2025?",
        "ground_truth": "Berdasarkan laporan, biaya pemeliharaan mesin M-02 pada bulan November 2025 adalah sekitar Rp 89.980.505.",
        "machine_ids": ["M-02"]
    },
    {
        "case_id": "F2",
        "question": "Sebutkan komponen yang sering rusak pada mesin M-03?",
        "ground_truth": "Dari catatan riwayat, komponen mesin M-03 yang paling sering mengalami perbaikan corrective adalah komponen sistem hidrolik dan bearing poros utama.",
        "machine_ids": ["M-03"]
    },
    {
        "case_id": "F3",
        "question": "Berapa downtime terlama pada mesin M-18?",
        "ground_truth": "Total downtime mesin M-18 selama bulan Agustus 2025 mencapai 39.3 jam yang mencakup tindakan preventif dan corrective.",
        "machine_ids": ["M-18"]
    },
    {
        "case_id": "F4",
        "question": "Bagaimana prosedur pencegahan overheat pada motor M-01?",
        "ground_truth": "Prosedur pencegahan overheat pada motor M-01 mencakup penggantian oli pelumas, pembersihan kipas dan filter udara setiap 500 jam operasional, serta memastikan batas suhu operasional tidak melampaui batas kritis 95°C.",
        "machine_ids": ["M-01"]
    },
    {
        "case_id": "F5",
        "question": "Apa saja yang harus diperiksa saat mesin getarannya sangat tinggi?",
        "ground_truth": "Saat getaran sangat tinggi, perlu diperiksa apakah bearing poros utama mengalami aus, serta memastikan kestabilan belt transmisi. Jika getaran mencapai 1.2 mm/s, itu masuk kategori kritis dan bearing mungkin harus diganti.",
        "machine_ids": ["M-01"]
    },
    {
        "case_id": "F6",
        "question": "Apakah mesin M-02 pernah mengalami short circuit?",
        "ground_truth": "Ya, mesin M-02 tercatat pernah mengalami insiden short circuit pada panel kontrol yang mengakibatkan downtime corrective selama puluhan jam.",
        "machine_ids": ["M-02"]
    },
    {
        "case_id": "F7",
        "question": "Bandingkan biaya pemeliharaan M-01 pada Juli vs Agustus 2025.",
        "ground_truth": "Biaya pemeliharaan mesin M-01 pada Agustus 2025 mencapai lebih dari Rp 96 juta, sedangkan pada Juli 2025 sekitar Rp 8-12 juta, yang berarti terjadi lonjakan biaya signifikan di bulan Agustus.",
        "machine_ids": ["M-01"]
    },
    {
        "case_id": "F8",
        "question": "Jelaskan langkah prosedur LOTO secara singkat.",
        "ground_truth": "Lock Out Tag Out (LOTO) mengharuskan aliran listrik diputus total dan dilabeli sebelum membuka panel mesin untuk memastikan keselamatan teknisi selama perbaikan berlangsung.",
        "machine_ids": []
    },
    {
        "case_id": "F9",
        "question": "Komponen apa yang memiliki biaya corrective tertinggi pada M-01 bulan Agustus?",
        "ground_truth": "Biaya corrective tertinggi pada M-01 di bulan Agustus 2025 terkait perbaikan komponen Motor dan Valve yang membutuhkan biaya besar.",
        "machine_ids": ["M-01"]
    },
    {
        "case_id": "F10",
        "question": "Apa itu nilai ambang kritis (threshold) tekanan hidrolik pada M-01?",
        "ground_truth": "Tekanan hidrolik M-01 memiliki tekanan normal di kisaran 100 PSI. Jika tekanan berlebih atau kurang drastis dari batas normal, sistem akan memberikan alert peringatan dini.",
        "machine_ids": ["M-01"]
    }
]

# ══════════════════════════════════════════════════════════════════════════════
# FETCH SYSTEM RESPONSE
# ══════════════════════════════════════════════════════════════════════════════

def get_system_response(question: str, machine_ids: list = None) -> dict:
    payload = {
        "query": question,
        "use_reranker": True,
        "use_hybrid": True
    }
    if machine_ids:
        payload["machine_ids"] = machine_ids
    
    try:
        response = requests.post(
            "http://localhost:8001/nlp/query",
            json=payload,
            timeout=60
        )
        return response.json()
    except Exception as e:
        logger.error(f"Failed to get response for query: {question}. Error: {e}")
        return {}

def run_evaluation_pipeline(cases: List[Dict]) -> List[SingleTurnSample]:
    samples = []

    for i, case in enumerate(cases, 1):
        logger.info(f"[{i}/{len(cases)}] Fetching: {case['question']}")
        t0 = time.time()
        
        resp = get_system_response(case["question"], case["machine_ids"])
        
        # Ekstrak jawaban
        answer = resp.get("answer", resp.get("answer_text", ""))
        
        # Ambil teks konteks asli dari API (setelah kita tambahkan di response)
        contexts = resp.get("context_texts", [])
        
        # Deduplikasi konteks untuk evaluasi (menghindari penalti RAGAS akibat overlap ekstrem)
        unique_contexts = []
        seen_texts = set()
        for ctx in contexts:
            # Gunakan substring kasar (100 karakter pertama) untuk deteksi duplikasi
            sig = ctx[:100].strip()
            if sig not in seen_texts:
                seen_texts.add(sig)
                unique_contexts.append(ctx)

        if not unique_contexts:
            unique_contexts = ["No external context retrieved or context free query."]

        samples.append(SingleTurnSample(
            user_input=case["question"],
            response=answer,
            retrieved_contexts=unique_contexts,
            reference=case["ground_truth"]
        ))
        
        logger.info(f"  ✅ Time: {int((time.time() - t0)*1000)}ms")
        
    return samples

# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

async def main(mode: str = "quick"):
    if not os.getenv("OPENAI_API_KEY"):
        raise SystemExit("❌ OPENAI_API_KEY tidak ditemukan di environment / .env")

    cases = QUICK_DATASET if mode == "quick" else FULL_DATASET
    logger.info("=== LAPIS AI — RAGAS EVALUATION (OPENAI) ===")
    logger.info(f"Cases: {len(cases)} | Mode: {mode.upper()}")

    # 1. Fetch system responses
    samples = run_evaluation_pipeline(cases)
    dataset = EvaluationDataset(samples=samples)

    # 2. Setup LLM & Embeddings (RAGAS Evaluator)
    evaluator_llm = LangchainLLMWrapper(ChatOpenAI(model="gpt-4o-mini", temperature=0, timeout=60))
    evaluator_embeddings = LangchainEmbeddingsWrapper(OpenAIEmbeddings())

    # 3. Setup Metrics
    metrics = [
        faithfulness,
        answer_relevancy,
        context_precision,
        context_recall,
        answer_correctness,
        answer_similarity,
    ]

    for m in metrics:
        if hasattr(m, "llm"):
            m.llm = evaluator_llm
        if hasattr(m, "embeddings"):
            m.embeddings = evaluator_embeddings

    ragas_run_config = RunConfig(
        max_workers=2,
        max_retries=2,
        timeout=120,
    )

    # 4. Run Evaluate
    logger.info(f"Menjalankan ragas.evaluate() dengan {len(metrics)} metrik...")
    try:
        result = evaluate(
            dataset,
            metrics=metrics,
            run_config=ragas_run_config
        )
    except Exception as e:
        logger.error(f"❌ Evaluasi gagal: {e}")
        return

    # 5. Output
    print("\n" + "=" * 60)
    print("  RAGAS EVALUATION RESULTS — Lapis AI")
    print("=" * 60)
    print(result)

    # Simpan ke file
    output_dir = Path("nlp/tests/results")
    output_dir.mkdir(parents=True, exist_ok=True)
    timestamp  = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    output_path = output_dir / f"ragas_results_{timestamp}.json"

    df = result.to_pandas()
    output = {
        "timestamp": timestamp,
        "cases_evaluated": len(cases),
        "scores_mean": df.mean(numeric_only=True).round(4).to_dict(),
        "scores_per_case": df.to_dict(orient="records"),
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2, default=str)

    print(f"\n✅ Hasil disimpan: {output_path}")

    # Print lowest scores
    print("\n💡 Area Perbaikan (Query dengan skor rendah):")
    for m in metrics:
        metric_name = m.name
        if metric_name in df.columns:
            lowest = df.loc[df[metric_name].idxmin()]
            print(f"  - Lowest {metric_name}: {lowest[metric_name]:.4f} -> Query: '{lowest['user_input']}'")

if __name__ == "__main__":
    mode = "quick"
    if len(sys.argv) > 1 and sys.argv[1].lower() == "full":
        mode = "full"
    
    asyncio.run(main(mode))
