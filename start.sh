#!/bin/bash

echo "🚀 Starting DiscoveryIntel..."
echo ""

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v redis-cli &> /dev/null; then
    echo "⚠️  Redis is not installed or not in PATH."
    echo "   Please install Redis or ensure it's running."
fi

if [ ! -f "backend/.env" ]; then
    echo "❌ Backend .env file not found."
    echo "   Please copy backend/.env.example to backend/.env and configure it."
    exit 1
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "❌ Frontend .env.local file not found."
    echo "   Please copy frontend/.env.example to frontend/.env.local and configure it."
    exit 1
fi

echo "📦 Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
fi

if [ ! -d "shared/node_modules" ]; then
    cd shared && npm install && cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    cd frontend && npm install && cd ..
fi

echo "🔨 Building shared types..."
cd shared && npm run build && cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Starting services..."
echo "  - Backend will run on http://localhost:3001"
echo "  - Frontend will run on http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

npm run dev
