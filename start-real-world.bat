@echo off
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║   🚀 Starting Real-World Agent Swarm System              ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Python and Node.js found
echo.

REM Install Python dependencies if needed
echo 📦 Checking Python dependencies...
pip show flask >nul 2>&1
if errorlevel 1 (
    echo Installing Flask...
    pip install flask flask-cors pyautogui pyperclip psutil requests
) else (
    echo ✅ Flask already installed
)

pip show pyautogui >nul 2>&1
if errorlevel 1 (
    echo Installing PyAutoGUI...
    pip install pyautogui
) else (
    echo ✅ PyAutoGUI already installed
)

pip show psutil >nul 2>&1
if errorlevel 1 (
    echo Installing psutil...
    pip install psutil
) else (
    echo ✅ psutil already installed
)

echo.
echo ═══════════════════════════════════════════════════════════
echo 🐍 Starting Real World Executor (Python Server)...
echo ═══════════════════════════════════════════════════════════
echo.

REM Start Python executor in a new window
start "Real World Executor" cmd /k "python real_world_server.py"

REM Wait for Python server to start
echo Waiting for Real World Executor to initialize...
timeout /t 3 /nobreak >nul

echo.
echo ═══════════════════════════════════════════════════════════
echo 🟢 Starting Backend Server (Node.js)...
echo ═══════════════════════════════════════════════════════════
echo.

REM Start backend
cd backend
npm run dev

echo.
echo ═══════════════════════════════════════════════════════════
echo ✅ System started!
echo.
echo 📝 To stop:
echo    1. Close the 'Real World Executor' window
echo    2. Press Ctrl+C in this window
echo ═══════════════════════════════════════════════════════════
