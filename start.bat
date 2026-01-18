@echo off
chcp 65001 >nul
title Serveur PHP Local

REM ===== Configuration =====
set PORT=8000
set ROOT=public

REM Dossier courant
set DIR=%cd%

REM Récupération de l'IP locale (IPv4)
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%A
    goto :ipfound
)

:ipfound
set IP=%IP: =%

echo 📂 Serveur lancé dans le dossier : %DIR%\%ROOT%
echo 🌐 URL locale :   http://localhost:%PORT%/
echo 📱 URL réseau :   http://%IP%:%PORT%/
echo 🔧 Appuie sur CTRL+C pour arrêter.
echo.

php -S 0.0.0.0:%PORT% -t %ROOT%

pause
