"""Live context injector — Redis reader dengan mock fallback."""

import json
import logging
import os
import random
import yaml
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional


# ── Logging Setup ──────────────────────────────────────────────────────────────

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


# ── Dataclass ──────────────────────────────────────────────────────────────────


@dataclass
class LiveContextData:
    """Snapshot kondisi real-time satu mesin dari Redis atau mock."""

    machine_id    : str
    status        : str = "unknown"       # healthy | warning | critical | unknown
    temperature_c : Optional[float] = None
    vibration_mms : Optional[float] = None
    pressure_psi  : Optional[float] = None
    rpm           : Optional[float] = None
    ml_prediction : str = "unknown"       # normal | butuh_perawatan | kritis | unknown
    rul_days      : Optional[int] = None
    active_alerts : List[str] = field(default_factory=list)
    last_updated  : str = ""
    data_source   : str = "redis"         # redis | mock | unavailable

    # ── Methods ────────────────────────────────────────────────────────────────

    def to_dict(self) -> Dict:
        """Serialisasi ke plain dict."""
        return asdict(self)

    def to_prompt_text(self) -> str:
        """Format kondisi mesin menjadi blok teks siap injeksi ke LLM prompt."""
        def fmt(val: Optional[float], unit: str = "") -> str:
            return f"{val}{unit}" if val is not None else "N/A"

        alerts_str = ", ".join(self.active_alerts) if self.active_alerts else "Tidak ada"

        return (
            f"[KONDISI REAL-TIME MESIN {self.machine_id} — {self.last_updated}]\n"
            f"Status         : {self.status.upper()}\n"
            f"Suhu           : {fmt(self.temperature_c, '°C')}\n"
            f"Getaran        : {fmt(self.vibration_mms, ' mm/s')}\n"
            f"Tekanan        : {fmt(self.pressure_psi, ' PSI')}\n"
            f"RPM            : {fmt(self.rpm)}\n"
            f"Prediksi ML    : {self.ml_prediction}\n"
            f"Sisa Umur (RUL): {fmt(self.rul_days, ' hari') if self.rul_days is not None else 'N/A'}\n"
            f"Alert Aktif    : {alerts_str}\n"
            f"Sumber Data    : {self.data_source}"
        )

    def is_critical(self) -> bool:
        """Return True jika mesin dalam kondisi kritis atau ada alert aktif."""
        return (
            self.status == "critical"
            or self.ml_prediction == "kritis"
            or len(self.active_alerts) > 0
        )

    def should_inject(self) -> bool:
        """Return True jika data tersedia dan layak diinjeksikan ke prompt."""
        return self.data_source != "unavailable"


# ── Fetcher Class ──────────────────────────────────────────────────────────────


class LiveContextFetcher:
    """Fetch kondisi real-time mesin dari Redis dengan fallback ke mock deterministik."""

    # Profil sensor per kategori status
    _PROFILES: Dict[str, Dict] = {
        "healthy": {
            "temp"     : (65.0, 72.0),
            "vibration": (0.35, 0.55),
            "pressure" : (98.0, 105.0),
            "rpm"      : (2300, 2500),
            "ml"       : "normal",
            "rul"      : (45, 90),
            "alerts"   : [],
        },
        "warning": {
            "temp"     : (78.0, 85.0),
            "vibration": (0.65, 0.90),
            "pressure" : (108.0, 113.0),
            "rpm"      : (2200, 2350),
            "ml"       : "butuh_perawatan",
            "rul"      : (12, 25),
            "alerts"   : [
                "Suhu mendekati batas warning",
                "Getaran meningkat",
            ],
        },
        "critical": {
            "temp"     : (88.0, 96.0),
            "vibration": (0.95, 1.20),
            "pressure" : (113.0, 118.0),
            "rpm"      : (2100, 2250),
            "ml"       : "kritis",
            "rul"      : (1, 7),
            "alerts"   : [
                "KRITIS: Suhu melebihi batas",
                "KRITIS: Vibrasi abnormal",
                "Segera hentikan operasi",
            ],
        },
    }

    _STATUS_BY_MOD = {0: "warning", 1: "healthy", 2: "critical"}

    def __init__(self, config_path: str = "nlp/configs/config.yaml") -> None:
        """Inisialisasi fetcher — coba koneksi Redis, fallback ke mock jika gagal."""
        with open(config_path, "r", encoding="utf-8") as f:
            self.config: Dict = yaml.safe_load(f)

        self.config_path  = config_path
        self.logger       = logging.getLogger(self.__class__.__name__)
        self.redis_url    = os.environ.get("REDIS_URL")
        self.redis_client = None
        self.mock_mode    = True

        # Coba koneksi Redis — import di dalam try agar tidak wajib install
        if self.redis_url:
            try:
                import redis  # type: ignore[import]
                self.redis_client = redis.from_url(
                    self.redis_url,
                    decode_responses=True,
                    socket_connect_timeout=2,
                )
                self.redis_client.ping()
                self.mock_mode = False
                self.logger.info("Redis connected: %s", self.redis_url)
            except Exception as conn_err:
                self.mock_mode = True
                self.logger.info(
                    "Redis tidak tersedia (%s) — menggunakan mock mode", conn_err
                )
        else:
            self.logger.info(
                "REDIS_URL tidak di-set — menggunakan mock mode"
            )

    # ── Mock Generator ─────────────────────────────────────────────────────────

    def _generate_mock_data(self, machine_id: str) -> LiveContextData:
        """Generate data sensor realistis dan deterministik per machine_id."""
        # Seed deterministik agar mesin yang sama selalu hasilkan pola yang sama
        random.seed(hash(machine_id) % 1000)

        # Tentukan profil berdasarkan nomor mesin
        try:
            num = int(machine_id.replace("M-", "").replace("M", ""))
        except ValueError:
            num = 0

        status  = self._STATUS_BY_MOD[num % 3]
        profile = self._PROFILES[status]

        temp      = round(random.uniform(*profile["temp"]), 1)
        vibration = round(random.uniform(*profile["vibration"]), 2)
        pressure  = round(random.uniform(*profile["pressure"]), 1)
        rpm       = round(random.uniform(*profile["rpm"]))
        rul_days  = random.randint(*profile["rul"])

        return LiveContextData(
            machine_id    = machine_id,
            status        = status,
            temperature_c = temp,
            vibration_mms = vibration,
            pressure_psi  = pressure,
            rpm           = float(rpm),
            ml_prediction = profile["ml"],
            rul_days      = rul_days,
            active_alerts = list(profile["alerts"]),  # copy agar tidak mutasi _PROFILES
            last_updated  = datetime.now(timezone.utc).isoformat(),
            data_source   = "mock",
        )

    # ── Redis Fetch ────────────────────────────────────────────────────────────

    def _fetch_from_redis(self, machine_id: str) -> Optional[LiveContextData]:
        """Fetch data real-time dari Redis key machine:{machine_id}:status."""
        try:
            key  = f"machine:{machine_id}:status"
            data = self.redis_client.get(key)  # type: ignore[union-attr]
            if data is None:
                self.logger.debug("Redis key '%s' tidak ditemukan.", key)
                return None

            parsed = json.loads(data)
            return LiveContextData(
                machine_id    = machine_id,
                status        = parsed.get("status", "unknown"),
                temperature_c = parsed.get("temperature"),
                vibration_mms = parsed.get("vibration"),
                pressure_psi  = parsed.get("pressure"),
                rpm           = parsed.get("rpm"),
                ml_prediction = parsed.get("ml_prediction", "unknown"),
                rul_days      = parsed.get("rul_days"),
                active_alerts = parsed.get("active_alerts", []),
                last_updated  = parsed.get("timestamp", ""),
                data_source   = "redis",
            )
        except Exception as e:
            self.logger.warning("Redis fetch gagal untuk %s: %s", machine_id, e)
            return None

    # ── Public API ─────────────────────────────────────────────────────────────

    def fetch(self, machine_id: str) -> LiveContextData:
        """Fetch live context — urutan: Redis → Mock (tidak pernah raise exception)."""
        if not self.mock_mode:
            result = self._fetch_from_redis(machine_id)
            if result is not None:
                return result
            self.logger.warning(
                "Redis gagal untuk %s — fallback ke mock.", machine_id
            )

        return self._generate_mock_data(machine_id)

    def fetch_multiple(
        self, machine_ids: List[str]
    ) -> Dict[str, LiveContextData]:
        """Fetch live context untuk beberapa mesin sekaligus."""
        return {mid: self.fetch(mid) for mid in machine_ids}

    def format_for_prompt(self, machine_ids: List[str]) -> str:
        """Fetch dan format live context list machine_ids menjadi string siap prompt."""
        if not machine_ids:
            return ""
        contexts = self.fetch_multiple(machine_ids)
        return "\n".join(ctx.to_prompt_text() for ctx in contexts.values())

    def get_status_summary(self) -> Dict[str, Any]:
        """Return status koneksi fetcher untuk health check."""
        return {
            "mode"     : "mock" if self.mock_mode else "redis",
            "redis_url": self.redis_url or "not configured",
            "available": not self.mock_mode,
        }


# ── Entry Point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    fetcher = LiveContextFetcher()
    info    = fetcher.get_status_summary()

    print("=== LIVE CONTEXT FETCHER ===")
    print(f"Mode      : {info['mode']}")
    print(f"Available : {info['available']}")
    print()

    test_machines = ["M-01", "M-02", "M-03", "M-07", "M-13"]
    for mid in test_machines:
        ctx = fetcher.fetch(mid)
        print(f"--- {mid} ---")
        print(ctx.to_prompt_text())
        print(f"is_critical: {ctx.is_critical()}")
        print()
