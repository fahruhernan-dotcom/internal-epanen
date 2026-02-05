import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dmbrjsegxbjeafzgalny.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYnJqc2VneGJqZWFmemdhbG55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg4ODE4NSwiZXhwIjoyMDg0NDY0MTg1fQ.zThOUCrggLC7ErBQWvXDiKv4Jj5n3nZV4rMVGib5NRM'
const supabase = createClient(supabaseUrl, supabaseKey)

async function setupAdmin() {
    console.log('Ensuring Admin user exists...')

    // Check if admin already exists
    const { data: existingAdmin } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', 6281122334455)
        .single()

    if (existingAdmin) {
        console.log('Admin already exists:', existingAdmin.full_name)
    } else {
        const { data, error } = await supabase
            .from('users')
            .insert([{
                id: crypto.randomUUID(),
                phone_number: 6281122334455,
                full_name: 'Super Admin',
                role: 'admin',
                is_active: true,
                company_id: 'fef23b03-fe98-4a56-9ebc-64e1d21845fb' // Owner/Holding company
            }])
            .select()

        if (error) {
            console.error('Error creating admin:', error.message)
        } else {
            console.log('Admin created successfully:', data[0].full_name)
        }
    }
}

setupAdmin()
