-- ============================================
-- MASTER SETUP: WEBSITE LAYER + FINANCIAL ADDITIONS
-- This script sets up ALL website-specific tables, views, and functions.
-- run this to ensure your database has all the latest features.
-- ============================================

-- ============================================
-- PART 1: PRE-REQUISITE FIXES
-- ============================================

-- Fix 1: Ensure 'users' table allows 'admin' role
DO $$
BEGIN
    ALTER TABLE IF EXISTS public.users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE IF EXISTS public.users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('admin', 'owner', 'ceo', 'farmer', 'manager'));
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint update skipped (table might not exist yet)';
END $$;

-- ============================================
-- PART 2: WEBSITE TABLES
-- ============================================

-- 1. AUDIT LOGS
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

-- 2. FINANCIAL PERIOD SUMMARIES (New for Smart Cards)
CREATE TABLE IF NOT EXISTS public.financial_period_summaries (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id),
    start_date date NOT NULL,
    end_date date NOT NULL,
    period_type text NOT NULL CHECK (period_type IN ('monthly', 'weekly', 'custom', 'daily')),
    summary_text text,
    period_label text, 
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT financial_period_summaries_pkey PRIMARY KEY (id)
);

-- 3. WEBSITE SESSIONS
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

-- 4. NOTIFICATIONS
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

-- 5. DRAFT REPORTS
CREATE TABLE IF NOT EXISTS public.draft_daily_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  report_data jsonb NOT NULL,
  last_saved timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT draft_daily_reports_pkey PRIMARY KEY (id)
);

-- 6. USER PREFERENCES
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

-- 7. ANALYTICS SNAPSHOTS
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

-- 8. WHATSAPP LOGS
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
-- PART 3: VIEWS
-- ============================================

-- View 1: Review of Finance Documents (Correct Source for Financial Reports)
CREATE OR REPLACE VIEW public.v_all_finance_docs AS
SELECT id, content, metadata, created_at, 'ePanen' as company_name, '3d0e89d1-76f5-421b-ba7b-c2c0dea6ebf0'::uuid as company_id FROM finance_epanen
UNION ALL
SELECT id, content, metadata, created_at, 'Kaja' as company_name, '8523f28b-7f12-4455-a8a8-015d2a826d5c'::uuid as company_id FROM finance_kaja
UNION ALL
SELECT id, content, metadata, created_at, 'Lyori' as company_name, '53af2fd7-685d-41b5-8daa-265fe3db9b46'::uuid as company_id FROM finance_lyori
UNION ALL
SELECT id, content, metadata, created_at, 'Melon' as company_name, '9c839312-d9ff-40c0-9800-732877cd7287'::uuid as company_id FROM finance_melon
UNION ALL
SELECT id, content, metadata, created_at, 'Moafarm' as company_name, '5236043f-a9ce-498c-84c4-c5de16893ccd'::uuid as company_id FROM finance_moafarm;

-- View 2: All Daily Reports (Operational)
CREATE OR REPLACE VIEW public.v_all_daily_reports AS
SELECT id, user_id, company_id, report_date, activities, issues, weather, notes, created_at, 'ePanen' as company_name FROM daily_reports_epanen
UNION ALL
SELECT id, user_id, company_id, report_date, activities, issues, weather, notes, created_at, 'Kaja' as company_name FROM daily_reports_kaja
UNION ALL
SELECT id, user_id, company_id, report_date, activities, issues, weather, notes, created_at, 'Lyori' as company_name FROM daily_reports_lyori
UNION ALL
SELECT id, user_id, company_id, report_date, activities, issues, weather, notes, created_at, 'Melon' as company_name FROM daily_reports_melon
UNION ALL
SELECT id, user_id, company_id, report_date, activities, issues, weather, notes, created_at, 'Moafarm' as company_name FROM daily_reports_moafarm;

-- View 3: User Details
CREATE OR REPLACE VIEW public.v_user_details AS
SELECT u.id, u.phone_number, u.full_name, u.role, u.company_id, c.name as company_name, c.code as company_code, u.is_active, u.created_at, u.updated_at
FROM users u LEFT JOIN companies c ON u.company_id = c.id;

-- View 4: Weekly Financial Reports (Legacy/Manual)
CREATE OR REPLACE VIEW public.v_financial_reports AS
SELECT wfr.id, wfr.company_id, c.name as company_name, c.code as company_code, wfr.year, wfr.week_number, wfr.period_start, wfr.period_end, wfr.revenue, wfr.cogs, wfr.operational_expenses, wfr.net_profit, wfr.expense_breakdown, wfr.uploaded_by, uploader.full_name as uploaded_by_name, wfr.is_approved, wfr.approved_by, approver.full_name as approved_by_name, wfr.approved_at, wfr.created_at, wfr.updated_at
FROM weekly_financial_reports wfr
LEFT JOIN companies c ON wfr.company_id = c.id
LEFT JOIN users uploader ON wfr.uploaded_by = uploader.id
LEFT JOIN users approver ON wfr.approved_by = approver.id;

-- View 5: SOP Violations
CREATE OR REPLACE VIEW public.v_sop_violations AS
SELECT sv.id, sv.daily_report_id, sv.sop_rule_id, sv.company_id, c.name as company_name, sv.user_id, u.full_name as user_name, sv.violation_type, sv.expected_value, sv.actual_value, sv.severity, sv.is_notified, sv.notified_at, sv.is_resolved, sv.resolved_by, resolver.full_name as resolved_by_name, sv.resolution_notes, sv.resolved_at, sv.is_escalated, sv.escalated_at, sv.escalation_notes, sv.created_at, sv.updated_at
FROM sop_violations sv
LEFT JOIN companies c ON sv.company_id = c.id
LEFT JOIN users u ON sv.user_id = u.id
LEFT JOIN users resolver ON sv.resolved_by = resolver.id;


-- ============================================
-- PART 4: INDEXES & RLS
-- ============================================

-- Indexes for new table
CREATE INDEX IF NOT EXISTS idx_finance_summaries_dates ON financial_period_summaries(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_finance_summaries_company ON financial_period_summaries(company_id);

-- Indexes for existing website tables
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_website_sessions_user_id ON website_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_draft_reports_user_id ON draft_daily_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_phone ON whatsapp_logs(phone_number);

-- RLS
ALTER TABLE financial_period_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Simplified for readability)
DO $$
BEGIN
    CREATE POLICY "Users can view own values" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


-- ============================================
-- PART 5: ADMIN USER
-- ============================================
INSERT INTO users (phone_number, full_name, role, is_active, company_id)
VALUES ('628999999999'::bigint, 'Website Administrator', 'admin', true, NULL)
ON CONFLICT (phone_number) DO UPDATE SET full_name = 'Website Administrator', role = 'admin', company_id = NULL, is_active = true;

-- Done
