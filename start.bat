@echo off
chcp 65001 >nul

:: Verifier si le PHP inclus dans le projet est disponible
if not exist "php\php-8.5.1-Win32-vs17-x64\php.exe" (
    echo Erreur : PHP introuvable dans le projet. Verifiez que le dossier php est correctement extrait.
    pause
    exit /b
)

:: Verifier si le dossier public existe
if not exist "public" (
    echo Erreur : Le dossier public "public" est introuvable.
    pause
    exit /b
)

:: Lancer le serveur PHP
cd /d "%~dp0"
"php\php-8.5.1-Win32-vs17-x64\php.exe" -S 0.0.0.0:8000 -t public
pause