"""
app.py
FastAPI HTTP wrapper untuk Lapis AI ML Engine.
Entry point: uvicorn src.app:app --host 0.0.0.0 --port 8000
"""
import sys, time, logging
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Request
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field
# pyrefly: ignore [missing-import]
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
from src.inference import predict

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)


# ── Pydantic Models (sesuai api_contract_final_v1.json) ────────
class SensorReadings(BaseModel):
    temperature:       float
    vibration:         float
    pressure:          float
    rpm:               int
    power_consumption: float
    noise_level:       float
    humidity:          float
    operating_hours:   float


class PredictRequest(BaseModel):
    machine_id:      str = Field(..., example="M-01")
    timestamp:       str = Field(..., example="2025-09-30T03:00:00")
    sensor_readings: SensorReadings
    sensor_history:  Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description=(
            "23 baris sensor sebelumnya untuk LSTM sequence. "
            "Jika None, ML Service akan pre-pad dengan zeros."
        ),
    )


# ── Lifespan ────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Models sudah di-load saat import inference (singleton pattern)
    log.info("ML Service startup complete — models ready")
    yield
    log.info("ML Service shutting down")


# ── App Init ────────────────────────────────────────────────────
app = FastAPI(
    title="Lapis AI ML Engine",
    description=(
        "Predictive Maintenance ML Service — "
        "Health Classifier & RUL Predictor"
    ),
    version="1.0.0",
    lifespan=lifespan,
)


# ── Endpoints ───────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    """Health check untuk circuit breaker Backend. Returns 200 jika siap."""
    return {
        "status":  "healthy",
        "service": "lapis-ai-ml-engine",
        "models": {
            "classifier":    "xgb_classifier_v2",
            "rul_predictor": "lstm_rul_v2",
            "pipeline":      "preprocessing_pipeline_v1",
        },
    }


@app.post("/api/ml/predict")
async def predict_endpoint(request: PredictRequest):
    """
    Endpoint utama prediksi ML.
    Model 1: Health Status Classification (HEALTHY/WARNING/CRITICAL)
    Model 2: RUL Prediction (aktif hanya jika WARNING atau CRITICAL)
    """
    payload = {
        "machine_id":      request.machine_id,
        "timestamp":       request.timestamp,
        "sensor_readings": request.sensor_readings.model_dump(),
    }

    history_df = None
    if request.sensor_history and len(request.sensor_history) > 0:
        import pandas as pd
        history_df = pd.DataFrame(request.sensor_history)
        history_df["timestamp"]  = pd.to_datetime(history_df["timestamp"])
        history_df["machine_id"] = request.machine_id
        history_df["failure"]    = 0   # placeholder

    result = predict(payload, history_df=history_df)

    if isinstance(result, dict) and result.get("status") == "error":
        return JSONResponse(
            status_code=result.get("code", 400),
            content=result,
        )

    return JSONResponse(status_code=200, content=result)


# ── Global Exception Handler ────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status":  "error",
            "code":     500,
            "message": f"Internal Server Error: {str(exc)}",
        },
    )
