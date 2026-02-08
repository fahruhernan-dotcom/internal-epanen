<template>
  <div class="admin-page animate-fade-in-up">
    <!-- Header Section -->
    <div class="page-header mb-2xl">
      <div>
        <h2 class="text-gradient-emerald text-3xl font-bold mb-xs">Administrasi Sistem</h2>
        <p class="text-muted">Kelola pengguna, akses role, dan konfigurasi sistem ekosistem.</p>
      </div>
      <button class="btn-primary-new hover-lift" @click="openAddModal" aria-label="Tambah user baru">
        <AppIcon name="plus" :size="20" />
        <span class="ml-sm font-semibold">Tambah User Baru</span>
      </button>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid mb-2xl">
      <!-- Total Users -->
      <div class="premium-card stat-card hover-glow">
        <div class="icon-pod emerald">
          <AppIcon name="users" :size="24" />
        </div>
        <div class="stat-content">
          <span class="stat-label">Total Pengguna</span>
          <span class="stat-value tabular-nums">{{ users.length }}</span>
        </div>
      </div>

      <!-- Admins -->
      <div class="premium-card stat-card hover-glow delay-1">
        <div class="icon-pod red">
          <AppIcon name="shield" :size="24" />
        </div>
        <div class="stat-content">
          <span class="stat-label">Administrator</span>
          <span class="stat-value tabular-nums">{{ usersByRole.admin }}</span>
        </div>
      </div>

      <!-- Owners/CEOs -->
      <div class="premium-card stat-card hover-glow delay-2">
        <div class="icon-pod purple">
          <AppIcon name="briefcase" :size="24" />
        </div>
        <div class="stat-content">
          <span class="stat-label">Eksekutif (Owner/CEO)</span>
          <span class="stat-value tabular-nums">{{ usersByRole.owner + usersByRole.ceo }}</span>
        </div>
      </div>

      <!-- Farmers -->
      <div class="premium-card stat-card hover-glow delay-3">
        <div class="icon-pod amber">
          <AppIcon name="sun" :size="24" />
        </div>
        <div class="stat-content">
          <span class="stat-label">Petani (Farmers)</span>
          <span class="stat-value tabular-nums">{{ usersByRole.farmer }}</span>
        </div>
      </div>
    </div>

    <!-- Users Table Section -->
    <div class="premium-card overflow-hidden">
      <div class="card-header-flex p-lg border-b border-glass">
        <div class="flex items-center gap-md">
          <div class="icon-box-sm">
             <AppIcon name="list" :size="18" />
          </div>
          <h3 class="font-bold text-lg">Direktori Pengguna</h3>
        </div>
        
        <div class="filter-wrapper">
          <AppIcon name="filter" :size="16" class="filter-icon" />
          <select v-model="filterRole" class="elite-select">
            <option value="">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
            <option value="ceo">CEO</option>
            <option value="farmer">Farmer</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="p-2xl flex flex-col items-center justify-center text-muted">
        <div class="spinner-premium mb-md"></div>
        <span>Menyinkronkan data pengguna...</span>
      </div>

      <div v-else class="table-responsive">
        <table class="elite-table">
          <thead>
            <tr>
              <th>Identitas Pengguna</th>
              <th>Kontak</th>
              <th>Role & Akses</th>
              <th>Entitas</th>
              <th>Status</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id" class="hover-row">
              <td>
                <div class="user-cell">
                  <div class="avatar-circle">{{ user.full_name.charAt(0).toUpperCase() }}</div>
                  <span class="font-semibold">{{ user.full_name }}</span>
                </div>
              </td>
              <td class="text-sm font-mono text-muted">{{ formatPhone(user.phone_number) }}</td>
              <td>
                <span class="role-badge" :class="user.role">
                  {{ user.role }}
                </span>
              </td>
              <td class="text-sm">
                <span v-if="user.role === 'admin'" class="text-muted italic">System Global</span>
                <span v-else class="font-medium text-main">{{ user.companies?.name || '-' }}</span>
              </td>
              <td>
                <div class="status-indicator">
                  <span class="status-dot" :class="user.is_active ? 'active' : 'inactive'"></span>
                  <span class="text-xs font-medium">{{ user.is_active ? 'Aktif' : 'Nonaktif' }}</span>
                </div>
              </td>
              <td>
                <div class="flex items-center justify-end gap-sm">
                  <button class="action-btn" @click="openEditModal(user)" title="Edit">
                    <AppIcon name="edit-2" :size="16" />
                  </button>
                  <button class="action-btn" @click="toggleUserStatus(user)" :title="user.is_active ? 'Nonaktifkan' : 'Aktifkan'">
                    <AppIcon :name="user.is_active ? 'lock' : 'unlock'" :size="16" />
                  </button>
                  <button class="action-btn danger" @click="confirmDeleteUser(user)" title="Hapus Permanen">
                    <AppIcon name="trash-2" :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-backdrop animate-fade-in" @click.self="closeModal">
      <div class="premium-card modal-card animate-scale-up">
        <div class="modal-header border-b border-glass p-lg flex justify-between items-center bg-glass-accent">
          <h3 class="text-xl font-bold">{{ editingUser ? 'Edit Profil Pengguna' : 'Registrasi User Baru' }}</h3>
          <button class="close-btn" @click="closeModal">
            <AppIcon name="x" :size="20" />
          </button>
        </div>

        <form @submit.prevent="saveUser" class="p-lg flex flex-col gap-lg">
          <div class="form-group">
            <label class="input-label">Nama Lengkap</label>
            <input 
              type="text" 
              v-model="formData.full_name" 
              class="elite-input" 
              placeholder="Contoh: Budi Santoso"
              required
            />
          </div>

          <div class="form-group">
            <label class="input-label">Nomor Telepon (WhatsApp)</label>
            <input 
              type="tel" 
              v-model="formData.phone_number" 
              class="elite-input" 
              placeholder="628xxxxxxxxxx"
              required
            />
            <small class="text-xs text-muted mt-xs">Akan digunakan untuk login dan notifikasi WA.</small>
          </div>

          <div class="grid grid-cols-2 gap-md">
            <div class="form-group">
              <label class="input-label">Role Akses</label>
              <div class="select-wrapper">
                <select v-model="formData.role" class="elite-input" required @change="handleRoleChange">
                  <option value="">Pilih Role...</option>
                  <option value="admin">⭐ Admin (Super User)</option>
                  <option value="owner">👔 Owner</option>
                  <option value="ceo">💼 CEO</option>
                  <option value="farmer">🌾 Farmer</option>
                </select>
                <AppIcon name="chevron-down" :size="16" class="select-icon" />
              </div>
            </div>

            <div class="form-group">
              <label class="input-label">
                Entitas Perusahaan
                <span v-if="formData.role === 'admin'" class="text-xs text-muted font-normal">(Tidak Perlu)</span>
              </label>
              <div class="select-wrapper">
                <select
                  v-model="formData.company_id"
                  class="elite-input"
                  :required="!['admin', 'owner'].includes(formData.role)"
                  :disabled="['admin', 'owner'].includes(formData.role)"
                >
                  <option value="">Pilih Perusahaan...</option>
                  <option v-for="company in companies" :key="company.id" :value="company.id">
                    {{ company.name }}
                  </option>
                </select>
                <AppIcon name="chevron-down" :size="16" class="select-icon" />
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="input-label">Password Sistem</label>
            <input 
              type="text" 
              v-model="formData.password" 
              class="elite-input font-mono" 
              placeholder="Default: smartfarm2026"
            />
             <small class="text-xs text-muted mt-xs">Biarkan kosong untuk menggunakan password default.</small>
          </div>

          <div class="form-group">
            <label class="flex items-center gap-md cursor-pointer p-sm rounded-lg hover:bg-white/5 transition-colors">
              <div class="toggle-switch">
                <input type="checkbox" v-model="formData.is_active" class="toggle-input" />
                <div class="toggle-slider"></div>
              </div>
              <span class="font-medium">Status Akun Aktif</span>
            </label>
          </div>

          <div v-if="formError" class="alert-box error">
            <AppIcon name="alert-circle" :size="18" />
            <span>{{ formError }}</span>
          </div>

          <div class="flex justify-end gap-md mt-md pt-md border-t border-glass">
            <button type="button" class="btn-ghost" @click="closeModal">Batal</button>
            <button type="submit" class="btn-primary-new" :disabled="saving">
              <template v-if="saving">
                 <div class="spinner-sm text-white"></div>
              </template>
              <template v-else>
                 <span>{{ editingUser ? 'Simpan Perubahan' : 'Buat User' }}</span>
              </template>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal (Premium Style) -->
    <div v-if="showDeleteModal" class="modal-backdrop animate-fade-in" @click.self="closeDeleteModal">
      <div class="premium-card modal-card animate-shake max-w-md border-error-soft">
        <div class="p-xl text-center">
          <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-lg text-red-600">
             <AppIcon name="alert-triangle" :size="32" />
          </div>
          <h3 class="text-xl font-bold mb-sm text-main">Konfirmasi Penghapusan</h3>
          <p class="text-muted mb-lg">
            Anda akan menghapus user <strong class="text-main">{{ userToDelete?.full_name }}</strong>. 
            Tindakan ini tidak dapat dibatalkan. Ketik nama user untuk konfirmasi.
          </p>

          <input 
            type="text" 
            v-model="deleteConfirmationText" 
            class="elite-input border-red-300 focus:border-red-500 mb-lg text-center" 
            :placeholder="userToDelete?.full_name"
          />

          <div class="flex gap-md">
            <button class="btn-ghost flex-1" @click="closeDeleteModal">Batalkan</button>
            <button
              @click="executeDeleteUser"
              class="btn-danger flex-1"
              :disabled="deleteConfirmationText !== userToDelete?.full_name || deleting"
            >
              <span v-if="deleting">Menghapus...</span>
              <span v-else>Hapus Permanen</span>
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import AppIcon from '@/components/AppIcon.vue'

const users = ref([])
const companies = ref([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const userToDelete = ref(null)
const deleteConfirmationText = ref('')
const editingUser = ref(null)
const filterRole = ref('')
const formError = ref('')

const formData = ref({
  full_name: '',
  phone_number: '',
  role: '',
  company_id: '',
  password: '',
  is_active: true
})

const filteredUsers = computed(() => {
  if (!filterRole.value) return users.value
  return users.value.filter(u => u.role === filterRole.value)
})

const usersByRole = computed(() => {
  const counts = { admin: 0, owner: 0, ceo: 0, farmer: 0 }
  users.value.forEach(u => {
    if (counts[u.role] !== undefined) counts[u.role]++
  })
  return counts
})

function formatPhone(phone) {
  if (!phone) return '-'
  const str = String(phone)
  if (str.length > 10) {
    return `+${str.slice(0, 2)} ${str.slice(2, 5)}-${str.slice(5, 9)}-${str.slice(9)}`
  }
  return str
}

function openAddModal() {
  editingUser.value = null
  formData.value = {
    full_name: '',
    phone_number: '',
    role: '',
    company_id: '',
    password: 'smartfarm2026',
    is_active: true
  }
  formError.value = ''
  showModal.value = true
}

function openEditModal(user) {
  editingUser.value = user
  formData.value = {
    full_name: user.full_name || '',
    phone_number: String(user.phone_number || ''),
    role: user.role || '',
    company_id: user.company_id || '',
    password: user.password || '',
    is_active: user.is_active !== false
  }
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingUser.value = null
  formError.value = ''
}

function handleRoleChange() {
  if (formData.value.role === 'admin') {
    formData.value.company_id = ''
  } else if (formData.value.role === 'owner') {
    const ownerCompany = companies.value.find(c => c.code === 'Owner' || c.name === 'Owner')
    if (ownerCompany) {
      formData.value.company_id = ownerCompany.id
    } else {
      formData.value.company_id = 'fef23b03-fe98-4a56-9ebc-64e1d21845fb'
    }
  }
}

async function saveUser() {
  saving.value = true
  formError.value = ''
  try {
    let phone = formData.value.phone_number.replace(/\D/g, '')
    if (phone.startsWith('0')) phone = '62' + phone.slice(1)
    if (!phone.startsWith('62')) phone = '62' + phone

    const userData = {
      full_name: formData.value.full_name,
      phone_number: parseInt(phone),
      role: formData.value.role,
      company_id: formData.value.company_id || null,
      password: formData.value.password || 'smartfarm2026',
      is_active: formData.value.is_active
    }

    if (editingUser.value) {
      const { error } = await supabase.from('users').update(userData).eq('id', editingUser.value.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('users').insert(userData)
      if (error) throw error
    }
    await loadUsers()
    closeModal()
  } catch (err) {
    formError.value = err.message
  } finally {
    saving.value = false
  }
}

async function toggleUserStatus(user) {
  try {
    const { error } = await supabase.from('users').update({ is_active: !user.is_active }).eq('id', user.id)
    if (error) throw error
    await loadUsers()
  } catch (err) {
    alert('Gagal mengubah status: ' + err.message)
  }
}

async function confirmDeleteUser(user) {
  userToDelete.value = user
  deleteConfirmationText.value = ''
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  userToDelete.value = null
  deleteConfirmationText.value = ''
}

async function executeDeleteUser() {
  if (deleteConfirmationText.value !== userToDelete.value.full_name) return
  deleting.value = true
  try {
    const { error } = await supabase.from('users').delete().eq('id', userToDelete.value.id)
    if (error) throw error
    await loadUsers()
    closeDeleteModal()
  } catch (err) {
    alert('Gagal menghapus user: ' + err.message)
  } finally {
    deleting.value = false
  }
}

async function loadUsers() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`*, companies (id, name, code)`)
      .order('full_name')
    if (error) throw error
    users.value = data || []
  } catch (err) {
    console.error('Failed to load users:', err)
  } finally {
    loading.value = false
  }
}

async function loadCompanies() {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, code')
      .eq('is_active', true)
      .order('name')
    if (error) throw error
    companies.value = data || []
  } catch (err) {
    console.error('Failed to load companies:', err)
  }
}

onMounted(() => {
  loadUsers()
  loadCompanies()
})
</script>

<style scoped>
/* Layout */
.admin-page {
  max-width: 1400px;
  margin: 0 auto;
  padding-bottom: 64px; /* Bottom spacing for page */
}

.page-header {
  margin-bottom: 48px; /* High separation for header */
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 32px; /* Increased card gap */
  margin-bottom: 48px; /* High separation for table */
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg); /* Reduced vertical padding */
  position: relative;
  overflow: hidden;
  background: rgba(var(--bg-card-rgb), 0.5); /* Ensure glass effect */
  border: 1px solid var(--glass-border);
  border-radius: 16px;
}

.icon-pod {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 16px -4px currentColor;
}

.icon-pod.emerald { background: linear-gradient(135deg, #10b981, #059669); color: rgba(16, 185, 129, 0.4); }
.icon-pod.emerald svg { color: white; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }

.icon-pod.red { background: linear-gradient(135deg, #ef4444, #b91c1c); color: rgba(239, 68, 68, 0.4); }
.icon-pod.red svg { color: white; }

.icon-pod.purple { background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: rgba(139, 92, 246, 0.4); }
.icon-pod.purple svg { color: white; }

.icon-pod.amber { background: linear-gradient(135deg, #f59e0b, #d97706); color: rgba(245, 158, 11, 0.4); }
.icon-pod.amber svg { color: white; }

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1;
}

/* ELITE TABLE CONTAINER & STYLES */
.premium-card.overflow-hidden {
  background: rgba(var(--bg-card-rgb), 0.3); /* Distinct container bg */
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.elite-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px; /* Slightly reduced gap for cohesiveness */
  padding: 0 var(--space-md); /* Internal padding for the table within card */
}

.elite-table th {
  text-align: left;
  padding: var(--space-md);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  font-weight: 700;
  border-bottom: none;
  background: rgba(255, 255, 255, 0.02); /* Subtle header highlight */
  border-radius: 8px; /* Rounded headers */
  margin-bottom: 8px;
}

.elite-table td {
  padding: 16px var(--space-md); /* Balanced padding */
  border-bottom: 1px solid var(--glass-border);
  color: var(--text-main);
  vertical-align: middle;
}

.hover-row:hover td {
  background: rgba(var(--text-main-rgb), 0.02);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

/* Badges & Status */
.role-badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.role-badge.admin { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
.role-badge.owner { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.2); }
.role-badge.ceo { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
.role-badge.farmer { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-dim);
}

.status-dot.active {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

/* Actions */
.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--text-muted);
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(var(--text-main-rgb), 0.05);
  color: var(--color-primary);
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* Buttons */
.btn-primary-new {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
  padding: 10px 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary-new:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.4);
}

.btn-ghost {
  padding: 10px 20px;
  border-radius: 10px;
  color: var(--text-muted);
  font-weight: 600;
  transition: background 0.2s;
}

.btn-ghost:hover {
  background: rgba(var(--text-main-rgb), 0.05);
  color: var(--text-main);
}

.btn-danger {
  background: #ef4444;
  color: white;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-danger:hover {
  background: #dc2626;
}

/* Inputs */
.elite-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid var(--glass-border);
  background: rgba(var(--text-main-rgb), 0.03);
  color: var(--text-main);
  transition: all 0.2s;
}

.elite-input:focus {
  outline: none;
  background: rgba(var(--text-main-rgb), 0.05);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.select-wrapper {
  position: relative;
}

.select-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--text-muted);
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-card {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--glass-border);
}

.input-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 6px;
}

/* Animation Utilities */
.hover-lift { transition: transform 0.3s ease; }
.hover-lift:hover { transform: translateY(-2px); }
.hover-glow:hover { box-shadow: 0 0 20px rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); }

.animate-scale-up {
  animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }

/* Filter Select */
.elite-select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--glass-border);
  background: rgba(var(--bg-card-rgb), 0.5);
  color: var(--text-main);
  font-size: 0.85rem;
  cursor: pointer;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: rgba(var(--text-main-rgb), 0.2);
  transition: .4s;
  border-radius: 34px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

.toggle-input:checked + .toggle-slider {
  background-color: var(--color-primary);
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(20px);
}
</style>
