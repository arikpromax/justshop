@echo off
chcp 65001 >nul
title Foto tovariv - Just shop
cd /d "%~dp0"
node "tools/foto.js"
echo.
pause
