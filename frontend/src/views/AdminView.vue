<template>
  <div class="admin-page">
    <!-- Page Header -->
    <div class="page-header animate-fade-in">
      <div class="header-content">
        <div class="title-group">
          <div class="premium-badge mb-xs">SYSTEM COMMAND</div>
          <h2 class="page-title">Direktori & Akses</h2>
          <p class="page-subtitle">Pusat kendali otentikasi dan manajemen personil Internal ePanen.</p>
        </div>
        <button class="btn-primary-glow" @click="openAddModal">
          <AppIcon name="user-plus" :size="20" />
          <span>Registrasi User</span>
        </button>
      </div>
    </div>

    <!-- Stats Hub -->
    <div class="stats-hub mb-xl animate-up">
      <div class="stat-glass-card">
        <div class="stat-icon-wrapper emerald">
          <AppIcon name="users" :size="24" />
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Personil</span>
          <span class="stat-value">{{ users.length }}</span>
        </div>
        <div class="stat-bg-glow emerald"></div>
      </div>

      <div class="stat-glass-card">
        <div class="stat-icon-wrapper red">
          <AppIcon name="shield-check" :size="24" />
        </div>
        <div class="stat-info">
          <span class="stat-label">Admin Sistem</span>
          <span class="stat-value">{{ usersByRole.admin || 0 }}</span>
        </div>
        <div class="stat-bg-glow red"></div>
      </div>

      <div class="stat-glass-card">
        <div class="stat-icon-wrapper purple">
          <AppIcon name="crown" :size="24" />
        </div>
        <div class="stat-info">
          <span class="stat-label">Eksekutif</span>
          <span class="stat-value">{{ (usersByRole.owner || 0) + (usersByRole.ceo || 0) }}</span>
        </div>
        <div class="stat-bg-glow purple"></div>
      </div>

      <div class="stat-glass-card">
        <div class="stat-icon-wrapper amber">
          <AppIcon name="sprout" :size="24" />
        </div>
        <div class="stat-info">
          <span class="stat-label">Operasional</span>
          <span class="stat-value">{{ usersByRole.farmer || 0 }}</span>
        </div>
        <div class="stat-bg-glow amber"></div>
      </div>

      <div class="stat-glass-card">
        <div class="stat-icon-wrapper pink">
          <AppIcon name="receipt" :size="24" />
        </div>
        <div class="stat-info">
          <span class="stat-label">KASIR</span>
          <span class="stat-value">{{ usersByRole.cashier || 0 }}</span>
        </div>
        <div class="stat-bg-glow pink"></div>
      </div>
    </div>

    <!-- User Directory Toolbar -->
    <div class="directory-container glass-premium-dark">
      <div class="directory-header">
        <div class="header-left">
          <AppIcon name="command" :size="20" class="header-icon" />
          <h3 class="directory-title">Direktori Pengguna</h3>
        </div>
        
        <div class="filter-group">
          <div class="search-box">
            <AppIcon name="search" :size="16" />
            <input 
              type="text" 
              v-model="searchQuery"
              placeholder="Cari nama..." 
              class="search-input" 
            />
          </div>
          <div class="select-pill">
            <AppIcon name="filter" :size="14" />
            <select v-model="filterRole">
              <option value="">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
              <option value="ceo">CEO</option>
              <option value="farmer">Farmer</option>
              <option value="cashier">Cashier</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="premium-loader"></div>
        <p>Menghubungkan ke database...</p>
      </div>

      <div v-else class="user-grid">
        <div v-for="(user, index) in filteredUsers" :key="user.id" 
             class="user-row-card animate-slide-right"
             :style="{ animationDelay: `${index * 50}ms` }">
          
          <div class="user-identity">
            <div class="user-avatar-premium" :class="user.role">
              {{ user.full_name?.charAt(0).toUpperCase() || '?' }}
              <div class="status-indicator-ring" :class="{ 'active': user.is_active }"></div>
            </div>
            <div class="user-info-text">
              <span class="user-name">{{ user.full_name }}</span>
              <span class="user-phone">
                <AppIcon name="phone" :size="12" />
                {{ formatPhone(user.phone_number) }}
              </span>
            </div>
          </div>

          <div class="user-access">
            <div class="access-pill" :class="user.role">
              <AppIcon :name="getRoleIcon(user.role)" :size="12" />
              <span>{{ user.role.toUpperCase() }}</span>
            </div>
            <span class="entity-name">
              {{ user.role === 'admin' ? 'System Global' : (user.companies?.name || 'ePanen') }}
            </span>
          </div>

          <div class="user-status">
            <span class="status-badge" :class="{ 'active': user.is_active }">
              {{ user.is_active ? 'TERVERIFIKASI' : 'TERKUNCI' }}
            </span>
          </div>

          <div class="user-actions">
            <button class="action-circle-btn" @click="openEditModal(user)" title="Edit Profil">
              <AppIcon name="edit-3" :size="16" />
            </button>
            <button class="action-circle-btn" @click="toggleUserStatus(user)" 
                    :class="{ 'warning': user.is_active }"
                    :title="user.is_active ? 'Kunci Akses' : 'Buka Akses'">
              <AppIcon :name="user.is_active ? 'shield-off' : 'lock'" :size="16" />
            </button>
            <button class="action-circle-btn danger" @click="confirmDeleteUser(user)" title="Hapus Permanen">
              <AppIcon name="trash-2" :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals (Add/Edit) -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card-premium glass-premium-dark animate-pop">
        <div class="modal-header-premium">
          <div class="header-icon-box">
            <AppIcon name="user-plus" :size="24" />
          </div>
          <div class="header-text">
            <h3>{{ editingUser ? 'Modifikasi Akses' : 'Registrasi Personil' }}</h3>
            <p>{{ editingUser ? 'Perbarui data dan role pengguna' : 'Tambahkan anggota baru ke dalam sistem' }}</p>
          </div>
          <button class="modal-close-btn" @click="closeModal">✕</button>
        </div>

        <form @submit.prevent="saveUser" class="modal-form-content">
          <div class="form-grid">
            <div class="input-field full-width">
              <label>Nama Lengkap</label>
              <div class="field-container">
                <AppIcon name="user" :size="18" />
                <input type="text" v-model="formData.full_name" placeholder="Nama lengkap personil..." required />
              </div>
            </div>

            <div class="input-field full-width">
              <label>Nomor WhatsApp</label>
              <div class="field-container">
                <AppIcon name="phone" :size="18" />
                <input type="tel" v-model="formData.phone_number" placeholder="628xxxxxxxxxx" required />
              </div>
            </div>

            <div class="input-field">
              <label>Role Akses</label>
              <div class="premium-select-wrapper" v-click-outside="() => isRoleDropdownOpen = false">
                <div 
                  class="premium-select-trigger" 
                  :class="{ open: isRoleDropdownOpen }"
                  @click="isRoleDropdownOpen = !isRoleDropdownOpen"
                >
                  <span>{{ formData.role ? capitalize(formData.role) : 'Pilih Role...' }}</span>
                  <AppIcon 
                    name="chevron-down" 
                    :size="16" 
                    class="select-arrow" 
                    :class="{ rotated: isRoleDropdownOpen }" 
                  />
                </div>
                
                <transition name="dropdown-slide">
                  <div class="premium-options-menu glass-panel" v-if="isRoleDropdownOpen">
                    <div 
                      class="premium-option" 
                      v-for="role in ['admin', 'owner', 'ceo', 'farmer', 'cashier']" 
                      :key="role"
                      :class="{ selected: formData.role === role }"
                      @click="selectRole(role)"
                    >
                      <span>{{ capitalize(role) }}</span>
                      <AppIcon v-if="formData.role === role" name="check" :size="14" class="text-emerald" />
                    </div>
                  </div>
                </transition>
              </div>
            </div>

            <div class="input-field">
              <label>Entitas</label>
              <div 
                class="premium-select-wrapper" 
                :class="{ 'disabled': formData.role === 'admin' || formData.role === 'owner' || formData.role === 'cashier' }" 
                v-click-outside="() => isCompanyDropdownOpen = false"
              >
                <div 
                  class="premium-select-trigger" 
                  :class="{ open: isCompanyDropdownOpen, 'disabled': formData.role === 'admin' || formData.role === 'owner' || formData.role === 'cashier' }"
                  @click="(!formData.role || (formData.role !== 'admin' && formData.role !== 'owner' && formData.role !== 'cashier')) && (isCompanyDropdownOpen = !isCompanyDropdownOpen)"
                >
                  <span>{{ getCompanyName(formData.company_id) || 'Pilih Perusahaan...' }}</span>
                  <AppIcon 
                    name="chevron-down" 
                    :size="16" 
                    class="select-arrow" 
                    :class="{ rotated: isCompanyDropdownOpen }" 
                  />
                </div>

                <transition name="dropdown-slide">
                  <div class="premium-options-menu glass-panel" v-if="isCompanyDropdownOpen">
                    <div 
                      class="premium-option" 
                      v-for="co in selectableCompanies" 
                      :key="co.id"
                      :class="{ selected: formData.company_id === co.id }"
                      @click="selectCompany(co)"
                    >
                      <span>{{ co.name }}</span>
                      <AppIcon v-if="formData.company_id === co.id" name="check" :size="14" class="text-emerald" />
                    </div>
                  </div>
                </transition>
              </div>
            </div>

            <div class="input-field full-width">
              <label>Password Login</label>
              <div class="field-container">
                <AppIcon name="key" :size="18" />
                <input type="text" v-model="formData.password" placeholder="epanen2026 (default)" />
              </div>
            </div>
          </div>

          <div v-if="formError" class="modal-error">
            <AppIcon name="alert-circle" :size="16" />
            <span>{{ formError }}</span>
          </div>

          <div class="modal-footer-premium">
            <button type="button" class="btn-cancel" @click="closeModal">BATALKAN</button>
            <button type="submit" class="btn-confirm" :disabled="saving">
              <span v-if="saving" class="spin-loader"></span>
              <span v-else>{{ editingUser ? 'PERBARUI DATA' : 'KONFIRMASI REGISTRASI' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-card-premium glass-premium-dark animate-shake" style="max-width: 400px;">
        <div class="delete-warning-header">
          <div class="warning-icon-box">
            <AppIcon name="alert-triangle" :size="32" />
          </div>
          <h3>Konfirmasi Hapus</h3>
          <p>Tindakan ini permanen. Ketik nama pengguna <strong>{{ userToDelete?.full_name }}</strong> untuk konfirmasi.</p>
        </div>
        
        <div class="p-lg">
          <input type="text" v-model="deleteConfirmationText" class="delete-confirm-input" :placeholder="userToDelete?.full_name" />
          <div class="flex gap-md mt-lg">
            <button class="btn-cancel flex-1" @click="closeDeleteModal">BATAL</button>
            <button class="btn-confirm danger flex-1" 
                    :disabled="deleteConfirmationText !== userToDelete?.full_name || deleting"
                    @click="executeDeleteUser">
              HAPUS PERMANEN
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
import { sanitizeInput, validatePhoneNumber } from '@/utils/security'

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
const searchQuery = ref('')
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
  let list = users.value
  if (filterRole.value) list = list.filter(u => u.role === filterRole.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(u => u.full_name?.toLowerCase().includes(q))
  }
  return list
})

const selectableCompanies = computed(() => {
  // Hide 'Owner' from manual selection to prevent admin confusion
  return companies.value.filter(c => c.name !== 'Owner' && c.code !== 'OWNER')
})

const usersByRole = computed(() => {
  const counts = { admin: 0, owner: 0, ceo: 0, farmer: 0, cashier: 0 }
  users.value.forEach(u => {
    if (counts[u.role] !== undefined) counts[u.role]++
  })
  return counts
})

function getRoleIcon(role) {
  const icons = {
    admin: 'shield-check',
    owner: 'crown',
    ceo: 'user-check',
    farmer: 'sprout',
    cashier: 'receipt'
  }
  return icons[role] || 'user'
}

function formatPhone(phone) {
  if (!phone) return '-'
  const str = String(phone)
  if (str.length > 10) {
    return `+${str.slice(0, 2)} ${str.slice(2, 5)}-${str.slice(5, 9)}-${str.slice(9)}`
  }
  return str
}

// Custom Dropdown Logic
const isRoleDropdownOpen = ref(false)
const isCompanyDropdownOpen = ref(false)

const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}

function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function getCompanyName(id) {
  const co = companies.value.find(c => c.id === id)
  return co ? co.name : ''
}

function selectRole(role) {
  formData.value.role = role
  
  if (role === 'admin' || role === 'cashier') {
    formData.value.company_id = ''
  } else if (role === 'owner') {
    // Auto-select 'Owner' company if exists
    const ownerComp = companies.value.find(c => c.name === 'Owner' || c.code === 'OWNER')
    if (ownerComp) {
      formData.value.company_id = ownerComp.id
    }
  }
  
  isRoleDropdownOpen.value = false
}

function selectCompany(co) {
  formData.value.company_id = co.id
  
  // If user selects 'Owner' company, force role to owner
  if (co.name === 'Owner' || co.code === 'OWNER') {
    formData.value.role = 'owner'
  }
  
  isCompanyDropdownOpen.value = false
}

function openAddModal() {
  editingUser.value = null
  formData.value = {
    full_name: '',
    phone_number: '',
    role: '',
    company_id: '',
    password: 'epanen2026',
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
    password: '', // Clear password on edit for security
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
  if (formData.value.role === 'admin' || formData.value.role === 'cashier') {
    formData.value.company_id = ''
  }
}

async function saveUser() {
  saving.value = true
  formError.value = ''
  try {
    // Sanitize inputs
    const cleanName = sanitizeInput(formData.value.full_name)
    if (!cleanName || cleanName.length < 2) {
      formError.value = 'Nama harus minimal 2 karakter.'
      return
    }

    let phone = String(formData.value.phone_number).replace(/\D/g, '')
    if (phone.startsWith('0')) phone = '62' + phone.slice(1)
    if (phone.length > 0 && !phone.startsWith('62')) phone = '62' + phone

    if (!validatePhoneNumber(phone)) {
      formError.value = 'Format nomor telepon tidak valid.'
      return
    }

    if (!formData.value.role) {
      formError.value = 'Role harus dipilih.'
      return
    }

    const userData = {
      full_name: cleanName,
      phone_number: phone ? parseInt(phone) : null,
      role: formData.value.role,
      company_id: formData.value.company_id || null,
      is_active: formData.value.is_active
    }

    // Only include password if it was entered
    if (formData.value.password) {
      userData.password = formData.value.password
    } else if (!editingUser.value) {
      // For new users, default to epanen2026 if empty
      userData.password = 'epanen2026'
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
      .select(`id, full_name, role, phone_number, company_id, is_active, created_at, companies (id, name, code)`)
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
  padding: 24px 32px 48px; /* Reduced top padding from 48px to 24px */
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  margin-bottom: 64px; /* Increased from 40px */
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.premium-badge {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.1);
  padding: 4px 10px;
  border-radius: 6px;
  letter-spacing: 0.1em;
  margin-bottom: 12px;
}

.page-title {
  font-size: 2.25rem;
  font-weight: 900;
  color: var(--text-main);
  letter-spacing: -0.04em;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 1.05rem;
  color: var(--text-muted);
  max-width: 600px;
  margin: 0;
}

.btn-primary-glow {
  background: linear-gradient(135deg, var(--color-primary), #059669);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.4);
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.btn-primary-glow:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 15px 30px -5px rgba(16, 185, 129, 0.5);
}

/* Stats Hub */
.stats-hub {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 24px;
  margin-bottom: 64px; /* Increased spacing to next section */
}

.stat-glass-card {
  position: relative;
  background: rgba(var(--bg-card-rgb), 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  overflow: hidden;
  transition: all 0.3s;
}

.stat-glass-card:hover {
  transform: translateY(-5px);
  background: rgba(var(--bg-card-rgb), 0.7);
}

.stat-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff; /* Ensure icon is white */
  z-index: 2;
  position: relative;
}

.stat-icon-wrapper.emerald { 
  background: linear-gradient(135deg, #10b981, #059669); 
  box-shadow: 0 8px 16px -4px rgba(16, 185, 129, 0.5); 
}
.stat-icon-wrapper.red { 
  background: linear-gradient(135deg, #ef4444, #b91c1c); 
  box-shadow: 0 8px 16px -4px rgba(239, 68, 68, 0.5); 
}
.stat-icon-wrapper.purple { 
  background: linear-gradient(135deg, #8b5cf6, #6d28d9); 
  box-shadow: 0 8px 16px -4px rgba(139, 92, 246, 0.5); 
}
.stat-icon-wrapper.amber { 
  background: linear-gradient(135deg, #f59e0b, #d97706); 
  box-shadow: 0 8px 16px -4px rgba(245, 158, 11, 0.5); 
}
.stat-icon-wrapper.pink { 
  background: linear-gradient(135deg, #ec4899, #be185d); 
  box-shadow: 0 8px 16px -4px rgba(236, 72, 153, 0.5); 
}

.stat-info { z-index: 2; }
.stat-label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; display: block; }
.stat-value { font-size: 1.75rem; font-weight: 900; color: var(--text-main); line-height: 1; }

.stat-bg-glow {
  position: absolute;
  top: -20%;
  right: -10%;
  width: 120px;
  height: 120px;
  filter: blur(40px);
  opacity: 0.1;
  z-index: 1;
}
.stat-bg-glow.emerald { background: #10b981; }
.stat-bg-glow.red { background: #ef4444; }
.stat-bg-glow.purple { background: #8b5cf6; }
.stat-bg-glow.amber { background: #f59e0b; }
.stat-bg-glow.pink { background: #ec4899; }

/* Directory Container */
.directory-container {
  background: rgba(var(--bg-card-rgb), 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 32px;
  overflow: hidden;
  box-shadow: 0 20px 40px -20px rgba(0, 0, 0, 0.3);
}

.directory-header {
  padding: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.header-left { display: flex; align-items: center; gap: 16px; }
.header-icon { color: var(--color-primary); }
.directory-title { font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin: 0; }

.filter-group { display: flex; gap: 16px; }

.search-box {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 16px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 240px;
  transition: all 0.2s;
}

.search-box:focus-within {
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.1);
}

.search-input {
  background: none;
  border: none;
  padding: 12px 0;
  color: var(--text-main);
  outline: none;
  width: 100%;
}

.select-pill {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 16px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.select-pill select {
  background: none;
  border: none;
  color: var(--text-main);
  padding: 12px 0;
  font-weight: 600;
  outline: none;
  cursor: pointer;
}

/* User Grid/Rows */
.user-grid {
  padding: 16px 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-row-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 16px 24px;
  border-radius: 20px;
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr;
  align-items: center;
  transition: all 0.2s;
}

.user-row-card:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateX(8px);
  border-color: rgba(var(--color-primary-rgb), 0.3);
}

.user-identity { display: flex; align-items: center; gap: 20px; }

.user-avatar-premium {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: white;
  position: relative;
  font-size: 1.1rem;
}

.user-avatar-premium.admin { background: linear-gradient(135deg, #ef4444, #991b1b); }
.user-avatar-premium.owner { background: linear-gradient(135deg, #8b5cf6, #4c1d95); }
.user-avatar-premium.ceo { background: linear-gradient(135deg, #f59e0b, #92400e); }
.user-avatar-premium.farmer { background: linear-gradient(135deg, #10b981, #065f46); }
.user-avatar-premium.cashier { background: linear-gradient(135deg, #ec4899, #be185d); }

.status-indicator-ring {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 14px;
  height: 14px;
  background: #64748b;
  border: 3px solid #1e293b;
  border-radius: 50%;
}
.status-indicator-ring.active { background: #10b981; box-shadow: 0 0 8px #10b981; }

.user-info-text { display: flex; flex-direction: column; gap: 2px; }
.user-name { font-size: 1rem; font-weight: 700; color: var(--text-main); }
.user-phone { font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; font-weight: 500; }

.user-access { display: flex; flex-direction: column; gap: 4px; }

.access-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 800;
  width: fit-content;
  border: 1px solid transparent;
}

/* Light Mode (Default) - High Contrast */
.access-pill.admin { background: rgba(239, 68, 68, 0.08); color: #dc2626; border-color: rgba(239, 68, 68, 0.15); }
.access-pill.owner { background: rgba(139, 92, 246, 0.08); color: #7c3aed; border-color: rgba(139, 92, 246, 0.15); }
.access-pill.ceo { background: rgba(245, 158, 11, 0.08); color: #d97706; border-color: rgba(245, 158, 11, 0.15); }
.access-pill.farmer { background: rgba(16, 185, 129, 0.08); color: #059669; border-color: rgba(16, 185, 129, 0.15); }
.access-pill.cashier { background: rgba(236, 72, 153, 0.08); color: #db2777; border-color: rgba(236, 72, 153, 0.15); }

/* Dark Mode Overrides - Neon Aesthetic */
.dark-mode .access-pill.admin { color: #fca5a5; background: rgba(239, 68, 68, 0.15); }
.dark-mode .access-pill.owner { color: #c4b5fd; background: rgba(139, 92, 246, 0.15); }
.dark-mode .access-pill.ceo { color: #fcd34d; background: rgba(245, 158, 11, 0.15); }
.dark-mode .access-pill.farmer { color: #a7f3d0; background: rgba(16, 185, 129, 0.15); }
.dark-mode .access-pill.cashier { color: #f9a8d4; background: rgba(236, 72, 153, 0.15); }

.entity-name { font-size: 0.85rem; color: var(--text-dim); font-weight: 600; }

.status-badge {
  font-size: 0.65rem;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.05em;
  padding: 4px 8px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 6px;
}
.status-badge.active { color: #34d399; background: rgba(52, 211, 153, 0.05); border-color: rgba(52, 211, 153, 0.2); }

.user-actions { display: flex; justify-content: flex-end; gap: 10px; }

.action-circle-btn {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.action-circle-btn:hover { background: rgba(255,255,255,0.1); color: var(--color-primary); transform: scale(1.1); }
.action-circle-btn.warning:hover { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
.action-circle-btn.danger:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 24px;
}

.modal-card-premium {
  max-width: 540px;
  width: 100%;
  border-radius: 32px;
  border: 1px solid rgba(255,254,255,0.15);
  /* overflow: hidden; Removed to allow dropdowns to overflow */
  background: rgba(15, 23, 42, 0.95); /* Adjusted opacity for no-blur behind */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  max-height: 90vh; /* Limit height */
}

.modal-header-premium {
  padding: 32px;
  display: flex;
  align-items: center;
  gap: 20px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  position: relative;
  border-radius: 32px 32px 0 0; /* Re-add radius since overflow hidden is gone */
}

.header-icon-box {
  width: 56px;
  height: 56px;
  background: var(--color-primary);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 20px -5px rgba(16, 185, 129, 0.5);
}

.header-text h3 { font-size: 1.5rem; font-weight: 800; color: #fff; margin: 0; }
.header-text p { font-size: 0.9rem; color: #94a3b8; margin: 4px 0 0 0; }

.modal-close-btn {
  position: absolute;
  top: 32px;
  right: 32px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1.2rem;
}

.modal-form-content { padding: 32px; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.full-width { grid-column: span 2; }

.input-field label {
  display: block;
  font-size: 0.75rem;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.field-container, .select-container {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 16px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
}

.field-container:focus-within, .select-container:focus-within {
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.08);
}

.field-container input, .select-container select {
  background: none;
  border: none;
  padding: 14px 0;
  color: white;
  outline: none;
  width: 100%;
  font-weight: 600;
}

.select-container { position: relative; padding-right: 40px; }
.select-arrow { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); pointer-events: none; opacity: 0.5; }

.disabled { opacity: 0.5; cursor: not-allowed; }

.modal-error {
  margin-top: 20px;
  background: rgba(239, 68, 68, 0.1);
  padding: 12px 16px;
  border-radius: 12px;
  color: #fca5a5;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  font-weight: 600;
}

.modal-footer-premium {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding-bottom: 32px; /* Pad bottom since it's the end */
  border-radius: 0 0 32px 32px;
}

.btn-cancel {
  background: none;
  border: none;
  color: #94a3b8;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 14px 24px;
  cursor: pointer;
  transition: color 0.2s;
}

.btn-confirm {
  background: linear-gradient(135deg, var(--color-primary), #059669);
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-confirm:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3); }
.btn-confirm.danger { background: #ef4444; }

/* Animation Hooks */
.animate-pop { animation: modalPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes modalPop { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.animate-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

.animate-slide-right { animation: slideRightFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
@keyframes slideRightFade { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }

/* Delete Specific */
.delete-warning-header { text-align: center; padding: 40px 32px 0; }
.warning-icon-box { width: 80px; height: 80px; background: rgba(239, 68, 68, 0.1); border-radius: 24px; display: flex; align-items: center; justify-content: center; color: #ef4444; margin: 0 auto 24px; }
.delete-confirm-input { width: 100%; background: rgba(0,0,0,0.2); border: 2px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 14px; color: white; text-align: center; font-weight: 800; }
.delete-confirm-input:focus { border-color: #ef4444; outline: none; }

.loading-state { padding: 64px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 20px; }
.premium-loader { width: 40px; height: 40px; border: 3px solid rgba(16, 185, 129, 0.1); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1024px) {
  .stats-hub { grid-template-columns: 1fr 1fr; }
  .user-row-card { grid-template-columns: 1.5fr 1fr 1fr; }
}

@media (max-width: 768px) {
  .stats-hub {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .stat-glass-card {
    padding: 14px !important;
  }

  .stat-icon-wrapper { width: 36px !important; height: 36px !important; }
  .stat-value { font-size: 1.1rem !important; }

  .user-row-card {
    grid-template-columns: 1fr !important;
    gap: 12px;
    padding: 16px !important;
  }

  .user-access { display: flex !important; }
  .user-status { display: flex !important; }

  .user-actions {
    display: flex !important;
    width: 100%;
    gap: 8px;
    border-top: 1px solid rgba(255,255,255,0.05);
    padding-top: 12px;
    margin-top: 4px;
  }

  .action-circle-btn {
    flex: 1 !important;
    width: auto !important;
    height: 40px !important;
    border-radius: 10px !important;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 16px !important;
  }

  .btn-primary-glow {
    width: 100%;
    justify-content: center;
  }

  .search-box { width: 100%; }
  .filter-group {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }

  .directory-header {
    flex-direction: column !important;
    gap: 12px !important;
  }

  .modal-overlay .modal-card-premium,
  .modal-overlay .modal-panel {
    width: 100% !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    border-radius: 0 !important;
    margin: 0 !important;
  }

  .page-header { padding: 0 !important; }
  .page-title { font-size: 1.4rem !important; }
  .page-subtitle { font-size: 0.8rem !important; }
}

/* Dropdown Option Styling Fix */
.premium-select-wrapper {
  position: relative;
  width: 100%;
  z-index: 50;
}

.premium-select-trigger {
    background: rgba(255, 255, 255, 0.05); /* Match field-container bg */
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 14px 16px; /* Match input padding */
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    color: white;
    font-weight: 600;
    font-size: 1rem; /* Match input font size, assuming it inherits or is close */
}

.premium-select-trigger:hover {
    background: rgba(255, 255, 255, 0.08); /* Match hover state */
    border-color: rgba(255, 255, 255, 0.2);
}

.premium-select-trigger.open {
    border-color: var(--color-primary);
    background: rgba(255, 255, 255, 0.08);
}

.select-arrow {
    color: #94a3b8; /* text-muted */
    transition: transform 0.3s ease;
}

.select-arrow.rotated {
    transform: rotate(180deg);
    color: var(--color-primary);
}

.premium-options-menu {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    width: 100%;
    background: #0f172a; /* Match modal base or dark variant */
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 6px;
    box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);
    overflow-y: auto; /* Enable vertical scroll */
    max-height: 240px; /* Limit height to show ~5 items */
    z-index: 100;
    overscroll-behavior: contain; /* Prevent parent scroll */
    scrollbar-width: none; /* Hide scrollbar Firefox */
}

/* Hide scrollbar Webkit */
.premium-options-menu::-webkit-scrollbar {
    display: none;
}

.premium-option {
    padding: 12px 16px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #94a3b8;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s ease;
}

.premium-option:hover {
    background: rgba(16, 185, 129, 0.08);
    color: white;
}

.premium-option.selected {
    background: rgba(16, 185, 129, 0.15);
    color: var(--color-primary);
    font-weight: 700;
}

.text-emerald { color: #10b981; }

.disabled-opacity { opacity: 0.5; pointer-events: none; }

/* Transitions */
.dropdown-slide-enter-active,
.dropdown-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-slide-enter-from,
.dropdown-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}
</style>
