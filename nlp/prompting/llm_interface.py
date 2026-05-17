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


# ── Logging Setup ──────────────────────────────────────────────────────────────

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


# ── Enum ───────────────────────────────────────────────────────────────────────


class LLMProvider(Enum):
    """Provider LLM yang didukung pipeline."""
    ANTHROPIC = "anthropic"
    GOOGLE    = "google"
    MOCK      = "mock"


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
    """Multi-provider LLM client dengan fallback chain: primary → fallback → mock."""

    def __init__(self, config_path: str = "nlp/configs/config.yaml") -> None:
        """Load config dan API keys dari environment."""
        with open(config_path, "r", encoding="utf-8") as f:
            config: Dict = yaml.safe_load(f)

        self.logger = logging.getLogger(self.__class__.__name__)

        llm_cfg = config["llm"]
        self.primary_provider  : str = llm_cfg["primary_provider"]
        self.primary_model     : str = llm_cfg["primary_model"]
        self.fallback_provider : str = llm_cfg["fallback_provider"]
        self.fallback_model    : str = llm_cfg["fallback_model"]
        self.max_tokens        : int = llm_cfg["max_tokens"]
        self.temperature       : float = llm_cfg["temperature"]

        self.anthropic_key  : str = os.environ.get("ANTHROPIC_API_KEY", "")
        self.google_key     : str = os.environ.get("GOOGLE_API_KEY", "")
        self.nvidia_key     : str = os.environ.get("NVIDIA_API_KEY", "")
        self.nvidia_base_url: str = llm_cfg.get(
            "nvidia_base_url", "https://integrate.api.nvidia.com/v1"
        )

    # ── Provider Calls ─────────────────────────────────────────────────────────

    def _call_anthropic(
        self, messages: List[Dict], system: str
    ) -> LLMResponse:
        """Panggil Anthropic Claude API."""
        try:
            import anthropic  # type: ignore[import]

            client = anthropic.Anthropic(api_key=self.anthropic_key)
            t0     = time.time()

            response = client.messages.create(
                model      = self.primary_model,
                max_tokens = self.max_tokens,
                system     = system,
                messages   = [m for m in messages if m["role"] != "system"],
            )

            latency = int((time.time() - t0) * 1000)
            answer  = response.content[0].text

            return LLMResponse(
                answer             = answer,
                action_suggestions = self._extract_actions(answer),
                provider_used      = "anthropic",
                model_used         = self.primary_model,
                latency_ms         = latency,
                tokens_used        = (
                    response.usage.input_tokens + response.usage.output_tokens
                ),
            )
        except Exception as e:
            self.logger.error("Anthropic call failed: %s", e)
            return LLMResponse(
                answer        = "",
                provider_used = "anthropic",
                success       = False,
                error_message = str(e),
            )

    def _call_google(
        self, messages: List[Dict], system: str
    ) -> LLMResponse:
        """Panggil Google Gemini API."""
        try:
            import google.generativeai as genai  # type: ignore[import]

            genai.configure(api_key=self.google_key)
            model = genai.GenerativeModel(
                model_name         = self.fallback_model,
                system_instruction = system,
            )
            t0 = time.time()

            user_content = "\n".join(
                m["content"] for m in messages if m["role"] == "user"
            )
            response = model.generate_content(user_content)
            latency  = int((time.time() - t0) * 1000)
            answer   = response.text

            return LLMResponse(
                answer             = answer,
                action_suggestions = self._extract_actions(answer),
                provider_used      = "google",
                model_used         = self.fallback_model,
                latency_ms         = latency,
            )
        except Exception as e:
            self.logger.error("Google call failed: %s", e)
            return LLMResponse(
                answer        = "",
                provider_used = "google",
                success       = False,
                error_message = str(e),
            )

    def _call_nvidia(
        self, messages: List[Dict], system: str
    ) -> LLMResponse:
        """Panggil NVIDIA NIM API menggunakan OpenAI-compatible client."""
        try:
            from openai import OpenAI  # type: ignore[import]
            from dotenv import load_dotenv
            load_dotenv()

            nvidia_key      = os.environ.get("NVIDIA_API_KEY", self.nvidia_key)
            nvidia_base_url = self.nvidia_base_url

            client = OpenAI(
                base_url=nvidia_base_url,
                api_key=nvidia_key,
            )

            # Gabungkan system prompt ke messages
            full_messages = [{"role": "system", "content": system}]
            full_messages += [m for m in messages if m["role"] != "system"]

            t0 = time.time()
            completion = client.chat.completions.create(
                model       = self.primary_model,
                messages    = full_messages,
                temperature = self.temperature,
                max_tokens  = self.max_tokens,
                stream      = False,
            )
            latency = int((time.time() - t0) * 1000)
            answer  = completion.choices[0].message.content

            return LLMResponse(
                answer             = answer,
                action_suggestions = self._extract_actions(answer),
                provider_used      = "nvidia",
                model_used         = self.primary_model,
                latency_ms         = latency,
                tokens_used        = (
                    completion.usage.total_tokens if completion.usage else 0
                ),
                success            = True,
            )
        except Exception as e:
            self.logger.error("NVIDIA call failed: %s", e)
            return LLMResponse(
                answer        = "",
                provider_used = "nvidia",
                success       = False,
                error_message = str(e),
            )

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
        """Generate respons LLM dengan fallback chain: primary → fallback → mock."""
        messages = prompt_package.to_messages()
        system   = prompt_package.system_prompt

        # Coba primary provider
        if self.primary_provider == "nvidia" and self.nvidia_key:
            result = self._call_nvidia(messages, system)
            if result.success:
                return result
            self.logger.warning("NVIDIA failed, using mock.")

        elif self.primary_provider == "anthropic" and self.anthropic_key:
            result = self._call_anthropic(messages, system)
            if result.success:
                return result
            self.logger.warning("Anthropic failed, trying fallback.")

        elif self.primary_provider == "google" and self.google_key:
            result = self._call_google(messages, system)
            if result.success:
                return result
            self.logger.warning("Google failed, using mock.")

        # Mock sebagai last resort
        self.logger.info("Using mock LLM.")
        return self._call_mock(messages, system)


# ── Entry Point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    from nlp.prompting.prompt_builder import PromptBuilder
    from nlp.prompting.live_context import LiveContextFetcher
    from nlp.retrieval.pipeline import RetrievalPipeline

    print("=== FASE 6 — PROMPT + LLM TEST ===\n")

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
    print(f"\n--- CITATIONS ({len(pkg.citations_used)}) ---")
    for c in pkg.citations_used[:3]:
        print(f"  {c}")
