#!/bin/bash
set -e

echo "==> Starting infrastructure..."
docker compose up -d postgres redis minio

echo "==> Waiting for PostgreSQL..."
sleep 5

echo "==> Installing API dependencies..."
cd apps/api
npm install
npx prisma generate
# Sync the Prisma schema without allowing migration drift to reset the database.
# `migrate dev` may reset a development database when it detects drift.
npx prisma db push

echo "==> Installing Web dependencies..."
cd ../web
npm install

echo "==> Setup complete!"
echo ""
echo "Run the services:"
echo "  Terminal 1: cd apps/api && npm run dev"
echo "  Terminal 2: cd apps/web && npm run dev"
echo "  Terminal 3 (optional): cd apps/ai && pip install -r requirements.txt && uvicorn main:app --reload --port 8000"
echo ""
echo "Open http://localhost:3000"
