"""
Evaluation Lapis AI RAG Pipeline menggunakan RAGAS framework.

Cara pakai:
    # Full (10 kasus)
    python -m nlp.tests.evaluation

    # Quick test (3 kasus pertama)
    python -m nlp.tests.evaluation quick

Requirement:
    pip install ragas langchain-groq
    GROQ_API_KEY di .env — dipakai untuk LLM judge RAGAS via Groq.
"""

import json
import logging
import os
import time
import warnings
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import List

# Suppress DeprecationWarning dan FutureWarning untuk output yang bersih
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

from dotenv import load_dotenv
load_dotenv()

# ── Lapis AI Pipeline ──────────────────────────────────────────────────────────
from nlp.retrieval.pipeline import RetrievalPipeline
from nlp.prompting.live_context import LiveContextFetcher
from nlp.prompting.prompt_builder import PromptBuilder
from nlp.prompting.llm_interface import LLMInterface

# ── RAGAS ──────────────────────────────────────────────────────────────────────
from ragas import evaluate
from ragas.dataset_schema import SingleTurnSample, EvaluationDataset
from ragas.run_config import RunConfig # CHANGED

# Monkeypatch ragas.metrics.collections untuk mengekspos singleton lowercase ke collections namespace
# karena versi 0.4.3 hanya mengekspos class camelCase di collections, sedangkan singleton lama di-deprecate
import ragas.metrics
import ragas.metrics.collections as _col
_col.faithfulness = ragas.metrics.faithfulness
_col.answer_relevancy = ragas.metrics.answer_relevancy
_col.context_precision = ragas.metrics.context_precision
_col.context_recall = ragas.metrics.context_recall
_col.context_entity_recall = ragas.metrics.context_entity_recall
_col.answer_correctness = ragas.metrics.answer_correctness
_col.answer_similarity = ragas.metrics.answer_similarity

from ragas.metrics.collections import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall,
    context_entity_recall,
    answer_correctness,
    answer_similarity,
)
from langchain_groq import ChatGroq
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper
from langchain_core.embeddings import Embeddings

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    format="%(asctime)s  %(levelname)s  %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("lapis_eval")


# ══════════════════════════════════════════════════════════════════════════════
# GOLDEN DATASET
# ══════════════════════════════════════════════════════════════════════════════

# Setiap entri: (query, machine_ids untuk filter, ground_truth)
GOLDEN_DATASET = [
    {
        "case_id"     : "E001",
        "query"       : "Apa yang terjadi pada M-01 saat emergency di Agustus 2025?",
        "machine_ids" : ["M-01"],
        "ground_truth": (
            "M-01 mengalami kegagalan sistem pendingin kritis pada 02/08/2025 "
            "yang menyebabkan motor berhenti beroperasi selama lebih dari 48 jam."
        ),
    },
    {
        "case_id"     : "E002",
        "query"       : "Berapa batas kritis suhu operasional mesin M-01?",
        "machine_ids" : ["M-01"],
        "ground_truth": (
            "Batas kritis suhu adalah lebih dari 95°C yang menyebabkan risiko overheat motor. "
            "Batas warning dimulai dari 85°C."
        ),
    },
    {
        "case_id"     : "E003",
        "query"       : "Prosedur keselamatan dan LOTO sebelum membuka panel motor",
        "machine_ids" : [],
        "ground_truth": (
            "Teknisi wajib menggunakan APD lengkap dan menerapkan prosedur LOTO "
            "(Lockout/Tagout) sebelum membuka panel manapun untuk mencegah kecelakaan kerja."
        ),
    },
    {
        "case_id"     : "E004",
        "query"       : "Ringkasan total downtime dan emergency pada mesin M-02",
        "machine_ids" : ["M-02"],
        "ground_truth": (
            "M-02 memiliki 3 kejadian emergency dengan total downtime lebih dari 300 jam "
            "sepanjang tahun 2025, penyebab utamanya adalah overheating dan kegagalan elektrikal."
        ),
    },
    {
        "case_id"     : "E005",
        "query"       : "Short circuit pada panel kontrol mesin M-02 November 2025",
        "machine_ids" : ["M-02"],
        "ground_truth": (
            "Short circuit terjadi pada panel kontrol M-02 pada 07/11/2025 "
            "dengan total downtime 59.6 jam akibat kabel korsleting karena kelembaban tinggi."
        ),
    },
    {
        "case_id"     : "E006",
        "query"       : "Getaran kritis dan cara menangani bearing aus pada mesin",
        "machine_ids" : [],
        "ground_truth": (
            "Getaran lebih dari 1.0 mm/s mengindikasikan bearing aus dan perlu segera diganti "
            "dengan komponen BRG-M01. Inspeksi bearing dilakukan setiap 250 jam operasional."
        ),
    },
    {
        "case_id"     : "E007",
        "query"       : "Kebocoran hydraulic system pada M-01 November 2025",
        "machine_ids" : ["M-01"],
        "ground_truth": (
            "Kebocoran besar pada hydraulic system M-01 terjadi pada 10/11/2025 "
            "yang menyebabkan mesin dihentikan untuk perbaikan darurat selama 36 jam."
        ),
    },
    {
        "case_id"     : "E008",
        "query"       : "Inspeksi rutin dan penggantian oli mesin M-03",
        "machine_ids" : ["M-03"],
        "ground_truth": (
            "Inspeksi rutin M-03 dilakukan setiap 500 jam operasional meliputi penggantian oli "
            "pelumas, filter udara, dan pengecekan sistem pendingin."
        ),
    },
    {
        "case_id"     : "E009",
        "query"       : "Prosedur pemeliharaan rutin setiap 500 jam operasional",
        "machine_ids" : [],
        "ground_truth": (
            "Pemeliharaan rutin 500 jam mencakup: penggantian oli pelumas, pembersihan filter "
            "udara, inspeksi sistem elektrikal, dan pengecekan tegangan belt serta kondisi bearing."
        ),
    },
    {
        "case_id"     : "E010",
        "query"       : "Motor overheat dan penggantian komponen pendingin M-02",
        "machine_ids" : ["M-02"],
        "ground_truth": (
            "Motor M-02 mengalami overheat pada Juli 2025 yang memerlukan penggantian komponen "
            "pendingin berupa kipas, heat sink, dan thermal paste. Perbaikan memakan waktu 24 jam."
        ),
    },
]


# ══════════════════════════════════════════════════════════════════════════════
# LOCAL E5 EMBEDDINGS — LangChain Embeddings adapter
# ══════════════════════════════════════════════════════════════════════════════

class _E5Embeddings(Embeddings):
    """
    LangChain Embeddings adapter untuk model E5 lokal.
    Dipakai sebagai embedding provider RAGAS tanpa API key eksternal.
    """

    def __init__(self, config_path: str = "nlp/configs/config.yaml") -> None:
        from nlp.embeddings.embedder import EmbeddingModel
        self._m = EmbeddingModel.get_instance(config_path)
        self._m.load_model()

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._m.embed_single(t).tolist() for t in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._m.embed_single(text).tolist()




# ══════════════════════════════════════════════════════════════════════════════
# PIPELINE RUNNER — kumpulkan answer + contexts untuk setiap kasus
# ══════════════════════════════════════════════════════════════════════════════

def run_pipeline(
    cases: List[dict],
    config_path: str = "nlp/configs/config.yaml",
) -> List[SingleTurnSample]:
    """
    Jalankan Lapis AI RAG pipeline untuk setiap kasus di GOLDEN_DATASET.
    Return list of SingleTurnSample siap untuk ragas.evaluate().
    """
    pipeline = RetrievalPipeline(config_path)
    fetcher  = LiveContextFetcher(config_path)
    builder  = PromptBuilder(config_path)
    llm      = LLMInterface(config_path)

    samples: List[SingleTurnSample] = []

    for i, case in enumerate(cases, 1):
        logger.info("[%d/%d] %s: %s", i, len(cases), case["case_id"], case["query"][:60])
        t0 = time.time()

        try:
            # 1. Retrieval
            results, _ = pipeline.run(
                query            = case["query"],
                machine_ids_hint = case["machine_ids"] or None,
                use_reranker     = True,
                use_hybrid       = True,
            )
            contexts = [r.text_content for r in results if r.text_content]

            # 2. Live context (opsional, hanya jika ada machine_ids)
            live_data = (
                [fetcher.fetch(mid) for mid in case["machine_ids"]]
                if case["machine_ids"] else []
            )

            # 3. Build prompt + generate
            pkg      = builder.build(
                query             = case["query"],
                results           = results,
                live_context_data = live_data or None,
            )
            llm_resp = llm.generate(pkg)
            answer   = llm_resp.answer

            elapsed = int((time.time() - t0) * 1000)
            logger.info(
                "  ✅ %d chunks | %dms | provider=%s",
                len(contexts), elapsed, llm_resp.provider_used,
            )

        except Exception as e:
            logger.error("  ❌ Error [%s]: %s", case["case_id"], e, exc_info=True)
            # Sertakan sample kosong agar jumlah dataset tetap konsisten
            answer   = ""
            contexts = [""]

        samples.append(
            SingleTurnSample(
                user_input         = case["query"],
                response           = answer,
                retrieved_contexts = contexts if contexts else [""],
                reference          = case["ground_truth"],
            )
        )

    return samples


# ══════════════════════════════════════════════════════════════════════════════
# TIMEOUT GUARD FOR RAGAS EVALUATE
# ══════════════════════════════════════════════════════════════════════════════

async def run_evaluation_with_timeout(dataset, metrics, run_config=None, timeout_seconds=120): # CHANGED
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(evaluate, dataset, metrics=metrics, run_config=run_config), # CHANGED
            timeout=timeout_seconds
        )
        return result
    except asyncio.TimeoutError:
        print("[ERROR] Evaluasi RAGAS timeout setelah", timeout_seconds, "detik")
        return None


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

def main(quick: bool = False) -> None:
    groq_key = os.environ.get("GROQ_API_KEY", "")
    if not groq_key or groq_key == "your_groq_api_key_here":
        raise SystemExit("❌  GROQ_API_KEY tidak ditemukan atau masih default di environment / .env")

    # ── Pilih kasus ────────────────────────────────────────────────────────────
    cases = GOLDEN_DATASET[:3] if quick else GOLDEN_DATASET
    logger.info("=== LAPIS AI — RAGAS EVALUATION (GROQ) ===")
    logger.info("Cases: %d | Mode: %s", len(cases), "QUICK" if quick else "FULL")

    # ── Step 1: Jalankan pipeline, kumpulkan dataset ───────────────────────────
    samples = run_pipeline(cases)
    dataset = EvaluationDataset(samples=samples)

    if quick: # CHANGED
        dataset = dataset[0:min(3, len(dataset))] # CHANGED

    # ── Step 2: Konfigurasi RAGAS — ChatGroq LLM ───────────────────────────────
    groq_llm = ChatGroq(
        model="llama-3.1-8b-instant",
        api_key=groq_key,
        temperature=0,
        max_tokens=1024, # CHANGED
        max_retries=2,
        timeout=30,  # prevent hanging
    )
    ragas_llm = LangchainLLMWrapper(groq_llm)
    ragas_embeddings = LangchainEmbeddingsWrapper(_E5Embeddings())

    ragas_run_config = RunConfig( # CHANGED
        max_workers=1, # CHANGED
        max_retries=2, # CHANGED
        timeout=45, # CHANGED
    ) # CHANGED

    # ── Step 3: Set LLM & Embeddings ke semua metrik secara eksplisit ──────────
    faithfulness.llm = ragas_llm
    answer_relevancy.llm = ragas_llm
    context_precision.llm = ragas_llm
    context_recall.llm = ragas_llm
    context_entity_recall.llm = ragas_llm
    answer_correctness.llm = ragas_llm
    answer_similarity.llm = ragas_llm

    # Inject embeddings ke metrik yang membutuhkannya
    answer_relevancy.embeddings = ragas_embeddings
    answer_correctness.embeddings = ragas_embeddings
    answer_similarity.embeddings = ragas_embeddings

    metrics = [
        faithfulness,
        answer_relevancy,
        context_precision,
        context_recall,
        context_entity_recall,
        answer_correctness,
        answer_similarity,
    ]

    # ── Step 4: Evaluate dengan Timeout Guard ──────────────────────────────────
    logger.info("Menjalankan ragas.evaluate() dengan %d metrik (Timeout Guard: 120s)...", len(metrics))
    result = asyncio.run(run_evaluation_with_timeout(dataset, metrics, run_config=ragas_run_config, timeout_seconds=120)) # CHANGED

    if result is None:
        logger.error("❌ Evaluasi gagal atau terhenti karena timeout.")
        return

    # ── Step 5: Tampilkan & simpan hasil ──────────────────────────────────────
    print("\n" + "=" * 60)
    print("  RAGAS EVALUATION RESULTS — Lapis AI")
    print("=" * 60)
    print(result)          # ragas sudah print tabel skor per metrik

    # Simpan ke JSON
    output_dir = Path("nlp/tests/eval_results")
    output_dir.mkdir(parents=True, exist_ok=True)
    timestamp  = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    output_path = output_dir / f"ragas_{timestamp}.json"

    df = result.to_pandas()
    output = {
        "timestamp"     : timestamp,
        "cases_evaluated": len(cases),
        "scores_mean"   : df.mean(numeric_only=True).round(4).to_dict(),
        "scores_per_case": df.to_dict(orient="records"),
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2, default=str)

    print(f"\n✅ Hasil disimpan: {output_path}")


if __name__ == "__main__":
    import sys
    main(quick="quick" in sys.argv)
