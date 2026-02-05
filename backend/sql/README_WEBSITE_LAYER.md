# Website Database Layer - Quick Guide

## 📋 What Was Created

### 1. New Tables (7 tables)

| Table | Purpose | Notes |
|-------|---------|-------|
| `audit_logs` | Track all data changes | Automatic logging via triggers |
| `website_sessions` | User authentication sessions | For website login |
| `notifications` | In-app alerts & messages | Per-user notifications |
| `draft_daily_reports` | Save reports before submit | Auto-save feature |
| `user_preferences` | Theme, language, settings | Per-user customization |
| `analytics_snapshots` | Historical metrics | For trend analytics |
| `whatsapp_logs` | Track n8n WhatsApp messages | Sent/delivered/failed |

### 2. Views (4 views)

| View | Purpose |
|------|---------|
| `v_all_daily_reports` | All reports from all companies in one query |
| `v_user_details` | Users with their company info |
| `v_financial_reports` | Financial reports with company & user details |
| `v_sop_violations` | SOP violations with full details |

### 3. N8N Bridge Functions

| Function | Purpose | Called By |
|----------|---------|-----------|
| `n8n_log_whatsapp()` | Log sent WhatsApp messages | n8n workflow |
| `n8n_create_sop_violation()` | Create violation + notify user | n8n workflow |
| `get_users_for_notification()` | Get users to notify | n8n workflow |

### 4. Helper Functions

| Function | Purpose |
|----------|---------|
| `get_daily_report_table(code)` | Get table name by company code |
| `get_company_id(code)` | Get company ID by code |
| `create_audit_log()` | Manually create audit entry |
| `create_notification()` | Create user notification |
| `clean_expired_sessions()` | Remove old sessions |

---

## 🚀 How to Use

### Step 1: Run the SQL Script

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of: `backend/sql/website_layer_setup.sql`
3. Paste and run
4. Look for ✅ success messages

### Step 2: Update Frontend Code

Use the new views in your frontend:

```javascript
// Instead of querying each company table separately:
const { data } = await supabase
  .from('v_all_daily_reports')
  .select('*')
  .eq('company_name', 'Lyori')
  .order('report_date', { ascending: false })

// Get user details with company:
const { data } = await supabase
  .from('v_user_details')
  .select('*')
  .eq('is_active', true)
```

### Step 3: N8N Integration

In your n8n workflows, call these functions:

```javascript
// Log WhatsApp message sent:
await supabase.rpc('n8n_log_whatsapp', {
  p_phone_number: '6281234567890',
  p_message_type: 'alert',
  p_message_content: 'SOP violation detected!',
  p_workflow_execution_id: '{{$execution.id}}'
})

// Create SOP violation:
await supabase.rpc('n8n_create_sop_violation', {
  p_daily_report_id: reportId,
  p_company_id: companyId,
  p_user_id: userId,
  p_violation_type: 'missing_activity',
  p_expected_value: 'daily_report',
  p_actual_value: 'null',
  p_severity: 'high'
})
```

---

## 📊 Audit Trail

All changes to these tables are automatically logged:

- `users`
- `companies`
- `weekly_financial_reports`

View audit logs:

```sql
SELECT * FROM audit_logs
WHERE table_name = 'users'
ORDER BY changed_at DESC
LIMIT 10;
```

---

## 🔔 Notifications

Create notifications from anywhere:

```javascript
// From frontend:
await supabase.rpc('create_notification', {
  p_user_id: userId,
  p_title: 'Report Approved',
  p_message: 'Your daily report has been approved.',
  p_type: 'success',
  p_link: '/reports/123'
})
```

---

## 🔐 Security

- **RLS (Row Level Security)** enabled on all new tables
- Users can only see their own data
- Admins can see everything
- Website sessions managed separately from n8n sessions

---

## 📈 Analytics

Store snapshots for trend charts:

```javascript
await supabase.from('analytics_snapshots').insert({
  company_id: companyId,
  snapshot_date: today,
  metric_type: 'profit',
  metric_value: 15000000,
  metadata: { source: 'weekly_report' }
})
```

---

## ✅ Verification

After setup, run these to verify:

```sql
-- Check new tables:
SELECT tablename FROM pg_tables
WHERE tablename IN ('audit_logs', 'notifications', 'whatsapp_logs');

-- Check views:
SELECT viewname FROM pg_views WHERE viewname LIKE 'v_%';

-- Check admin user:
SELECT * FROM users WHERE phone_number = '628999999999';

-- Test notification:
SELECT create_notification(
  '628999999999'::uuid,
  'Test',
  'Website layer is working!',
  'success'
);
```

---

## 🎯 What's Different from Before?

| Before | After |
|--------|-------|
| No audit trail | Full audit logging |
| No notifications | In-app notification system |
| Drafts lost if browser closes | Auto-save to database |
| No user preferences | Theme, language per user |
| Hard to query all reports | Simple views |
| Manual n8n logging | Automatic logging functions |

---

**Created:** 2026-02-06
**Compatible with:** Your existing n8n database (no changes to n8n tables)
