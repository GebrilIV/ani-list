# Anime List – Gestionnaire de listes d’anime

Anime List est une application simple et rapide pour gérer vos listes d’anime. Vous pouvez ajouter des animés, suivre votre progression épisode par épisode, et organiser vos animes dans des listes personnalisées. L'application offre également des fiches détaillées pour chaque anime, avec synopsis, images, et tags, ainsi qu'une recherche avancée pour retrouver facilement vos anime préférés. Elle utilise l'API [AniList](https://anilist.co/) pour enrichir les données.

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

   > **Note :** Assurez-vous que PHP est installé et ajouté au PATH. Vous pouvez télécharger PHP depuis [php.net](https://www.php.net/downloads.php?usage=web&os=linux&osvariant=linux-fedora&version=default).
   > Pour les utilisateurs Windows sans PHP installé, une branche spécifique est disponible avec PHP intégré. Consultez [cette branche](https://github.com/GebrilIV/ani-list/tree/php-win) pour plus de détails.

2. **Accéder à l’application**

   Ouvrez votre navigateur à l’adresse :
   - [http://localhost:8000/](http://localhost:8000/)
   - Ou '{ip}:8000' pour aussi accéder depuis un autre appareil

---

## 🛠️ Stack technique

- **Frontend :** [Vue.js](https://vuejs.org/)
- **Backend :** [(Slim 4)](https://www.slimframework.com/), stockage JSON local
- **API :**
  - [AniList](https://docs.anilist.co/) 
  - [MyAnimeList](https://myanimelist.net/apiconfig/references/api/v2) 
  - [Jikan](https://jikan.moe/)
  - [Kitsu](https://kitsu.docs.apiary.io/)

  > **Note :** L'application prend en charge plusieurs API. Certaines API peuvent être soumises à des limites de requêtes (rate limits), nécessiter une key ou être temporairement indisponibles. Dans ce cas, une autre API compatible peut être utilisée.

---

## 👤 Auteur

Développé par [GebrilIV](https://github.com/GebrilIV) & [Copilot](https://github.com/copilot)

---

© 2026 – Apache License Version 2.0.