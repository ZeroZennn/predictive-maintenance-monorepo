"""
preprocessing_pipeline.py
FeatureEngineeringTransformer untuk Lapis AI.
Didefinisikan di modul ini (bukan __main__) agar pipeline .pkl bisa
di-load dari konteks apapun: notebook, script, atau API server.
"""

import sys
import logging
# pyrefly: ignore [missing-import]
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline

# Pastikan ROOT dapat di-import (diperlukan untuk load config)
_MODULE_DIR = Path(__file__).resolve().parent
_ROOT       = _MODULE_DIR.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

log = logging.getLogger(__name__)

# ── Konstanta — identik dengan Cell 1 notebook ─────────────────
SEQ_NUMERIC_COLS = [
    "temperature", "vibration", "pressure",
    "rpm", "power_consumption", "noise_level",
]
ALL_SENSOR_COLS = SEQ_NUMERIC_COLS + ["humidity", "operating_hours"]
ROLL_WINDOWS    = [24, 48]
LAG_SIZES       = [1, 6, 24]
DAMAGE_CAT_MAP  = {
    "electrical": 0, "lubrication": 1,
    "mechanical": 2, "unknown":     3,
}
DROP_COLS = [
    "timestamp", "machine_id", "failure", "health_label",
    "health_label_confirmed", "health_label_encoded",
    "rul_days", "technician_notes", "damage_category_raw",
]

# Keyword NLP
_MECHANICAL_KW  = ["belt", "pulley", "rantai", "bearing", "gear", "poros"]
_ELECTRICAL_KW  = ["sensor", "elektrik", "listrik", "kabel", "relay"]
_LUBRICATION_KW = ["oli", "pelumas", "grease", "gemuk"]
_SEVERITY_HIGH  = ["putus", "rusak parah", "breakdown", "patah"]
_SEVERITY_MED   = ["aus", "bocor", "abnormal", "overheat"]


class FeatureEngineeringTransformer(BaseEstimator, TransformerMixin):
    """
    Custom sklearn transformer untuk feature engineering Lapis AI.

    Stateless: fit() hanya menyimpan urutan kolom dari X_train_clf.
    transform() mereproduksi seluruh pipeline feature engineering
    secara deterministik.

    Input : pd.DataFrame raw sensor (n_samples x raw_cols)
    Output: pd.DataFrame (n_samples x 69) — diteruskan ke StandardScaler
    """

    def __init__(self, maintenance_df=None):
        """
        Parameters
        ----------
        maintenance_df : pd.DataFrame atau None
            Tabel maintenance_logs opsional.
            Jika None, hours_since_last_maint di-set ke 0.
        """
        self.maintenance_df  = maintenance_df
        self._expected_cols  = None

    # ── fit ────────────────────────────────────────────────────
    def fit(self, X, y=None):
        """Stateless — hanya load urutan kolom dari X_train_clf."""
        self._expected_cols = self._load_expected_cols()
        return self

    # ── Helpers ────────────────────────────────────────────────
    @staticmethod
    def _load_expected_cols():
        """Load urutan 69 kolom dari X_train_clf.parquet."""
        train_path = _ROOT / "data" / "processed" / "X_train_clf.parquet"
        if train_path.exists():
            cols = pd.read_parquet(train_path).columns.tolist()
            log.debug(f"Expected feature cols loaded: {len(cols)} kolom")
            return cols
        log.warning("X_train_clf.parquet tidak ditemukan — urutan kolom default.")
        return None

    def _clip_negatives(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clip vibration ke minimum 0 (fix DFT-02 dari Fase 5)."""
        if "vibration" in df.columns:
            df["vibration"] = df["vibration"].clip(lower=0)
        return df

    def _add_rolling_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Rolling mean/std/max untuk 6 sensor x 2 window = 36 kolom baru."""
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
        return df

    def _add_lag_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Lag features untuk 6 sensor x 3 lag = 18 kolom baru."""
        for sensor in SEQ_NUMERIC_COLS:
            for lag in LAG_SIZES:
                col = f"{sensor}_lag_{lag}h"
                df[col] = df.groupby("machine_id")[sensor].shift(lag)
                df[col] = df[col].fillna(df[sensor])
        return df

    def _add_ratio_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """4 cross-sensor ratio dan interaction features."""
        df["temp_vibration_ratio"]           = df["temperature"]      / df["vibration"].clip(lower=0.001)
        df["pressure_rpm_ratio"]             = df["pressure"]         / df["rpm"].clip(lower=1)
        df["power_noise_ratio"]              = df["power_consumption"] / df["noise_level"].clip(lower=0.001)
        df["vibration_pressure_interaction"] = df["vibration"]        * df["pressure"]
        return df

    def _add_degradation_proxy(self, df: pd.DataFrame) -> pd.DataFrame:
        """hours_since_last_maint: merge_asof jika ada, else 0."""
        maint = self.maintenance_df
        if maint is not None:
            maint_clean = (
                maint[["machine_id", "timestamp"]]
                .drop_duplicates()
                .sort_values(["machine_id", "timestamp"])
                .rename(columns={"timestamp": "maint_ts"})
            )
            df = df.sort_values(["machine_id", "timestamp"]).reset_index(drop=True)
            parts = []
            for mid, grp in df.groupby("machine_id"):
                m_mid = maint_clean[maint_clean["machine_id"] == mid].sort_values("maint_ts")
                grp_s = grp.sort_values("timestamp")
                if len(m_mid) > 0:
                    res = pd.merge_asof(
                        grp_s, m_mid,
                        left_on="timestamp", right_on="maint_ts",
                        by="machine_id",
                    )
                    res["hours_since_last_maint"] = (
                        (res["timestamp"] - res["maint_ts"])
                        .dt.total_seconds() / 3600
                    ).fillna(0).clip(lower=0)
                else:
                    grp_s = grp_s.copy()
                    grp_s["hours_since_last_maint"] = 0
                    res = grp_s
                parts.append(res)
            df = pd.concat(parts).reset_index(drop=True)
            if "maint_ts" in df.columns:
                df = df.drop(columns=["maint_ts"])
        else:
            df["hours_since_last_maint"] = 0
        return df

    def _add_nlp_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """damage_category + severity_score dari technician_notes."""
        def classify(note):
            if not isinstance(note, str):
                return "unknown"
            n = note.lower()
            if any(k in n for k in _MECHANICAL_KW):  return "mechanical"
            if any(k in n for k in _ELECTRICAL_KW):  return "electrical"
            if any(k in n for k in _LUBRICATION_KW): return "lubrication"
            return "unknown"

        def score(note):
            if not isinstance(note, str):
                return 1
            n = note.lower()
            if any(k in n for k in _SEVERITY_HIGH): return 3
            if any(k in n for k in _SEVERITY_MED):  return 2
            return 1

        if "technician_notes" in df.columns:
            df["damage_category_raw"] = df["technician_notes"].apply(classify)
            df["severity_score"]      = df["technician_notes"].apply(score)
        else:
            df["damage_category_raw"] = "unknown"
            df["severity_score"]      = 1

        df["damage_category"] = (
            df["damage_category_raw"].map(DAMAGE_CAT_MAP).fillna(3).astype(int)
        )
        return df

    def _select_and_order_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Drop kolom non-fitur, reindex ke 69 kolom yang tepat."""
        df = df.drop(columns=DROP_COLS, errors="ignore")

        expected = self._expected_cols
        if expected is None:
            expected = self._load_expected_cols()

        if expected is not None:
            df = df.reindex(columns=expected, fill_value=0)
        else:
            log.warning("Expected cols tidak tersedia — output mungkin != 69 kolom!")

        return df

    # ── transform ──────────────────────────────────────────────
    def transform(self, X, y=None):
        """
        Jalankan seluruh pipeline feature engineering.

        Parameters
        ----------
        X : pd.DataFrame  (format raw sensor_readings)
        y : diabaikan

        Returns
        -------
        pd.DataFrame (n_samples x 69) — diteruskan ke StandardScaler
        """
        df = X.copy()
        log.debug(f"transform() start | input shape: {df.shape}")

        df = self._clip_negatives(df)
        df = self._add_rolling_features(df)
        df = self._add_lag_features(df)
        df = self._add_ratio_features(df)
        df = self._add_degradation_proxy(df)
        df = self._add_nlp_features(df)
        df = self._select_and_order_features(df)

        log.debug(f"transform() done  | output shape: {df.shape}")
        # Return DataFrame (bukan .values) agar StandardScaler tidak warning
        return df


def build_pipeline(scaler) -> Pipeline:
    """
    Bangun sklearn Pipeline dengan scaler yang sudah di-fit.

    Parameters
    ----------
    scaler : fitted StandardScaler

    Returns
    -------
    sklearn.pipeline.Pipeline
    """
    transformer = FeatureEngineeringTransformer()
    transformer._expected_cols = FeatureEngineeringTransformer._load_expected_cols()
    return Pipeline(steps=[
        ("feature_engineering", transformer),
        ("scaling",             scaler),
    ])
