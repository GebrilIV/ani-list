# Branche **php-win** (Windows sans installation de PHP)

## 📌 À quoi sert cette branche ?

Cette branche a été créée pour les **utilisateurs Windows** qui n'ont pas php d'installer sur leur apareille.

Elle permet de **lancer le projet sans installer PHP**, en utilisant une version portable déjà incluse.

👉 Projet principal : [ani-list](https://github.com/GebrilIV/ani-list)

---

## 📦 Contenu de cette branche

Cette branche contient **uniquement** :

* une version portable de PHP : **php-8.5.1-Win32-vs17-x64**
* un fichier `start.bat` adapté pour lancer le projet automatiquement

⚠️ **Cette branche n’est pas un projet complet à elle seule**. Elle est conçue pour être **fusionnée manuellement** avec le projet principal.

---

## 🛠️ Installation / Mise en place (Windows)

### 1️⃣ Télécharger les fichiers

* Téléchargez **tous les fichiers** de cette branche :
  [https://github.com/GebrilIV/ani-list/tree/php-win](https://github.com/GebrilIV/ani-list/tree/php-win)

* Téléchargez également le projet principal si ce n’est pas déjà fait :
  [https://github.com/GebrilIV/ani-list](https://github.com/GebrilIV/ani-list)

---

### 2️⃣ Copier les fichiers dans le projet principal

1. Ouvrez le dossier du projet principal (`ani-list`)
2. Copiez **le dossier php** et **start.bat** de la branche **php-win** a la racine du projet principal
3. Collez-les **à la racine du projet principal**
4. **Écrasez les fichiers existants** si Windows le demande

## ▶️ Démarrer le projet (sans installer PHP)

Une fois les fichiers copiés :

### **Pour Windows :**

Double-cliquez sur `start.bat` ou exécutez dans un terminal :

```cmd
start.bat
```

---

## 🌐 Accéder à l’application

Ouvrez votre navigateur à l’adresse :

* [http://localhost:8000/](http://localhost:8000/)
* Ou votre ip personnelle + port, pour aussi pouvoir acceder depuis un autre appareil

---

## ℹ️ Informations complémentaires

* Cette branche utilise **PHP sans installation système**
* Aucune variable d’environnement n’est requise

Pour plus d’informations sur le fonctionnement général du projet, les fonctionnalités et la structure des fichiers, consultez le **README principal** :
👉 [README.md – branche main](https://github.com/GebrilIV/ani-list/blob/main/README.md)

---

## Crédit PHP

Cette branche inclut **PHP 8.5.1 (Win32 vs17 x64)**, disponible sur le site officiel :

* [https://www.php.net/](https://www.php.net/)



➡️ Cette version de PHP est fournie **à titre pratique uniquement** pour simplifier l’utilisation du projet sous Windows.
Elle **n’est pas développée, modifiée, ni maintenue**.
