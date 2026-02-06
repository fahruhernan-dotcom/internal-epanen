-- ============================================
-- FIX ADMIN ROLE CONSTRAINT
-- Run this in Supabase SQL Editor FIRST
-- ============================================

-- STEP 1: Drop the old constraint (that doesn't allow 'admin')
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- STEP 2: Add new constraint that includes 'admin' role
ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('admin', 'owner', 'ceo', 'farmer', 'manager'));

-- STEP 3: Verify the constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND contype = 'c';

-- ============================================
-- Expected output should show:
-- users_role_check
-- CHECK (role IN ('admin', 'owner', 'ceo', 'farmer', 'manager'))
-- ============================================

-- STEP 4: Now insert the admin user
INSERT INTO users (phone_number, full_name, role, is_active, company_id)
VALUES (
  '628999999999',
  'Website Administrator',
  'admin',
  true,
  NULL
)
ON CONFLICT (phone_number) DO UPDATE SET
  full_name = 'Website Administrator',
  role = 'admin',
  company_id = NULL,
  is_active = true;

-- STEP 5: Verify admin user created
SELECT '✅ Admin User Created!' as status, *
FROM users
WHERE phone_number = '628999999999';

-- STEP 6: Show all roles in database
SELECT DISTINCT role
FROM users
ORDER BY role;
