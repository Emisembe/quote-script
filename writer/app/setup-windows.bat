@echo off
title Emisembe Writer - offline setup
echo.
echo  === Emisembe Writer: offline setup ===
echo.

rem --- 1. Disk space check -------------------------------------------------
for /f %%F in ('powershell -NoProfile -Command "[math]::Floor((Get-PSDrive C).Free/1GB)"') do set FREEGB=%%F
echo  Free space on C: %FREEGB% GB
if %FREEGB% LSS 8 (
  echo.
  echo  WARNING: You need at least 8 GB free ^(Ollama about 2 GB + model about 3.3 GB + room to work^).
  echo  Free up space first: Settings ^> System ^> Storage ^> Temporary files / Cleanup recommendations.
  echo  See README.md, section "Free up disk space".
  echo.
  pause
  exit /b
)

rem --- 2. Ollama installed? ------------------------------------------------
where ollama >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Ollama is not installed yet. Your browser will open the download page.
  echo  Install it, then run this file again.
  start "" https://ollama.com/download
  echo.
  pause
  exit /b
)

rem --- 3. Allow the Writer page to talk to Ollama ---------------------------
echo.
echo  Allowing the Writer app to talk to Ollama...
setx OLLAMA_ORIGINS "*" >nul
echo  done.

rem --- 4. Download the model -----------------------------------------------
echo.
echo  Downloading the AI model gemma3:4b (about 3.3 GB). This can take a while...
ollama pull gemma3:4b
if errorlevel 1 (
  echo  The download failed. Check your internet connection and run this file again.
  pause
  exit /b
)

echo.
echo  ============================================================
echo   Almost done!
echo   1. Quit Ollama: right-click the llama icon near the clock ^> Quit.
echo   2. Start Ollama again from the Start menu.
echo   3. Double-click start-writer.bat
echo  ============================================================
echo.
pause
