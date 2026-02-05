-- ============================================
-- SmartFarm Admin Role - Enable Script
-- Jalankan di Supabase SQL Editor
-- Mengupdate constraint role agar mengizinkan 'admin'
-- ============================================

-- 1. Hapus constraint lama
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Tambah constraint baru dengan 'admin'
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('owner', 'ceo', 'manager', 'farmer', 'admin'));

-- 3. Tambah atau Update user Admin
-- GANTI nomor telepon dengan nomor kamu jika ingin nomor lain
INSERT INTO users (phone_number, full_name, role, is_active, company_id)
VALUES (
  6282133859391,  -- Admin phone number (082133859391)
  'Admin SmartFarm',
  'admin',
  true,
  '8523f28b-7f12-4455-a8a8-015d2a826d5c'
)
ON CONFLICT (phone_number) DO UPDATE SET role = 'admin';

-- VERIFIKASI
SELECT id, phone_number, full_name, role FROM users WHERE role = 'admin';
