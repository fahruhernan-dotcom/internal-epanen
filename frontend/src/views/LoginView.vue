<template>
  <div class="login-page">
    <!-- Apex Elite Background: Mesh Gradient + Noise -->
    <div class="aurora-background">
      <div class="aurora-blob blob-1"></div>
      <div class="aurora-blob blob-2"></div>
      <div class="aurora-blob blob-3"></div>
      <div class="noise-layered"></div>
      <div class="grid-precision"></div>
    </div>

    <!-- Login Card: Elite Fidelity -->
    <div class="login-card premium-card">
      <div class="card-header animate-in stagger-1">
        <div class="logo-stack">
          <div class="logo-icon-wrapper">
            <AppIcon name="leaf" :size="32" color="white" />
          </div>
          <div class="logo-glow"></div>
        </div>
        <h1 class="brand-title">SmartFarm</h1>
        <p class="brand-subtitle">Executive Dashboard Interface</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group animate-in stagger-2">
          <label class="form-label">Phone Access</label>
          <div class="input-wrapper">
            <div class="input-icon">
              <AppIcon name="phone" :size="18" />
            </div>
            <input 
              type="tel" 
              v-model="phone" 
              class="elite-input" 
              placeholder="08xxxxxxxxxx"
              required
            />
          </div>
        </div>

        <div class="form-group animate-in stagger-3">
          <label class="form-label">Security Key</label>
          <div class="input-wrapper">
            <div class="input-icon">
              <AppIcon name="lock" :size="18" />
            </div>
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="password" 
              class="elite-input" 
              placeholder="Enter password"
              required
            />
            <button 
              type="button" 
              class="pass-toggle-btn"
              @click="showPassword = !showPassword"
            >
              <AppIcon :name="showPassword ? 'eye-off' : 'eye'" :size="16" />
            </button>
          </div>
        </div>

        <div v-if="authStore.error" class="error-slate">
          <AppIcon name="alert-circle" :size="16" />
          <span>{{ authStore.error }}</span>
        </div>

        <button 
          type="submit" 
          class="btn-elite animate-in stagger-4"
          :disabled="authStore.loading"
        >
          <div v-if="authStore.loading" class="elite-spinner"></div>
          <span v-else>Access Core Terminal</span>
          <div class="shimmer-effect"></div>
        </button>
      </form>

      <div class="login-footer-legal">
        <p>SECURED BY APEX PROTOCOL • 2026</p>
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

async function handleLogin() {
  const success = await authStore.login(phone.value, password.value)
  if (success) {
    router.push('/')
  }
}
</script>

<style scoped>
/* Page Layout */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--bg-main);
  position: relative;
  overflow: hidden;
}

/* Aurora Mesh Background */
.aurora-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.aurora-blob {
  position: absolute;
  filter: blur(120px);
  opacity: 0.4;
  mix-blend-mode: soft-light;
}

.blob-1 {
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, var(--color-primary-dark) 0%, transparent 70%);
  top: -10%;
  left: -10%;
  animation: aurora-float 20s infinite ease-in-out;
}

.blob-2 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, var(--color-primary) 0%, transparent 70%);
  bottom: -5%;
  right: -5%;
  animation: aurora-float 15s infinite ease-in-out reverse;
}

.blob-3 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, var(--text-dim) 0%, transparent 70%);
  top: 40%;
  left: 30%;
  animation: aurora-float 25s infinite ease-in-out;
}

.noise-layered {
  position: absolute;
  inset: 0;
  background: var(--noise-texture);
  opacity: 0.15;
  mix-blend-mode: overlay;
}

.grid-precision {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(circle at center, black, transparent 80%);
}

@keyframes aurora-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(50px, -50px) scale(1.1); }
  66% { transform: translate(-30px, 40px) scale(0.9); }
}

/* Login Card: Apex Styling */
.login-card {
  width: 100%;
  max-width: 440px;
  padding: 64px 48px;
  z-index: 10;
}

.logo-stack {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
}

.logo-icon-wrapper {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, var(--color-primary), var(--color-primary-dark));
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 12px rgba(255, 255, 255, 0.2);
}

.logo-glow {
  position: absolute;
  inset: -10px;
  background: var(--color-primary);
  filter: blur(20px);
  opacity: 0.4;
  z-index: 1;
}

.brand-title {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--text-main);
  letter-spacing: -0.05em;
  margin-bottom: 4px;
  text-shadow: 0 4px 12px rgba(0,0,0,0.5);
}

.brand-subtitle {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.2em;
}

/* Elite Form Components */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.form-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  display: block;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  color: var(--text-muted);
  pointer-events: none;
  transition: var(--transition-fast);
}

.elite-input {
  width: 100%;
  padding: 18px 18px 18px 52px;
  background: rgba(var(--text-main-rgb), 0.05); /* Adaptive background */
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  font-size: 1rem;
  color: var(--text-main);
  transition: var(--transition-main);
}

.elite-input:focus {
  outline: none;
  background: rgba(var(--text-main-rgb), 0.1);
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.05);
}

.elite-input:focus + .input-icon {
  color: var(--color-primary);
}

.pass-toggle-btn {
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  transition: var(--transition-fast);
}

.pass-toggle-btn:hover {
  color: white;
}

/* Alert Styling */
.error-slate {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  padding: 14px;
  border-radius: 12px;
  font-size: 0.8125rem;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Elite Submit Button */
.btn-elite {
  position: relative;
  width: 100%;
  padding: 18px;
  background: var(--text-main);
  color: var(--bg-main);
  border: none;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  transition: var(--transition-main);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.3);
}

.btn-elite:hover:not(:disabled) {
  background: var(--color-primary);
  color: #ffffff;
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 20px 30px -10px rgba(16, 185, 129, 0.4);
}

.shimmer-effect {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  to { left: 100%; }
}

.elite-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0,0,0,0.1);
  border-top-color: #000000;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Legal Footer */
.login-footer-legal {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  text-align: center;
}

.login-footer-legal p {
  font-size: 0.6875rem;
  font-weight: 800;
  color: var(--text-dim);
  letter-spacing: 0.2em;
}

/* Entrance Animations */
.animate-in {
  opacity: 0;
  transform: translateY(20px);
  animation: apex-slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.stagger-1 { animation-delay: 0.1s; }
.stagger-2 { animation-delay: 0.2s; }
.stagger-3 { animation-delay: 0.3s; }
.stagger-4 { animation-delay: 0.4s; }

@keyframes apex-slide-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
