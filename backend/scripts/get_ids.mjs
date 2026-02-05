import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://dmbrjsegxbjeafzgalny.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYnJqc2VneGJqZWFmemdhbG55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg4ODE4NSwiZXhwIjoyMDg0NDY0MTg1fQ.zThOUCrggLC7ErBQWvXDiKv4Jj5n3nZV4rMVGib5NRM'
)

const { data } = await supabase
    .from('companies')
    .select('id, code, name')
    .in('name', ['Lyori', 'Kaja', 'Moafarm'])

console.log(JSON.stringify(data, null, 2))
