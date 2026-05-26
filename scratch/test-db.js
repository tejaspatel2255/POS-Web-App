import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Read .env manually
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

console.log('Connecting to Supabase at:', supabaseUrl)
console.log('Using Anon Key starting with:', supabaseAnonKey ? supabaseAnonKey.substring(0, 15) : 'undefined')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  try {
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
    
    if (catError) {
      console.error('Categories Error:', catError)
    } else {
      console.log('Categories count in DB:', categories ? categories.length : 0)
      console.log('Categories data:', categories)
    }

    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .limit(5)

    if (prodError) {
      console.error('Products Error:', prodError)
    } else {
      console.log('Products count (limit 5) in DB:', products ? products.length : 0)
      console.log('Products data:', products)
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

test()
