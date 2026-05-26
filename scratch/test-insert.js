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

async function testInsert() {
  console.log('Testing insert into categories...')
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: 'TEST_INSERT_RLS_CHECK', sort_order: 99 })
    .select()

  if (error) {
    console.log('Insert failed (this is expected if RLS is active and you are not admin):', error.message)
  } else {
    console.log('Insert succeeded! RLS might be disabled or allowing inserts:', data)
    // Clean up
    await supabase.from('categories').delete().eq('name', 'TEST_INSERT_RLS_CHECK')
  }
}

testInsert()
