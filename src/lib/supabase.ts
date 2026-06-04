// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase environment variables VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are missing. Please configure them in your .env file.'
  )
}

// Fallback to placeholder strings to prevent app crash
const urlToUse = supabaseUrl || 'https://placeholder-project.supabase.co'
const keyToUse = supabaseAnonKey || 'placeholder-anon-key'

export const supabase = createClient(urlToUse, keyToUse, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
})
