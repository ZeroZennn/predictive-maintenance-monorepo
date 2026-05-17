"""
feature_engineering.py
Modul fungsi feature engineering untuk Lapis AI.
Semua fungsi menerima DataFrame dan mengembalikan DataFrame.
"""
import sys
import logging
# pyrefly: ignore [missing-import]
import numpy as np
import pandas as pd
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from src.config import W_WARNING_HRS, W_CRITICAL_HRS

log = logging.getLogger(__name__)

# ── Konstanta ──────────────────────────────────────────────────
SEQ_NUMERIC_COLS = [
    "temperature", "vibration", "pressure",
    "rpm", "power_consumption", "noise_level",
]
ALL_SENSOR_COLS = SEQ_NUMERIC_COLS + ["humidity", "operating_hours"]
ROLL_WINDOWS    = [24, 48]
LAG_SIZES       = [1, 6, 24]
DAMAGE_CAT_MAP  = {
    "electrical": 0, "lubrication": 1,
    "mechanical": 2, "unknown": 3,
}
MECHANICAL_KW   = ["belt", "pulley", "rantai", "bearing", "gear", "poros"]
ELECTRICAL_KW   = ["sensor", "elektrik", "listrik", "kabel", "relay"]
LUBRICATION_KW  = ["oli", "pelumas", "grease", "gemuk"]
SEVERITY_HIGH   = ["putus", "rusak parah", "breakdown", "patah"]
SEVERITY_MED    = ["aus", "bocor", "abnormal", "overheat"]


def clip_negatives(df: pd.DataFrame) -> pd.DataFrame:
    """Clip kolom vibration ke minimum 0 (fix DFT-02)."""
    df = df.copy()
    if "vibration" in df.columns:
        df["vibration"] = df["vibration"].clip(lower=0)
    return df


def add_rolling_features(df: pd.DataFrame) -> pd.DataFrame:
    """Tambahkan rolling mean/std/max per sensor per machine_id."""
    df = df.sort_values(["machine_id", "timestamp"]).reset_index(drop=True)
    for sensor in SEQ_NUMERIC_COLS:
        for w in ROLL_WINDOWS:
            grp = df.groupby("machine_id")[sensor]
            df[f"{sensor}_roll_mean_{w}h"] = grp.transform(
                lambda s: s.rolling(w, min_periods=1).mean())
            df[f"{sensor}_roll_std_{w}h"]  = grp.transform(
                lambda s: s.rolling(w, min_periods=1).std()
            ).fillna(0)
            df[f"{sensor}_roll_max_{w}h"]  = grp.transform(
                lambda s: s.rolling(w, min_periods=1).max())
    log.debug(f"Rolling features added: {len(SEQ_NUMERIC_COLS)*len(ROLL_WINDOWS)*3} cols")
    return df


def add_lag_features(df: pd.DataFrame) -> pd.DataFrame:
    """Tambahkan lag features per sensor per machine_id, NaN diisi ffill+bfill."""
    for sensor in SEQ_NUMERIC_COLS:
        for lag in LAG_SIZES:
            col = f"{sensor}_lag_{lag}h"
            df[col] = df.groupby("machine_id")[sensor].shift(lag)
            df[col] = df[col].fillna(df[sensor])
    log.debug(f"Lag features added: {len(SEQ_NUMERIC_COLS)*len(LAG_SIZES)} cols")
    return df


def add_ratio_features(df: pd.DataFrame) -> pd.DataFrame:
    """Tambahkan 4 cross-sensor ratio dan interaction features."""
    df["temp_vibration_ratio"]           = df["temperature"]       / df["vibration"].clip(lower=0.001)
    df["pressure_rpm_ratio"]             = df["pressure"]          / df["rpm"].clip(lower=1)
    df["power_noise_ratio"]              = df["power_consumption"]  / df["noise_level"].clip(lower=0.001)
    df["vibration_pressure_interaction"] = df["vibration"]         * df["pressure"]
    return df


def add_degradation_proxy(df: pd.DataFrame,
                          maintenance_df=None) -> pd.DataFrame:
    """Tambahkan hours_since_last_maint; default 0 jika maintenance_df=None."""
    if maintenance_df is not None:
        maint = (maintenance_df[["machine_id", "timestamp"]]
                 .drop_duplicates()
                 .sort_values(["machine_id", "timestamp"])
                 .rename(columns={"timestamp": "maint_ts"}))
        df = df.sort_values(["machine_id", "timestamp"]).reset_index(drop=True)
        parts = []
        for mid, grp in df.groupby("machine_id"):
            maint_mid = maint[maint["machine_id"] == mid].sort_values("maint_ts")
            grp_s = grp.sort_values("timestamp")
            if len(maint_mid) > 0:
                res = pd.merge_asof(grp_s, maint_mid,
                                    left_on="timestamp", right_on="maint_ts",
                                    by="machine_id")
                res["hours_since_last_maint"] = (
                    (res["timestamp"] - res["maint_ts"])
                    .dt.total_seconds() / 3600
                ).fillna(0).clip(lower=0)
            else:
                grp_s["hours_since_last_maint"] = 0
                res = grp_s
            parts.append(res)
        df = pd.concat(parts).reset_index(drop=True)
        if "maint_ts" in df.columns:
            df = df.drop(columns=["maint_ts"])
    else:
        df["hours_since_last_maint"] = 0
    return df


def add_nlp_features(df: pd.DataFrame) -> pd.DataFrame:
    """Ekstrak damage_category dan severity_score dari technician_notes."""
    def classify(note):
        if not isinstance(note, str):
            return "unknown"
        n = note.lower()
        if any(k in n for k in MECHANICAL_KW):   return "mechanical"
        if any(k in n for k in ELECTRICAL_KW):   return "electrical"
        if any(k in n for k in LUBRICATION_KW):  return "lubrication"
        return "unknown"

    def score(note):
        if not isinstance(note, str):
            return 1
        n = note.lower()
        if any(k in n for k in SEVERITY_HIGH): return 3
        if any(k in n for k in SEVERITY_MED):  return 2
        return 1

    if "technician_notes" in df.columns:
        df["damage_category_raw"] = df["technician_notes"].apply(classify)
        df["severity_score"]      = df["technician_notes"].apply(score)
    else:
        df["damage_category_raw"] = "unknown"
        df["severity_score"]      = 1

    df["damage_category"] = (df["damage_category_raw"]
                             .map(DAMAGE_CAT_MAP).fillna(3).astype(int))
    return df
