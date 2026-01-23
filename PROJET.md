# Anime Tracker

## 🎯 Objectif du projet

Anime Tracker est une **application web locale** destinée à gérer une ou plusieurs listes d’anime et séries à regarder.  
Le but est de remplacer un simple bloc-notes par une solution :

- claire et organisée  
- visuelle  
- rapide à utiliser  
- permettant un suivi précis de la progression de visionnage  

### Problèmes que ce projet résout

L’utilisation d’un bloc-notes ou d’une liste classique pose plusieurs limites :

- Titres peu explicites  
- Aucun élément visuel (images, affiches)  
- Recherche inefficace  
- Absence d’informations contextuelles (synopsis, nombre d’épisodes, statut)  
- Suivi de progression limité (épisode, minute, seconde)  

---

## ⚙️ Objectifs fonctionnels

1. **Ajout rapide d’anime**  
   - Recherche simple et auto-complétée via API  
   - Gain de temps prioritaire  

2. **Gestion d’un répertoire personnel**  
   - Ajouter un anime à une ou plusieurs listes  
   - Statut : non commencé / en cours / terminé  
   - Suivi précis : épisode, minute et seconde (modifiable manuellement)  

3. **Affichage clair et visuel**  
   - Barre de recherche  
   - Fiche anime avec image, synopsis, informations générales  

4. **Gestion de plusieurs listes**  
   - Création et modification de listes  
   - Import / export JSON  

---

## 🛠 Stack technique

Le projet utilise les technologies suivantes :

- **Frontend :** HTML, CSS, JavaScript (Vue.js minimal pour l’affichage dynamique)  
- **Backend :** PHP + [Slim 4 Framework](https://www.slimframework.com/)  
- **Stockage local :** fichiers JSON  
- **APIs pour enrichir les données :**  
  - [AniList API](https://anilist.gitbook.io/anilist-apiv2-docs/) (GraphQL)  
  - [Jikan API](https://jikan.moe/) comme alternative ou complément  

### Pourquoi ce choix

- Slim permet de créer un backend léger et facilement extensible  
- JSON pour garder les données locales simples et portables  
- Les APIs offrent auto-complétion et enrichissement automatique des fiches anime  

---

## 🗂 Workspace actuel (depart)

Structure actuelle du projet :

│
├── public/
│ ├── index.html
│ ├── assets/
│ │ ├── css/
│ │ └── js/
│ │ ├── app.js ← Vue
│ │ ├── api.js ← appels backend
│ │ └── models.js
│
├── backend/
│ ├── index.php ← point d’entrée Slim
│ ├── routes/
│ │ ├── anime.php
│ │ └── lists.php
│ ├── services/
│ │ ├── AniListService.php
│ │ └── StorageService.php
│ ├── storage/
│ │ └── data.json
│ └── config.php
│
├── README.md
│
+





### Plan a suivre :

**1 UI page d’accueil**
Organiser l’interface : header, barre de recherche, affichage des listes, boutons d’action.
Ajouter une barre de recherche fonctionnelle (filtrage local + auto-complétion AniList).
Afficher les animes sous forme de cartes avec image, titre, nombre d’épisodes, statut.
Ajouter un bouton pour “Ajouter à ma liste” depuis les résultats AniList.
Gestion des listes

**2 gestion des liste**
Permettre la création, modification et suppression de listes personnalisées.
Afficher chaque liste avec ses animes.
Ajouter la possibilité de déplacer un anime d’une liste à une autre.
Suivi de progression

**3 suivi de progression**
Permettre de modifier le statut (non commencé, en cours, terminé) et la progression (épisode, minute, seconde) pour chaque anime.
Afficher la progression sur la fiche anime.
Import / Export JSON

**4import/export**
Ajouter des boutons pour exporter/importer les listes au format JSON.
Enrichissement des fiches anime

**5enrichire fiche anime**
Afficher le synopsis, l’image, et d’autres infos depuis AniList/Jikan lors de l’ajout ou la recherche.
Amélioration UX/UI

**6amelioré UX/UI**
Rendre l’interface plus agréable : responsive, animations, feedback utilisateur.
Tests et corrections

Tester toutes les fonctionnalités, corriger les bugs, améliorer la fluidité.





### avencé du projet (depart: 06.01.26 | fin: *)


<
# D* - *.*.26:
*
>


# D1 - 06.01.26:
workspace + planifié suite projet

# D2 - 10.01.26:
fini une grande partit frontend (affichage) + correction un ou deux problème.
faire une grande partit de la partit List (ajouter anime + créer list)
debut page aceuille

# D3 - 11.01.26:
correction bugs ajout anime (info pas ecirt dans data.json) (commencé correction)

# D4 - 14.01.26:
correction bugs ajout anime (info pas ecirt dans data.json) (corrigé)
correction affichage liste
debut creation page dedié a chaque anime

# D5 - 16.01.26:
ajout de 'autres' dans SPA des anime.
system recherche
system doublons
github repository

# D6 - 18.01.26:
license

# D7 - 20.01.26:
modif readme
modif vers. php win
issues





a faire - voir issues

