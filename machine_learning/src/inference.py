"""
inference.py
Entry point tunggal untuk semua prediksi ML Lapis AI.
Dipanggil oleh Backend melalui: from src.inference import predict
"""
import os, time, logging

# NOTE: TF_USE_LEGACY_KERAS tidak dibutuhkan untuk TF 2.15.0
# TF 2.15.0 menggunakan Keras 2 secara native (Keras 3 baru masuk di TF 2.16+)
# Guard ini hanya relevan jika upgrade ke TF >= 2.16 di masa depan

# pyrefly: ignore [missing-import]
import numpy as np
import pandas as pd
# pyrefly: ignore [missing-import]
import joblib
import tensorflow as tf
from pathlib import Path
from datetime import datetime
from typing import Optional

# ── WAJIB: import agar pickle bisa menemukan class saat deserialization ──
# Meski tidak digunakan langsung, baris ini memastikan joblib.load() tidak
# gagal dengan AttributeError saat me-load preprocessing_pipeline.pkl
from src.preprocessing_pipeline import FeatureEngineeringTransformer  # noqa: F401

log = logging.getLogger(__name__)

# ── Singleton Model Loader ──────────────────────────────────────
# Model di-load SEKALI saat modul di-import, bukan per-request
_ROOT       = Path(__file__).resolve().parents[1]
_FINAL_DIR  = _ROOT / "models" / "final"
_pipeline   = None
_classifier = None
_rul_model  = None


def _load_models():
    """Load semua model ke memory. Dipanggil sekali saat startup."""
    global _pipeline, _classifier, _rul_model
    log.info("Loading ML models...")
    _pipeline   = joblib.load(_FINAL_DIR / "preprocessing_pipeline.pkl")
    _classifier = joblib.load(_FINAL_DIR / "classifier_final.pkl")
    _rul_model  = tf.keras.models.load_model(
                      str(_FINAL_DIR / "rul_predictor_final.h5"))
    # Warm-up call: paksa TF compile graph sebelum request pertama masuk
    _dummy = np.zeros((1, 24, 69), dtype=np.float32)
    _rul_model.predict(_dummy, verbose=0)
    log.info("LSTM warm-up call completed — inference ready ✅")
    log.info("All models loaded successfully ✅")



_load_models()

# ── Konstanta Deployment ────────────────────────────────────────
WARNING_THRESHOLD  = 0.60
CRITICAL_THRESHOLD = 0.50
SEQ_LEN            = 24
N_FEATURES         = 69
LABEL_MAP          = {0: "HEALTHY", 1: "WARNING", 2: "CRITICAL"}
REQUIRED_SENSORS   = [
    "temperature", "vibration", "pressure", "rpm",
    "power_consumption", "noise_level", "humidity", "operating_hours",
]


def _get_urgency_level(rul_days: float) -> str:
    """Mapping rul_days ke urgency label operasional."""
    if   rul_days <= 1.0: return "IMMEDIATE"
    elif rul_days <= 2.0: return "CRITICAL"
    elif rul_days <= 7.0: return "WARNING"
    else:                 return "MONITOR"


def _apply_threshold(proba: np.ndarray) -> np.ndarray:
    """Terapkan threshold kustom: WARNING jika P(W) > 0.60."""
    preds = np.argmax(proba, axis=1)
    preds[proba[:, 1] > WARNING_THRESHOLD] = 1
    return preds


def _prepare_lstm_input(features: np.ndarray,
                        seq_len: int = SEQ_LEN) -> np.ndarray:
    """Reshape array ke (1, seq_len, n_features) dengan pre-padding jika perlu."""
    n_rows = features.shape[0]
    if n_rows >= seq_len:
        seq = features[-seq_len:, :]
    else:
        pad = np.zeros((seq_len - n_rows, N_FEATURES))
        seq = np.vstack([pad, features])
    return seq.reshape(1, seq_len, N_FEATURES)


def predict(payload: dict,
            history_df: Optional[pd.DataFrame] = None) -> dict:
    """
    Fungsi prediksi utama — Cascaded Model Pipeline.

    Parameters
    ----------
    payload    : dict sesuai API Contract (machine_id, timestamp, sensor_readings)
    history_df : pd.DataFrame opsional — 24 baris terakhir mesin untuk LSTM sequence

    Returns
    -------
    dict sesuai API Contract response schema
    """
    t_start = time.perf_counter()

    # Step 1: Validasi payload
    machine_id = payload.get("machine_id", "UNKNOWN")
    timestamp  = payload.get("timestamp", datetime.now().isoformat())
    sensors    = payload.get("sensor_readings", {})

    missing = [s for s in REQUIRED_SENSORS if s not in sensors]
    if missing:
        return {"status": "error", "code": 400,
                "message": f"Missing sensor fields: {missing}"}

    # Step 2: Buat DataFrame mentah
    raw_row = {
        "timestamp":  pd.to_datetime(timestamp),
        "machine_id": machine_id,
        **sensors,
        "failure": 0,
    }
    raw_df = (pd.concat([history_df, pd.DataFrame([raw_row])],
                         ignore_index=True)
              if history_df is not None
              else pd.DataFrame([raw_row]))

    # Step 3: Preprocessing pipeline
    features         = _pipeline.transform(raw_df)   # (n_rows, 69)
    current_features = features[-1:, :]               # (1, 69) — baris terakhir

    # Step 4: Model 1 — Klasifikasi
    proba      = _classifier.predict_proba(current_features)  # (1, 3)
    pred_code  = int(_apply_threshold(proba)[0])
    pred_label = LABEL_MAP[pred_code]
    confidence = float(np.max(proba[0]))

    # Step 5: Model 2 — RUL (hanya jika WARNING atau CRITICAL)
    if pred_code in [1, 2]:
        lstm_input = _prepare_lstm_input(features)
        rul_raw    = float(_rul_model.predict(lstm_input, verbose=0)[0][0])
        rul_days   = max(0.0, round(rul_raw, 4))
        rul_result = {
            "is_active":     True,
            "rul_days":      rul_days,
            "rul_hours":     round(rul_days * 24, 2),
            "urgency_level": _get_urgency_level(rul_days),
        }
    else:
        rul_result = {
            "is_active":     False,
            "rul_days":      None,
            "rul_hours":     None,
            "urgency_level": "MONITOR",
        }

    inference_ms = round((time.perf_counter() - t_start) * 1000, 2)

    # Step 6: Susun response
    return {
        "machine_id": machine_id,
        "timestamp":  timestamp,
        "model_1_classifier": {
            "predicted_label": pred_label,
            "predicted_code":  pred_code,
            "confidence":      round(confidence, 6),
            "probabilities": {
                "HEALTHY":  round(float(proba[0][0]), 6),
                "WARNING":  round(float(proba[0][1]), 6),
                "CRITICAL": round(float(proba[0][2]), 6),
            },
            "threshold_used": {
                "WARNING":  WARNING_THRESHOLD,
                "CRITICAL": CRITICAL_THRESHOLD,
            },
        },
        "model_2_rul": rul_result,
        "metadata": {
            "model_1_version":   "xgb_classifier_v2",
            "model_2_version":   "lstm_rul_v2",
            "pipeline_version":  "preprocessing_pipeline_v1",
            "inference_time_ms": inference_ms,
        },
    }
