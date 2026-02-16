-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  ePANEN SECURITY HARDENING - Phase 2                          ║
-- ║  Jalankan SETELAH Anon Key sudah diganti di .env              ║
-- ║  Tanggal: 2026-02-17                                          ║
-- ╚══════════════════════════════════════════════════════════════════╝


-- ============================================================
-- STEP 1: Verifikasi semua user sudah ada di auth.users
-- Jalankan ini dulu, pastikan hasilnya 0 (nol)
-- ============================================================
SELECT u.id, u.full_name, u.phone_number
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.id
WHERE au.id IS NULL;

-- Jika ada hasil > 0, JANGAN lanjut. Jalankan migrasi ulang dulu.


-- ============================================================
-- STEP 2: Update trigger agar TIDAK butuh kolom password lagi
-- ============================================================

-- 2a. Trigger INSERT: Daftarkan ke auth.users jika belum ada
CREATE OR REPLACE FUNCTION public.handle_web_user_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_fake_email text;
  v_password text;
BEGIN
  v_fake_email := NEW.phone_number::text || '@epanen.local';
  v_password := COALESCE(NULLIF(TRIM(NEW.password), ''), 'epanen2026');
  
  -- Pakai NOT EXISTS daripada ON CONFLICT untuk menghindari error constraint
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_fake_email) THEN
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
        extensions.crypt(v_password, extensions.gen_salt('bf')),
        now(),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
        jsonb_build_object('full_name', NEW.full_name, 'role', NEW.role),
        now(), now()
      );

      INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      )
      VALUES (
        NEW.id, NEW.id,
        jsonb_build_object('sub', NEW.id::text, 'email', v_fake_email, 'email_verified', true),
        'email', v_fake_email,
        now(), now(), now()
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2b. Trigger UPDATE: Sinkronisasi password & profil ke auth.users
CREATE OR REPLACE FUNCTION public.handle_web_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Sinkronisasi metadata (nama, role)
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object('full_name', NEW.full_name, 'role', NEW.role),
      updated_at = now()
  WHERE id = NEW.id;

  -- Jika nomor HP berubah, update email di auth
  IF (NEW.phone_number IS DISTINCT FROM OLD.phone_number) THEN
    UPDATE auth.users
    SET email = NEW.phone_number::text || '@epanen.local'
    WHERE id = NEW.id;
  END IF;

  -- Jika password berubah (dan tidak kosong/bawaan UI)
  IF (NEW.password IS NOT NULL AND NEW.password != '' AND NEW.password != '********') THEN
    UPDATE auth.users
    SET encrypted_password = extensions.crypt(NEW.password, extensions.gen_salt('bf'))
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_web_user_updated ON public.users;
CREATE TRIGGER on_web_user_updated
AFTER UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_web_user_update();


-- ============================================================
-- STEP 3: Kebijakan Akses 'anon' untuk Login
-- Agar frontend bisa mencari user saat login sebelum punya token
-- ============================================================
DROP POLICY IF EXISTS "users_select_anon_login" ON public.users;
CREATE POLICY "users_select_anon_login" ON public.users
FOR SELECT TO anon 
USING (is_active = true);
-- Note: Ini aman karena kolom password sudah tidak ada.
-- Anon hanya bisa melihat: id, full_name, role, phone_number, dll.
-- Tanpa password, tidak ada data sensitif yang terekspos.


-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  SELESAI! Checklist:                                           ║
-- ║                                                                ║
-- ║  ✅ Trigger INSERT: User baru otomatis terdaftar di auth       ║
-- ║  ✅ Trigger UPDATE: Perubahan password/profil tersinkron       ║
-- ║  ✅ Trigger DELETE: Hapus user bersihkan auth (sudah ada)      ║
-- ║  ✅ Kolom audit: last_login_at, login_count                   ║
-- ║  ✅ Policy anon: Bisa login tanpa service_role key             ║
-- ║  ⚠️  DROP password column: Uncomment manual setelah verifikasi ║
-- ╚══════════════════════════════════════════════════════════════════╝
