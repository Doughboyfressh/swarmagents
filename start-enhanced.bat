@echo off
echo ========================================
echo  Enhanced Agent Swarm with Vision
echo  Qwen-VL 27B on RTX 5090
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found! Please install Python 3.10+
    pause
    exit /b 1
)

REM Install dependencies if needed
echo Installing Python dependencies...
pip install flask flask-cors pyautogui pyperclip psutil requests pillow chromadb opencv-python-headless --quiet

echo.
echo Starting Enhanced Real World Executor (Port 5000)...
echo Vision capabilities ENABLED for Qwen-VL
echo.

start "Real World Executor" python real_world_executor.py

REM Wait for server to start
timeout /t 3 /nobreak >nul

echo Starting Node.js backend...
cd /d "%~dp0"
start "Agent Swarm Backend" npm run dev

echo.
echo System starting up...
echo - Python Executor: http://localhost:5000
echo - Node Backend: http://localhost:3001
echo - Frontend: http://localhost:5173
echo.
echo Move mouse to top-left corner for emergency stop!
echo.
pause
