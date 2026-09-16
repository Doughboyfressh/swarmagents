@echo off
REM Find and copy server.exe from existing llama.cpp installation to model directory

echo ========================================
echo   Copy server.exe to Model Directory
echo ========================================
echo.

set MODEL_DIR=C:\Users\Dough\Desktop\Qwen3.6-27B

REM Check if server.exe already exists in model directory
if exist "%MODEL_DIR%\server.exe" (
    echo server.exe already exists in model directory!
    echo.
    echo Location: %MODEL_DIR%\server.exe
    echo.
    echo You can now run: start-llm.bat
    echo.
    pause
    exit /b 0
)

echo Searching for llama.cpp server.exe...
echo.

REM Common llama.cpp installation locations
set FOUND=

REM Check current directory
if exist "server.exe" (
    set FOUND=%CD%\server.exe
    goto :copy
)

REM Check common locations
if exist "C:\Users\Dough\Desktop\llama.cpp\server.exe" (
    set FOUND=C:\Users\Dough\Desktop\llama.cpp\server.exe
    goto :copy
)

if exist "C:\Users\Dough\llama.cpp\server.exe" (
    set FOUND=C:\Users\Dough\llama.cpp\server.exe
    goto :copy
)

if exist "C:\llama.cpp\server.exe" (
    set FOUND=C:\llama.cpp\server.exe
    goto :copy
)

if exist "C:\Program Files\llama.cpp\server.exe" (
    set FOUND=C:\Program Files\llama.cpp\server.exe
    goto :copy
)

REM Search in Downloads
for /r "C:\Users\Dough\Downloads" %%f in (server.exe) do (
    if exist "%%f" (
        set FOUND=%%f
        goto :copy
    )
)

echo.
echo Could not find server.exe automatically.
echo.
echo Please specify the path to server.exe:
echo.
set /p MANUAL_PATH="Enter full path to server.exe: "

if exist "%MANUAL_PATH%" (
    set FOUND=%MANUAL_PATH%
    goto :copy
)

echo.
echo ERROR: File not found!
echo.
pause
exit /b 1

:copy
echo.
echo Found server.exe at:
echo   %FOUND%
echo.
echo Copying to model directory...
echo.

copy /Y "%FOUND%" "%MODEL_DIR%\server.exe"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to copy server.exe!
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Success!
echo ========================================
echo.
echo server.exe copied to:
echo   %MODEL_DIR%\server.exe
echo.
echo You can now run:
echo   start-llm.bat
echo.
echo Or start everything with:
echo   start-system.bat
echo.
pause
