FROM python:3.10-slim

WORKDIR /app

# System deps untuk TensorFlow & scikit-learn
RUN apt-get update && apt-get install -y \
    gcc g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements dulu (layer caching)
COPY requirements.txt .

# Install FastAPI stack + project deps
RUN pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn[standard]==0.24.0 \
    pydantic==2.5.0 \
    && pip install --no-cache-dir -r requirements.txt

# Copy source code dan artifacts
COPY src/ ./src/
COPY models/final/ ./models/final/
COPY data/processed/X_train_clf.parquet ./data/processed/

# Expose port
EXPOSE 8000

# Health check built-in Docker
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c \
    "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# workers=1: LSTM tidak thread-safe untuk multi-worker
CMD ["uvicorn", "src.app:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1"]
