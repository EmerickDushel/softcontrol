import { createClient } from '@supabase/supabase-js'

// Remplacez ces valeurs par celles de votre projet Supabase
// Paramètres > API dans votre tableau de bord Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '❌ Variables Supabase manquantes.\n' +
    'Créez un fichier .env.local à la racine du projet avec :\n' +
    'VITE_SUPABASE_URL=https://xxxx.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=votre_clé_anon'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
