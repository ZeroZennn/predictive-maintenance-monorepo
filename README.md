# Lapis AI — Predictive Maintenance SaaS

> An intelligent, data-driven SaaS platform for real-time equipment monitoring,
> anomaly detection, and AI-powered predictive maintenance — built on a scalable
> microservice monorepo architecture.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend API** | Node.js · Express · REST & WebSocket |
| **Frontend** | Next.js · React |
| **Relational DB** | PostgreSQL 15 |
| **Time-Series DB** | TimescaleDB (PostgreSQL extension) |
| **Cache / Broker** | Redis 7 |
| **ML Engine** | Python · FastAPI · scikit-learn / PyTorch |
| **NLP Engine** | Python · FastAPI · Transformers |
| **Containerization** | Docker · Docker Compose |
| **Auth** | JWT |

---

## Monorepo Structure

```
predictive-maintenance-monorepo/
├── backend/                   # Node.js Express API
│   ├── src/
│   │   ├── controllers/       # Route handler logic
│   │   ├── services/          # Business logic layer
│   │   ├── routes/            # Express route definitions
│   │   ├── middlewares/       # Auth, error handling, etc.
│   │   ├── config/            # DB connections, app config
│   │   ├── utils/             # Helper functions
│   │   └── websockets/        # WebSocket event handlers
│   └── .env.example
├── frontend/                  # Next.js React application
├── machine_learning/          # Python FastAPI — ML Engine
├── nlp/                       # Python FastAPI — NLP Engine
├── docker-compose.yml         # Multi-service orchestration
├── .gitignore
├── .env.example               # Root environment template
└── README.md
```

---

## Getting Started

> ⚠️ **See phase documentation for detailed setup instructions.**

Phase-by-phase onboarding guides will be added as the project progresses.
For now, copy the environment template and bring up the infrastructure services:

```bash
# 1. Clone the repository
git clone <repo-url>
cd predictive-maintenance-monorepo

# 2. Set up environment variables
cp .env.example .env
# Edit .env and fill in all required values

# 3. Start infrastructure services
docker compose up postgres timescaledb redis -d

# 4. (Coming soon) Start all services
# docker compose up -d
```

---

## Contributing

Branch naming convention: `feat/<phase>-<short-description>`

---

*Lapis AI — Built with ❤️ for smarter maintenance.*
