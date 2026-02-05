# 🔧 STEP-BY-STEP SUPABASE SETUP GUIDE

Follow these steps EXACTLY to set up the website layer on your Supabase.

---

## STEP 1: Open Supabase Dashboard

1. Open your browser
2. Go to: **https://supabase.com/dashboard**
3. You should see your projects list
4. Find and click on your project

---

## STEP 2: Open SQL Editor

1. Look at the **left sidebar** (icons on the left side)
2. Find the icon that looks like: `</>` (SQL Editor)
3. Click on it
4. You should see a "New query" button

---

## STEP 3: Create New Query

1. Click the **"New query"** button
2. A white text editor will appear
3. This is where you'll paste the SQL code

---

## STEP 4: Copy the SQL Code

### OPTION A: Copy From File

1. Open File Explorer
2. Go to: `./backend/sql/`
3. Open file: `website_layer_setup.sql`
4. Press `Ctrl + A` (select all)
5. Press `Ctrl + C` (copy)

### OPTION B: Copy From Below

<details>
<summary>Click to expand SQL code (Scroll down to copy all)</summary>

```sql
-- ============================================
-- WEBSITE DATABASE LAYER - STEP BY STEP
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- PART 1: CREATE NEW TABLES

-- Table 1: Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid REFERENCES public.users(id),
  changed_at timestamp with time zone DEFAULT now(),
  ip_address text,
  user_agent text,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

-- Table 2: Website Sessions
CREATE TABLE IF NOT EXISTS public.website_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  session_token text NOT NULL UNIQUE,
  ip_address inet,
  user_agent text,
  last_activity timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT website_sessions_pkey PRIMARY KEY (id)
);

-- Table 3: Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  title text NOT NULL,
  message text NOT NULL,
  type text CHECK (type IN ('info', 'success', 'warning', 'error')),
  link text,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

-- Table 4: Draft Reports
CREATE TABLE IF NOT EXISTS public.draft_daily_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  report_data jsonb NOT NULL,
  last_saved timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT draft_daily_reports_pkey PRIMARY KEY (id)
);

-- Table 5: User Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  theme text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language text DEFAULT 'id' CHECK (language IN ('id', 'en')),
  notifications_enabled boolean DEFAULT true,
  default_company_id uuid REFERENCES public.companies(id),
  sidebar_collapsed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_preferences_pkey PRIMARY KEY (user_id)
);

-- Table 6: Analytics Snapshots
CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  snapshot_date date NOT NULL,
  metric_type text NOT NULL CHECK (metric_type IN ('profit', 'production', 'revenue', 'expenses')),
  metric_value numeric NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT analytics_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_snapshots_unique UNIQUE (company_id, snapshot_date, metric_type)
);

-- Table 7: WhatsApp Logs
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workflow_execution_id text,
  phone_number text NOT NULL,
  message_type text CHECK (message_type IN ('alert', 'notification', 'reminder')),
  message_content text,
  status text CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT whatsapp_logs_pkey PRIMARY KEY (id)
);

-- ============================================
-- PART 2: CREATE VIEWS
-- ============================================

-- View 1: All Daily Reports Combined
CREATE OR REPLACE VIEW public.v_all_daily_reports AS
SELECT
  id,
  user_id,
  company_id,
  report_date,
  activities,
  issues,
  weather,
  notes,
  created_at,
  'ePanen' as company_name
FROM daily_reports_epanen
UNION ALL
SELECT
  id,
  user_id,
  company_id,
  report_date,
  activities,
  issues,
  weather,
  notes,
  created_at,
  'Kaja' as company_name
FROM daily_reports_kaja
UNION ALL
SELECT
  id,
  user_id,
  company_id,
  report_date,
  activities,
  issues,
  weather,
  notes,
  created_at,
  'Lyori' as company_name
FROM daily_reports_lyori
UNION ALL
SELECT
  id,
  user_id,
  company_id,
  report_date,
  activities,
  issues,
  weather,
  notes,
  created_at,
  'Melon' as company_name
FROM daily_reports_melon
UNION ALL
SELECT
  id,
  user_id,
  company_id,
  report_date,
  activities,
  issues,
  weather,
  notes,
  created_at,
  'Moafarm' as company_name
FROM daily_reports_moafarm;

-- View 2: User Details with Company
CREATE OR REPLACE VIEW public.v_user_details AS
SELECT
  u.id,
  u.phone_number,
  u.full_name,
  u.role,
  u.company_id,
  c.name as company_name,
  c.code as company_code,
  u.is_active,
  u.created_at,
  u.updated_at
FROM users u
LEFT JOIN companies c ON u.company_id = c.id;

-- View 3: Financial Reports with Details
CREATE OR REPLACE VIEW public.v_financial_reports AS
SELECT
  wfr.id,
  wfr.company_id,
  c.name as company_name,
  c.code as company_code,
  wfr.year,
  wfr.week_number,
  wfr.period_start,
  wfr.period_end,
  wfr.revenue,
  wfr.cogs,
  wfr.operational_expenses,
  wfr.net_profit,
  wfr.expense_breakdown,
  wfr.uploaded_by,
  uploader.full_name as uploaded_by_name,
  wfr.is_approved,
  wfr.approved_by,
  approver.full_name as approved_by_name,
  wfr.approved_at,
  wfr.created_at,
  wfr.updated_at
FROM weekly_financial_reports wfr
LEFT JOIN companies c ON wfr.company_id = c.id
LEFT JOIN users uploader ON wfr.uploaded_by = uploader.id
LEFT JOIN users approver ON wfr.approved_by = approver.id;

-- View 4: SOP Violations with Details
CREATE OR REPLACE VIEW public.v_sop_violations AS
SELECT
  sv.id,
  sv.daily_report_id,
  sv.sop_rule_id,
  sv.company_id,
  c.name as company_name,
  sv.user_id,
  u.full_name as user_name,
  sv.violation_type,
  sv.expected_value,
  sv.actual_value,
  sv.severity,
  sv.is_notified,
  sv.notified_at,
  sv.is_resolved,
  sv.resolved_by,
  resolver.full_name as resolved_by_name,
  sv.resolution_notes,
  sv.resolved_at,
  sv.is_escalated,
  sv.escalated_at,
  sv.escalation_notes,
  sv.created_at,
  sv.updated_at
FROM sop_violations sv
LEFT JOIN companies c ON sv.company_id = c.id
LEFT JOIN users u ON sv.user_id = u.id
LEFT JOIN users resolver ON sv.resolved_by = resolver.id;

-- ============================================
-- PART 3: CREATE FUNCTIONS
-- ============================================

-- Function: Create Notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'info',
  p_link text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    link
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_link
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: N8N Log WhatsApp
CREATE OR REPLACE FUNCTION public.n8n_log_whatsapp(
  p_phone_number text,
  p_message_type text,
  p_message_content text,
  p_workflow_execution_id text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO whatsapp_logs (
    workflow_execution_id,
    phone_number,
    message_type,
    message_content,
    status,
    metadata
  ) VALUES (
    p_workflow_execution_id,
    p_phone_number,
    p_message_type,
    p_message_content,
    'sent',
    p_metadata
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: N8N Create SOP Violation
CREATE OR REPLACE FUNCTION public.n8n_create_sop_violation(
  p_daily_report_id uuid,
  p_company_id uuid,
  p_user_id uuid,
  p_violation_type text,
  p_expected_value text,
  p_actual_value text,
  p_severity text DEFAULT 'medium'
)
RETURNS uuid AS $$
DECLARE
  v_violation_id uuid;
BEGIN
  INSERT INTO sop_violations (
    daily_report_id,
    company_id,
    user_id,
    violation_type,
    expected_value,
    actual_value,
    severity
  ) VALUES (
    p_daily_report_id,
    p_company_id,
    p_user_id,
    p_violation_type,
    p_expected_value,
    p_actual_value,
    p_severity
  ) RETURNING id INTO v_violation_id;

  RETURN v_violation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 4: CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_website_sessions_user_id ON website_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_website_sessions_token ON website_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_draft_reports_user_id ON draft_daily_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_phone ON whatsapp_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_analytics_company_date ON analytics_snapshots(company_id, snapshot_date DESC);

-- ============================================
-- PART 5: INSERT ADMIN USER
-- ============================================

INSERT INTO users (phone_number, full_name, role, is_active, company_id)
VALUES (
  '628999999999'::bigint,
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

-- ============================================
-- PART 6: VERIFICATION
-- ============================================

-- Verify tables created
SELECT '✅ TABLES CREATED' as status, COUNT(*) as count
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('audit_logs', 'website_sessions', 'notifications', 'draft_daily_reports', 'user_preferences', 'analytics_snapshots', 'whatsapp_logs');

-- Verify views created
SELECT '✅ VIEWS CREATED' as status, COUNT(*) as count
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('v_all_daily_reports', 'v_user_details', 'v_financial_reports', 'v_sop_violations');

-- Verify admin user
SELECT '✅ ADMIN USER' as status, phone_number, full_name, role, company_id
FROM users
WHERE phone_number = '628999999999'::bigint;

-- Test notification function
SELECT create_notification(
  (SELECT id FROM users WHERE phone_number = '628999999999'::bigint),
  'Welcome!',
  'Website layer is ready!',
  'success'
) as notification_id;

-- Show notification created
SELECT '✅ NOTIFICATION TEST' as status, id, title, message, type
FROM notifications
WHERE title = 'Welcome!'
ORDER BY created_at DESC
LIMIT 1;

-- Summary
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'WEBSITE LAYER SETUP COMPLETE!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Admin login: 628999999999';
  RAISE NOTICE 'Password: smartfarm2026';
  RAISE NOTICE '===========================================';
END $$;
```

</details>

---

## STEP 5: Paste in Supabase

1. Go back to Supabase SQL Editor (the white text area)
2. Paste the SQL code (`Ctrl + V`)
3. You should see a LOT of SQL code

---

## STEP 6: Run the SQL

1. Look for the **RUN** button (usually at bottom right or top right)
2. Or press: **Ctrl + Enter**
3. Wait for it to process (5-10 seconds)

---

## STEP 7: Check Results

### ✅ SUCCESS: You should see:

```
✅ TABLES CREATED | 7
✅ VIEWS CREATED | 4
✅ ADMIN USER | 628999999999 | Website Administrator | admin | null
✅ NOTIFICATION TEST | [uuid] | Welcome! | Website layer is ready! | success
===========================================
WEBSITE LAYER SETUP COMPLETE!
===========================================
```

### ❌ ERROR: If you see red error text:

**Scroll to the error** and tell me what it says. Common errors:

| Error | Solution |
|-------|----------|
| `permission denied` | Make sure you're in the right project |
| `relation "users" does not exist` | Your database is different than expected |
| `constraint violation` | Run the fix constraint SQL first |

---

## STEP 8: Verify Tables Were Created

1. In Supabase, click **Table Editor** (icon looks like a grid)
2. Scroll down - you should see NEW tables:
   - `audit_logs`
   - `website_sessions`
   - `notifications`
   - `draft_daily_reports`
   - `user_preferences`
   - `analytics_snapshots`
   - `whatsapp_logs`

---

## STEP 9: Test Admin Login

1. Open your browser
2. Go to: `http://localhost:3000`
3. Login with:
   - **Phone:** `628999999999`
   - **Password:** `smartfarm2026`

---

## STEP 10: Verify in Database

Go back to Supabase SQL Editor and run:

```sql
-- Check admin user exists
SELECT * FROM users WHERE phone_number = '628999999999'::bigint;

-- Check notification was created
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1;

-- Check view works
SELECT * FROM v_user_details WHERE role = 'admin';
```

---

## 🆘 TROUBLESHOOTING

### Problem: "relation does not exist"

**Solution:** Your database might have different table names. Run this to check:

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Send me the list and I'll update the SQL.

---

### Problem: "permission denied"

**Solution:** Make sure you're the owner of the project. Check:
1. Supabase Dashboard → Project Settings
2. You should see "Owner" next to your email

---

### Problem: SQL runs but no tables appear

**Solution:** Refresh the page:
1. Press `F5` in browser
2. Go back to Table Editor
3. Tables should appear

---

## ✅ CHECKLIST

Before moving on, verify:

- [ ] SQL ran without errors
- [ ] Can see 7 new tables in Table Editor
- [ ] Can see 4 views in SQL Editor
- [ ] Admin user `628999999999` exists
- [ ] Can login to localhost with admin account
- [ ] Can see notification in `notifications` table

---

## 📞 Still Stuck?

Send me:
1. The exact error message
2. Screenshot if possible
3. What step you're on

I'll help you fix it! 👍
