FROM python:3.10-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    gcc g++ curl \
    && rm -rf /var/lib/apt/lists/*

# ── Layer 1: Upgrade pip terlebih dahulu ──────────────────────
RUN pip install --no-cache-dir --upgrade pip

# ── Layer 2: Install TensorFlow TERPISAH dengan versi terkunci ─
# Dipisah agar Docker cache layer ini secara independen.
# TF 2.15.0 menggunakan Keras 2 secara native — tidak butuh tf-keras
RUN pip install --no-cache-dir \
    tensorflow-cpu==2.15.0

# ── Layer 3: Framework dependencies ──────────────────────────
RUN pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn[standard]==0.24.0 \
    pydantic==2.5.0

# ── Layer 4: ML dependencies dari requirements_ml.txt ───────────
# Constraint file memastikan pip tidak upgrade/downgrade tensorflow
# saat meng-install dependensi lain dari requirements_ml.txt
COPY requirements_ml.txt .
RUN printf 'tensorflow-cpu==2.15.0\n' > /tmp/tf_constraint.txt && \
    pip install --no-cache-dir -r requirements_ml.txt \
        --constraint /tmp/tf_constraint.txt

# ── Application files ─────────────────────────────────────────
COPY src/ ./src/
# Includes: preprocessing_pipeline.pkl, classifier_final.pkl,
# rul_predictor_final.h5, scaler_final.pkl, model cards
COPY models/final/ ./models/final/
COPY data/processed/X_train_clf.parquet ./data/processed/

# ── Environment variables ──────────────────────────────────────
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=30s --start-period=90s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "src.app:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1"]
