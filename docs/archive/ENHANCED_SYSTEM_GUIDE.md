# 🚀 Enhanced Agent Swarm with Vision - Complete Guide

## Overview
Your agent swarm has been upgraded from a simulation to a **fully autonomous, self-improving real-world execution system** with:

- 👁️ **Vision Capabilities** - Screen perception via Qwen3.6-27B
- 🧠 **Long-term Memory** - ChromaDB vector storage
- 🛡️ **Self-Correction** - Critic agent review system
- 🛠️ **Skill Libraries** - Dynamic capability expansion
- ⚡ **RTX 5090 Optimized** - Full GPU acceleration

## Quick Start (Windows)

### 1. Install Dependencies
```powershell
pip install flask flask-cors pyautogui pyperclip psutil requests pillow chromadb opencv-python-headless
```

### 2. Run the System
```powershell
.\start-enhanced.bat
```

Or manually:
```powershell
# Terminal 1: Python Executor
python real_world_executor.py

# Terminal 2: Node Backend
npm run dev

# Terminal 3: Frontend (if separate)
npm run dev --prefix client
```

## New API Endpoints

### Vision Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/vision/screenshot` | POST | Capture screen as base64 image |
| `/api/vision/analyze` | POST | Capture screen + system context for LLM |

### Action Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/action/execute` | POST | Execute action with before/after screenshots |
| `/api/system/stats` | GET | Get CPU, RAM, disk usage |

## Usage Examples

### With Vision
```json
// Request screenshot
POST http://localhost:5000/api/vision/analyze
Response: {
  "success": true,
  "image": "data:image/jpeg;base64,...",
  "context": {
    "resolution": [1920, 1080],
    "cpu_usage": 23.5,
    "ram_usage": 45.2
  }
}
```

### Send to Qwen3.6-27B
The image is automatically sent to your LLM with this prompt structure:
```
[System: Here is the current screen state. Analyze what you see and determine next action.]
[Image: <base64_data>]
[Context: CPU 23%, RAM 45%, Resolution 1920x1080]
[User Goal: <your task>]
```

### Execute Action with Verification
```json
POST http://localhost:5000/api/action/execute
{
  "action": "click",
  "params": {"x": 500, "y": 300}
}
Response: {
  "success": true,
  "result": {"status": "clicked", "coords": [500, 300]},
  "vision": {
    "before": "data:image/jpeg;base64,...",
    "after": "data:image/jpeg;base64,..."
  }
}
```

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────────────┐
│   React UI  │────▶│  Node.js API │────▶│  Python Executor   │
│  (Port 5173)│     │  (Port 3001) │     │    (Port 5000)     │
└─────────────┘     └──────────────┘     └────────────────────┘
                           │                      │
                           ▼                      ▼
                    ┌──────────────┐     ┌────────────────────┐
                    │  Qwen3.6-27B │     │  Windows PC        │
                    │  (llama.cpp) │     │  - File System     │
                    │  RTX 5090    │     │  - Browser         │
                    └──────────────┘     │  - Mouse/Keyboard  │
                                         │  - Shell Commands  │
                                         └────────────────────┘
                                                │
                                                ▼
                                         ┌────────────────────┐
                                         │   ChromaDB Memory  │
                                         │   ./agent_memory/  │
                                         └────────────────────┘
```

## Prompt Engineering for Qwen3.6-27B

Use this system prompt for best results:

```
You are an autonomous agent swarm with vision capabilities running on Windows.
You can SEE the screen via screenshots and TAKE ACTIONS via mouse/keyboard.

AVAILABLE ACTIONS:
- screenshot: Capture current screen
- click: Click at x,y coordinates  
- type: Type text
- shell: Run command
- file_read: Read file
- file_write: Write file

VISION WORKFLOW:
1. Take screenshot to see current state
2. Analyze what you see
3. Plan next action
4. Execute action
5. Verify result with new screenshot
6. Repeat until goal achieved

SAFETY RULES:
- Always verify before destructive actions
- Move mouse to corner for emergency stop
- Report progress after each step
```

## Memory System

ChromaDB stores:
- Successful action sequences
- Failed attempts and lessons learned
- User preferences
- Skill definitions

Query examples:
- "Show me similar tasks we've done"
- "What worked last time?"
- "Remember my preferred workflow"

## Self-Correction Flow

```
User Request
    │
    ▼
┌─────────────┐
│  Planner    │ → Creates action plan
└─────────────┘
    │
    ▼
┌─────────────┐
│   Critic    │ → Reviews for safety/errors
└─────────────┘
    │
    ▼
┌─────────────┐
│  Executor   │ → Takes action + screenshots
└─────────────┘
    │
    ▼
┌─────────────┐
│  Verifier   │ → Compares before/after images
└─────────────┘
    │
    ▼
Success? ──No──▶ Retry with correction
    │
   Yes
    │
    ▼
┌─────────────┐
│   Memory    │ → Store successful pattern
└─────────────┘
```

## Troubleshooting

### Vision not working
- Ensure `pillow` is installed: `pip install pillow`
- Check ENABLE_VISION = True in executor
- Verify screenshot permissions on Windows

### Slow performance
- Reduce SCREENSHOT_QUALITY (default 85)
- Use region screenshots instead of full screen
- Ensure llama.cpp is using CUDA: `nvidia-smi`

### Memory issues
- Clear ChromaDB: Delete `./agent_memory/` folder
- Reduce context window size
- Restart Python executor

### Actions failing
- Check PyAutoGUI failsafe (move mouse to unstick)
- Run as Administrator for some operations
- Review error logs in console

## Security Notes

⚠️ **Important:**
- Only run on trusted networks (localhost is safe)
- Path traversal protection enabled
- Emergency stop: Move mouse to top-left corner
- Review destructive commands before executing
- Set `ENABLE_REAL_WORLD=false` when not in use

## Next Steps

1. **Test Vision**: "Take a screenshot and describe what you see"
2. **Test Memory**: "Remember that I prefer dark mode"
3. **Test Skills**: "Run a system health check"
4. **Test Self-Correction**: "Organize my Downloads folder"

Your RTX 5090 will handle Qwen3.6-27B inference while Python executes real actions!
