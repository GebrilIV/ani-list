@echo off
chcp 65001 >nul
title Serveur PHP Local

REM ===== Configuration =====
set PORT=8000
set ROOT=public

REM Vérifier si PHP est disponible
php -v >nul 2>&1
if errorlevel 1 (
    echo Erreur : PHP n'est pas installé ou n'est pas dans le PATH.
    pause
    exit /b
)

REM Lancer le serveur PHP
echo 📂 Serveur lancé dans le dossier : %cd%\%ROOT%
echo 🌐 URL locale :   http://localhost:%PORT%/
echo 🔧 Appuyez sur CTRL+C pour arrêter le serveur.
php -S 0.0.0.0:%PORT% -t %ROOT%
pause
