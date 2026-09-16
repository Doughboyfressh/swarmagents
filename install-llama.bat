@echo off
REM Install llama.cpp for Windows
REM This script downloads and sets up llama.cpp with CUDA support

echo ========================================
echo   Installing llama.cpp for Windows
echo ========================================
echo.

REM Set installation directory
set INSTALL_DIR=C:\Users\Dough\Desktop\llama.cpp
set MODEL_DIR=C:\Users\Dough\Desktop\Qwen3.6-27B

echo Installation directory: %INSTALL_DIR%
echo Model directory: %MODEL_DIR%
echo.

REM Check if already installed
if exist "%INSTALL_DIR%\server.exe" (
    echo llama.cpp is already installed!
    echo.
    echo Copying server.exe to model directory...
    copy /Y "%INSTALL_DIR%\server.exe" "%MODEL_DIR%\server.exe"
    echo.
    echo Installation complete!
    echo.
    pause
    exit /b 0
)

echo Downloading llama.cpp...
echo.
echo This will download the latest release with CUDA support.
echo File size: ~100-200 MB
echo.

REM Create installation directory
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM Download latest release
echo Downloading from GitHub releases...
echo.

REM Use PowerShell to download
powershell -Command "& {$url = 'https://github.com/ggerganov/llama.cpp/releases/latest'; $response = Invoke-WebRequest -Uri $url -MaximumRedirection 0 -ErrorAction SilentlyContinue; $latestVersion = $response.Headers.Location -replace '.*/tag/', ''; $downloadUrl = \"https://github.com/ggerganov/llama.cpp/releases/download/$latestVersion/llama-$latestVersion-bin-win-cuda-cu12.4-x64.zip\"; Write-Host \"Downloading: $downloadUrl\"; Invoke-WebRequest -Uri $downloadUrl -OutFile \"$env:TEMP\llama-cpp.zip\"}"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Download failed!
    echo.
    echo Manual installation required:
    echo 1. Go to: https://github.com/ggerganov/llama.cpp/releases
    echo 2. Download: llama-bin-win-cuda-cu12.x-x64.zip
    echo 3. Extract to: %INSTALL_DIR%
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)

echo.
echo Extracting files...
powershell -Command "Expand-Archive -Path $env:TEMP\llama-cpp.zip -DestinationPath '%INSTALL_DIR%' -Force"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Extraction failed!
    echo.
    pause
    exit /b 1
)

echo.
echo Finding server.exe...
cd /d "%INSTALL_DIR%"

REM Find server.exe in extracted files
set SERVER_EXE=
for /r %%f in (server.exe) do (
    set SERVER_EXE=%%f
)

if "%SERVER_EXE%"=="" (
    echo.
    echo ERROR: server.exe not found in extracted files!
    echo.
    echo Please check the extraction and try again.
    echo.
    pause
    exit /b 1
)

echo Found: %SERVER_EXE%
echo.

REM Copy server.exe to model directory
echo Copying server.exe to model directory...
copy /Y "%SERVER_EXE%" "%MODEL_DIR%\server.exe"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to copy server.exe!
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo llama.cpp is now installed at:
echo   %INSTALL_DIR%
echo.
echo server.exe copied to:
echo   %MODEL_DIR%\server.exe
echo.
echo You can now run: start-llm.bat
echo.

REM Clean up
del /q "%TEMP%\llama-cpp.zip" 2>nul

pause
