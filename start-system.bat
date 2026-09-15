@echo off
REM Complete System Startup Script for Windows
REM This script starts all components of the Agent Swarm Intelligence System

echo ========================================
echo   Agent Swarm Intelligence System
echo   Complete System Startup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/4] Checking LLM Server...
echo.

REM Check if LLM server is already running
curl -s http://localhost:8080/v1/models >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ LLM server is already running
    echo.
) else (
    echo LLM server not running. Starting in new window...
    start "LLM Server" cmd /k "call start-llm.bat"
    echo Waiting for LLM server to start...
    timeout /t 10 /nobreak >nul
    
    REM Verify it started
    curl -s http://localhost:8080/v1/models >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo WARNING: LLM server may not have started properly
        echo Please check the LLM Server window
        echo.
    ) else (
        echo ✓ LLM server started successfully
        echo.
    )
)

echo [2/4] Starting Backend Server...
echo.

REM Check if backend dependencies are installed
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    echo.
)

REM Start backend in new window
start "Backend Server" cmd /k "cd backend && npm run dev"
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Verify backend started
curl -s http://localhost:3001/api/health >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Backend server may not have started properly
    echo Please check the Backend Server window
    echo.
) else (
    echo ✓ Backend server started successfully
    echo.
)

echo [3/4] Starting Frontend...
echo.

REM Check if frontend dependencies are installed
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    echo.
)

REM Start frontend in new window
start "Frontend" cmd /k "npm run dev"
echo Waiting for frontend to start...
timeout /t 5 /nobreak >nul

echo ✓ Frontend started successfully
echo.

echo [4/4] System Ready!
echo.
echo ========================================
echo   All Systems Running
echo ========================================
echo.
echo Access Points:
echo   Frontend:    http://localhost:5173
echo   Backend API: http://localhost:3001/api
echo   WebSocket:   ws://localhost:3001
echo   LLM API:     http://localhost:8080/v1
echo.
echo To stop the system:
echo   - Close all command windows
echo   - Or press Ctrl+C in each window
echo.
echo Press any key to open the frontend in your browser...
pause >nul

start http://localhost:5173

echo.
echo System is running. Close this window to stop monitoring.
echo The other windows will continue running.
pause
