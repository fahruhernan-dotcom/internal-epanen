-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  ePANEN VIEW FIX - ADD REPORTER NAME TO DAILY REPORTS VIEW    ║
-- ║  Jalankan di Supabase SQL Editor                              ║
-- ║  Tanggal: 2026-02-18                                         ║
-- ║                                                               ║
-- ║  MASALAH:                                                     ║
-- ║  - Kolom "Pelapor" di UI menampilkan UUID, bukan nama asli.   ║
-- ║  - View v_all_daily_reports belum join ke tabel users.        ║
-- ╚══════════════════════════════════════════════════════════════════╝

DROP VIEW IF EXISTS public.v_all_daily_reports CASCADE;

CREATE OR REPLACE VIEW public.v_all_daily_reports AS
SELECT 
    dr.id, 
    dr.user_id, 
    u.full_name as user_name,
    dr.company_id, 
    dr.report_date, 
    dr.activities, 
    dr.issues, 
    dr.weather, 
    dr.notes, 
    dr.created_at, 
    'ePanen' as company_name
FROM daily_reports_epanen dr
LEFT JOIN users u ON dr.user_id::text = u.id::text
UNION ALL
SELECT 
    dr.id, 
    dr.user_id, 
    u.full_name as user_name,
    dr.company_id, 
    dr.report_date, 
    dr.activities, 
    dr.issues, 
    dr.weather, 
    dr.notes, 
    dr.created_at, 
    'Kaja' as company_name
FROM daily_reports_kaja dr
LEFT JOIN users u ON dr.user_id::text = u.id::text
UNION ALL
SELECT 
    dr.id, 
    dr.user_id, 
    u.full_name as user_name,
    dr.company_id, 
    dr.report_date, 
    dr.activities, 
    dr.issues, 
    dr.weather, 
    dr.notes, 
    dr.created_at, 
    'Lyori' as company_name
FROM daily_reports_lyori dr
LEFT JOIN users u ON dr.user_id::text = u.id::text
UNION ALL
SELECT 
    dr.id, 
    dr.user_id, 
    u.full_name as user_name,
    dr.company_id, 
    dr.report_date, 
    dr.activities, 
    dr.issues, 
    dr.weather, 
    dr.notes, 
    dr.created_at, 
    'Melon' as company_name
FROM daily_reports_melon dr
LEFT JOIN users u ON dr.user_id::text = u.id::text
UNION ALL
SELECT 
    dr.id, 
    dr.user_id, 
    u.full_name as user_name,
    dr.company_id, 
    dr.report_date, 
    dr.activities, 
    dr.issues, 
    dr.weather, 
    dr.notes, 
    dr.created_at, 
    'Moafarm' as company_name
FROM daily_reports_moafarm dr
LEFT JOIN users u ON dr.user_id::text = u.id::text;

-- Permissions
GRANT SELECT ON public.v_all_daily_reports TO authenticated, anon;
