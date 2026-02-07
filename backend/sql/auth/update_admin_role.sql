-- ============================================
-- SmartFarm Admin Role Update
-- Admin is a website super-user (not tied to any company)
-- ============================================

-- 1. UPDATE EXISTING ADMIN USERS
-- Set company_id to NULL for all admin users
UPDATE users
SET company_id = NULL
WHERE role = 'admin';

-- 2. VERIFY THE UPDATE
-- Check that admin users have NULL company_id
SELECT
    id,
    phone_number,
    full_name,
    role,
    company_id,
    is_active
FROM users
WHERE role = 'admin';

-- 3. CREATE A DEFAULT ADMIN USER (if not exists)
-- This creates a website admin with access to manage all users
-- Phone: 628999999999
-- Password: smartfarm2026
INSERT INTO users (phone_number, full_name, role, is_active, company_id)
VALUES (
  628999999999,
  'Website Administrator',
  'admin',
  true,
  NULL  -- Admin has NO company
)
ON CONFLICT (phone_number) DO UPDATE SET
  role = 'admin',
  company_id = NULL;

-- 4. ADD COMMENT FOR DOCUMENTATION
COMMENT ON COLUMN users.company_id IS 'Company ID (NULL for admin users who manage the website)';

-- 5. SHOW SUMMARY
-- Count users by role
SELECT
    role,
    COUNT(*) as user_count,
    COUNT(CASE WHEN company_id IS NULL THEN 1 END) as without_company
FROM users
WHERE is_active = true
GROUP BY role
ORDER BY role;

-- ============================================
-- Expected Results:
-- - All admin users should have company_id = NULL
-- - All other roles (owner, ceo, farmer) should have a company_id
-- ============================================
