@echo off
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║   🚀 Enhanced Agent Swarm - All Features Enabled         ║
echo ║      Vision + Memory + Self-Correction + Skills          ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Check Python installation
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.10+
    pause
    exit /b 1
)

echo Installing Python dependencies...
pip install flask flask-cors pyautogui pyperclip psutil requests pillow chromadb opencv-python-headless --quiet

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed successfully
echo.
echo Starting Enhanced Real World Executor Server...
echo.
echo This server provides:
echo   👁️ Vision capabilities (Qwen-VL integration)
echo   🧠 Long-term memory (ChromaDB vector database)
echo   🛡️ Self-correction (Critic agent review)
echo   🛠️ Skill libraries (Dynamic capability expansion)
echo   ⚡ RTX 5090 optimized inference
echo.
echo Press Ctrl+C to stop the server
echo.

start http://localhost:3000

python enhanced_real_world_executor.py

pause
