# Anime Tracker – Gestionnaire de listes d’anime

Anime Tracker est une application web locale moderne pour gérer vos listes d’anime, enrichie par l’API [AniList](https://anilist.co/). Elle permet d’ajouter, organiser, suivre la progression et explorer vos séries animées avec une interface claire et rapide.

---

## 🚀 Lancer l’application

1. **Démarrage du serveur local**

   - **Sur Linux/MacOS :**
     ```bash
     ./start.sh
     ```
     (ou `bash start.sh` si besoin)

   - **Sur Windows :**
     Double-cliquez sur `start.bat` ou exécutez dans un terminal :
     ```cmd
     start.bat
     ```

   > **Note :** Assurez-vous que PHP est installé et ajouté au PATH. Vous pouvez télécharger PHP depuis [php.net](https://www.php.net/downloads).

2. **Accéder à l’application**

   Ouvrez votre navigateur à l’adresse :
   - [http://localhost:8000/](http://localhost:8000/)
   - Ou l’URL réseau affichée dans le terminal pour accès depuis un autre appareil

---

## ✨ Fonctionnalités principales

- **Ajout rapide d’anime** avec auto-complétion via AniList
- **Gestion de listes personnalisées** (création, édition, couleurs, description)
- **Suivi précis de la progression** (épisode, minute, note, etc.)
- **Fiches détaillées** pour chaque anime (image, synopsis, tags, statut…)
- **Recherche avancée** et tri par dernier visionné
- **Interface moderne** (SPA Vue.js, responsive, thème clair/sombre, footer dynamique)
- **Stockage local** (aucune donnée envoyée en ligne)

---

## 🛠️ Stack technique

- **Frontend :** Vue.js, HTML, CSS (SPA)
- **Backend :** PHP (Slim 4), stockage JSON local
- **API :** [AniList](https://anilist.co/) (données enrichies)

---

## 📄 Documentation & détails

Pour plus d’informations sur la structure, les objectifs et les choix techniques, consultez :
- [`PROJET.md`](./PROJET.md)

---

## 👤 Auteur

Développé par [GebrilIV](https://github.com/GebrilIV) & [Copilot](https://github.com/copilot)

---

© 2026 – Apache License Version 2.0.