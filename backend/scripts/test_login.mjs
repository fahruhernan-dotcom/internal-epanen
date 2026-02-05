import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dmbrjsegxbjeafzgalny.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYnJqc2VneGJqZWFmemdhbG55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg4ODE4NSwiZXhwIjoyMDg0NDY0MTg1fQ.zThOUCrggLC7ErBQWvXDiKv4Jj5n3nZV4rMVGib5NRM'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testLogin(phone) {
    console.log(`Testing login for: ${phone}`)

    let normalizedPhone = phone.replace(/\D/g, '')
    if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '62' + normalizedPhone.slice(1)
    } else if (!normalizedPhone.startsWith('62')) {
        normalizedPhone = '62' + normalizedPhone
    }

    console.log(`Normalized: ${normalizedPhone}`)

    const { data: user, error } = await supabase
        .from('users')
        .select(`
            *,
            companies (
                id,
                name,
                code
            )
        `)
        .eq('phone_number', normalizedPhone)
        .eq('is_active', true)
        .single()

    if (error) {
        console.error('Login Error:', error.message)
    } else {
        console.log('User found:', JSON.stringify(user, null, 2))
    }
}

testLogin('6281234567890')
