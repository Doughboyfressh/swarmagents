#!/bin/bash

echo "🧬 Agent Swarm Intelligence - Full System Startup"
echo "=================================================="
echo ""

# Check if llama.cpp is running
echo "🔍 Checking llama.cpp server..."
if curl -s http://localhost:8080/v1/models > /dev/null 2>&1; then
    echo "✅ LLM server is running on port 8080"
else
    echo "⚠️  LLM server not detected on port 8080"
    echo "   Please start llama.cpp server first:"
    echo "   ./server -m qwen-3.6-27b.gguf -c 4096 --port 8080 -ngl 99"
    echo ""
    read -p "Continue without LLM? (y/n) " -n 1 -r
    echo
    if [[ ! $reply =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# Start backend
echo "🚀 Starting backend server..."
cd backend
npm install > /dev/null 2>&1
npm run dev &
BACKEND_PID=$!
cd ..

echo "✅ Backend started (PID: $BACKEND_PID)"
echo ""

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 3

# Check if backend is running
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend is ready on port 3001"
else
    echo "❌ Backend failed to start"
    kill $BACKEND_PID
    exit 1
fi

echo ""

# Start frontend
echo "🎨 Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo "✅ Frontend started (PID: $FRONTEND_PID)"
echo ""

echo "=================================================="
echo "🎉 System is running!"
echo ""
echo "📊 Access points:"
echo "   • Frontend:    http://localhost:5173"
echo "   • Backend API: http://localhost:3001/api"
echo "   • WebSocket:   ws://localhost:3001"
echo ""
echo "🛑 To stop the system:"
echo "   Press Ctrl+C"
echo ""
echo "=================================================="
echo ""

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping system...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

wait
