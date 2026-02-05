# SmartFarm Internal System

Dashboard monitoring multifungsi yang terintegrasi dengan n8n Internal SmartFarm dan WhatsApp.

## 📁 Struktur Proyek

Proyek ini terbagi menjadi dua bagian utama:

### 1. [Frontend](./frontend)
Aplikasi web berbasis **Vue 3 + Vite**.
- **Path:** `/frontend`
- **Tampilan:** Elegant Nature-Tech (Dark/Light Mode).
- **Fitur Utama:** Dashboard Peran, RAG Reconstructor, SOP Pocket Book, Trend Analytics.

### 2. [Backend](./backend)
Logika database, automasi, dan script pendukung.
- **Path:** `/backend`
- `n8n/`: Workflow automasi WhatsApp & RAG.
- `sql/`: Script setup database Supabase.
- `scripts/`: Script utilitas (check DB, create admin, dll).

## 🚀 Cara Menjalankan

### Frontend (Dashboard)
```bash
cd frontend
npm install
npm run dev
```
Dashboard akan berjalan di `http://localhost:3000`

### Backend Scripts
```bash
# Cek database
cd backend/scripts
node check_db.mjs

# Buat admin user baru
node create_admin_user.mjs
```

## 👥 User Roles

| Role | Deskripsi | Company | Access |
|------|-----------|---------|--------|
| **Admin** | Website super-user | TIDAK ADA | Manage all users, full system access |
| **Owner** | Pemilik bisnis | Holding/All | Full visibility, all companies |
| **CEO** | CEO perusahaan | Assigned company | Manage finance & reports for their company |
| **Farmer** | Petani/operator | Assigned company | Submit daily reports for their company |

**Catatan:** Hanya role **Admin** yang tidak memiliki company (company_id = NULL).

## 🔐 Credentials Default

### Test Account
- **Phone:** `6281234567890`
- **Password:** `smartfarm2026`

### Admin Default (setelah run script)
- **Phone:** `628999999999`
- **Password:** `smartfarm2026`

## 🔧 Setup Awal

### 1. Jalankan Database Setup
```sql
-- Buka Supabase SQL Editor
-- Jalankan: backend/sql/database_setup.sql
```

### 2. Update Admin Role
```sql
-- Jalankan: backend/sql/update_admin_role.sql
```

### 3. Buat Admin User
```bash
cd backend/scripts
node create_admin_user.mjs
```

### 4. Login sebagai Admin
Gunakan admin account untuk:
- Membuat user baru (Owner, CEO, Farmer)
- Assign company ke user
- Manage semua user di sistem

## 🏢 Companies

Companies yang tersedia:
- **Lyori** - Agricultural farming
- **Moafarm** - Cattle farming
- **Kaja** - Vegetable farming
- **ePanen** - Harvest platform
- **Melon** - Melon farming
- **Owner/Holding** - Parent company

---
*Powered by SmartFarm Team 2026*
