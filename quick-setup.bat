@echo off
REM Quick Setup - Find and copy server.exe from your existing llama.cpp installation

echo ========================================
echo   Quick Setup - Find server.exe
echo ========================================
echo.

set MODEL_DIR=C:\Users\Dough\Desktop\Qwen3.6-27B

REM Check if server.exe already exists
if exist "%MODEL_DIR%\server.exe" (
    echo ✓ server.exe already exists in model directory!
    echo.
    echo You can now run:
    echo   start-llm.bat
    echo.
    pause
    exit /b 0
)

echo Searching for llama.cpp server.exe...
echo.

REM Try to find server.exe in common locations
set FOUND=

REM Check if llama.cpp is in common locations
for %%d in (
    "C:\Users\Dough\Desktop\llama.cpp"
    "C:\Users\Dough\llama.cpp"
    "C:\llama.cpp"
    "C:\Program Files\llama.cpp"
    "C:\Program Files (x86)\llama.cpp"
    "%USERPROFILE%\llama.cpp"
    "%USERPROFILE%\Downloads\llama.cpp"
) do (
    if exist "%%~d\server.exe" (
        set FOUND=%%~d\server.exe
        goto :found
    )
)

REM Search recursively in user directory
echo Searching in user directories (this may take a moment)...
for /r "%USERPROFILE%" %%f in (server.exe) do (
    if exist "%%f" (
        set FOUND=%%f
        goto :found
    )
)

:notfound
echo.
echo ✗ Could not find server.exe automatically.
echo.
echo Please manually copy server.exe to:
echo   %MODEL_DIR%
echo.
echo Or specify the path:
set /p SERVER_PATH="Enter full path to server.exe: "
if exist "%SERVER_PATH%" (
    copy "%SERVER_PATH%" "%MODEL_DIR%\server.exe"
    goto :success
)
echo.
echo ✗ File not found. Please copy server.exe manually.
pause
exit /b 1

:found
echo ✓ Found server.exe at:
echo   %FOUND%
echo.
echo Copying to model directory...
copy "%FOUND%" "%MODEL_DIR%\server.exe" >nul
if %ERRORLEVEL% EQU 0 (
    goto :success
) else (
    echo ✗ Failed to copy. Please copy manually.
    pause
    exit /b 1
)

:success
echo.
echo ========================================
echo   ✓ Setup Complete!
echo ========================================
echo.
echo server.exe is ready at:
echo   %MODEL_DIR%\server.exe
echo.
echo Next steps:
echo   1. Run: start-llm.bat
echo   2. Or run: start-system.bat
echo.
pause
