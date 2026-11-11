# 🚀 Complete Setup Guide - Agent Swarm Intelligence System

This guide will help you set up the complete Agent Swarm Intelligence System with backend server and LLM integration on your RTX 5090 system.

## 📋 Prerequisites

### Hardware Requirements
- **GPU**: RTX 5090 (32GB VRAM) ✅
- **RAM**: 32GB system RAM ✅
- **Storage**: 50GB free space
- **OS**: Linux (recommended) or Windows with WSL2

### Software Requirements
- **Node.js** 18+ and npm
- **Git**
- **CUDA** 12.x (for llama.cpp GPU acceleration)
- **Build Essentials** (gcc, g++, make)

## 🎯 Installation Overview

```
1. Install llama.cpp + Qwen model
3. Set up backend server
5. Connect frontend to backend
8. Test the complete system
```

---

## 📥 Step 1: Install llama.cpp

### 1.1 Install CUDA (if not installed)

**Ubuntu/Debian:**
```bash
# Check if CUDA is installed
nvidia-smi

# If not installed, install CUDA 12.x
wget https://developer.download.nvidia.com/compute/cuda/12.4.0/local_installers/cuda_12.4.0_550.54.14_linux.run
sudo sh cuda_12.4.0_550.54.14_linux.run
```

**Verify CUDA:**
```bash
nvcc --version
```

### 1.2 Clone and Build llama.cpp

```bash
# Clone llama.cpp
cd ~
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp

# Build with CUDA support
make GGML_CUDA=1 -j$(nproc)

# Verify build
ls -la server
```

### 1.3 Download Qwen 3.6 27B Model

You'll need the GGUF format model. Download from:
- **Hugging Face**: https://huggingface.co/Qwen
- **Or use your existing model**

```bash
# If downloading from Hugging Face
# (You'll need to install huggingface-cli)
pip install huggingface-hub

# Download model (this will take a while)
huggingface-cli download Qwen/Qwen2.5-32B-Instruct-GGUF \
  qwen2.5-32b-instruct-q4_k_m.gguf \
  --local-dir ./models

# Move to llama.cpp directory
mv ./models/qwen2.5-32b-instruct-q4_k_m.gguf ./
```

**Note**: Adjust the model name based on what's available. You need a GGUF file.

---

## 🚀 Step 2: Start llama.cpp Server

### 2.1 Start Server

```bash
cd ~/llama.cpp

# Start server with optimal settings for RTX 5090
./server \
  -m qwen2.5-32b-instruct-q4_k_m.gguf \
  -c 4096 \
  --host 0.0.0.0 \
  --port 8080 \
  -ngl 99 \
  --n-batch 512 \
  --threads 16
```

**Parameter explanations:**
- `-m`: Path to your GGUF model file
- `-c 4096`: Context size (adjust if you run out of VRAM)
- `--host 0.0.0.0`: Listen on all interfaces
- `--port 8080`: Port number (must match backend config)
- `-ngl 99`: Offload 99 layers to GPU (use all VRAM)
- `--n-batch 512`: Batch size for faster inference
- `--threads 16`: CPU threads (adjust based on your CPU)

### 2.2 Verify Server is Running

```bash
# Test the server
curl http://localhost:8080/v1/models

# Expected output:
# {"object":"list","data":[{"id":"...","object":"model",...}]}
```

**Keep this terminal running!** The server must stay active.

---

## 🔧 Step 3: Set Up Backend Server

### 3.1 Navigate to Backend

```bash
cd /path/to/agent-swarm/backend
```

### 3.2 Install Dependencies

```bash
npm install
```

This will install:
- Express (web server)
- WebSocket (real-time communication)
- SQLite (database)
- Axios (HTTP client for LLM)
- And other dependencies

### 3.3 Configure Environment

The `.env` file is already created with default settings:

```env
PORT=3001
LLM_ENDPOINT=http://localhost:8080
LLM_MODEL=qwen-3.6-27b
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=512
LLM_ENABLED=true
```

**Adjust if needed:**
- `LLM_ENDPOINT`: Must match your llama.cpp server port
- `LLM_MODEL`: Name of your model (for logging)
- `LLM_TEMPERATURE`: 0.7 is good for creative responses
- `LLM_MAX_TOKENS`: 512 tokens per response

### 3.4 Initialize Database

```bash
npm run db:init
```

This creates the SQLite database at `./data/swarm.db`

### 3.5 Start Backend Server

```bash
npm run dev
```

**Expected output:**
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🧬 Agent Swarm Intelligence Backend Server             ║
║                                                           ║
║   Server:     http://localhost:3001                      ║
║   WebSocket:  ws://localhost:3001                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

✅ Database initialized successfully
✅ LLM connected successfully
🚀 Initializing Agent Orchestrator...
✅ Created 40 agents and 12 resources
▶️ Starting simulation...
```

**Keep this terminal running!**

---

## 🎨 Step 4: Start Frontend

### 4.1 Open New Terminal

```bash
cd /path/to/agent-swarm
```

### 4.2 Install Frontend Dependencies (if not done)

```bash
npm install
```

### 4.3 Start Frontend

```bash
npm run dev
```

**Expected output:**
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host 0.0.0.0 to expose
```

---

## 🌐 Step 5: Access the System

### 5.1 Open Browser

Navigate to: **http://localhost:5173**

You should see:
- Canvas with agents moving
- Control panel on left
- Metrics and LLM panel on right
- Real-time updates

### 5.2 Test LLM Integration

In the LLM panel (right side):
1. Click the settings icon (⚙️)
2. Verify connection status shows "Connected"
3. Click "Test Connection"
5. Try chatting: "Analyze the swarm behavior"

### 5.3 Test Backend API

```bash
# Health check
curl http://localhost:3001/api/health

# Expected:
# {"status":"ok","llmConnected":true,"simulationRunning":true,"clientCount":1}
```

---

## 🚀 Step 6: Quick Start (All-in-One Script)

I've created a startup script that handles all of this:

```bash
# Make script executable
chmod +x start.sh

# Run the script
./start.sh
```

This will:
1. Check if llama.cpp is running
2. Start backend server
3. Start frontend
4. Show you the access URLs

**To stop**: Press Ctrl+C

---

## 🔍 Step 7: Verify Everything Works

### 7.1 Check All Services

```bash
# 1. Check llama.cpp
curl http://localhost:8080/v1/models

# 2. Check backend
curl http://localhost:3001/api/health

# 3. Check frontend
curl http://localhost:5173
```

### 7.2 Test Features

**Frontend:**
- ✅ Agents are moving
- ✅ Metrics are updating
- ✅ Can add resources by clicking
- ✅ Can adjust parameters
- ✅ Can change behaviors

**Backend:**
- ✅ API endpoints work
- ✅ WebSocket is active
- ✅ Database is recording
- ✅ LLM is responding

**LLM:**
- ✅ Connection is stable
- ✅ Chat works
- ✅ Recommendations work
- ✅ Response time < 5 seconds

---

## 📈 Performance Tuning

### 8.1 RTX 5090 Optimization

**llama.cpp settings:**
```bash
./server \
  -m qwen2.5-32b-instruct-q4_k_m.gguf \
  -c 8160 \        # Increase context if VRAM allows
  -ngl 99 \        # All layers to GPU
  --n-batch 1024 \ # Larger batch for speed
  --threads 16     # Adjust based on CPU cores
```

**Monitor VRAM usage:**
```bash
watch -n 1 nvidia-smi
```

### 8.2 Backend Performance

**Adjust in `.env`:**
```env
# Reduce update frequency if too slow
BROADCAST_INTERVAL=200  # ms (default: 100)

# Reduce database writes
SAVE_INTERVAL=5000      # ms (default: 1000)
```

### 8.3 Agent Count

**Recommended for RTX 5090:**
- **50-100 agents**: Smooth 60 FPS
- **100-200 agents**: 30-60 FPS
- **200+ agents**: May need optimization

---

## 🐛 Troubleshooting

### Problem: LLM Connection Failed

**Solution:**
```bash
# 1. Check if llama.cpp is running
ps aux | localhost:8080

# 2. Check llama.cpp logs
# (In the llama.cpp terminal)

# 3. Restart llama.cpp
pkill -f "./server"
./server -m qwen2.5-32b-instruct-q4_k_m.gguf -c 4096 --port 8080 -ngl 99
```

### Problem: Backend Won't Start

**Solution:**
```bash
# 1. Check if port 3001 is in use
lsof -i :3001

# 2. Kill the process
kill -9 <PID>

# 3. Check backend logs
tail -f backend/logs/server.log

# 4. Reset database
rm backend/data/swarm.db
npm run db:init
```

### Problem: Frontend Can't Connect

**Solution:**
```bash
# 1. Check if backend is running
curl http://localhost:3001/api/health

# 2. Check browser console (F12)
# Look for WebSocket errors

# 3. Restart frontend
pkill -f "vite"
npm run dev
```

### Problem: Slow LLM Responses

**Solution:**
```bash
# 1. Check VRAM usage
nvidia-smi

# 2. Reduce context size in llama.cpp
-c 2048  # Instead of 4096

# 3. Reduce max tokens in .env
LLM_MAX_TOKENS=256

# 4. Use smaller model quantization
# q4_k_m instead of q5_k_m
```

### Problem: Database Corruption

**Solution:**
```bash
# 1. Stop backend
pkill -f "tsx watch"

# 2. Delete database
rm backend/data/swarm.db*

# 3. Reinitialize
npm run db:init

# 4. Restart backend
npm run dev
```

---

## 📊 Monitoring

### Monitor All Services

```bash
# Create monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash
while true; do
  clear
  echo "=== System Status ==="
  echo ""
  echo "GPU:"
  nvidia-smi --query-gpu=name,temperature.gpu,utilization.gpu,memory.used --format=csv
  echo ""
  echo "llama.cpp:"
  curl -s http://localhost:8080/v1/models | jq -r '.data[0].id' || echo "Not running"
  echo ""
  echo "Backend:"
  curl -s http://localhost:3001/api/health | jq -r '.status' || echo "Not running"
  echo ""
  echo "Database:"
  ls -lh backend/data/swarm.db 2>/dev/null || echo "Not found"
  echo ""
  sleep 5
done
EOF

chmod +x monitor.sh
./monitor.sh
```

---

## 🎯 Production Deployment

### Using systemd (Linux)

**Create service file:**
```bash
sudo nano /etc/systemd/system/system.service
```

**Add content:**
```ini
[Unit]
Description=Agent Swarm Backend
After=network.target

[Service]
Type=simplef
User =youruser
WorkingDirectory=/path/to/agent-swarm/backend
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=30
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

**Start service:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable system
sudo systemctl start
sudo systemctl status system
```

---

## 📝 Next Steps

### 1. Explore Features
- Try different swarm behaviors
- Test LLM recommendations
- Experiment with parameters
- Build custom scenarios

### 2. Customize
- Modify agent behaviors
- Add new resource types
- Create new threat types
- Extend LLM capabilities

### 3. Scale
- Increase agent count
- Add more resources
- Create multiple swarms
- Optimize performance

---

## 📞 Getting Help

### Documentation
- [Backend README](backend/README.md)
- [API Reference](backend/docs/API.md)
- [Architecture](backend/docs/ARCHITECTURE.md)

### Logs
- Backend: `backend/logs/server.log`
- Frontend: Browser console (F12)
- llama.cpp: Terminal output

### Support
- Check troubleshooting section
- Review documentation
- Check GitHub issues

---

## ✅ Success Criteria

Your setup is complete when:

- ✅ llama.cpp server is running on port 8080
- ✅ Backend server is running on port 3001
- ✅ Frontend is running on port 5173
- ✅ All three can communicate
- ✅ LLM is responding to queries
- ✅ Agents are moving in real-time
- ✅ Metrics are being recorded
- ✅ WebSocket is active

---

**🎉 Congratulations! Your Agent Swarm Intelligence System is now fully operational!**

Enjoy exploring emergent swarm behaviors with AI-driven coordination! 🧬✨
