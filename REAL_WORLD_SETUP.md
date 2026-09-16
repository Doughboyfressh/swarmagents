# Real-World Agent Swarm Setup Guide

This guide explains how to enable your agent swarm to execute real-world actions on your Windows PC.

## Architecture Overview

```
┌─────────────────┐     HTTP      ┌──────────────────┐     HTTP      ┌─────────────────┐
│   Node.js       │◄─────────────►│   Python         │◄─────────────►│   Windows PC    │
│   Backend       │               │   Executor       │               │   (Real World)  │
│   (Port 3001)   │               │   (Port 5000)    │               │                 │
│                 │               │                  │               │ - Shell cmds    │
│ - LLM Service   │               │ - File ops       │               │ - File system   │
│ - Orchestrator  │               │ - Mouse/keyboard │               │ - Browser       │
│ - WebSocket     │               │ - System info    │               │ - Hardware      │
└─────────────────┘               └──────────────────┘               └─────────────────┘
```

## Quick Start

### Step 1: Install Python Dependencies

Open PowerShell and run:

```powershell
pip install flask flask-cors pyautogui pyperclip psutil requests
```

### Step 2: Start the Real World Executor

In PowerShell, navigate to your project folder and run:

```powershell
python real_world_server.py
```

You should see:
```
╔═══════════════════════════════════════════════════════════╗
║   🌍 Real World Executor API Server                      ║
║   Server running on: http://localhost:5000               ║
╚═══════════════════════════════════════════════════════════╝
```

### Step 3: Enable Real-World Mode in Backend

Create or edit `.env` file in the project root:

```env
ENABLE_REAL_WORLD=true
REAL_WORLD_EXECUTOR_URL=http://localhost:5000
```

### Step 4: Start the Backend

```powershell
cd backend
npm run dev
```

Look for:
```
🌍 Real-world execution: ENABLED
   Executor URL: http://localhost:5000
```

### Step 5: Test It!

#### Option A: Via REST API

```powershell
# Test system info
curl http://localhost:5000/system/info

# Execute a shell command
curl -X POST http://localhost:5000/execute `
  -H "Content-Type: application/json" `
  -d '{\"action\":\"run_shell\",\"params\":{\"command\":\"dir C:\\Users\"}}'

# Create a file
curl -X POST http://localhost:5000/execute `
  -H "Content-Type: application/json" `
  -d '{\"action\":\"file_write\",\"params\":{\"path\":\"C:\\Users\\YourName\\Desktop\\test.txt\",\"content\":\"Hello from Agent Swarm!\"}}'
```

#### Option B: Via LLM Chat

Send a message like:
```
Please create a file on my desktop called agentswarm.txt with the text "The swarm is real!"
```

The LLM will respond with an action JSON that gets executed automatically.

## Available Actions

| Action | Description | Example |
|--------|-------------|---------|
| `run_shell` | Execute PowerShell/cmd commands | `{"command": "dir"}` |
| `file_write` | Write content to a file | `{"path": "C:\\file.txt", "content": "hello"}` |
| `file_read` | Read file contents | `{"path": "C:\\file.txt"}` |
| `browser_open` | Open URL in browser | `{"url": "https://google.com"}` |
| `type_text` | Type keyboard input | `{"text": "Hello World"}` |
| `click_mouse` | Click mouse | `{"x": 100, "y": 200}` or `{}` for current position |
| `get_system_info` | Get CPU/RAM/disk stats | `{}` |

## Security Features

1. **Path Restrictions**: File operations limited to safe directories:
   - User home directory
   - Documents folder
   - Desktop folder
   - Current working directory

2. **Explicit Enable Required**: Must set `ENABLE_REAL_WORLD=true` in `.env`

3. **Action Logging**: All actions are logged to console

4. **Failsafe**: Move mouse to screen corner to stop PyAutoGUI actions

## Example Use Cases

### 1. Automated File Organization
```
"Organize my Downloads folder by moving all .pdf files to a PDFs subfolder"
```

### 2. System Monitoring
```
"Check my CPU and RAM usage every minute and alert me if either exceeds 80%"
```

### 3. Browser Automation
```
"Open Chrome and navigate to github.com, then open the trending page"
```

### 4. Data Collection
```
"Read all text files in my Documents folder and summarize their contents"
```

### 5. PC Control
```
"Take a screenshot and save it to my Desktop as capture.png"
```

## Troubleshooting

### "Real-world execution is disabled"
- Check `.env` has `ENABLE_REAL_WORLD=true`
- Restart the backend after changing `.env`

### "Connection refused" on port 5000
- Ensure `python real_world_server.py` is running
- Check firewall isn't blocking port 5000

### PyAutoGUI failsafe triggered
- You moved the mouse too quickly to a corner
- This is a safety feature - just retry the action

### Permission denied for file operations
- Ensure the path is in allowed directories
- Run PowerShell as Administrator if needed

## Advanced: Custom Actions

Edit `real_world_executor.py` to add custom actions:

```python
def execute_action(self, action_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
    if action_type == "my_custom_action":
        return self.my_custom_function(params.get("param1"))
    
    # ... existing code
```

## Stopping the System

1. Press `Ctrl+C` in the Python executor terminal
2. Press `Ctrl+C` in the Node.js backend terminal

## Next Steps

- Integrate with physical robots (DJI Tello, Raspberry Pi)
- Add IoT device control (smart lights, sensors)
- Connect to cloud APIs (AWS, Azure, GCP)
- Implement voice control integration
