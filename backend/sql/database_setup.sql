-- ============================================
-- SmartFarm Owner Dashboard - Database Setup
-- Jalankan di Supabase SQL Editor
-- TIDAK mengubah n8n workflow sama sekali
-- ============================================

-- ============================================
-- 1. TAMBAH USER OWNER (jika belum ada)
-- ============================================

-- Cek apakah sudah ada owner
SELECT * FROM users WHERE role = 'owner';

-- Jika belum ada, tambahkan owner
-- GANTI nomor telepon dengan nomor kamu
INSERT INTO users (phone_number, full_name, role, is_active, company_id)
VALUES (
  628123456789,  -- GANTI dengan nomor teleponmu (format: 62xxxxxxxxxx)
  'Owner SmartFarm',
  'owner',
  true,
  '8523f28b-7f12-4455-a8a8-015d2a826d5c'  -- Holding company ID
)
ON CONFLICT (phone_number) DO UPDATE SET role = 'owner';

-- ============================================
-- 2. PASTIKAN TABEL COMPANIES ADA & LENGKAP
-- ============================================

-- Cek companies yang sudah ada
SELECT * FROM companies;

-- Jika perlu tambah company, gunakan ini:
-- (Biasanya sudah ada dari n8n workflow)

/*
INSERT INTO companies (id, code, name, industry, is_active) VALUES
  ('3d0e89d1-76f5-421b-ba7b-c2c0dea6ebf0', 'EP', 'ePanen', 'Agriculture', true),
  ('5236043f-a9ce-498c-84c4-c5de16893ccd', 'MO', 'Moafarm', 'Agriculture', true),
  ('53af2fd7-685d-41b5-8daa-265fe3db9b46', 'LY', 'Lyori', 'Agriculture', true),
  ('8523f28b-7f12-4455-a8a8-015d2a826d5c', 'HD', 'Holding', 'Holding Company', true),
  ('9c839312-d9ff-40c0-9800-732877cd7287', 'ML', 'Melon', 'Agriculture', true)
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================
-- 3. PASTIKAN TABEL DAILY REPORTS ADA
-- ============================================

-- Cek apakah tabel daily reports sudah ada
-- (Jika error "does not exist", buat tabelnya)

-- Untuk ePanen
CREATE TABLE IF NOT EXISTS daily_reports_epanen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  company_id TEXT,
  report_date DATE DEFAULT CURRENT_DATE,
  activities JSONB,
  issues JSONB,
  weather TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Untuk Lyori
CREATE TABLE IF NOT EXISTS daily_reports_lyori (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  company_id TEXT,
  report_date DATE DEFAULT CURRENT_DATE,
  activities JSONB,
  issues JSONB,
  weather TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Untuk Moafarm
CREATE TABLE IF NOT EXISTS daily_reports_moafarm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  company_id TEXT,
  report_date DATE DEFAULT CURRENT_DATE,
  activities JSONB,
  issues JSONB,
  weather TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Untuk Kaja
CREATE TABLE IF NOT EXISTS daily_reports_kaja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  company_id TEXT,
  report_date DATE DEFAULT CURRENT_DATE,
  activities JSONB,
  issues JSONB,
  weather TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Untuk Melon
CREATE TABLE IF NOT EXISTS daily_reports_melon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  company_id TEXT,
  report_date DATE DEFAULT CURRENT_DATE,
  activities JSONB,
  issues JSONB,
  weather TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Untuk Holding (optional)
CREATE TABLE IF NOT EXISTS daily_reports_holding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  company_id TEXT,
  report_date DATE DEFAULT CURRENT_DATE,
  activities JSONB,
  issues JSONB,
  weather TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. SAMPLE DATA UNTUK TESTING (OPTIONAL)
-- ============================================

-- Tambah sample daily report untuk testing
/*
INSERT INTO daily_reports_epanen (user_id, report_date, activities, issues, weather, notes)
VALUES (
  'Pak Tani',
  CURRENT_DATE,
  '{"summary": "Panen cabai merah", "details": "100kg cabai dipanen hari ini"}',
  '[{"type": "pest", "severity": "low", "notes": "Ada hama dikit"}]',
  'Cerah',
  'Hasil panen bagus'
);

INSERT INTO daily_reports_lyori (user_id, report_date, activities, issues, weather, notes)
VALUES (
  'Bu Tani Lyori',
  CURRENT_DATE,
  '{"summary": "Perawatan tanaman", "details": "Penyiraman dan pemupukan"}',
  null,
  'Mendung',
  'Kondisi tanaman sehat'
);

INSERT INTO daily_reports_moafarm (user_id, report_date, activities, issues, weather, notes)
VALUES (
  'Pak Moafarm',
  CURRENT_DATE - INTERVAL '1 day',
  '{"summary": "Persiapan lahan", "details": "Penggemburan tanah untuk musim tanam"}',
  null,
  'Hujan ringan',
  'Lahan siap tanam minggu depan'
);
*/

-- ============================================
-- 5. VERIFIKASI SETUP
-- ============================================

-- Cek owner user
SELECT id, phone_number, full_name, role, is_active 
FROM users 
WHERE role = 'owner';

-- Cek companies
SELECT id, code, name, is_active 
FROM companies 
WHERE is_active = true;

-- Cek jumlah reports per company
SELECT 'ePanen' as company, COUNT(*) as reports FROM daily_reports_epanen
UNION ALL
SELECT 'Lyori', COUNT(*) FROM daily_reports_lyori
UNION ALL
SELECT 'Moafarm', COUNT(*) FROM daily_reports_moafarm
UNION ALL
SELECT 'Kaja', COUNT(*) FROM daily_reports_kaja
UNION ALL
SELECT 'Melon', COUNT(*) FROM daily_reports_melon;
