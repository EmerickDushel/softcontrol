# SoftControl — HACCP Manager

Application web de gestion des contrôles HACCP et du suivi des procédures d'hygiène et de sécurité alimentaire.

## 🚀 Démarrage rapide

### Prérequis
- [Node.js](https://nodejs.org) v18 ou supérieur

### Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer en mode développement
npm run dev
```

Ouvrez [http://localhost:5173](http://localhost:5173) dans votre navigateur.

### Build de production

```bash
npm run build
```

## 📁 Structure du projet

```
softcontrol/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx        ← Application principale (modifier ici)
│   ├── main.jsx       ← Point d'entrée React
│   └── index.css      ← Styles globaux
├── index.html
├── vite.config.js
├── netlify.toml       ← Config déploiement Netlify
└── package.json
```

## 🌐 Déploiement Netlify

Le fichier `netlify.toml` est pré-configuré. Il suffit de connecter le dépôt GitHub à Netlify.

## ✏️ Modifications

Toutes les modifications se font dans `src/App.jsx`.

- **Catégories HACCP** : tableau `HACCP_CATEGORIES`
- **Statuts** : objet `STATUS_CONFIG`
- **Couleurs** : objet `COLORS`
- **Utilisateurs par défaut** : state `users` dans le composant `App`
