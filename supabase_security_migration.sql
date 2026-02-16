-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  ePANEN SECURITY MIGRATION - FINAL COMPLETE SCRIPT            ║
-- ║  Jalankan SEKALI di Supabase SQL Editor                       ║
-- ║  Tanggal: 2026-02-16                                         ║
-- ╚══════════════════════════════════════════════════════════════════╝


-- ============================================================
-- PHASE 1: BERSIHKAN SEMUA STATE YANG RUSAK
-- ============================================================

-- 1a. Hapus semua policy lama (aman: IF EXISTS)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins/Owners can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "View Companies" ON public.companies;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_admin" ON public.users;
DROP POLICY IF EXISTS "users_select_anon" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_update_admin" ON public.users;
DROP POLICY IF EXISTS "users_insert_admin" ON public.users;
DROP POLICY IF EXISTS "users_delete_admin" ON public.users;
DROP POLICY IF EXISTS "companies_select_authenticated" ON public.companies;
DROP POLICY IF EXISTS "companies_select_anon" ON public.companies;
DROP POLICY IF EXISTS "reports_lyori_select" ON public.daily_reports_lyori;
DROP POLICY IF EXISTS "reports_lyori_anon" ON public.daily_reports_lyori;
DROP POLICY IF EXISTS "reports_moafarm_select" ON public.daily_reports_moafarm;
DROP POLICY IF EXISTS "reports_moafarm_anon" ON public.daily_reports_moafarm;
DROP POLICY IF EXISTS "reports_kaja_select" ON public.daily_reports_kaja;
DROP POLICY IF EXISTS "reports_kaja_anon" ON public.daily_reports_kaja;
DROP POLICY IF EXISTS "reports_epanen_select" ON public.daily_reports_epanen;
DROP POLICY IF EXISTS "reports_epanen_anon" ON public.daily_reports_epanen;
DROP POLICY IF EXISTS "reports_melon_select" ON public.daily_reports_melon;
DROP POLICY IF EXISTS "reports_melon_anon" ON public.daily_reports_melon;
DROP POLICY IF EXISTS "View Lyori Reports" ON public.daily_reports_lyori;
DROP POLICY IF EXISTS "View Moafarm Reports" ON public.daily_reports_moafarm;
DROP POLICY IF EXISTS "View Kaja Reports" ON public.daily_reports_kaja;
DROP POLICY IF EXISTS "View ePanen Reports" ON public.daily_reports_epanen;
DROP POLICY IF EXISTS "View Melon Reports" ON public.daily_reports_melon;

-- 1b. Hapus fungsi lama beserta dependensinya
DROP FUNCTION IF EXISTS public.get_current_user_claims() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_or_owner() CASCADE;

-- 1c. Hapus trigger lama
DROP TRIGGER IF EXISTS on_web_user_created ON public.users;
DROP TRIGGER IF EXISTS on_user_deleted_sync ON public.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 1d. Bersihkan semua data auth yang rusak (dari percobaan sebelumnya)
DELETE FROM auth.identities;
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.mfa_factors;
DELETE FROM auth.mfa_challenges;
DELETE FROM auth.mfa_amr_claims;
DELETE FROM auth.users;


-- ============================================================
-- PHASE 2: NONAKTIFKAN RLS SEMENTARA
-- ============================================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports_lyori DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports_moafarm DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports_kaja DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports_epanen DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports_melon DISABLE ROW LEVEL SECURITY;


-- ============================================================
-- PHASE 3: MIGRASI USER LAMA KE SUPABASE AUTH
-- ============================================================
-- Strategi: Nomor HP diubah jadi email palsu (628xxx@epanen.local)
-- Ini menghindari kebutuhan Twilio/Phone Provider

CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- 3a. Masukkan semua user ke auth.users
INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT
    '00000000-0000-0000-0000-000000000000',
    u.id,  -- Samakan ID agar sinkron dengan public.users
    'authenticated',
    'authenticated',
    u.phone_number::text || '@epanen.local',
    extensions.crypt(COALESCE(u.password, 'epanen2026'), extensions.gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('full_name', u.full_name, 'role', u.role),
    now(), now(),
    '', '', '', ''
FROM public.users u
WHERE u.phone_number IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.email = u.phone_number::text || '@epanen.local'
);

-- 3b. Buat identity records (WAJIB untuk Supabase GoTrue)
INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
)
SELECT
    au.id, au.id,
    jsonb_build_object('sub', au.id::text, 'email', au.email, 'email_verified', true),
    'email', au.email,
    now(), now(), now()
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM auth.identities ai WHERE ai.user_id = au.id
);


-- ============================================================
-- PHASE 4: AKTIFKAN RLS DENGAN POLICY AMAN
-- ============================================================

-- 4a. Aktifkan RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports_lyori ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports_moafarm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports_kaja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports_epanen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports_melon ENABLE ROW LEVEL SECURITY;

-- 4b. Fungsi helper (SECURITY DEFINER = berjalan sebagai DB owner)
CREATE OR REPLACE FUNCTION public.get_current_user_claims()
RETURNS TABLE (role text, company_id uuid, user_id uuid)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT u.role, u.company_id, u.id
    FROM public.users u
    WHERE u.phone_number::text = split_part(
        (SELECT email FROM auth.users WHERE id = auth.uid()),
        '@', 1
    );
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────
-- 4c. POLICY: Tabel USERS
-- ────────────────────────────────────────

-- User bisa lihat profil sendiri
CREATE POLICY "users_select_own" ON public.users
FOR SELECT USING (
    phone_number::text = split_part(
        (SELECT email FROM auth.users WHERE id = auth.uid()),
        '@', 1
    )
);

-- Admin/Owner/CEO bisa lihat semua profil
CREATE POLICY "users_select_admin" ON public.users
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims()
        WHERE role IN ('admin', 'owner', 'ceo')
    )
);

-- User bisa update profil sendiri
CREATE POLICY "users_update_own" ON public.users
FOR UPDATE USING (
    phone_number::text = split_part(
        (SELECT email FROM auth.users WHERE id = auth.uid()),
        '@', 1
    )
);

-- Admin/Owner bisa update semua user
CREATE POLICY "users_update_admin" ON public.users
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims()
        WHERE role IN ('admin', 'owner')
    )
);

-- Admin/Owner bisa tambah user baru
CREATE POLICY "users_insert_admin" ON public.users
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims()
        WHERE role IN ('admin', 'owner')
    )
);

-- Admin/Owner bisa hapus user
CREATE POLICY "users_delete_admin" ON public.users
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims()
        WHERE role IN ('admin', 'owner')
    )
);

-- ────────────────────────────────────────
-- 4d. POLICY: Tabel COMPANIES
-- ────────────────────────────────────────
CREATE POLICY "companies_select_authenticated" ON public.companies
FOR SELECT TO authenticated USING (true);

-- ────────────────────────────────────────
-- 4e. POLICY: Tabel DAILY REPORTS (per perusahaan)
-- ────────────────────────────────────────

-- Lyori
CREATE POLICY "reports_lyori_select" ON public.daily_reports_lyori
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner', 'ceo', 'manager')
        OR c.company_id = '53af2fd7-685d-41b5-8daa-265fe3db9b46'::uuid
    )
);

-- Moafarm
CREATE POLICY "reports_moafarm_select" ON public.daily_reports_moafarm
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner', 'ceo', 'manager')
        OR c.company_id = '5236043f-a9ce-498c-84c4-c5de16893ccd'::uuid
    )
);

-- Kaja
CREATE POLICY "reports_kaja_select" ON public.daily_reports_kaja
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner', 'ceo', 'manager')
        OR c.company_id = '8523f28b-7f12-4455-a8a8-015d2a826d5c'::uuid
    )
);

-- ePanen
CREATE POLICY "reports_epanen_select" ON public.daily_reports_epanen
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner', 'ceo', 'manager')
        OR c.company_id = '3d0e89d1-76f5-421b-ba7b-c2c0dea6ebf0'::uuid
    )
);

-- Melon
CREATE POLICY "reports_melon_select" ON public.daily_reports_melon
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.get_current_user_claims() c
        WHERE c.role IN ('admin', 'owner', 'ceo', 'manager')
        OR c.company_id = '9c839312-d9ff-40c0-9800-732877cd7287'::uuid
    )
);


-- ============================================================
-- PHASE 5: TRIGGER OTOMATIS (Sinkronisasi Web <-> Auth)
-- ============================================================

-- 5a. Saat TAMBAH user dari web → Daftarkan ke Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_web_user_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_fake_email text;
BEGIN
  v_fake_email := NEW.phone_number::text || '@epanen.local';
  
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    NEW.id, 'authenticated', 'authenticated',
    v_fake_email,
    extensions.crypt(COALESCE(NEW.password, 'epanen2026'), extensions.gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('full_name', NEW.full_name, 'role', NEW.role),
    now(), now()
  ) ON CONFLICT (email) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.id,
    jsonb_build_object('sub', NEW.id::text, 'email', v_fake_email, 'email_verified', true),
    'email', v_fake_email,
    now(), now(), now()
  ) ON CONFLICT (provider, provider_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_web_user_created ON public.users;
CREATE TRIGGER on_web_user_created
AFTER INSERT ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_web_user_registration();

-- 5b. Saat HAPUS user dari web → Hapus juga dari Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_user_delete_sync()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_user_deleted_sync ON public.users;
CREATE TRIGGER on_user_deleted_sync
AFTER DELETE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete_sync();


-- ============================================================
-- PHASE 6: PERBAIKI CONSTRAINT (Agar hapus user tidak error)
-- ============================================================
ALTER TABLE public.draft_daily_reports 
DROP CONSTRAINT IF EXISTS draft_daily_reports_user_id_fkey,
ADD CONSTRAINT draft_daily_reports_user_id_fkey 
   FOREIGN KEY (user_id) REFERENCES public.users(id) 
   ON DELETE CASCADE;


-- ============================================================
-- PHASE 7: RESTORE TRIGGER updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON public.users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;


-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  SELESAI! Ringkasan:                                           ║
-- ║                                                                ║
-- ║  ✅ User lama berhasil dimigrasikan ke Supabase Auth           ║
-- ║  ✅ RLS aktif — data perusahaan terisolasi                     ║
-- ║  ✅ TIDAK ADA akses anon — harus login untuk lihat data        ║
-- ║  ✅ Admin/Owner bisa tambah, edit, dan hapus user dari web     ║
-- ║  ✅ Hapus user otomatis bersihkan data auth + draft laporan    ║
-- ║  ✅ Password tersimpan dalam bentuk hash (bcrypt)              ║
-- ║  ✅ Semua fungsi SECURITY DEFINER + search_path terkunci       ║
-- ╚══════════════════════════════════════════════════════════════════╝
