@echo off
title LanguageTool (offline grammar checker) - keep this window open
rem Optional: a fast offline grammar checker for English and German.
rem 1. Install Java 17 or newer:  https://adoptium.net
rem 2. Download https://languagetool.org/download/LanguageTool-stable.zip
rem 3. Unzip it INTO this folder (you get a folder like "LanguageTool-6.6").
rem 4. Double-click this file, then in Writer: Settings > Checker > LanguageTool on this PC.

where java >nul 2>nul
if errorlevel 1 (
  echo Java is not installed. Get it from https://adoptium.net and run this file again.
  start "" https://adoptium.net
  pause
  exit /b
)
set LTDIR=
for /d %%D in ("%~dp0LanguageTool*") do set "LTDIR=%%D"
if "%LTDIR%"=="" (
  echo No LanguageTool folder found next to this file.
  echo Download https://languagetool.org/download/LanguageTool-stable.zip and unzip it here.
  pause
  exit /b
)
echo Starting LanguageTool from %LTDIR% on http://localhost:8081 ...
echo Keep this window open while you use Writer. Close it to stop.
java -cp "%LTDIR%\languagetool-server.jar" org.languagetool.server.HTTPServer --port 8081 --allow-origin "*"
pause
