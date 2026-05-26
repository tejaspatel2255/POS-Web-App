import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve('.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const parts = line.split('=')
  if (parts.length >= 2) {
    const key = parts[0].trim()
    const value = parts.slice(1).join('=').trim()
    env[key] = value
  }
})

const supabaseUrl = env['VITE_SUPABASE_URL']
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY']

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function getStats() {
  console.log('1. Logging in to bypass authenticated-only RLS...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: '23cs075@charusat.edu.in',
    password: 'Tejas@22'
  })

  if (authError) {
    console.error('Login failed:', authError.message)
    return
  }

  console.log('Login successful! Getting counts...')
  
  for (const table of ['profiles', 'categories', 'products', 'orders', 'order_items']) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`Table "${table}": Error querying table:`, error.message)
    } else {
      console.log(`Table "${table}": ${count} rows`)
    }
  }
}

getStats()
