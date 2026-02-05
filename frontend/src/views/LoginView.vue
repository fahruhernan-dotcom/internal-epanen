<template>
  <div class="login-container">
    <div class="login-background">
      <div class="leaf leaf-1"></div>
      <div class="leaf leaf-2"></div>
      <div class="leaf leaf-3"></div>
    </div>
    
    <div class="login-card card-glass animate-slide-up">
      <div class="login-header">
        <div class="logo">
          <span class="logo-icon">🌿</span>
          <h1>SmartFarm</h1>
        </div>
        <p class="login-subtitle">Internal Dashboard System</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">Nomor Telepon</label>
          <div class="input-wrapper">
            <span class="input-icon">📱</span>
            <input 
              type="tel" 
              v-model="phone" 
              class="form-input" 
              placeholder="08xxxxxxxxxx"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="password" 
              class="form-input" 
              placeholder="Masukkan password"
              required
            />
            <button 
              type="button" 
              class="password-toggle"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
        </div>

        <div v-if="authStore.error" class="error-message">
          ⚠️ {{ authStore.error }}
        </div>

        <button 
          type="submit" 
          class="btn btn-primary btn-login"
          :disabled="authStore.loading"
        >
          <span v-if="authStore.loading" class="spinner"></span>
          <span v-else>Masuk Dashboard</span>
        </button>
      </form>

      <div class="login-footer">
        <p>SmartFarm Internal System • 2026</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const phone = ref('')
const password = ref('')
const showPassword = ref(false)

async function handleLogin() {
  const success = await authStore.login(phone.value, password.value)
  if (success) {
    router.push('/')
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  background: linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 50%, var(--accent-700) 100%);
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.leaf {
  position: absolute;
  width: 200px;
  height: 200px;
  background: radial-gradient(ellipse at center, rgba(34, 197, 94, 0.2), transparent);
  border-radius: 50% 0 50% 50%;
  animation: float 8s ease-in-out infinite;
}

.leaf-1 {
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.leaf-2 {
  top: 60%;
  right: 10%;
  animation-delay: -2s;
  transform: scale(0.7);
}

.leaf-3 {
  bottom: 10%;
  left: 30%;
  animation-delay: -4s;
  transform: scale(0.5);
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: var(--space-2xl);
  background: rgba(255, 255, 255, 0.95);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
}

.dark-mode .login-card {
  background: rgba(26, 35, 50, 0.95);
}

.login-header {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.logo-icon {
  font-size: 2.5rem;
}

.logo h1 {
  font-size: 1.75rem;
  background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: var(--space-md);
  font-size: 1rem;
}

.input-wrapper .form-input {
  padding-left: 2.75rem;
  padding-right: 2.75rem;
}

.password-toggle {
  position: absolute;
  right: var(--space-md);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0.7;
  transition: opacity var(--transition-fast);
}

.password-toggle:hover {
  opacity: 1;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--error);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  margin-bottom: var(--space-md);
  text-align: center;
}

.btn-login {
  width: 100%;
  padding: var(--space-md);
  font-size: 1rem;
  margin-top: var(--space-sm);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-footer {
  text-align: center;
  margin-top: var(--space-xl);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-color);
}

.login-footer p {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}
</style>
