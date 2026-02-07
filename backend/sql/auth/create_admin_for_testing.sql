-- ============================================
-- QUICK ADMIN SETUP FOR LOCALHOST TESTING
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. CREATE OR UPDATE ADMIN USER
-- This admin will be able to manage all users
-- Login: 628999999999
-- Password: smartfarm2026
INSERT INTO users (phone_number, full_name, role, is_active, company_id)
VALUES (
  '628999999999',
  'Website Administrator',
  'admin',
  true,
  NULL  -- Admin has NO company
)
ON CONFLICT (phone_number) DO UPDATE SET
  full_name = 'Website Administrator',
  role = 'admin',
  company_id = NULL,
  is_active = true;

-- 2. VERIFY ADMIN USER CREATED
SELECT
    '✅ Admin User Created!' as status,
    id,
    phone_number,
    full_name,
    role,
    company_id,
    is_active
FROM users
WHERE phone_number = '628999999999';

-- 3. SHOW ALL USERS (for reference)
SELECT
    role,
    COUNT(*) as count,
    CASE
      WHEN role = 'admin' THEN 'No company (website admin)'
      ELSE 'Has company'
    END as company_status
FROM users
WHERE is_active = true
GROUP BY role
ORDER BY role;

-- ============================================
-- INSTRUCTIONS:
-- 1. Copy this entire script
-- 2. Go to https://supabase.com/dashboard
-- 3. Select your project
-- 4. Go to SQL Editor
-- 5. Paste and run this script
-- 6. Login to localhost with: 628999999999 / smartfarm2026
-- ============================================
