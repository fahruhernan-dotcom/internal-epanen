import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dmbrjsegxbjeafzgalny.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYnJqc2VneGJqZWFmemdhbG55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg4ODE4NSwiZXhwIjoyMDg0NDY0MTg1fQ.zThOUCrggLC7ErBQWvXDiKv4Jj5n3nZV4rMVGib5NRM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdmin() {
    console.log('--- Creating Admin User ---')

    const adminData = {
        phone_number: 628999999999, // Testing phone number
        full_name: 'Super Admin',
        role: 'admin',
        is_active: true,
        company_id: '8523f28b-7f12-4455-a8a8-015d2a826d5c' // Holding/Owner company
    }

    const { data, error } = await supabase
        .from('users')
        .upsert(adminData, { onConflict: 'phone_number' })
        .select()

    if (error) {
        console.error('Error creating admin:', error.message)
    } else {
        console.log('✅ Admin Success:', data[0].full_name, 'with phone:', data[0].phone_number)
    }
}

createAdmin()
