import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dmbrjsegxbjeafzgalny.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYnJqc2VneGJqZWFmemdhbG55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg4ODE4NSwiZXhwIjoyMDg0NDY0MTg1fQ.zThOUCrggLC7ErBQWvXDiKv4Jj5n3nZV4rMVGib5NRM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRagMetadata() {
    console.log('=== CHECKING RAG METADATA ===\n')

    const ragTables = [
        'finance_lyori',
        'general_document_lyori',
        'finance_epanen'
    ]

    for (const table of ragTables) {
        console.log(`Checking table: ${table}`)
        const { data, error } = await supabase
            .from(table)
            .select('metadata, content')
            .limit(3)

        if (error) {
            console.log(`   Error in ${table}:`, error.message)
        } else {
            console.log(`   Sample Data for ${table}:`)
            data.forEach((item, i) => {
                console.log(`   [Sample ${i + 1}] Metadata:`, JSON.stringify(item.metadata, null, 2))
                console.log(`   [Sample ${i + 1}] Content Snippet:`, item.content?.substring(0, 100) + '...')
                console.log('   ---')
            })
        }
        console.log('\n')
    }
}

checkRagMetadata()
