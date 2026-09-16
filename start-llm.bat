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

REM Use llama.exe from WindowsApps directory
if exist "C:\Users\Dough\AppData\Local\Microsoft\WindowsApps\llama.exe" (
    echo Starting llama.cpp server with CUDA support...
    echo.
    echo Model: %MODEL_FILE%
    echo Context: 4096 tokens
    echo GPU Layers: 99 (all layers to GPU)
    echo Port: 8080
    echo Host: 0.0.0.0 (accessible from network)
    echo.
    echo ========================================
    echo.
    
    C:\Users\Dough\AppData\Local\Microsoft\WindowsApps\llama.exe serve -m "%MODEL_FILE%" -c 4096 --host 0.0.0.0 --port 8080 -ngl 99
) else if exist "server.exe" (
    echo Starting llama.cpp server with CUDA support...
    echo.
    echo Model: %MODEL_FILE%
    echo Context: 4096 tokens
    echo GPU Layers: 99 (all layers to GPU)
    echo Port: 8080
    echo.
    echo ========================================
    echo.
    
    server.exe -m "%MODEL_FILE%" -c 4096 --host 0.0.0.0 --port 8080 -ngl 99
) else (
    echo ERROR: llama.cpp not found!
    echo.
    echo ========================================
    echo   Installation Required
    echo ========================================
    echo.
    echo llama.exe was not found at:
    echo   C:\Users\Dough\AppData\Local\Microsoft\WindowsApps\llama.exe
    echo.
    echo Please ensure llama.cpp is installed from Windows Store
    echo or download from: https://github.com/ggerganov/llama.cpp/releases
    echo.
    pause
    exit /b 1
)
