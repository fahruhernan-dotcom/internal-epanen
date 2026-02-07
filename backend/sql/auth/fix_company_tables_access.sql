-- ============================================
-- FIX: COMPANY TABLES ACCESS & UNIFIED VIEWS
-- Enforce RLS and add basic SELECT policies for all companies.
-- ============================================

-- 1. UTILITY: Enable RLS and Add SELECT Policy if missing
DO $$
DECLARE
    tbl TEXT;
    target_tables TEXT[] := ARRAY[
        'finance_epanen', 'finance_kaja', 'finance_lyori', 'finance_moafarm', 'finance_melon',
        'general_document_kaja', 'general_document_lyori', 'general_document_moafarm'
    ];
BEGIN
    FOREACH tbl IN ARRAY target_tables LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', tbl);
        
        -- Drop if exists and recreate public select policy
        EXECUTE format('DROP POLICY IF EXISTS "Public Select" ON public.%I', tbl);
        EXECUTE format('CREATE POLICY "Public Select" ON public.%I FOR SELECT USING (true)', tbl);
    END LOOP;
END $$;

-- 2. UPDATE VIEW: v_all_finance_docs
-- Ensures IDs and Names are correctly mapped for all companies
DROP VIEW IF EXISTS public.v_all_finance_docs;
CREATE OR REPLACE VIEW public.v_all_finance_docs AS
SELECT id, content, metadata, created_at, 'ePanen' as company_name, '3d0e89d1-76f5-421b-ba7b-c2c0dea6ebf0'::uuid as company_id FROM finance_epanen
UNION ALL
SELECT id, content, metadata, created_at, 'Kaja' as company_name, '8523f28b-7f12-4455-a8a8-015d2a826d5c'::uuid as company_id FROM finance_kaja
UNION ALL
SELECT id, content, metadata, created_at, 'Lyori' as company_name, '53af2fd7-685d-41b5-8daa-265fe3db9b46'::uuid as company_id FROM finance_lyori
UNION ALL
SELECT id, content, metadata, created_at, 'Melon' as company_name, '9c839312-d9ff-40c0-9800-732877cd7287'::uuid as company_id FROM finance_melon
UNION ALL
SELECT id, content, metadata, created_at, 'Moafarm' as company_name, '5236043f-a9ce-498c-84c4-c5de16893ccd'::uuid as company_id FROM finance_moafarm;

-- 3. UPDATE VIEW: v_all_general_docs
DROP VIEW IF EXISTS public.v_all_general_docs;
CREATE OR REPLACE VIEW public.v_all_general_docs AS
SELECT id, content, metadata, created_at, 'Kaja' as company_name, '8523f28b-7f12-4455-a8a8-015d2a826d5c'::uuid as company_id FROM general_document_kaja
UNION ALL
SELECT id, content, metadata, created_at, 'Lyori' as company_name, '53af2fd7-685d-41b5-8daa-265fe3db9b46'::uuid as company_id FROM general_document_lyori
UNION ALL
SELECT id, content, metadata, created_at, 'Moafarm' as company_name, '5236043f-a9ce-498c-84c4-c5de16893ccd'::uuid as company_id FROM general_document_moafarm;

-- 4. PERMISSIONS
GRANT SELECT ON public.v_all_finance_docs TO authenticated, anon;
GRANT SELECT ON public.v_all_general_docs TO authenticated, anon;

DO $$ BEGIN RAISE NOTICE 'RLS and Views fixed for all companies.'; END $$;
