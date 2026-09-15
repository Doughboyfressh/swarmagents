# Windows Setup Guide - Agent Swarm Intelligence System

Complete setup guide for running the Agent Swarm Intelligence System on Windows with local Qwen 3.6 27B LLM.

## 📋 Prerequisites

### Required Software

1. **Node.js 18+**
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **Git**
   - Download: https://git-scm.com/download/win
   - Verify: `git --version`

3. **llama.cpp** (for LLM inference)
   - Download: https://github.com/ggerganov/llama.cpp/releases
   - Get the latest Windows release with CUDA support

4. **Qwen 3.6 27B Model**
   - You already have it at: `C:\Users\Dough\Desktop\Qwen3.6-27B`

### Hardware Requirements

- **GPU**: RTX 5090 (32GB VRAM) ✅
- **RAM**: 32GB system RAM ✅
- **Storage**: 50GB free space
- **OS**: Windows 10/11

---

## 🚀 Quick Start (Automated)

### Option 1: Start Everything

Simply double-click `start-system.bat` in the project root.

This will:
1. Check if LLM server is running
2. Start LLM server if needed
3. Install dependencies if needed
4. Start backend server
5. Start frontend
6. Open browser automatically

### Option 2: Manual Start

Follow the detailed steps below.

---

## 📦 Detailed Setup

### Step 1: Install llama.cpp

1. **Download llama.cpp**
   - Go to: https://github.com/ggerganov/llama.cpp/releases
   - Download the latest Windows release with CUDA (e.g., `llama-bXXXX-bin-win-cuda-cu12.x-x64.zip`)
   - Extract to: `C:\Users\Dough\Desktop\llama.cpp`

2. **Verify Installation**
   ```cmd
   cd C:\Users\Dough\Desktop\llama.cpp
   dir server.exe
   ```
   You should see `server.exe`

3. **Copy server.exe to Model Directory**
   ```cmd
   copy server.exe "C:\Users\Dough\Desktop\Qwen3.6-27B\"
   ```

### Step 2: Verify Qwen Model

1. **Check Model Directory**
   ```cmd
   dir "C:\Users\Dough\Desktop\Qwen3.6-27B"
   ```
   
   You should see a `.gguf` file (e.g., `qwen2.5-32b-instruct-q4_k_m.gguf`)

2. **Note the Model Filename**
   - The exact filename will be used in the startup script
   - Example: `qwen2.5-32b-instruct-q4_k_m.gguf`

### Step 3: Start LLM Server

**Option A: Use the Batch Script**
```cmd
start-llm.bat
```

**Option B: Manual Start**
```cmd
cd C:\Users\Dough\Desktop\Qwen3.6-27B

server.exe -m qwen2.5-32b-instruct-q4_k_m.gguf ^
  -c 4096 ^
  --host 0.0.0.0 ^
  --port 8080 ^
  -ngl 99 ^
  --n-batch 512 ^
  --threads 16
```

**Parameter Explanation:**
- `-m`: Model file path
- `-c 4096`: Context size (adjust based on VRAM)
- `--host 0.0.0.0`: Listen on all interfaces
- `--port 8080`: Port number
- `-ngl 99`: Offload 99 layers to GPU (use all VRAM)
- `--n-batch 512`: Batch size for faster inference
- `--threads 16`: CPU threads

**Expected Output:**
```
llama server listening on port 8080
```

**Verify Server:**
```cmd
curl http://localhost:8080/v1/models
```

Expected response:
```json
{"object":"list","data":[{"id":"...","object":"model",...}]}
```

### Step 4: Install Backend Dependencies

```cmd
cd backend
npm install
```

### Step 5: Start Backend Server

```cmd
cd backend
npm run dev
```

**Expected Output:**
```
╔═══════════════════════════════════════════════════════════╗
║   🧬 Agent Swarm Intelligence Backend Server             ║
║   Server:     http://localhost:3001                      ║
║   WebSocket:  ws://localhost:3001                        ║
╚═══════════════════════════════════════════════════════════╝

✅ Database initialized successfully
✅ LLM connected successfully
🚀 Initializing Agent Orchestrator...
✅ Created 40 agents and 12 resources
▶️ Starting simulation...
```

**Verify Backend:**
```cmd
curl http://localhost:3001/api/health
```

Expected response:
```json
{"status":"ok","llmConnected":true,"simulationRunning":true,"clientCount":0}
```

### Step 6: Install Frontend Dependencies

```cmd
cd ..
npm install
```

### Step 7: Start Frontend

```cmd
npm run dev
```

**Expected Output:**
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host 0.0.0.0 to expose
```

### Step 8: Open Browser

Navigate to: **http://localhost:5173**

You should see:
- Canvas with agents moving
- Control panel on left
- Metrics and LLM panel on right
- Real-time updates

---

## 🔍 Verification Checklist

### LLM Server
- [ ] Server is running on port 8080
- [ ] `curl http://localhost:8080/v1/models` returns model list
- [ ] GPU is being utilized (check with `nvidia-smi`)

### Backend Server
- [ ] Server is running on port 3001
- [ ] `curl http://localhost:3001/api/health` returns status
- [ ] LLM is connected (`llmConnected: true`)
- [ ] Simulation is running (`simulationRunning: true`)

### Frontend
- [ ] Frontend is running on port 5173
- [ ] Browser opens http://localhost:5173
- [ ] Canvas shows moving agents
- [ ] Metrics are updating
- [ ] LLM panel shows "Connected"

### Integration
- [ ] Frontend connects to backend (check browser console)
- [ ] WebSocket connection established
- [ ] LLM chat works (try sending a message)
- [ ] Agents respond to LLM commands

---

## 🐛 Troubleshooting

### Issue: LLM Server Won't Start

**Symptom:**
```
ERROR: Model directory not found!
```

**Solution:**
1. Verify model path: `C:\Users\Dough\Desktop\Qwen3.6-27B`
2. Check if `.gguf` file exists in directory
3. Update `start-llm.bat` with correct filename

**Symptom:**
```
ERROR: llama.cpp server.exe not found!
```

**Solution:**
1. Download llama.cpp from releases
2. Copy `server.exe` to model directory
3. Or update `start-llm.bat` with correct path

### Issue: Backend Won't Start

**Symptom:**
```
Error: Cannot find module 'express'
```

**Solution:**
```cmd
cd backend
npm install
```

**Symptom:**
```
❌ LLM connection failed
```

**Solution:**
1. Verify LLM server is running
2. Check port 8080 is accessible
3. Verify `.env` file has correct `LLM_ENDPOINT`

### Issue: Frontend Won't Start

**Symptom:**
```
Error: Cannot find module 'react'
```

**Solution:**
```cmd
npm install
```

**Symptom:**
```
WebSocket connection failed
```

**Solution:**
1. Verify backend is running on port 3001
2. Check browser console for errors
3. Verify no firewall blocking WebSocket

### Issue: LLM Not Responding

**Symptom:**
LLM chat shows "Error communicating with LLM server"

**Solution:**
1. Check LLM server is running
2. Verify model is loaded (check llama.cpp logs)
3. Try increasing timeout in `backend/src/services/llm.ts`
4. Check VRAM usage with `nvidia-smi`

### Issue: Poor Performance

**Symptom:**
Low FPS, laggy interface

**Solution:**
1. Reduce agent count (try 40 agents)
2. Reduce LLM context size (try `-c 2048`)
3. Close other GPU-intensive applications
4. Check GPU temperature with `nvidia-smi`

### Issue: High VRAM Usage

**Symptom:**
`nvidia-smi` shows >30GB VRAM usage

**Solution:**
1. Reduce context size: `-c 2048` instead of `-c 4096`
2. Reduce layers offloaded: `-ngl 80` instead of `-ngl 99`
3. Use smaller quantization (q4_k_m instead of q5_k_m)

---

## 📊 Performance Monitoring

### Monitor GPU Usage
```cmd
nvidia-smi
```

Or continuous monitoring:
```cmd
nvidia-smi -l 1
```

### Monitor Backend Logs
Backend logs appear in the backend command window.

### Monitor Frontend Logs
Press F12 in browser to open Developer Tools → Console tab.

### Monitor Database
Database file: `backend/data/swarm.db`

View with SQLite browser: https://sqlitebrowser.org/

---

## 🔧 Configuration

### Backend Configuration

Edit `backend/.env`:
```env
# Server
PORT=3001

# LLM
LLM_ENDPOINT=http://localhost:8080
LLM_MODEL=qwen-3.6-27b
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=512
LLM_ENABLED=true

# Database
DB_PATH=./data/swarm.db
```

### Frontend Configuration

Edit `vite.config.js`:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true
      }
    }
  }
})
```

### LLM Configuration

Edit `start-llm.bat`:
```batch
server.exe -m qwen2.5-32b-instruct-q4_k_m.gguf ^
  -c 4096 ^
  --port 8080 ^
  -ngl 99
```

**Adjust based on your GPU:**
- **RTX 5090 (32GB)**: `-ngl 99 -c 4096`
- **RTX 4090 (24GB)**: `-ngl 80 -c 2048`
- **RTX 3090 (24GB)**: `-ngl 70 -c 2048`

---

## 🔄 Updating the System

### Update Frontend
```cmd
git pull
npm install
npm run dev
```

### Update Backend
```cmd
cd backend
git pull
npm install
npm run dev
```

### Update llama.cpp
1. Download latest release
2. Replace `server.exe` in model directory
3. Restart LLM server

---

## 📝 Common Commands

### Start Everything
```cmd
start-system.bat
```

### Start LLM Only
```cmd
start-llm.bat
```

### Start Backend Only
```cmd
cd backend
npm run dev
```

### Start Frontend Only
```cmd
npm run dev
```

### Check System Status
```cmd
curl http://localhost:3001/api/health
```

### View GPU Usage
```cmd
nvidia-smi
```

### Stop All Servers
Close all command windows or press Ctrl+C in each.

---

## 🎯 Next Steps

1. **Test the System**
   - Try different swarm behaviors
   - Chat with the LLM
   - Adjust parameters
   - Save/load configurations

2. **Explore Features**
   - Try all 9 behavior modes
   - Test all 12 scenarios
   - Enable advanced systems
   - Experiment with LLM director mode

3. **Customize**
   - Modify agent behaviors
   - Add new scenarios
   - Adjust LLM prompts
   - Create custom configurations

4. **Monitor Performance**
   - Watch GPU usage
   - Monitor FPS
   - Track LLM response times
   - Optimize parameters

---

## 📞 Support

### Documentation
- `README.md` - Project overview
- `SETUP_GUIDE.md` - Complete setup guide
- `backend/README.md` - Backend API reference
- `CRITICAL_FIXES.md` - Recent fixes

### Logs
- Backend: Command window output
- Frontend: Browser console (F12)
- LLM: llama.cpp command window

### Health Checks
```cmd
# Backend health
curl http://localhost:3001/api/health

# LLM health
curl http://localhost:8080/v1/models

# Frontend
# Open http://localhost:5173 in browser
```

---

## ✅ Success Criteria

Your system is working when:

- ✅ LLM server responds on port 8080
- ✅ Backend server responds on port 3001
- ✅ Frontend loads on port 5173
- ✅ Agents are moving in canvas
- ✅ Metrics are updating
- ✅ LLM chat works
- ✅ GPU is being utilized
- ✅ No errors in console

---

## 🎉 You're Ready!

Once all verification checks pass, you're ready to explore the Agent Swarm Intelligence System!

**Quick Start:**
1. Run `start-system.bat`
2. Wait for all servers to start
3. Open http://localhost:5173
4. Start exploring!

**Need Help?**
- Check troubleshooting section
- Review documentation
- Check logs for errors
- Verify all services are running

Enjoy your advanced multi-agent swarm system with AI-powered coordination! 🧬✨
