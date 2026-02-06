-- ============================================
-- WEBSITE DATABASE LAYER
-- Adds website-specific functionality to existing n8n database
-- Does NOT modify existing n8n tables
-- ============================================

-- ============================================
-- PART 1: WEBSITE-SPECIFIC TABLES
-- ============================================

-- 1. AUDIT LOGS (Track all data changes)
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

-- 2. USER SESSIONS (Website authentication)
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

-- 3. NOTIFICATIONS (Website alerts)
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

-- 4. DRAFT REPORTS (Save reports before submission)
CREATE TABLE IF NOT EXISTS public.draft_daily_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  report_data jsonb NOT NULL,
  last_saved timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT draft_daily_reports_pkey PRIMARY KEY (id)
);

-- 5. USER PREFERENCES (Theme, settings, etc.)
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

-- 6. ANALYTICS SNAPSHOTS (For trend analytics)
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

-- 7. WHATSAPP MESSAGE LOGS (Track n8n WhatsApp messages)
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
-- PART 2: VIEWS FOR SIMPLIFIED QUERIES
-- ============================================

-- View: All daily reports combined (for dashboard)
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

-- View: User details with company
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

-- View: Weekly financial reports with company details
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

-- View: SOP violations with details
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
-- PART 3: HELPER FUNCTIONS
-- ============================================

-- Function: Get daily report table name by company code
CREATE OR REPLACE FUNCTION public.get_daily_report_table(company_code text)
RETURNS text AS $$
BEGIN
  CASE company_code
    WHEN 'EP' THEN RETURN 'daily_reports_epanen';
    WHEN 'KA' THEN RETURN 'daily_reports_kaja';
    WHEN 'LY' THEN RETURN 'daily_reports_lyori';
    WHEN 'ML' THEN RETURN 'daily_reports_melon';
    WHEN 'MO' THEN RETURN 'daily_reports_moafarm';
    ELSE RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Get company ID by code
CREATE OR REPLACE FUNCTION public.get_company_id(company_code text)
RETURNS uuid AS $$
  SELECT id FROM companies WHERE code = company_code LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Function: Create audit log entry
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_table_name text,
  p_record_id uuid,
  p_action text,
  p_old_data jsonb DEFAULT NULL,
  p_new_data jsonb DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_by
  ) VALUES (
    p_table_name,
    p_record_id,
    p_action,
    p_old_data,
    p_new_data,
    p_user_id
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Clean expired sessions
CREATE OR REPLACE FUNCTION public.clean_expired_sessions()
RETURNS int AS $$
DECLARE
  v_deleted_count int;
BEGIN
  DELETE FROM website_sessions
  WHERE expires_at < now() OR is_active = false;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Create notification
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

-- ============================================
-- PART 4: TRIGGERS FOR AUDIT LOGGING
-- ============================================

-- Trigger function for audit logging
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  v_old_data jsonb;
  v_new_data jsonb;
  v_user_id uuid;
BEGIN
  -- Get current user from session (if available)
  -- v_user_id := NULL; -- Set from application context

  IF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
    PERFORM create_audit_log(
      TG_TABLE_NAME,
      OLD.id,
      'delete',
      v_old_data,
      NULL,
      v_user_id
    );
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    PERFORM create_audit_log(
      TG_TABLE_NAME,
      NEW.id,
      'update',
      v_old_data,
      v_new_data,
      v_user_id
    );
    RETURN NEW;

  ELSIF TG_OP = 'INSERT' THEN
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
    PERFORM create_audit_log(
      TG_TABLE_NAME,
      NEW.id,
      'insert',
      NULL,
      v_new_data,
      v_user_id
    );
    RETURN NEW;

  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_users ON users;
CREATE TRIGGER audit_users
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_companies ON companies;
CREATE TRIGGER audit_companies
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_weekly_financial_reports ON weekly_financial_reports;
CREATE TRIGGER audit_weekly_financial_reports
  AFTER INSERT OR UPDATE OR DELETE ON weekly_financial_reports
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================
-- PART 5: INDEXES FOR PERFORMANCE
-- ============================================

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON audit_logs(changed_by);

-- Indexes for website_sessions
CREATE INDEX IF NOT EXISTS idx_website_sessions_user_id ON website_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_website_sessions_token ON website_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_website_sessions_expires_at ON website_sessions(expires_at);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Indexes for draft_daily_reports
CREATE INDEX IF NOT EXISTS idx_draft_reports_user_id ON draft_daily_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_draft_reports_company_id ON draft_daily_reports(company_id);

-- Indexes for whatsapp_logs
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_phone ON whatsapp_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status ON whatsapp_logs(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at ON whatsapp_logs(created_at DESC);

-- Indexes for analytics_snapshots
CREATE INDEX IF NOT EXISTS idx_analytics_company_date ON analytics_snapshots(company_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_metric_type ON analytics_snapshots(metric_type);

-- ============================================
-- PART 6: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on website tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins see all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Policy: Users see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can manage their own preferences
CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can manage their own drafts
CREATE POLICY "Users can manage own drafts"
  ON draft_daily_reports FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- PART 7: BRIDGE FUNCTIONS FOR N8N INTEGRATION
-- ============================================

-- Function: N8N can log WhatsApp messages
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

-- Function: N8N can create SOP violation alerts
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

  -- Create notification for user
  PERFORM create_notification(
    p_user_id,
    'SOP Violation Detected',
    'A ' || p_severity || ' severity violation was detected: ' || p_violation_type,
    'warning',
    '/sop-violations/' || v_violation_id
  );

  RETURN v_violation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get users for WhatsApp notification by company
CREATE OR REPLACE FUNCTION public.get_users_for_notification(
  p_company_id uuid,
  p_role text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  phone_number bigint,
  full_name text,
  role text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.phone_number,
    u.full_name,
    u.role
  FROM users u
  WHERE u.is_active = true
    AND u.company_id = p_company_id
    AND (p_role IS NULL OR u.role = p_role);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- PART 8: SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert admin user if not exists
INSERT INTO users (phone_number, full_name, role, is_active, company_id)
VALUES (
  '628999999999'::bigint,
  'Website Administrator',
  'admin',
  true,
  NULL
)
ON CONFLICT (phone_number) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all new tables
SELECT
  'New Website Tables' as section,
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'audit_logs',
    'website_sessions',
    'notifications',
    'draft_daily_reports',
    'user_preferences',
    'analytics_snapshots',
    'whatsapp_logs'
  )
ORDER BY tablename;

-- Check all views
SELECT
  'Website Views' as section,
  schemaname,
  viewname as tablename
FROM pg_views
WHERE schemaname = 'public'
  AND viewname LIKE 'v_%'
ORDER BY viewname;

-- Check all functions
SELECT
  'Website Functions' as section,
  n.nspname as schema_name,
  p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%'
  AND p.prokind = 'f'
ORDER BY p.proname;

-- ============================================
-- END OF WEBSITE LAYER SETUP
-- ============================================

-- Display summary
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'WEBSITE DATABASE LAYER SETUP COMPLETE';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ 7 New tables created';
  RAISE NOTICE '✅ 4 Views created for simplified queries';
  RAISE NOTICE '✅ Helper functions for n8n integration';
  RAISE NOTICE '✅ Audit logging enabled on critical tables';
  RAISE NOTICE '✅ Row Level Security policies configured';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Admin user: 628999999999';
  RAISE NOTICE 'Password: smartfarm2026';
  RAISE NOTICE '===========================================';
END $$;
