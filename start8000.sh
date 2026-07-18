#!/bin/bash

# Configuration
PORT=8000
DIR=$(pwd)

# Récupération automatique de l'adresse IP locale (IPv4 non loopback)
IP=$(hostname -I | awk '{print $1}')

# Message à afficher dans le terminal Konsole
CMD="
echo '📂 Serveur lancé dans le dossier : $DIR/public';
echo '🌐 URL locale :   http://localhost:$PORT/';
echo '📱 URL réseau :   http://$IP:$PORT/';
echo '🔧 Appuie sur CTRL+C pour arrêter.';
echo '';
php -S 0.0.0.0:$PORT -t public;
"

# Lancer Konsole avec les commandes
konsole --noclose -e bash -c "$CMD"
