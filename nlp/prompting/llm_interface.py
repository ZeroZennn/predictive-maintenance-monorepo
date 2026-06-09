"""Multi-provider LLM interface untuk Lapis AI RAG Pipeline."""

import json
import logging
import os
import time
import yaml
from dotenv import load_dotenv
load_dotenv()
from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

from nlp.prompting.prompt_builder import PromptPackage
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage


# ── Logging Setup ──────────────────────────────────────────────────────────────

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


# ── Enum ───────────────────────────────────────────────────────────────────────


class LLMProvider(Enum):
    """Provider LLM yang didukung pipeline."""
    OPENAI = "openai"
    MOCK   = "mock"


# ── Dataclass ──────────────────────────────────────────────────────────────────


@dataclass
class LLMResponse:
    """Respons dari LLM beserta metadata eksekusi."""

    answer            : str
    action_suggestions: List[str] = field(default_factory=list)
    provider_used     : str = ""
    model_used        : str = ""
    latency_ms        : int = 0
    tokens_used       : int = 0
    success           : bool = True
    error_message     : str = ""

    def to_dict(self) -> Dict:
        """Serialisasi ke plain dict."""
        return asdict(self)


# ── LLM Interface ──────────────────────────────────────────────────────────────


class LLMInterface:
    """Multi-provider LLM client dengan fallback chain: OpenAI → mock."""

    def __init__(
        self,
        config_path: str = "nlp/configs/config.yaml",
        model: str = "gpt-4o-mini"
    ) -> None:
        """Load config dan API keys dari environment."""
        with open(config_path, "r", encoding="utf-8") as f:
            config: Dict = yaml.safe_load(f)

        self.logger = logging.getLogger(self.__class__.__name__)

        llm_cfg = config["llm"]
        self.max_tokens        : int = llm_cfg["max_tokens"]
        self.temperature       : float = llm_cfg["temperature"]
        self.model_name        : str = model
        self.primary_provider  : str = "openai"

        # Inisialisasi ChatOpenAI
        self.llm = ChatOpenAI(
            model=model,
            api_key=os.getenv("OPENAI_API_KEY"),
            temperature=self.temperature,
            max_retries=2,
            timeout=30,
        )

    # ── Safe & Mock Fallback Methods ──────────────────────────────────────────

    def _mock_response(self, prompt: str) -> str:
        return f"[MOCK] OpenAI unavailable. Prompt received: {prompt[:50]}..."

    def generate_safe(self, prompt: str) -> str:
        try:
            return self.llm.invoke(prompt).content
        except Exception as e:
            print(f"[WARNING] OpenAI error: {e}. Using mock.")
            return self._mock_response(prompt)

    def _call_mock(
        self, messages: List[Dict], system: str
    ) -> LLMResponse:
        """Mock LLM response deterministik untuk development tanpa API key."""
        import random

        # Ambil user message terakhir
        user_msg = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                user_msg = m.get("content", "")
                break

        lower = user_msg.lower()

        if any(kw in lower for kw in ["emergency", "kritis", "KRITIS"]):
            answer = (
                "ANALISIS: Berdasarkan data yang tersedia, mesin mengalami kondisi darurat "
                "yang memerlukan perhatian segera. Data historis menunjukkan pola kejadian "
                "serupa yang telah terjadi sebelumnya.\n\n"
                "REKOMENDASI: [SEGERA] Hentikan operasi mesin dan lakukan inspeksi menyeluruh. "
                "Periksa sistem pendingin dan komponen bearing.\n\n"
                "REFERENSI: Berdasarkan data laporan pemeliharaan dan buku manual operasional."
            )
        elif any(kw in lower for kw in ["loto", "keselamatan", "prosedur"]):
            answer = (
                "ANALISIS: Prosedur keselamatan merupakan bagian kritis dari operasional mesin.\n\n"
                "REKOMENDASI: [SEGERA] Pastikan semua APD terpasang sebelum memulai pekerjaan. "
                "Terapkan prosedur LOTO sebelum membuka panel apapun.\n\n"
                "REFERENSI: Buku Manual Operasional Mesin M-01, Bagian Keselamatan Kerja."
            )
        else:
            answer = (
                "ANALISIS: Berdasarkan data yang ditemukan di sistem, kondisi mesin "
                "perlu dievaluasi lebih lanjut.\n\n"
                "REKOMENDASI: [PREVENTIF] Lakukan inspeksi rutin sesuai jadwal dan "
                "pantau parameter sensor secara berkala.\n\n"
                "REFERENSI: Data laporan pemeliharaan bulanan."
            )

        return LLMResponse(
            answer             = answer,
            action_suggestions = self._extract_actions(answer),
            provider_used      = "mock",
            model_used         = "mock-v1",
            latency_ms         = random.randint(200, 800),
            success            = True,
        )

    # ── Action Extractor ───────────────────────────────────────────────────────

    def _extract_actions(self, answer: str) -> List[str]:
        """Ekstrak baris rekomendasi dari jawaban LLM sebagai action list."""
        actions: List[str] = []
        for line in answer.split("\n"):
            line = line.strip()
            if any(tag in line for tag in ["[SEGERA]", "[7 HARI]", "[PREVENTIF]"]):
                clean = line.replace("REKOMENDASI:", "").strip()
                if clean:
                    actions.append(clean)
        return actions if actions else ["Pantau kondisi mesin secara berkala"]

    # ── Main Generate ──────────────────────────────────────────────────────────

    def generate(self, prompt_package: PromptPackage) -> LLMResponse:
        """Generate respons LLM menggunakan ChatOpenAI dengan fallback mock."""
        messages = prompt_package.to_messages()
        system   = prompt_package.system_prompt

        # Gabungkan system prompt ke messages
        full_messages = [{"role": "system", "content": system}]
        full_messages += [m for m in messages if m["role"] != "system"]

        # Konversi ke LangChain message objects
        lc_messages = []
        for m in full_messages:
            role = m["role"]
            content = m["content"]
            if role == "system":
                lc_messages.append(SystemMessage(content=content))
            elif role == "user":
                lc_messages.append(HumanMessage(content=content))
            elif role == "assistant":
                lc_messages.append(AIMessage(content=content))
            else:
                lc_messages.append(HumanMessage(content=content))

        t0 = time.time()
        try:
            # Periksa ketersediaan API key
            openai_key = os.getenv("OPENAI_API_KEY")
            if not openai_key or openai_key == "your_openai_api_key_here":
                raise ValueError("OPENAI_API_KEY tidak dikonfigurasi atau masih default.")

            response = self.llm.invoke(lc_messages)
            latency = int((time.time() - t0) * 1000)
            answer = response.content

            # Ekstrak token usage dari metadata jika tersedia
            tokens = 0
            if hasattr(response, "response_metadata") and response.response_metadata:
                token_usage = response.response_metadata.get("token_usage", {})
                tokens = token_usage.get("total_tokens", 0)

            return LLMResponse(
                answer             = answer,
                action_suggestions = self._extract_actions(answer),
                provider_used      = "openai",
                model_used         = self.model_name,
                latency_ms         = latency,
                tokens_used        = tokens,
                success            = True,
            )

        except Exception as e:
            self.logger.warning("OpenAI call failed: %s. Using mock fallback.", e)
            mock_resp = self._call_mock(messages, system)
            mock_resp.error_message = str(e)
            return mock_resp


# ── Entry Point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    from nlp.prompting.prompt_builder import PromptPackage, PromptBuilder
    from nlp.prompting.live_context import LiveContextFetcher
    from nlp.retrieval.pipeline import RetrievalPipeline

    print("=== TEST FASE 8 — OPENAI LLM INTERFACE ===\n")

    retrieval = RetrievalPipeline()
    fetcher   = LiveContextFetcher()
    builder   = PromptBuilder()
    llm       = LLMInterface()

    query   = "Apa yang harus dilakukan untuk M-02 yang dalam kondisi kritis?"
    machine = ["M-02"]

    results, route = retrieval.run(query, machine)
    live_ctx       = [fetcher.fetch(m) for m in machine]
    pkg            = builder.build(query, results, live_ctx, history=None)
    response       = llm.generate(pkg)

    print(f"Query    : {query}")
    print(f"Mode     : {route.mode.value}")
    print(f"Provider : {response.provider_used}")
    print(f"Model    : {response.model_used}")
    print(f"Latency  : {response.latency_ms}ms")
    print(f"\n--- JAWABAN ---")
    print(response.answer)
    print(f"\n--- ACTION SUGGESTIONS ---")
    for a in response.action_suggestions:
        print(f"  - {a}")
