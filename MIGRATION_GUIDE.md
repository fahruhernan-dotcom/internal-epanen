# Security Migration Guide

## What Changed?

### 1. Authentication (auth.js)
- **Strategy**: Uses **email-based** Supabase Auth instead of Phone Auth.
- **Why**: Phone Auth requires a paid Twilio account. Email Auth works out of the box.
- **How**: Phone numbers are converted to fake emails: `628987654321@epanen.local`
- **Fallback**: If Supabase Auth fails, the app falls back to direct database login (legacy mode).
- **User Experience**: Nothing changes — users still enter their phone number and password.

### 2. XSS Prevention (security.js)
- **New utility**: `sanitizeHTML()` using DOMPurify.
- **Applied to**: AI summary rendering in `DashboardView.vue`.
- **Blocks**: `<script>`, `<iframe>`, `onclick`, and other malicious HTML.

### 3. Row Level Security (RLS)
- **Enabled on**: `users`, `companies`, and all `daily_reports_*` tables.
- **Policies**: Role-based access (admin/owner/ceo can see everything; others are restricted).
- **Anon Access**: Temporary `anon` policies allow legacy login to continue working.

---

## Migration Steps

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Run the SQL Migration
1. Open your **Supabase Dashboard** → **SQL Editor**.
2. Copy the ENTIRE content of `supabase_security_migration.sql`.
3. Paste and **Run** the query.
4. You should see: `Success. No rows returned`.

### Step 3: Verify
1. Go to **Authentication** → **Users** in Supabase Dashboard.
2. You should see your users listed with emails like `628xxx@epanen.local`.
3. Try logging in at `localhost:3000/login` with your phone number and password.

---

## Login Credentials (After Migration)

| User                  | Phone         | Password    |
| --------------------- | ------------- | ----------- |
| Website Administrator | 08987654321   | epanen2026  |
| Daniel (CEO)          | 08132155522   | epanen2026* |
| Budi (Owner)          | 085709947075  | epanen2026* |
| Ares (Cashier)        | 08123456789   | epanen2026* |
| Lemon (Cashier)       | 082133859391  | epanen2026* |

*\* Uses existing password from DB, or `epanen2026` if none was set.*

---

## Future Improvements (TODO)
- [ ] Remove `anon` policies once all users are migrated to Supabase Auth.
- [ ] Add proper password change flow using `supabase.auth.updateUser()`.
- [ ] Consider migrating to real email addresses for password recovery.
