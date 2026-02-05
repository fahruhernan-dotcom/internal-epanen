<template>
  <div class="profile-page animate-fade-in">
    <header class="dashboard-header mb-lg">
      <span class="section-label">User Settings</span>
      <h2 class="gradient-text">Akun & Keamanan</h2>
      <p class="text-muted">Kelola informasi profil dan keamanan akun SmartFarm Anda.</p>
    </header>

    <div class="profile-grid">
      <!-- User Info Card -->
      <div class="card glass-premium profile-card">
        <div class="card-header border-none">
          <h3>Informasi Profil</h3>
        </div>
        <div class="card-body">
          <div class="user-avatar-large">
            {{ authStore.userName.charAt(0) }}
          </div>
          <div class="user-info-list">
            <div class="info-item">
              <label>Nama Lengkap</label>
              <span>{{ authStore.userName }}</span>
            </div>
            <div class="info-item">
              <label>Nomor Telepon</label>
              <span>+{{ authStore.user?.phone_number }}</span>
            </div>
            <div class="info-item">
              <label>Peranan (Role)</label>
              <span class="badge badge-primary">{{ authStore.user?.role?.toUpperCase() }}</span>
            </div>
            <div class="info-item" v-if="authStore.user?.companies">
              <label>Perusahaan</label>
              <span>{{ authStore.user.companies.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Change Password Card -->
      <div class="card glass-premium password-card">
        <div class="card-header border-none">
          <h3>Ganti Password</h3>
        </div>
        <div class="card-body">
          <form @submit.prevent="handleUpdatePassword" class="form-container">
            <div class="form-group">
              <label class="form-label">Password Saat Ini</label>
              <input 
                type="password" 
                v-model="passwordForm.current" 
                class="form-input" 
                placeholder="••••••••"
                required
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">Password Baru</label>
              <input 
                type="password" 
                v-model="passwordForm.new" 
                class="form-input" 
                placeholder="Minimal 6 karakter"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Konfirmasi Password Baru</label>
              <input 
                type="password" 
                v-model="passwordForm.confirm" 
                class="form-input" 
                placeholder="Ulangi password baru"
                required
              />
            </div>

            <div v-if="error" class="error-banner mb-md">
              {{ error }}
            </div>
            
            <div v-if="success" class="success-banner mb-md">
              {{ success }}
            </div>

            <button 
              type="submit" 
              class="btn btn-primary w-full" 
              :disabled="loading"
            >
              <span v-if="loading" class="spinner"></span>
              <span v-else>💾 Simpan Password Baru</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/services/supabase'

const authStore = useAuthStore()
const loading = ref(false)
const error = ref(null)
const success = ref(null)

const passwordForm = reactive({
  current: '',
  new: '',
  confirm: ''
})

async function handleUpdatePassword() {
  error.value = null
  success.value = null
  
  if (passwordForm.new !== passwordForm.confirm) {
    error.value = 'Konfirmasi password tidak cocok.'
    return
  }
  
  if (passwordForm.new.length < 4) {
    error.value = 'Password baru terlalu pendek.'
    return
  }

  loading.value = true
  try {
    // 1. Verify current password
    // For this implementation, we check against the stored user data or a hardcoded default
    // In a real app, we'd verify with the DB
    const storedUser = JSON.parse(localStorage.getItem('smartfarm_user'))
    const currentPassword = storedUser.password || 'smartfarm2026'

    if (passwordForm.current !== currentPassword) {
      throw new Error('Password saat ini salah.')
    }

    // 2. Update in Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: passwordForm.new })
      .eq('id', authStore.user.id)

    if (updateError) throw updateError

    // 3. Update local storage user object
    storedUser.password = passwordForm.new
    localStorage.setItem('smartfarm_user', JSON.stringify(storedUser))
    
    // Update authStore state if needed (user object might need refresh)
    authStore.user.password = passwordForm.new

    success.value = 'Password berhasil diperbarui!'
    passwordForm.current = ''
    passwordForm.new = ''
    passwordForm.confirm = ''
    
  } catch (err) {
    console.error('Password Update Error:', err)
    error.value = err.message || 'Gagal memperbarui password.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: var(--space-xl);
}

.user-avatar-large {
  width: 80px;
  height: 80px;
  background: var(--primary-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  margin: 0 auto var(--space-lg);
  box-shadow: 0 10px 20px rgba(34, 197, 94, 0.3);
}

.user-info-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item label {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-bottom: 2px;
}

.info-item span {
  font-weight: 500;
  color: var(--text-primary);
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.success-banner {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  border-left: 4px solid #22c55e;
}

.error-banner {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  border-left: 4px solid #ef4444;
}

@media (max-width: 992px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
