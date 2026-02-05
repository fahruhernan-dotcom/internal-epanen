import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dmbrjsegxbjeafzgalny.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYnJqc2VneGJqZWFmemdhbG55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg4ODE4NSwiZXhwIjoyMDg0NDY0MTg1fQ.zThOUCrggLC7ErBQWvXDiKv4Jj5n3nZV4rMVGib5NRM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSopTables() {
    console.log('=== CHECKING SOP/DOCUMENT TABLES ===\n')

    // List all potential tables to see what exists
    const { data: tables, error } = await supabase
        .from('pg_catalog.pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')

    if (error) {
        console.log('Error fetching tables:', error.message)
    } else {
        console.log('Existing tables in public schema:')
        tables.forEach(t => console.log(` - ${t.tablename}`))
    }
}

checkSopTables()
