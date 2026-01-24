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
   - Ou '{ip}:8000' pour aussi accès depuis un autre appareil

---

## 📄 Documentation & détails

Pour plus d’informations sur la structure, les objectifs et les choix techniques, consultez :
- [`PROJET.md`](./PROJET.md)

---

## 🛠️ Stack technique

- **Frontend :** Vue.js, HTML, CSS (SPA)
- **Backend :** PHP (Slim 4), stockage JSON local
- **API :** [AniList](https://anilist.co/) (données enrichies)
  > **Note :** L'API AniList a une limite de 30 requêtes par minute. Si le système d'ajout d'anime ne fonctionne pas temporairement, cela peut être dû à cette limite. Veuillez patienter avant de réessayer.

---

## 👤 Auteur

Développé par [GebrilIV](https://github.com/GebrilIV) & [Copilot](https://github.com/copilot)

---

© 2026 – Apache License Version 2.0.