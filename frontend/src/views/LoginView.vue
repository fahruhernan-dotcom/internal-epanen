<template>
  <div class="login-page">
    <!-- Aurora Mesh Background (Shared with MainLayout) -->
    <div class="aurora-container">
      <div class="aurora-blob blob-1"></div>
      <div class="aurora-blob blob-2"></div>
      <div class="aurora-blob blob-3"></div>
      <div class="noise-overlay"></div>
    </div>

    <!-- Login Container -->
    <div class="login-container">
      <div class="login-card glass-premium animate-up">
        
        <!-- Header -->
        <div class="card-header">
          <div class="logo-wrapper">
            <div class="logo-icon-box">
              <AppIcon name="leaf" :size="28" class="logo-icon" />
            </div>
            <div class="logo-glow"></div>
          </div>
          <h1 class="brand-title">Official <span class="text-emerald">ePanen</span></h1>
          <p class="brand-subtitle">Sistem Manajemen Ekosistem Digital</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="login-form">
          
          <div class="form-group">
            <label class="form-label">Nomor Telepon</label>
            <div class="input-group" :class="{ 'focused': focusedField === 'phone' }">
              <span class="input-icon-box">
                <AppIcon name="phone" :size="18" />
              </span>
              <input 
                type="tel" 
                v-model="phone" 
                class="form-input" 
                placeholder="Contoh: 08123456789"
                required
                @focus="focusedField = 'phone'"
                @blur="focusedField = null"
              />
            </div>
          </div>

          <div class="form-group">
            <div class="flex justify-between items-center mb-2">
              <label class="form-label mb-0">Kata Sandi</label>
              <a href="#" class="forgot-link">Lupa kata sandi?</a>
            </div>
            <div class="input-group" :class="{ 'focused': focusedField === 'password' }">
              <span class="input-icon-box">
                <AppIcon name="lock" :size="18" />
              </span>
              <input 
                :type="showPassword ? 'text' : 'password'" 
                v-model="password" 
                class="form-input" 
                placeholder="Masukkan kata sandi Anda"
                required
                @focus="focusedField = 'password'"
                @blur="focusedField = null"
              />
              <button 
                type="button" 
                class="password-toggle"
                @click="showPassword = !showPassword"
                tabindex="-1"
              >
                <AppIcon :name="showPassword ? 'eye-off' : 'eye'" :size="18" />
              </button>
            </div>
          </div>

          <!-- Error Alert -->
          <div v-if="authStore.error" class="error-alert animate-shake">
            <AppIcon name="alert-triangle" :size="16" />
            <span>{{ authStore.error }}</span>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            class="btn-primary-gradient"
            :disabled="authStore.loading"
          >
            <span v-if="authStore.loading" class="spinner"></span>
            <span v-else>Masuk ke Dashboard</span>
            <div class="shimmer"></div>
          </button>

        </form>

        <!-- Footer -->
        <div class="card-footer">
          <p class="copyright">
            &copy; 2026 SmartFarm Ecosystem. <br>
            <span class="opacity-60">Secured by ePanen Protocol</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppIcon from '@/components/AppIcon.vue'

const router = useRouter()
const authStore = useAuthStore()

const phone = ref('')
const password = ref('')
const showPassword = ref(false)
const focusedField = ref(null)

async function handleLogin() {
  const success = await authStore.login(phone.value, password.value)
  if (success) {
    router.push('/')
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background-color: var(--bg-main); /* Fallback */
}

/* Background Aurora Reuse */
.aurora-container {
  position: fixed; /* Changed from absolute to fixed */
  inset: 0;
  z-index: 0;
  background: var(--bg-mesh); /* Consistent with dashboard */
  height: 100vh; /* Ensure full viewport height */
  width: 100vw;
  overflow: hidden; /* Clip blobs */
}

.aurora-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  animation: float 20s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
}

.blob-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: rgba(16, 185, 129, 0.25); animation-delay: 0s; }
.blob-2 { bottom: -10%; right: -10%; width: 60vw; height: 60vw; background: rgba(59, 130, 246, 0.2); animation-delay: -5s; }
.blob-3 { top: 40%; left: 40%; width: 40vw; height: 40vw; background: rgba(139, 92, 246, 0.15); animation-delay: -8s; }

.noise-overlay {
  position: absolute;
  inset: 0;
  background-image: var(--noise-texture);
  opacity: 0.03;
  pointer-events: none;
}

@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(30px, 30px) scale(1.05); }
}

.login-container {
  z-index: 10;
  padding: 24px;
  width: 100%;
  max-width: 480px;
}

.login-card {
  background: rgba(var(--bg-card-rgb), 0.65);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 32px;
  padding: 48px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.dark-mode .login-card {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(255, 255, 255, 0.05);
}

/* Header */
.card-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon-box {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-primary), #059669);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 2;
  box-shadow: 
    0 10px 25px -5px rgba(16, 185, 129, 0.4),
    inset 0 1px 1px rgba(255, 255, 255, 0.3),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.logo-icon-box::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent 60%);
  pointer-events: none;
}

.logo-glow {
  position: absolute;
  inset: -15px;
  background: var(--color-primary);
  filter: blur(35px);
  opacity: 0.25;
  z-index: 1;
  animation: pulse-glow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.brand-title {
  font-size: 2.25rem;
  font-weight: 900;
  color: var(--text-main);
  margin-bottom: 4px;
  letter-spacing: -0.05em;
  background: linear-gradient(135deg, var(--text-main), #10b981);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-subtitle {
  font-size: 0.95rem;
  color: var(--text-dim);
  font-weight: 500;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 8px;
}

.forgot-link {
  font-size: 0.8rem;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.forgot-link:hover {
  text-decoration: underline;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(var(--bg-main-rgb), 0.5); /* Semi-transparent input bg */
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 4px;
}

.input-group:hover {
  background: rgba(var(--bg-main-rgb), 0.8);
  border-color: rgba(var(--text-main-rgb), 0.1);
}

.input-group.focused {
  background: var(--bg-main);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
  transform: translateY(-1px);
}

.input-icon-box {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
  transition: color 0.2s;
}

.focused .input-icon-box {
  color: var(--color-primary);
}

.form-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 0;
  font-size: 1rem;
  color: var(--text-main);
  font-weight: 500;
  outline: none;
  width: 100%; /* Fix width */
}

/* Password Toggle */
.password-toggle {
  background: none;
  border: none;
  padding: 0 16px;
  color: var(--text-dim);
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.password-toggle:hover {
  color: var(--text-main);
}

/* Button */
.btn-primary-gradient {
  position: relative;
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, var(--color-primary), #059669);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.3);
}

.btn-primary-gradient:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px -5px rgba(16, 185, 129, 0.4);
}

.btn-primary-gradient:active:not(:disabled) {
  transform: translateY(1px);
}

.btn-primary-gradient:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

/* Shimmer Animation */
.shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: 0.5s;
}

.btn-primary-gradient:hover .shimmer {
  left: 100%;
  transition: 0.7s ease-in-out;
}

/* Spinner */
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Alert */
.error-alert {
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  color: #ef4444;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
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

/* Footer & Legal */
.card-footer {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid rgba(0,0,0,0.05);
}

.dark-mode .card-footer {
  border-color: rgba(255,255,255,0.05);
}

.copyright {
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.6;
}

/* Entrance Animation */
.animate-up {
  opacity: 0;
  transform: translateY(30px);
  animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUpFade {
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.1); }
}

/* Mobile */
@media (max-width: 640px) {
  .login-card {
    padding: 32px 24px;
    border-radius: 24px;
  }
  .brand-title {
    font-size: 1.75rem;
  }
}
</style>
