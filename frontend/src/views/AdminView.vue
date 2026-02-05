<template>
  <div class="admin-page animate-fade-in">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2>Website Administration</h2>
        <p class="text-muted">Manage all users, companies, and system settings</p>
      </div>
      <button class="btn btn-primary" @click="openAddModal">
        ➕ Add New User
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-row">
      <div class="mini-stat card">
        <span class="stat-value">{{ users.length }}</span>
        <span class="stat-label">Total Users</span>
      </div>
      <div class="mini-stat card">
        <span class="stat-value">{{ usersByRole.admin }}</span>
        <span class="stat-label">Admins</span>
      </div>
      <div class="mini-stat card">
        <span class="stat-value">{{ usersByRole.owner }}</span>
        <span class="stat-label">Owners</span>
      </div>
      <div class="mini-stat card">
        <span class="stat-value">{{ usersByRole.ceo }}</span>
        <span class="stat-label">CEOs</span>
      </div>
      <div class="mini-stat card">
        <span class="stat-value">{{ usersByRole.farmer }}</span>
        <span class="stat-label">Farmers</span>
      </div>
    </div>

    <!-- Users Table -->
    <div class="card">
      <div class="card-header">
        <h3>Daftar User</h3>
        <div class="filter-group">
          <select v-model="filterRole" class="form-input">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
            <option value="ceo">CEO</option>
            <option value="farmer">Farmer</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <span>Memuat data...</span>
      </div>

      <div v-else class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Nomor Telepon</th>
              <th>Role</th>
              <th>Company</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <strong>{{ user.full_name }}</strong>
              </td>
              <td>{{ formatPhone(user.phone_number) }}</td>
              <td>
                <span class="badge" :class="getRoleBadgeClass(user.role)">
                  {{ user.role }}
                </span>
              </td>
              <td>
                <span v-if="user.role === 'admin'" class="badge badge-error">Website Admin</span>
                <span v-else>{{ user.companies?.name || '-' }}</span>
              </td>
              <td>
                <span class="badge" :class="user.is_active ? 'badge-success' : 'badge-error'">
                  {{ user.is_active ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon" @click="openEditModal(user)" title="Edit">✏️</button>
                  <button class="btn-icon" @click="toggleUserStatus(user)" :title="user.is_active ? 'Nonaktifkan' : 'Aktifkan'">
                    {{ user.is_active ? '🔒' : '🔓' }}
                  </button>
                  <button class="btn-icon btn-delete" @click="confirmDeleteUser(user)" title="Hapus User">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content card">
        <div class="modal-header">
          <h3>{{ editingUser ? 'Edit User' : 'Tambah User Baru' }}</h3>
          <button class="btn-close" @click="closeModal">✕</button>
        </div>

        <form @submit.prevent="saveUser" class="modal-body">
          <div class="form-group">
            <label class="form-label">Nama Lengkap *</label>
            <input 
              type="text" 
              v-model="formData.full_name" 
              class="form-input" 
              placeholder="Nama lengkap user"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Nomor Telepon *</label>
            <input 
              type="tel" 
              v-model="formData.phone_number" 
              class="form-input" 
              placeholder="628xxxxxxxxxx"
              required
            />
            <small class="form-hint">Format: 628xxxxxxxxxx (tanpa + atau spasi)</small>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Role *</label>
              <select v-model="formData.role" class="form-input" required @change="handleRoleChange">
                <option value="">Select Role</option>
                <option value="admin">Admin (Website Super-User)</option>
                <option value="owner">Owner</option>
                <option value="ceo">CEO</option>
                <option value="farmer">Farmer</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">
                Company *
                <small v-if="formData.role === 'admin'" class="text-muted">(Not required for Admin)</small>
              </label>
              <select
                v-model="formData.company_id"
                class="form-input"
                :required="formData.role !== 'admin'"
                :disabled="formData.role === 'admin'"
              >
                <option value="">Select Company</option>
                <option v-for="company in companies" :key="company.id" :value="company.id">
                  {{ company.name }}
                </option>
              </select>
              <small v-if="formData.role !== 'admin' && !formData.company_id" class="form-hint text-error">
                Company is required for {{ formData.role }} role
              </small>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Password (Sistem Website)</label>
            <input 
              type="text" 
              v-model="formData.password" 
              class="form-input" 
              placeholder="smartfarm2026"
            />
            <small class="form-hint">Kosongkan jika ingin menggunakan default "smartfarm2026"</small>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.is_active" />
              <span>User Aktif</span>
            </label>
          </div>

          <div v-if="formError" class="error-message">
            ⚠️ {{ formError }}
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="spinner"></span>
              <span v-else>{{ editingUser ? 'Simpan Perubahan' : 'Tambah User' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-content card border-error shadow-xl animate-shake">
        <div class="modal-header border-none bg-error-light text-error">
          <h3>⚠️ Konfirmasi Penghapusan Permanen</h3>
          <button class="btn-close" @click="closeDeleteModal">✕</button>
        </div>
        
        <div class="modal-body p-lg">
          <p>Anda akan menghapus user <strong>{{ userToDelete?.full_name }}</strong> secara permanen.</p>
          <p class="text-sm text-muted mb-md">Seluruh data akses user ini akan dicabut. Ketik <strong>{{ userToDelete?.full_name }}</strong> di bawah untuk melanjutkan:</p>
          
          <input 
            type="text" 
            v-model="deleteConfirmationText" 
            class="form-input border-error mb-md" 
            :placeholder="userToDelete?.full_name"
          />

          <div v-if="userToDelete?.role === 'owner'" class="warning-banner mb-md">
            <strong>PERINGATAN:</strong> Ini adalah akun OWNER. Pastikan ada akun Owner lain sebelum menghapus akun ini agar sistem tidak terkunci.
          </div>
        </div>

        <div class="modal-footer bg-gray-50">
          <button class="btn btn-secondary" @click="closeDeleteModal">Batal</button>
          <button 
            @click="executeDeleteUser" 
            class="btn btn-error" 
            :disabled="deleteConfirmationText !== userToDelete?.full_name || deleting"
          >
            <span v-if="deleting" class="spinner"></span>
            <span v-else>🔥 Ya, Hapus Permanen</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'

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

function getRoleBadgeClass(role) {
  const classes = {
    admin: 'badge-error',
    owner: 'badge-info',
    ceo: 'badge-warning',
    farmer: 'badge-success'
  }
  return classes[role] || 'badge-info'
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
  // Clear company_id when admin is selected (admin doesn't belong to any company)
  if (formData.value.role === 'admin') {
    formData.value.company_id = ''
  }
}

async function saveUser() {
  saving.value = true
  formError.value = ''

  try {
    // Validate phone number
    let phone = formData.value.phone_number.replace(/\D/g, '')
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1)
    }
    if (!phone.startsWith('62')) {
      phone = '62' + phone
    }

    const userData = {
      full_name: formData.value.full_name,
      phone_number: parseInt(phone),
      role: formData.value.role,
      company_id: formData.value.company_id || null,
      password: formData.value.password || 'smartfarm2026',
      is_active: formData.value.is_active
    }

    if (editingUser.value) {
      // Update existing user
      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', editingUser.value.id)

      if (error) throw error
    } else {
      // Insert new user
      const { error } = await supabase
        .from('users')
        .insert(userData)

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
    const { error } = await supabase
      .from('users')
      .update({ is_active: !user.is_active })
      .eq('id', user.id)

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
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userToDelete.value.id)

    if (error) throw error
    
    await loadUsers()
    closeDeleteModal()
    alert('User berhasil dihapus secara permanen.')
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
      .select(`
        *,
        companies (
          id,
          name,
          code
        )
      `)
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
.admin-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  margin: 0;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
}

.mini-stat {
  text-align: center;
  padding: var(--space-lg);
}

.mini-stat .stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-600);
}

.mini-stat .stat-label {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--border-color);
}

.card-header h3 {
  margin: 0;
}

.filter-group .form-input {
  min-width: 150px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: var(--space-xs);
}

.btn-icon {
  background: var(--bg-tertiary);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.btn-icon:hover {
  background: var(--primary-100);
  transform: scale(1.05);
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-lg);
}

.modal-content {
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
}

.btn-close {
  background: var(--bg-tertiary);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.btn-close:hover {
  background: var(--error);
  color: white;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.form-hint {
  display: block;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-top: var(--space-xs);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--error);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-color);
}

.border-error {
  border: 1px solid var(--error) !important;
}

.bg-error-light {
  background-color: rgba(239, 68, 68, 0.05);
}

.btn-error {
  background: var(--error);
  color: white;
  border: none;
}

.btn-error:hover:not(:disabled) {
  background: #dc2626;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-error:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.warning-banner {
  background: #fffbeb;
  border-left: 4px solid #f59e0b;
  color: #92400e;
  padding: var(--space-md);
  font-size: 0.875rem;
  border-radius: var(--radius-sm);
}

.animate-shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  gap: var(--space-md);
  color: var(--text-tertiary);
}

/* Responsive */
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    gap: var(--space-md);
    align-items: stretch;
  }
}
</style>
