-- ============================================
-- UNIFIED VIEWS FIX: Correcting Company IDs
-- Run this in Supabase SQL Editor to fix the filters.
-- ============================================

-- 1. Refresh Unified Finance View
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

-- 2. Refresh Unified Daily Reports View
DROP VIEW IF EXISTS public.v_all_daily_reports;
CREATE OR REPLACE VIEW public.v_all_daily_reports AS
SELECT id, user_id, '3d0e89d1-76f5-421b-ba7b-c2c0dea6ebf0'::uuid as company_id, report_date, activities, issues, weather, notes, created_at, 'ePanen' as company_name FROM daily_reports_epanen
UNION ALL
SELECT id, user_id, '8523f28b-7f12-4455-a8a8-015d2a826d5c'::uuid as company_id, report_date, activities, issues, weather, notes, created_at, 'Kaja' as company_name FROM daily_reports_kaja
UNION ALL
SELECT id, user_id, '53af2fd7-685d-41b5-8daa-265fe3db9b46'::uuid as company_id, report_date, activities, issues, weather, notes, created_at, 'Lyori' as company_name FROM daily_reports_lyori
UNION ALL
SELECT id, user_id, '9c839312-d9ff-40c0-9800-732877cd7287'::uuid as company_id, report_date, activities, issues, weather, notes, created_at, 'Melon' as company_name FROM daily_reports_melon
UNION ALL
SELECT id, user_id, '5236043f-a9ce-498c-84c4-c5de16893ccd'::uuid as company_id, report_date, activities, issues, weather, notes, created_at, 'Moafarm' as company_name FROM daily_reports_moafarm;

-- 3. Permissions
GRANT SELECT ON public.v_all_finance_docs TO authenticated, anon;
GRANT SELECT ON public.v_all_daily_reports TO authenticated, anon;
