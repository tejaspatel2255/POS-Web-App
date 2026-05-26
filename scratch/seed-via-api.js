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

async function seed() {
  console.log('1. Logging in as 23cs075@charusat.edu.in...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: '23cs075@charusat.edu.in',
    password: 'Tejas@22'
  })

  if (authError) {
    console.error('Login failed:', authError.message)
    return
  }

  const user = authData.user
  console.log('Login successful! User ID:', user.id)

  console.log('2. Inserting admin profile record...')
  // Try inserting or updating profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      role: 'admin',
      full_name: 'Tejas Patel'
    })

  if (profileError) {
    console.error('Failed to upsert profile:', profileError.message)
    console.log('Attempting standard insert...')
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        role: 'admin',
        full_name: 'Tejas Patel'
      })
    if (insertError) {
      console.error('Insert also failed:', insertError.message)
      return
    }
  }
  console.log('Profile successfully set to Admin!')

  console.log('3. Inserting categories...')
  const categoriesList = [
    { name: 'a ICECREAM', sort_order: 1 },
    { name: 'b HALF_REAL', sort_order: 2 },
    { name: 'c PACKING IT', sort_order: 3 },
    { name: 'CADBURY', sort_order: 4 },
    { name: 'Cold Drinks', sort_order: 5 },
    { name: 'Flavour MILK', sort_order: 6 },
    { name: 'MILK-SHAKE', sort_order: 7 },
    { name: 'PARTY-PACK', sort_order: 8 },
    { name: 'SHIKHAND', sort_order: 9 },
    { name: 'zTOPING ICE', sort_order: 10 },
    { name: 'GINGER', sort_order: 11 }
  ]

  const { data: insertedCategories, error: catError } = await supabase
    .from('categories')
    .upsert(categoriesList, { onConflict: 'name' })
    .select()

  if (catError) {
    console.error('Failed to insert categories:', catError.message)
    return
  }
  console.log(`Inserted/updated ${insertedCategories.length} categories.`)

  const iceCreamCat = insertedCategories.find(c => c.name === 'a ICECREAM')
  if (!iceCreamCat) {
    console.error('Could not find "a ICECREAM" category in inserted rows.')
    return
  }

  console.log('4. Inserting products under "a ICECREAM"...')
  const productsList = [
    'Savaliya Special', 'American Dry Fruit', 'Anjeer', 'Belgian Chocolate', 'Blue Diamond', 
    'Butter Scotch', 'Caramel Chocolate', 'Choco Chips', 'Chocolate Oriyo', 'Cookies Cream', 
    'Crunchy Munchy', 'Desert Topping', 'Dryfruit Khajana', 'Golden Pearl', 'Hira-Moti', 
    'Hot Brownie With Vanilla', 'Jambu', 'Jamfal', 'Japani Hungama', 'Kaju Draksh', 
    'Kesar Pista', 'Lotus Biscoff', 'Mango', 'Mava Malai', 'Mexican Khajana', 
    'Musk Melon', 'Pan Masala', 'Payna Orange', 'Raj Bhog', 'Rajdhani', 
    'Red Velvet', 'Sitaphal', 'Strawberry', 'Tender Coconut', 'Thandai', 
    'Tiramisu', 'Vanilla', 'White House', 'Wild Berry', 'Winter Cream', 
    'Baki Na', 'Pop Corn'
  ].map((name, index) => ({
    category_id: iceCreamCat.id,
    name,
    price: 0.00,
    sort_order: index + 1,
    is_available: true
  }))

  const { data: insertedProducts, error: prodError } = await supabase
    .from('products')
    .upsert(productsList, { onConflict: 'name' })
    .select()

  if (prodError) {
    console.error('Failed to insert products:', prodError.message)
    return
  }

  console.log(`Seeding complete! Successfully loaded ${insertedProducts.length} items.`)
}

seed()
