@echo off
chcp 65001 >nul

:: Verifier si PHP est disponible dans le PATH
where php >nul 2>&1
if errorlevel 1 (
    echo Erreur : PHP n'est pas disponible dans le PATH. Assurez-vous que PHP est correctement installé et configuré.
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
php -S 0.0.0.0:8000 -t public
pause