// Create Admin User Script
// Run: node create_admin_user.mjs

import { createClient } from '@supabase/supabase-js'
import readline from 'readline'

const supabaseUrl = 'https://dmbrjsegxbjeafzgalny.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYnJqc2VneGJqZWFmemdhbG55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg4ODE4NSwiZXhwIjoyMDg0NDY0MTg1fQ.zThOUCrggLC7ErBQWvXDiKv4Jj5n3nZV4rMVGib5NRM'

const supabase = createClient(supabaseUrl, supabaseKey)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function createAdminUser() {
  console.log('=== CREATE WEBSITE ADMIN USER ===\n')
  console.log('Note: Admin users are NOT tied to any company.\n')

  try {
    // Get admin details
    const phone = await question('Enter phone number (62xxxxxxxxxx): ')
    const name = await question('Enter full name: ')

    // Normalize phone
    let normalizedPhone = phone.replace(/\D/g, '')
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '62' + normalizedPhone.slice(1)
    } else if (!normalizedPhone.startsWith('62')) {
      normalizedPhone = '62' + normalizedPhone
    }

    console.log(`\nCreating admin user:`)
    console.log(`  Phone: ${normalizedPhone}`)
    console.log(`  Name: ${name}`)
    console.log(`  Role: admin (website super-user)`)
    console.log(`  Company: NONE`)

    const confirm = await question('\nConfirm? (yes/no): ')

    if (confirm.toLowerCase() !== 'yes') {
      console.log('Cancelled.')
      rl.close()
      return
    }

    // Insert admin user
    const { data, error } = await supabase
      .from('users')
      .insert({
        phone_number: normalizedPhone,
        full_name: name,
        role: 'admin',
        is_active: true,
        company_id: null  // Admin has NO company
      })
      .select()

    if (error) throw error

    console.log('\n✅ Admin user created successfully!')
    console.log(`   User ID: ${data[0].id}`)
    console.log(`   Login with phone: ${normalizedPhone}`)
    console.log(`   Password: smartfarm2026`)

  } catch (err) {
    console.error('\n❌ Error:', err.message)
  } finally {
    rl.close()
  }
}

createAdminUser()
