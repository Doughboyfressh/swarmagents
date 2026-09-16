@echo off
REM Start LLM Server for Agent Swarm Intelligence System
REM This script starts the llama.cpp server with Qwen 3.6 27B model

echo ========================================
echo   Starting LLM Server
echo ========================================
echo.

REM Check if model directory exists
if not exist "C:\Users\Dough\Desktop\Qwen3.6-27B" (
    echo ERROR: Model directory not found!
    echo Expected: C:\Users\Dough\Desktop\Qwen3.6-27B
    echo.
    pause
    exit /b 1
)

REM Find the model file
set MODEL_FILE=
for %%f in ("C:\Users\Dough\Desktop\Qwen3.6-27B\*.gguf") do (
    set MODEL_FILE=%%f
)

if "%MODEL_FILE%"=="" (
    echo ERROR: No .gguf model file found in directory!
    echo Expected: C:\Users\Dough\Desktop\Qwen3.6-27B\*.gguf
    echo.
    pause
    exit /b 1
)

echo Found model: %MODEL_FILE%
echo.
echo Starting llama.cpp server...
echo Server will be available at: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start llama.cpp server
REM Adjust these parameters based on your GPU VRAM:
REM - RTX 5090 (32GB VRAM): Can use -ngl 99 (all layers to GPU)
REM - RTX 4090 (24GB VRAM): Use -ngl 80-90
REM - RTX 3090 (24GB VRAM): Use -ngl 70-80

cd /d "C:\Users\Dough\Desktop\Qwen3.6-27B"

REM If you have llama.cpp installed, use this:
if exist "server.exe" (
    echo Starting llama.cpp server with CUDA support...
    echo.
    echo Model: %MODEL_FILE%
    echo Context: 4096 tokens
    echo GPU Layers: 99 (all layers to GPU)
    echo Port: 8080
    echo.
    echo ========================================
    echo.
    
    server.exe -m "%MODEL_FILE%" -c 4096 --host 0.0.0.0 --port 8080 -ngl 99 --n-batch 512
) else (
    echo ERROR: llama.cpp server.exe not found!
    echo.
    echo ========================================
    echo   Installation Required
    echo ========================================
    echo.
    echo You need to install llama.cpp to run the LLM server.
    echo.
    echo QUICK INSTALLATION:
    echo.
    echo Option 1: Run install-llama.bat (automated)
    echo   - Double-click: install-llama.bat
    echo   - Follow the prompts
    echo   - Restart this script
    echo.
    echo Option 2: Manual installation
    echo   1. Download from:
    echo      https://github.com/ggerganov/llama.cpp/releases
    echo.
    echo   2. Get file: llama-bin-win-cuda-cu12.4-x64.zip
    echo      (Make sure it says "cuda" and "cu12.x")
    echo.
    echo   3. Extract and copy server.exe to:
    echo      C:\Users\Dough\Desktop\Qwen3.6-27B\
    echo.
    echo   4. Run this script again
    echo.
    echo See INSTALL_LLAMA.md for detailed instructions.
    echo.
    pause
    exit /b 1
)
