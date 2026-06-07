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
import traceback  
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
from ragas.run_config import RunConfig 

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
from langchain_openai import ChatOpenAI 
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper
from langchain_core.embeddings import Embeddings
from langchain_core.language_models.chat_models import BaseChatModel 
from langchain_core.outputs import ChatResult 
from typing import Any, List, Optional 

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    format="%(asctime)s  %(levelname)s  %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("lapis_eval")


# ══════════════════════════════════════════════════════════════════════════════
# GOLDEN DATASET — Advisory POV (rewrite 2026-05-26)
# Sumber fakta: Buku_Manual_M01.clean.txt, Laporan M-01 Juli/Agustus 2025,
#               Laporan M-02 November 2025, maintenance_logs.csv
# ══════════════════════════════════════════════════════════════════════════════

# Setiap entri: query advisory teknisi, ground_truth actionable, machine_ids
GOLDEN_DATASET = [
    # ── Tindakan Darurat / Emergency Response (3 kasus) ───────────────────────
    {
        "case_id"     : "E001",
        "query"       : (
            "Apa yang harus dilakukan jika sistem pendingin M-01 "
            "mengalami kegagalan kritis?"
        ),
        "machine_ids" : ["M-01"],
        "ground_truth": (
            "Segera matikan mesin dan ganti komponen Motor. Berdasarkan "
            "riwayat kejadian serupa pada 02/08/2025 (Log ID: ML-0119), "
            "kegagalan sistem pendingin kritis menyebabkan downtime 21.6 jam "
            "dengan biaya Rp 49.643.133. Setelah perbaikan, lakukan lubrikasi "
            "komponen dan cek belt sebagai tindakan preventif."
        ),
    },
    {
        "case_id"     : "E002",
        "query"       : (
            "Langkah apa yang perlu diambil saat terjadi short circuit "
            "pada panel kontrol mesin M-02?"
        ),
        "machine_ids" : ["M-02"],
        "ground_truth": (
            "Tekan tombol Emergency Stop, terapkan prosedur LOTO, dan "
            "periksa panel kontrol secara menyeluruh. Pada kejadian "
            "07/11/2025 (Log ID: ML-0058), short circuit pada panel kontrol "
            "M-02 menyebabkan downtime 59.6 jam dengan biaya Rp 17.616.249. "
            "Pastikan aliran listrik diputus total sebelum membuka panel."
        ),
    },
    {
        "case_id"     : "E003",
        "query"       : (
            "Bagaimana cara menangani kebocoran besar pada hydraulic "
            "system M-01?"
        ),
        "machine_ids" : ["M-01"],
        "ground_truth": (
            "Hentikan mesin segera dan periksa seal jalur pengisian "
            "(Part Code: SEAL-M01). Pada 10/11/2025 (Log ID: ML-0230), "
            "kebocoran besar pada hydraulic system M-01 memerlukan "
            "penggantian Belt dengan downtime 21.7 jam dan biaya "
            "Rp 13.696.714. Periksa juga tekanan udara — jika drop "
            "di bawah 90 PSI, kemungkinan ada seal atau valve yang robek."
        ),
    },

    # ── Prosedur & Pencegahan / Preventive (3 kasus) ──────────────────────────
    {
        "case_id"     : "E004",
        "query"       : (
            "Bagaimana prosedur LOTO yang benar sebelum membuka "
            "panel motor mesin?"
        ),
        "machine_ids" : [],
        "ground_truth": (
            "Teknisi wajib menggunakan APD berupa sarung tangan tahan panas, "
            "pelindung telinga (earmuff), dan sepatu safety. Prosedur Lock "
            "Out Tag Out (LOTO) mengharuskan aliran listrik diputus total "
            "sebelum membuka panel motor atau menyentuh sabuk transmisi. "
            "Jika mesin mengeluarkan asap atau getaran hebat mendadak, "
            "tekan tombol Emergency Stop di panel samping kanan."
        ),
    },
    {
        "case_id"     : "E005",
        "query"       : (
            "Apa yang harus dilakukan saat inspeksi rutin 500 jam "
            "operasional mesin?"
        ),
        "machine_ids" : [],
        "ground_truth": (
            "Inspeksi rutin setiap 500 jam operasional mencakup: "
            "penggantian oli pelumas, pembersihan filter udara, dan "
            "pengecekan koneksi elektrikal. Selain itu periksa ketegangan "
            "sabuk (belt) dan kondisi pulley — jika ditemukan retakan halus "
            "pada belt, segera lakukan penggantian sebelum putus."
        ),
    }, 
    {
        "case_id"     : "E006",
        "query"       : (
            "Bagaimana cara mencegah belt putus pada mesin M-01 "
            "berdasarkan riwayat perawatan?"
        ),
        "machine_ids" : ["M-01"],
        "ground_truth": (
            "Lakukan pemeriksaan ketegangan sabuk (belt) dan kondisi pulley "
            "secara berkala. Jika ditemukan retakan halus, segera ganti "
            "sebelum putus. Pada 28/08/2025 (Log ID: ML-0201) terjadi belt "
            "putus pada M-01 yang memerlukan penggantian belt dan pulley "
            "dengan downtime 18.9 jam dan biaya Rp 7.085.779. Tindakan "
            "preventif: lubrikasi komponen dan cek belt secara rutin."
        ),
    },

    # ── Diagnosis Komponen / Troubleshooting (2 kasus) ────────────────────────
    {
        "case_id"     : "E007",
        "query"       : (
            "Kenapa bearing pada M-01 bisa aus dan apa yang perlu "
            "diperiksa untuk mengatasinya?"
        ),
        "machine_ids" : ["M-01"],
        "ground_truth": (
            "Bearing aus terdeteksi jika getaran melebihi 1.0 mm/s "
            "(batas kritis). Jika getaran melebihi 1.2 mm/s, kencangkan "
            "baut housing atau ganti komponen Bearing (Part Code: BRG-M01). "
            "Pada 31/07/2025 (Log ID: ML-0105), M-01 mengalami bearing aus "
            "yang memerlukan penggantian Seal dengan downtime 20.3 jam "
            "dan biaya Rp 4.531.286."
        ),
    },
    {
        "case_id"     : "E008",
        "query"       : (
            "Apa yang harus diperiksa jika motor M-02 mengalami "
            "overheat berulang?"
        ),
        "machine_ids" : ["M-02"],
        "ground_truth": (
            "Periksa suhu operasional — batas warning adalah 80°C dan "
            "batas kritis adalah lebih dari 95°C. Tambahkan pelumas pada "
            "poros utama atau cek kipas pendingin motor. Pada 30/11/2025 "
            "(Log ID: ML-0006), motor M-02 mengalami overheat dan "
            "memerlukan penggantian komponen pendingin berupa Filter "
            "dengan downtime 14.2 jam dan biaya Rp 5.763.765."
        ),
    },

    # ── Threshold & Batas Operasional (2 kasus) ───────────────────────────────
    {
        "case_id"     : "E009",
        "query"       : (
            "Pada kondisi suhu berapa mesin M-01 harus segera "
            "dihentikan untuk mencegah kerusakan?"
        ),
        "machine_ids" : ["M-01"],
        "ground_truth": (
            "Suhu operasional normal M-01 adalah 65°C-75°C. Batas "
            "peringatan (warning) dimulai dari 80°C — pada titik ini "
            "tambahkan pelumas pada poros utama atau cek kipas pendingin. "
            "Batas kritis (critical/shut-off) adalah lebih dari 95°C yang "
            "menyebabkan risiko overheat pada motor — mesin harus segera "
            "dihentikan."
        ),
    },
    {
        "case_id"     : "E010",
        "query"       : (
            "Apakah mesin perlu dihentikan jika tekanan udara "
            "turun di bawah 90 PSI?"
        ),
        "machine_ids" : [],
        "ground_truth": (
            "Ya, tekanan udara normal adalah 98-105 PSI. Jika tekanan "
            "drop di bawah 90 PSI, kemungkinan ada kebocoran pada katup "
            "(valve) atau seal yang robek. Lakukan pengecekan pada seal "
            "jalur pengisian (Part Code: SEAL-M01). Batas kritis tekanan "
            "adalah lebih dari 115 PSI yang berisiko kebocoran pada seal "
            "atau katup."
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

            # 2. Live context DISABLED untuk evaluasi RAGAS — agar faithfulness  
            #    diukur secara akurat hanya terhadap retrieved_contexts,          
            #    tanpa kontaminasi dari mock sensor data.                         
            live_data = None  

            # 3. Build prompt + generate
            pkg      = builder.build(
                query             = case["query"],
                results           = results,
                live_context_data = live_data, 
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
            print(f"\n{'='*60}")                                      
            print(f"TRACEBACK for {case['case_id']}:")                 
            print(traceback.format_exc())                              
            print(f"{'='*60}\n")                                      
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


class LLMSingleGenWrapper(BaseChatModel): 
    """ 
    Provider-agnostic wrapper yang memotong parameter 'n' dari setiap 
    LLM API call. Wajib karena RAGAS secara internal request n=3 
    untuk multi-generation scoring, sedangkan sebagian besar provider 
    free tier hanya support n=1 dan akan throw BadRequestError jika n>1. 
    """ 
    inner: Any 
    model_config = {"arbitrary_types_allowed": True} 

    @property 
    def _llm_type(self) -> str: 
        return "llm_single_gen_wrapper" 

    def _generate( 
        self, 
        messages: List, 
        stop: Optional[List[str]] = None, 
        run_manager=None, 
        **kwargs, 
    ) -> ChatResult: 
        kwargs.pop("n", None)  # Strip n — provider only supports n=1 
        return self.inner._generate( 
            messages, stop=stop, run_manager=run_manager, **kwargs 
        ) 

    async def _agenerate( 
        self, 
        messages: List, 
        stop: Optional[List[str]] = None, 
        run_manager=None, 
        **kwargs, 
    ) -> ChatResult: 
        kwargs.pop("n", None)  # Strip n — async path 
        return await self.inner._agenerate( 
            messages, stop=stop, run_manager=run_manager, **kwargs 
        ) 


# ══════════════════════════════════════════════════════════════════════════════
# TIMEOUT GUARD FOR RAGAS EVALUATE
# ══════════════════════════════════════════════════════════════════════════════

async def run_evaluation_with_timeout(dataset, metrics, run_config=None, timeout_seconds=None):
    """Run ragas.evaluate() in a thread — no timeout (evaluation-only)."""
    result = await asyncio.to_thread(
        evaluate, dataset, metrics=metrics, run_config=run_config,
    )
    return result


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

    if quick: 
        dataset = dataset[0:min(3, len(dataset))] 

    openai_llm = ChatOpenAI( 
        model="gpt-4o-mini", 
        api_key=os.getenv("OPENAI_API_KEY"), 
        temperature=0, 
        max_tokens=2048, 
        max_retries=2, 
        timeout=30, 
    ) 
    ragas_llm = LangchainLLMWrapper(openai_llm) 
    ragas_embeddings = LangchainEmbeddingsWrapper(_E5Embeddings())

    ragas_run_config = RunConfig( 
        max_workers=1, 
        max_retries=2, 
        timeout=120, 
    ) 

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

    # ── Step 4: Evaluate ───────────────────────────────────────────────────────
    logger.info("Menjalankan ragas.evaluate() dengan %d metrik...", len(metrics))
    result = asyncio.run(run_evaluation_with_timeout(dataset, metrics, run_config=ragas_run_config))

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
