#!/bin/bash
set -e

echo "======================================"
echo " PRIME — Integration Stack Startup"
echo "======================================"

echo ""
echo "[STEP 1] Starting infrastructure..."
docker compose up postgres timescaledb redis -d
echo "  Waiting 30s for infrastructure to be healthy..."
sleep 30
docker compose ps

echo ""
echo "[STEP 2] Starting ML Service..."
docker compose up ml-service -d
echo "  Waiting 90s for LSTM + XGBoost to load..."
sleep 90
docker compose ps

echo ""
echo "[STEP 3] Running database migrations..."
cd backend
node src/config/migrate.js
node src/config/migrate2.js
node src/config/migrate3.js
node src/config/migrate4.js
node src/config/migrate5.js
echo "  Migrations complete."

echo ""
echo "[STEP 4] Seeding initial users..."
node src/config/seedUsers.js
echo "  Seed complete."
cd ..

echo ""
echo "[STEP 5] Health checks..."
echo "  Backend (will start manually)..."
echo "  Checking ML Service health..."
curl -s http://localhost:8000/health | python3 -m json.tool

echo ""
echo "======================================"
echo " Stack ready. Next steps:"
echo " 1. cd backend && npm run dev"
echo " 2. cd frontend && npm run dev"
echo " 3. Verify: http://localhost:3000/health"
echo " 4. Verify: http://localhost:3001"
echo "======================================"
