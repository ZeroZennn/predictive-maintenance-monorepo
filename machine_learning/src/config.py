# =============================================================================
# LAPIS AI — GLOBAL CONFIGURATION
# Single Source of Truth untuk seluruh pipeline
# =============================================================================

from pathlib import Path

# --- ROOT & PATH SETUP ---
ROOT_DIR = Path(__file__).resolve().parent.parent

DATA_RAW_DIR      = ROOT_DIR / "data" / "raw"
DATA_INTERIM_DIR  = ROOT_DIR / "data" / "interim"
DATA_PROCESSED_DIR= ROOT_DIR / "data" / "processed"
MODELS_ML_DIR     = ROOT_DIR / "models" / "ml_track"
MODELS_DL_DIR     = ROOT_DIR / "models" / "dl_track"
MODELS_FINAL_DIR  = ROOT_DIR / "models" / "final"

# --- SOURCE FILES ---
SENSOR_FILE      = DATA_RAW_DIR / "sensor_readings.csv"
MAINTENANCE_FILE = DATA_RAW_DIR / "maintenance_logs.csv"

# --- REPRODUCIBILITY ---
GLOBAL_SEED = 42

# --- LABEL ENGINEERING PARAMETERS (akan divalidasi di Fase 2) ---
W_CRITICAL_HRS = 24   # jam sebelum failure → label CRITICAL
W_WARNING_HRS  = 48   # jam sebelum failure → label WARNING

# --- LABEL MAP ---
LABEL_MAP = {
    "HEALTHY" : 0,
    "WARNING" : 1,
    "CRITICAL": 2
}

# --- RUL SETTINGS ---
RUL_UNIT = "days"   # satuan output RUL untuk tim operasional