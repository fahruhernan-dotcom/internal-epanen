# SmartFarm Owner Dashboard - Final Implementation Plan

## Executive Summary
Membangun web dashboard multifungsi (4 roles) yang terintegrasi dengan n8n Internal SmartFarm dan WhatsApp. Dashboard ini dirancang dengan estetika modern "Nature-Tech" (elegan & alami) untuk memberikan visibilitas penuh bagi Owner dan kontrol operasional bagi CEO/Farmer.

---

## 1. Arsitektur & Peran Pengguna

| Dashboard | Role | Akses Utama | Navigasi |
|-----------|------|-------------|------------|
| **Admin** | `admin` | Full System + **User Management** | Kelola User, AI Intelligence, All Reports |
| **Owner** | `owner` | Full Visibility + Intelligence | AI Intelligence, Monitoring Semua Perusahaan |
| **CEO** | `ceo` | **Manage Finance** (Company Sendiri) | Upload Finance, Monitoring Harian Company |
| **Farmer** | `farmer` | **Submit Reports** & SOP | Isi Laporan Harian, Buku Saku SOP |

---

## 2. Fitur Utama (Functional Requirements)

### 2.1 Dashboard & Monitoring
- **Global Overview**: Kartu ringkasan untuk semua perusahaan (Lyori, Moafarm, Kaja, ePanen, Melon).
- **Daily Monitoring**: Tabel laporan harian dengan filter perusahaan, tanggal, dan pelapor.
- **Financial Monitoring**: Ringkasan keuangan mingguan (Revenue, COGS, Profit).

### 2.2 Intelligence & Visualization
- **AI Architecture View**: Peta visual interaktif (Node Graph) yang menampilkan hierarki Agent n8n (Orchestrator -> Sub-Agents -> Tools).
- **RAG Document Reconstructor**: Algoritme untuk menyatukan kembali chunk dokumen PDF agar bisa dibaca secara mengalir (sequential).
- **AI Query (RAG)**: Chatbot untuk tanya jawab data perusahaan via n8n.

### 2.3 Fitur Premium (Phase 7)
- **SOP Reference**: Modul khusus panduan operasional untuk Farmer.
- **Audit Trail**: Log penghapusan/edit data untuk keamanan dan transparansi.
- **WhatsApp Alert Logs**: Riwayat notifikasi alert yang dikirim oleh n8n.
- **Trend Analytics**: Grafik pertumbuhan profit & produksi jangka panjang.
- **Draft Mode**: Simpan sementara laporan harian (antisipasi sinyal buruk).

---

## 3. Detail Teknis

### 3.1 Tech Stack
- **Frontend**: Vue.js 3 + Vite
- **Styling**: Vanilla CSS (Glassmorphism + Nature Theme)
- **Database**: Supabase (PostgreSQL + Vector)
- **Backend/AI**: n8n Workflow Integration

### 3.2 Keamanan Data
- **Role-Based Access Control (RBAC)**: CEO & Farmer hanya bisa melihat data milik perusahaannya sendiri.
- **Admin Only**: Panel manajemen user hanya bisa diakses oleh role `admin`.
- **Owner Privilege**: Fitur hapus data keuangan hanya untuk Owner (dan dicatat di Audit Trail).

---

## 4. Rencana Implementasi (Phases)

| Fase | Deskripsi | Status |
|------|-----------|--------|
| **Phase 1** | Project Setup & Auth (Role-based login) | 🔁 In Progress |
| **Phase 2** | Dashboard & Company Cards | ⏳ Pending |
| **Phase 3** | Reports Module (Daily & Finance View) | ⏳ Pending |
| **Phase 4** | AI Visualization & RAG Integration | ⏳ Pending |
| **Phase 5** | RAG Document Reconstructor | ⏳ Pending |
| **Phase 6** | AI Visual Architecture Refinement | ✅ Done |
| **Phase 7** | Premium Features (SOP, Audit, Analytics, Draft) | ⏳ Pending |

---

## 5. Struktur Folder Project

```
src/
├── components/          # Reusable UI (Cards, Tables, Charts)
├── views/               # Page Components (Admin, CEO, Farmer Dashboard)
├── stores/              # Pinia (Auth, Reports, Companies)
├── services/            # API Clients (Supabase, n8n)
└── layouts/             # MainLayout (Sidebar & Header)
```

---

## 6. Verifikasi & Pengujian
- **Manual**: Login dengan 4 akun berbeda untuk memastikan isolasi data.
- **Automated**: Vitest untuk logika store dan formatting data.
- **Final Check**: Responsif di desktop dan tablet.

---
**Dibuat oleh Antigravity (Advanced AI Coding Assistant)**
**Terakhir Diperbarui: 5 Februari 2026**
