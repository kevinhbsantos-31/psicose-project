@echo off
rem Abre o portal PSICOSE (previa local). Liga o servidor se ainda nao estiver ligado.
cd /d "%~dp0"
netstat -ano | findstr /r /c:":5180 .*LISTENING" >nul
if errorlevel 1 (
  start "PSICOSE - servidor (nao feche esta janela)" /min node server.mjs
  timeout /t 2 /nobreak >nul
)
start "" "http://localhost:5180"
