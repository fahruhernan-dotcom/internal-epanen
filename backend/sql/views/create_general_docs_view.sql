-- Create a unified view for all general documents (SOPs, Corporate Docs, etc.)
-- This mirrors the approach used for 'v_all_finance_docs'

CREATE OR REPLACE VIEW v_all_general_docs AS
SELECT 
    id,
    content,
    embedding,
    metadata,
    created_at,
    'Lyori' as company_name
FROM general_document_lyori
UNION ALL
SELECT 
    id,
    content,
    embedding,
    metadata,
    created_at,
    'Kaja' as company_name
FROM general_document_kaja
UNION ALL
SELECT 
    id,
    content,
    embedding,
    metadata,
    created_at,
    'Moafarm' as company_name
FROM general_document_moafarm;

-- Grant access to authenticated users (or service role)
GRANT SELECT ON v_all_general_docs TO authenticated;
GRANT SELECT ON v_all_general_docs TO service_role;

-- Note: RLS is generally handled on the underlying tables, but since this is for AI RAG 
-- which primarily uses vector search via RPC or direct service role access, view access is sufficient.
