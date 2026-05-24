"""FastAPI application entry point untuk Lapis AI NLP Service."""

import logging
import os
import sys

import yaml
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from nlp.api.endpoints import router

# ── Environment & Logging ──────────────────────────────────────────────────────

load_dotenv()

logging.basicConfig(
    level  = logging.INFO,
    format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("lapis_ai_nlp")

# ── FastAPI App ────────────────────────────────────────────────────────────────

app = FastAPI(
    title       = "Lapis AI — NLP Service",
    description = "RAG Pipeline API untuk Predictive Maintenance",
    version     = "1.0.0",
    docs_url    = "/nlp/docs",
    redoc_url   = "/nlp/redoc",
)

# ── CORS Middleware ────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Router ─────────────────────────────────────────────────────────────────────

app.include_router(router, prefix="/nlp", tags=["NLP Pipeline"])

# ── Root Endpoint ──────────────────────────────────────────────────────────────


@app.get("/", summary="Root — service info")
async def root() -> dict:
    """Return info dasar service."""
    return {
        "service": "Lapis AI NLP Service",
        "version": "1.0.0",
        "docs"   : "/nlp/docs",
        "health" : "/nlp/health",
    }


# ── Entry Point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    with open("nlp/configs/config.yaml", "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    host = config["api"]["host"]
    port = config["api"]["port"]

    logger.info("Starting Lapis AI NLP Service on %s:%d", host, port)
    uvicorn.run("nlp.api.main:app", host=host, port=port, reload=False)
