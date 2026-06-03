# SoftControl — HACCP Manager (avec Supabase)

Application web complète de gestion HACCP avec base de données réelle, authentification et stockage de photos.

## ✅ Fonctionnalités base de données
- Comptes utilisateurs réels (email + mot de passe sécurisé)
- Données persistantes (contrôles sauvegardés entre sessions)
- Upload et stockage de photos
- Gestion multi-utilisateurs avec rôles
- Authentification sécurisée via Supabase Auth

## 🚀 Installation

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configurer Supabase
Créez le fichier `.env.local` à la racine :
```
VITE_SUPABASE_URL=https://VOTRE_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=VOTRE_CLE_ANON_PUBLIC
```

### 3. Initialiser la base de données
Copiez le contenu de `supabase-schema.sql` dans :
Supabase Dashboard > SQL Editor > New query > Run

### 4. Lancer en développement
```bash
npm run dev
```

## 📁 Structure
```
softcontrol/
├── src/
│   ├── App.jsx              ← Application principale
│   ├── supabaseClient.js    ← Configuration Supabase
│   ├── main.jsx
│   └── index.css
├── supabase-schema.sql      ← Script SQL à exécuter sur Supabase
├── .env.local.example       ← Template variables d'environnement
├── netlify.toml
└── package.json
```

## 🌐 Déploiement Netlify
Ajoutez les variables d'environnement dans :
Netlify > Site settings > Environment variables
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
