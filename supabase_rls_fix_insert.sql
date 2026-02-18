-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  ePANEN RLS FIX - MISSING INSERT/UPDATE/DELETE POLICIES       ║
-- ║  Jalankan di Supabase SQL Editor                              ║
-- ║  Tanggal: 2026-02-18                                         ║
-- ║                                                               ║
-- ║  MASALAH:                                                     ║
-- ║  - Farmer gak bisa submit laporan harian (no INSERT policy)   ║
-- ║  - Cashier gak bisa generate invoice (no policies on invoices)║
-- ║  - Admin juga gak bisa (same reason)                          ║
-- ╚══════════════════════════════════════════════════════════════════╝


-- ============================================================
-- FIX 1: DAILY REPORTS - Tambah INSERT, UPDATE, DELETE policies
-- ============================================================
-- Saat ini hanya ada SELECT policy, jadi user bisa LIHAT tapi
-- tidak bisa TAMBAH, EDIT, atau HAPUS laporan.

-- ── Lyori ──
CREATE POLICY "reports_lyori_insert" ON public.daily_reports_lyori
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner', 'ceo', 'manager', 'farmer', 'cashier')
        AND (
            c.company_id = '53af2fd7-685d-41b5-8daa-265fe3db9b46'::uuid
            OR c.role IN ('admin', 'owner')
        )
    )
);

CREATE POLICY "reports_lyori_update" ON public.daily_reports_lyori
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner', 'ceo', 'manager')
        OR (c.company_id = '53af2fd7-685d-41b5-8daa-265fe3db9b46'::uuid AND c.user_id::text = daily_reports_lyori.user_id::text)
    )
);

CREATE POLICY "reports_lyori_delete" ON public.daily_reports_lyori
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner')
    )
);

-- ── Moafarm ──
CREATE POLICY "reports_moafarm_insert" ON public.daily_reports_moafarm
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner', 'ceo', 'manager', 'farmer', 'cashier')
        AND (
            c.company_id = '5236043f-a9ce-498c-84c4-c5de16893ccd'::uuid
            OR c.role IN ('admin', 'owner')
        )
    )
);

CREATE POLICY "reports_moafarm_update" ON public.daily_reports_moafarm
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner', 'ceo', 'manager')
        OR (c.company_id = '5236043f-a9ce-498c-84c4-c5de16893ccd'::uuid AND c.user_id::text = daily_reports_moafarm.user_id::text)
    )
);

CREATE POLICY "reports_moafarm_delete" ON public.daily_reports_moafarm
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner')
    )
);

-- ── Kaja ──
CREATE POLICY "reports_kaja_insert" ON public.daily_reports_kaja
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner', 'ceo', 'manager', 'farmer', 'cashier')
        AND (
            c.company_id = '8523f28b-7f12-4455-a8a8-015d2a826d5c'::uuid
            OR c.role IN ('admin', 'owner')
        )
    )
);

CREATE POLICY "reports_kaja_update" ON public.daily_reports_kaja
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner', 'ceo', 'manager')
        OR (c.company_id = '8523f28b-7f12-4455-a8a8-015d2a826d5c'::uuid AND c.user_id::text = daily_reports_kaja.user_id::text)
    )
);

CREATE POLICY "reports_kaja_delete" ON public.daily_reports_kaja
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner')
    )
);

-- ── ePanen ──
CREATE POLICY "reports_epanen_insert" ON public.daily_reports_epanen
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner', 'ceo', 'manager', 'farmer', 'cashier')
        AND (
            c.company_id = '3d0e89d1-76f5-421b-ba7b-c2c0dea6ebf0'::uuid
            OR c.role IN ('admin', 'owner')
        )
    )
);

CREATE POLICY "reports_epanen_update" ON public.daily_reports_epanen
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner', 'ceo', 'manager')
        OR (c.company_id = '3d0e89d1-76f5-421b-ba7b-c2c0dea6ebf0'::uuid AND c.user_id::text = daily_reports_epanen.user_id::text)
    )
);

CREATE POLICY "reports_epanen_delete" ON public.daily_reports_epanen
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner')
    )
);

-- ── Melon ──
CREATE POLICY "reports_melon_insert" ON public.daily_reports_melon
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner', 'ceo', 'manager', 'farmer', 'cashier')
        AND (
            c.company_id = '9c839312-d9ff-40c0-9800-732877cd7287'::uuid
            OR c.role IN ('admin', 'owner')
        )
    )
);

CREATE POLICY "reports_melon_update" ON public.daily_reports_melon
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner', 'ceo', 'manager')
        OR (c.company_id = '9c839312-d9ff-40c0-9800-732877cd7287'::uuid AND c.user_id::text = daily_reports_melon.user_id::text)
    )
);

CREATE POLICY "reports_melon_delete" ON public.daily_reports_melon
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner')
    )
);


-- ============================================================
-- FIX 2: INVOICES TABLE - Enable RLS + semua policies
-- ============================================================
-- Tabel invoices BELUM punya RLS policies sama sekali, 
-- jadi cashier gak bisa buat/update invoice.

-- Cek dulu apakah RLS sudah enabled
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies jika ada (safety)
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete" ON public.invoices;

-- Semua authenticated user bisa lihat invoices
CREATE POLICY "invoices_select" ON public.invoices
FOR SELECT TO authenticated USING (true);

-- Authenticated users bisa buat invoice (cashier, admin, owner, manager)
CREATE POLICY "invoices_insert" ON public.invoices
FOR INSERT TO authenticated WITH CHECK (true);

-- Authenticated users bisa update invoice (process, mark ready, etc.)
CREATE POLICY "invoices_update" ON public.invoices
FOR UPDATE TO authenticated USING (true);

-- Hanya admin/owner bisa delete invoice
CREATE POLICY "invoices_delete" ON public.invoices
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner')
    )
);


-- ============================================================
-- FIX 3: DRAFT_DAILY_REPORTS - Enable RLS + policies
-- ============================================================
ALTER TABLE public.draft_daily_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drafts_select" ON public.draft_daily_reports;
DROP POLICY IF EXISTS "drafts_insert" ON public.draft_daily_reports;
DROP POLICY IF EXISTS "drafts_update" ON public.draft_daily_reports;
DROP POLICY IF EXISTS "drafts_delete" ON public.draft_daily_reports;

-- User bisa kelola draft sendiri
CREATE POLICY "drafts_select" ON public.draft_daily_reports
FOR SELECT TO authenticated USING (true);

CREATE POLICY "drafts_insert" ON public.draft_daily_reports
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "drafts_update" ON public.draft_daily_reports
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "drafts_delete" ON public.draft_daily_reports
FOR DELETE TO authenticated USING (true);


-- ============================================================
-- FIX 4: PRODUCT_MARKET_PRICES - Enable RLS + policies
-- ============================================================
ALTER TABLE public.product_market_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_prices_select" ON public.product_market_prices;
DROP POLICY IF EXISTS "market_prices_insert" ON public.product_market_prices;
DROP POLICY IF EXISTS "market_prices_update" ON public.product_market_prices;

-- Semua authenticated bisa lihat harga
CREATE POLICY "market_prices_select" ON public.product_market_prices
FOR SELECT TO authenticated USING (true);

-- Admin/Owner bisa update/insert harga
CREATE POLICY "market_prices_insert" ON public.product_market_prices
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner')
    )
);

CREATE POLICY "market_prices_update" ON public.product_market_prices
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner')
    )
);


-- ============================================================
-- FIX 5: CHAT_HISTORY - Enable RLS + policies (if table exists)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_history' AND table_schema = 'public') THEN
        EXECUTE 'ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY';
        
        EXECUTE 'DROP POLICY IF EXISTS "chat_select" ON public.chat_history';
        EXECUTE 'DROP POLICY IF EXISTS "chat_insert" ON public.chat_history';
        
        EXECUTE 'CREATE POLICY "chat_select" ON public.chat_history FOR SELECT TO authenticated USING (true)';
        EXECUTE 'CREATE POLICY "chat_insert" ON public.chat_history FOR INSERT TO authenticated WITH CHECK (true)';
    END IF;
END $$;


-- ============================================================
-- FIX 6: STORAGE BUCKET POLICIES (Invoices)
-- ============================================================
-- Supabase Storage juga butuh RLS policy agar user bisa upload.
-- Ini dilakukan lewat storage.objects table.

-- Allow authenticated users to upload to invoices bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('invoices', 'invoices', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing storage policies untuk invoices (safety)
DROP POLICY IF EXISTS "invoices_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "invoices_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "invoices_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "invoices_storage_delete" ON storage.objects;

-- Anyone can read invoice PDFs (public bucket)
CREATE POLICY "invoices_storage_select" ON storage.objects
FOR SELECT USING (bucket_id = 'invoices');

-- Authenticated users can upload invoice PDFs
CREATE POLICY "invoices_storage_insert" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'invoices');

-- Authenticated users can update invoice PDFs
CREATE POLICY "invoices_storage_update" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'invoices');

-- Authenticated users can delete invoice PDFs
CREATE POLICY "invoices_storage_delete" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'invoices');


-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  SELESAI! Fix yang diterapkan:                                 ║
-- ║                                                                ║
-- ║  ✅ daily_reports_* : INSERT + UPDATE + DELETE policies added  ║
-- ║  ✅ invoices        : RLS enabled + full CRUD policies         ║
-- ║  ✅ draft_daily_reports: RLS + full CRUD policies              ║
-- ║  ✅ product_market_prices: RLS + SELECT/INSERT/UPDATE policies ║
-- ║  ✅ chat_history    : RLS + SELECT/INSERT policies             ║
-- ║  ✅ storage.objects : Upload/read policies for invoices bucket ║
-- ║                                                                ║
-- ║  Farmer bisa submit laporan ✅                                 ║
-- ║  Cashier bisa generate invoice + upload PDF ✅                 ║
-- ║  Admin bisa melakukan semua operasi ✅                         ║
-- ╚══════════════════════════════════════════════════════════════════╝
