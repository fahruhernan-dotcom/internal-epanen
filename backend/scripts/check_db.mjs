// Check Supabase database script
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dmbrjsegxbjeafzgalny.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYnJqc2VneGJqZWFmemdhbG55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg4ODE4NSwiZXhwIjoyMDg0NDY0MTg1fQ.zThOUCrggLC7ErBQWvXDiKv4Jj5n3nZV4rMVGib5NRM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
    console.log('=== CHECKING SUPABASE DATABASE ===\n')

    // 1. Check users table
    console.log('1. USERS TABLE:')
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, phone_number, full_name, role, is_active, company_id')
        .limit(20)

    if (usersError) {
        console.log('   Error:', usersError.message)
    } else {
        console.log('   Total users:', users.length)
        users.forEach(u => {
            console.log(`   - ${u.full_name} | ${u.phone_number} | role: ${u.role} | active: ${u.is_active}`)
        })

        // Check for owner
        const owners = users.filter(u => u.role === 'owner')
        console.log(`\n   Owners found: ${owners.length}`)
        if (owners.length === 0) {
            console.log('   ⚠️  NO OWNER USER FOUND - Need to add one!')
        }
    }

    // 2. Check companies table
    console.log('\n2. COMPANIES TABLE:')
    const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, code, name, is_active')

    if (companiesError) {
        console.log('   Error:', companiesError.message)
    } else {
        console.log('   Total companies:', companies.length)
        companies.forEach(c => {
            console.log(`   - ${c.code} | ${c.name} | active: ${c.is_active}`)
        })
    }

    // 3. Check daily reports tables
    console.log('\n3. DAILY REPORTS TABLES:')

    const tables = [
        'daily_reports_epanen',
        'daily_reports_lyori',
        'daily_reports_moafarm',
        'daily_reports_kaja',
        'daily_reports_melon'
    ]

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })

        if (error) {
            console.log(`   - ${table}: ❌ Error - ${error.message}`)
        } else {
            console.log(`   - ${table}: ✅ ${count} records`)
        }
    }

    console.log('\n=== CHECK COMPLETE ===')
}

checkDatabase()
