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
from langchain_openai import ChatOpenAI # CHANGED
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper
from langchain_core.embeddings import Embeddings
from langchain_core.language_models.chat_models import BaseChatModel # CHANGED
from langchain_core.outputs import ChatResult # CHANGED
from typing import Any, List, Optional # CHANGED

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    format="%(asctime)s  %(levelname)s  %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("lapis_eval")


# ══════════════════════════════════════════════════════════════════════════════
# GOLDEN DATASET — Verified against nlp/data/processed/ (audit 2026-05-24)
# ══════════════════════════════════════════════════════════════════════════════

# Setiap entri: (query, machine_ids untuk filter, ground_truth)
# ground_truth HANYA berisi fakta yang ada verbatim di file processed.
GOLDEN_DATASET = [
    # ── Emergency / Incident Spesifik (4 kasus) ───────────────────────────────
    {
        "case_id"     : "E001",
        "query"       : "Apa yang terjadi pada M-01 saat emergency di Agustus 2025?",
        "machine_ids" : ["M-01"],
        "ground_truth": (
            "Pada 02/08/2025 (Log ID: ML-0119) terjadi tindakan Emergency pada M-01 "
            "berupa kegagalan sistem pendingin kritis. Part yang diganti adalah Motor "
            "dengan downtime 21.6 jam dan biaya Rp 49.643.133. Selain itu pada "
            "26/08/2025 (Log ID: ML-0447) terjadi short circuit pada panel kontrol "
            "dengan downtime 33.5 jam dan biaya Rp 31.560.747. Total downtime M-01 "
            "bulan Agustus 2025 mencapai 100.7 jam."
        ),
    },
    {
        "case_id"     : "E005",
        "query"       : "Short circuit pada panel kontrol mesin M-02 November 2025",
        "machine_ids" : ["M-02"],
        "ground_truth": (
            "Pada 07/11/2025 (Log ID: ML-0058) dilakukan tindakan Emergency pada M-02 "
            "karena short circuit pada panel kontrol. Part yang diganti tercatat sebagai "
            "Tidak ada. Aktivitas ini menyebabkan downtime selama 59.6 jam dengan biaya "
            "Rp 17.616.249."
        ),
    },
    {
        "case_id"     : "E007",
        "query"       : "Kebocoran hydraulic system pada M-01 November 2025",
        "machine_ids" : ["M-01"],
        "ground_truth": (
            "Pada 10/11/2025 (Log ID: ML-0230) dilakukan tindakan Emergency pada M-01 "
            "karena kebocoran besar pada hydraulic system. Part yang diganti tercatat "
            "sebagai Belt dengan downtime 21.7 jam dan biaya Rp 13.696.714."
        ),
    },
    {
        "case_id"     : "E010",
        "query"       : "Motor overheat dan penggantian komponen pendingin M-02 Juli 2025",
        "machine_ids" : ["M-02"],
        "ground_truth": (
            "Pada 25/07/2025 (Log ID: ML-0266) dilakukan tindakan Corrective pada M-02 "
            "karena motor overheat, ganti komponen pendingin. Part yang diganti tercatat "
            "sebagai Belt dengan downtime 12.8 jam dan biaya Rp 7.067.223."
        ),
    },

    # ── Spesifikasi Teknis dari Manual (3 kasus) ──────────────────────────────
    {
        "case_id"     : "E002",
        "query"       : "Berapa batas kritis suhu operasional mesin M-01?",
        "machine_ids" : ["M-01"],
        "ground_truth": (
            "Berdasarkan Buku Manual Operasional Mesin M-01, suhu operasional normal "
            "adalah 65°C-75°C. Batas Peringatan (Warning) dimulai dari 80°C. Batas "
            "Kritis (Critical/Shut-off) adalah lebih dari 95°C yang menyebabkan risiko "
            "overheat pada motor."
        ),
    },
    {
        "case_id"     : "E006",
        "query"       : "Getaran kritis dan cara menangani bearing aus pada mesin M-01",
        "machine_ids" : ["M-01"],
        "ground_truth": (
            "Getaran normal M-01 adalah 0.35-0.55 mm/s. Batas kritis getaran adalah "
            "lebih dari 1.0 mm/s yang mengindikasikan kerusakan bearing atau poros tidak "
            "presisi. Jika getaran melebihi 1.2 mm/s, tindakan perbaikan adalah "
            "kencangkan baut housing atau ganti komponen Bearing dengan Part Code BRG-M01."
        ),
    },
    {
        "case_id"     : "E009",
        "query"       : "Prosedur pemeliharaan rutin setiap 500 jam operasional",
        "machine_ids" : [],
        "ground_truth": (
            "Inspeksi rutin dilakukan setiap 500 jam operasional. Tindakan yang dilakukan "
            "mencakup penggantian oli pelumas, pembersihan filter udara, dan pengecekan "
            "koneksi elektrikal. Selain itu dilakukan pemeriksaan ketegangan sabuk (belt) "
            "dan kondisi pulley, serta penggantian belt jika ditemukan retakan halus."
        ),
    },

    # ── Prosedur / SOP (2 kasus) ──────────────────────────────────────────────
    {
        "case_id"     : "E003",
        "query"       : "Prosedur keselamatan dan LOTO sebelum membuka panel motor",
        "machine_ids" : [],
        "ground_truth": (
            "Teknisi wajib menggunakan APD berupa sarung tangan tahan panas, pelindung "
            "telinga (earmuff), dan sepatu safety. Prosedur Lock Out Tag Out (LOTO) "
            "mengharuskan aliran listrik diputus total sebelum membuka panel motor atau "
            "menyentuh sabuk transmisi."
        ),
    },
    {
        "case_id"     : "E008",
        "query"       : "Bearing aus dan penggantian komponen pada M-01 Juli 2025",
        "machine_ids" : ["M-01"],
        "ground_truth": (
            "Pada 31/07/2025 (Log ID: ML-0105) dilakukan tindakan Corrective pada M-01 "
            "karena bearing aus, perlu penggantian. Part yang diganti tercatat sebagai "
            "Seal dengan downtime 20.3 jam dan biaya Rp 4.531.286. Total downtime M-01 "
            "bulan Juli 2025 mencapai 58.0 jam dari 7 aktivitas pemeliharaan "
            "(2 Corrective, 5 Preventive)."
        ),
    },

    # ── Ringkasan / Agregasi (1 kasus) ────────────────────────────────────────
    {
        "case_id"     : "E004",
        "query"       : "Ringkasan kejadian emergency pada mesin M-02 sepanjang 2025",
        "machine_ids" : ["M-02"],
        "ground_truth": (
            "M-02 mengalami 3 kejadian Emergency: (1) 28/08/2025 (ML-0216) mesin berhenti "
            "total karena kerusakan motor utama, downtime 32.1 jam, biaya Rp 16.044.880; "
            "(2) 17/09/2025 (ML-0055) short circuit pada panel kontrol, downtime 18.9 jam, "
            "biaya Rp 21.218.618; (3) 07/11/2025 (ML-0058) short circuit pada panel kontrol, "
            "downtime 59.6 jam, biaya Rp 17.616.249. Total downtime emergency M-02 adalah "
            "110.6 jam."
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

            # 2. Live context DISABLED untuk evaluasi RAGAS — agar faithfulness  # CHANGED
            #    diukur secara akurat hanya terhadap retrieved_contexts,          # CHANGED
            #    tanpa kontaminasi dari mock sensor data.                         # CHANGED
            live_data = None  # CHANGED

            # 3. Build prompt + generate
            pkg      = builder.build(
                query             = case["query"],
                results           = results,
                live_context_data = live_data,  # CHANGED: always None for eval
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


class LLMSingleGenWrapper(BaseChatModel): # CHANGED
    """ # CHANGED
    Provider-agnostic wrapper yang memotong parameter 'n' dari setiap # CHANGED
    LLM API call. Wajib karena RAGAS secara internal request n=3 # CHANGED
    untuk multi-generation scoring, sedangkan sebagian besar provider # CHANGED
    free tier hanya support n=1 dan akan throw BadRequestError jika n>1. # CHANGED
    """ # CHANGED
    inner: Any # CHANGED
    model_config = {"arbitrary_types_allowed": True} # CHANGED
# CHANGED
    @property # CHANGED
    def _llm_type(self) -> str: # CHANGED
        return "llm_single_gen_wrapper" # CHANGED
# CHANGED
    def _generate( # CHANGED
        self, # CHANGED
        messages: List, # CHANGED
        stop: Optional[List[str]] = None, # CHANGED
        run_manager=None, # CHANGED
        **kwargs, # CHANGED
    ) -> ChatResult: # CHANGED
        kwargs.pop("n", None)  # Strip n — provider only supports n=1 # CHANGED
        return self.inner._generate( # CHANGED
            messages, stop=stop, run_manager=run_manager, **kwargs # CHANGED
        ) # CHANGED
# CHANGED
    async def _agenerate( # CHANGED
        self, # CHANGED
        messages: List, # CHANGED
        stop: Optional[List[str]] = None, # CHANGED
        run_manager=None, # CHANGED
        **kwargs, # CHANGED
    ) -> ChatResult: # CHANGED
        kwargs.pop("n", None)  # Strip n — async path # CHANGED
        return await self.inner._agenerate( # CHANGED
            messages, stop=stop, run_manager=run_manager, **kwargs # CHANGED
        ) # CHANGED


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

    openai_llm = ChatOpenAI( # CHANGED
        model="gpt-4o-mini", # CHANGED
        api_key=os.getenv("OPENAI_API_KEY"), # CHANGED
        temperature=0, # CHANGED
        max_tokens=2048, # CHANGED
        max_retries=2, # CHANGED
        timeout=30, # CHANGED
    ) # CHANGED
    ragas_llm = LangchainLLMWrapper(openai_llm) # CHANGED
    ragas_embeddings = LangchainEmbeddingsWrapper(_E5Embeddings())

    ragas_run_config = RunConfig( # CHANGED
        max_workers=1, # CHANGED
        max_retries=2, # CHANGED
        timeout=120, # CHANGED
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
    result = asyncio.run(run_evaluation_with_timeout(dataset, metrics, run_config=ragas_run_config, timeout_seconds=600)) # CHANGED

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
