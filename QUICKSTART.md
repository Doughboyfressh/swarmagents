# 🚀 Quick Start Guide - Complete Setup

Get your Agent Swarm Intelligence System running in 5 minutes!

## ⚡ Fast Track (5 Minutes)

### Step 1: Install llama.cpp (2 minutes)

**Double-click: `install-llama.bat`**

This will automatically:
- Download llama.cpp (~100-200 MB)
- Extract files
- Copy server.exe to your model directory

**Or manual download:**
1. Go to: https://github.com/ggerganov/llama.cpp/releases
2. Download: `llama-bXXXX-bin-win-cuda-cu12.4-x64.zip`
3. Extract and copy `server.exe` to: `C:\Users\Dough\Desktop\Qwen3.6-27B\`

### Step 2: Start Everything (1 minute)

**Double-click: `start-system.bat`**

This will:
- ✅ Start LLM server with your Qwen model
- ✅ Start backend server
- ✅ Start frontend
- ✅ Open browser automatically

### Step 3: Start Using! (2 minutes)

Your browser opens to: **http://localhost:5173**

Try these:
1. **Chat with LLM**: Type "Analyze the swarm behavior"
2. **Change behavior**: Click different behavior modes
3. **Enable Director**: Let LLM control the swarm
4. **Adjust parameters**: See real-time effects

---

## 📋 Complete Checklist

### Before You Start
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Model file exists: `C:\Users\Dough\Desktop\Qwen3.6-27B\Qwen3.6-27B-UD-Q6_K_XL.gguf`
- [ ] 50GB free disk space
- [ ] RTX 5090 GPU with 32GB VRAM

### Installation
- [ ] Run `install-llama.bat` OR manually install llama.cpp
- [ ] Verify `server.exe` exists in model directory
- [ ] Run `cd backend && npm install`
- [ ] Run `npm install` in project root

### First Run
- [ ] Run `start-system.bat`
- [ ] Wait for all servers to start
- [ ] Browser opens automatically
- [ ] Verify agents are moving on canvas
- [ ] Test LLM chat in right panel

---

## 🎯 What to Try First

### 1. Basic Swarm Behavior
- Watch agents flock together
- Click canvas to add resources
- Adjust parameters and see effects

### 2. Chat with LLM
- Open LLM panel (right side)
- Type: "What patterns do you see?"
- Get AI analysis of swarm behavior

### 3. Enable Director Mode
- Click "Start Director"
- Set goal: "Maximize resource collection"
- Watch LLM make autonomous decisions

### 4. Try Different Scenarios
- Click scenario buttons (left panel)
- Try "Neural Evolution" 🧬
- Try "Ant Colony" 🐜
- Try "Predator & Prey" 🐺

---

## 🔍 Verify Everything Works

### Check LLM Server
```cmd
curl http://localhost:8080/v1/models
```
Should return model information.

### Check Backend
```cmd
curl http://localhost:3001/api/health
```
Should return: `{"status":"ok","llmConnected":true,...}`

### Check Frontend
Open: http://localhost:5173

Should see:
- Moving agents on canvas
- Control panel on left
- Metrics on right
- LLM chat panel

---

## 🐛 Common Issues

### Issue: "server.exe not found"
**Solution:** Run `install-llama.bat` or see `INSTALL_LLAMA.md`

### Issue: "Cannot connect to LLM"
**Solution:** 
1. Verify LLM server is running
2. Check port 8080 is available
3. Try: `curl http://localhost:8080/v1/models`

### Issue: "Backend won't start"
**Solution:**
```cmd
cd backend
npm install
npm run dev
```

### Issue: "Frontend won't load"
**Solution:**
```cmd
npm install
npm run dev
```

---

## 📊 Monitor Performance

### Check GPU Usage
```cmd
nvidia-smi
```

Expected:
- GPU utilization: 80-95%
- Memory: ~28GB / 32GB
- Process: server.exe

### Check System Status
```cmd
curl http://localhost:3001/api/health
```

Should show:
- `llmConnected: true`
- `simulationRunning: true`
- `clientCount: 1`

---

## 🎓 Next Steps

### Learn the Features
1. Read `README.md` for feature overview
2. Check `WINDOWS_SETUP.md` for detailed setup
3. Review `LLM_CONFIGURED.md` for LLM usage

### Explore Advanced Features
- Enable all advanced systems (left panel)
- Try Q-learning mode
- Enable construction system
- Test multi-swarm dynamics

### Customize
- Create your own scenarios
- Modify agent behaviors
- Adjust LLM prompts
- Save interesting configurations

---

## 📞 Need Help?

### Documentation
- **Quick Start**: This file
- **Windows Setup**: `WINDOWS_SETUP.md`
- **LLM Install**: `INSTALL_LLAMA.md`
- **LLM Config**: `LLM_CONFIGURED.md`
- **Full System**: `COMPLETE_SYSTEM.md`

### Troubleshooting
- Check `INSTALL_LLAMA.md` for LLM issues
- Check `WINDOWS_SETUP.md` for Windows issues
- Check logs in command windows
- Monitor GPU with `nvidia-smi`

### Health Checks
```cmd
# LLM server
curl http://localhost:8080/v1/models

# Backend
curl http://localhost:3001/api/health

# Frontend
# Open http://localhost:5173 in browser
```

---

## ✅ Success Criteria

You're ready when:
- ✅ LLM server responds on port 8080
- ✅ Backend connects to LLM
- ✅ Frontend loads in browser
- ✅ Agents are moving
- ✅ LLM chat works
- ✅ Director mode works

---

## 🎉 You're Done!

Your Agent Swarm Intelligence System is running with:

✅ **Local LLM**: Qwen 3.6 27B on RTX 5090  
✅ **Backend**: Full API with database  
✅ **Frontend**: Real-time visualization  
✅ **AI Integration**: LLM controls swarm  
✅ **Performance**: Optimized for your hardware  

**Enjoy exploring emergent swarm intelligence!** 🧬✨

---

**Quick Commands:**
- Start everything: `start-system.bat`
- Start LLM only: `start-llm.bat`
- Install llama.cpp: `install-llama.bat`
- Check GPU: `nvidia-smi`
- Check backend: `curl http://localhost:3001/api/health`
