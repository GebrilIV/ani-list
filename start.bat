@echo off
chcp 65001 >nul
title Serveur PHP Local

REM ===== Configuration =====
set PORT=8000
set ROOT=public
set PHP_PATH=php\php-8.5.1-Win32-vs17-x64\php.exe

REM Vérifier si le PHP inclus dans le projet est disponible
if not exist "%PHP_PATH%" (
    echo Erreur : PHP inclus dans le projet introuvable. Assurez-vous que le dossier php est correctement extrait.
    pause
    exit /b
)

REM Vérifier si le dossier public existe
if not exist "%ROOT%" (
    echo Erreur : Le dossier racine "%ROOT%" est introuvable.
    pause
    exit /b
)

REM Lancer le serveur PHP
set DIR=%~dp0
cd /d "%DIR%"
echo 📂 Serveur lancé dans le dossier : %DIR%%ROOT%
echo 🌐 URL locale :   http://localhost:%PORT%/
echo 🔧 Appuyez sur CTRL+C pour arrêter le serveur.
"%PHP_PATH%" -S 0.0.0.0:%PORT% -t %ROOT%
pause
