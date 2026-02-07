<template>
  <div class="farmer-dashboard">
    <!-- Premium App Header -->
    <header class="app-header animate-slide-down">
      <div class="header-content">
        <div class="user-welcome">
          <p class="greeting">Selamat Pagi,</p>
          <h2 class="user-name">{{ authStore.user?.full_name?.split(' ')[0] || 'Petani' }}!</h2>
        </div>
        <div class="company-badge">
          <div class="status-orb pulse"></div>
          <span class="company-name text-truncate">{{ userCompany }}</span>
        </div>
      </div>
    </header>

    <!-- Main Content Area with Tab Transitions -->
    <main class="dashboard-content">
      <router-view v-slot="{ Component }">
        <transition name="slide-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>

      <!-- Fallback if not using router-view for tabs yet, though we are switching to components based on activeTab -->
      <transition name="slide-fade" mode="out-in">
        <KeepAlive :max="5">
          <div :key="activeTab" class="content-container">
            <!-- Tab: Home (Report Form) -->
            <div v-if="activeTab === 'home'">
              <FarmerReportForm />
            </div>

            <!-- Tab: AI Chat -->
            <div v-else-if="activeTab === 'ai'">
              <FarmerChatView :embedded="true" />
            </div>

            <!-- Tab: History -->
            <div v-else-if="activeTab === 'history'">
              <FarmerHistoryList />
            </div>

            <!-- Tab: SOP -->
            <div v-else-if="activeTab === 'sop'">
              <SOPReferenceView :embedded="true" />
            </div>

            <!-- Tab: Profile -->
            <div v-else-if="activeTab === 'profile'">
              <div class="profile-card card shadow-xl animate-slide-up">
                <div class="profile-header">
                  <div class="avatar-gradient">
                    <span class="avatar-text">{{ userInitials }}</span>
                  </div>
                  <div class="profile-info">
                    <h3>{{ authStore.user?.full_name || 'Petani' }}</h3>
                    <p class="text-muted">{{ authStore.user?.role?.toUpperCase() }} • {{ userCompany }}</p>
                  </div>
                </div>
                
                <div class="profile-stats">
                  <div class="stat-box">
                    <span class="stat-count">24</span>
                    <span class="stat-meta">Laporan</span>
                  </div>
                  <div class="stat-box">
                    <span class="stat-count">98%</span>
                    <span class="stat-meta">SOP</span>
                  </div>
                </div>

                <div class="action-list">
                  <button class="action-item">
                    <span class="action-icon">⚙️</span>
                    <span>Pengaturan Akun</span>
                  </button>
                  <button class="action-item text-error" @click="handleLogout">
                    <span class="action-icon">🚪</span>
                    <span>Keluar Aplikasi</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </KeepAlive>
      </transition>
    </main>

    <!-- Floating Glassmorphism Dock -->
    <div class="dock-container">
      <nav class="floating-dock glass-premium animate-slide-up">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="dock-item"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <div class="icon-wrapper">
            <span class="dock-icon">{{ tab.icon }}</span>
          </div>
          <span class="dock-label">{{ tab.label }}</span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import FarmerReportForm from '@/components/FarmerReportForm.vue'
import FarmerHistoryList from '@/components/FarmerHistoryList.vue'
import SOPReferenceView from '@/views/SOPReferenceView.vue'
import FarmerChatView from '@/views/FarmerChatView.vue'

const router = useRouter()
const authStore = useAuthStore()
const activeTab = ref('home')

const tabs = [
  { id: 'home', label: 'Lapor', icon: '📝' },
  { id: 'ai', label: 'AI Chat', icon: '🤖' },
  { id: 'history', label: 'Riwayat', icon: '📋' },
  { id: 'sop', label: 'SOP', icon: '📖' },
  { id: 'profile', label: 'Profil', icon: '👤' }
]

const userInitials = computed(() => {
    const name = authStore.user?.full_name || 'P'
    return name.charAt(0).toUpperCase()
})

const userCompany = computed(() => authStore.user?.companies?.name || 'SmartFarm')

async function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.farmer-dashboard {
  min-height: 100vh;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

/* Premium Header */
.app-header {
  padding: var(--space-xl) var(--space-lg) var(--space-md);
  background: var(--bg-primary);
  z-index: 10;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
}

.greeting {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  margin-bottom: 2px;
}

.user-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.company-badge {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: var(--bg-secondary);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.status-orb {
  width: 8px;
  height: 8px;
  background: var(--primary-500);
  border-radius: 50%;
}

.pulse {
  animation: pulse-ring 1.5s cubic-bezier(0.24, 0, 0.38, 1) infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(0.9); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.5; }
  100% { transform: scale(0.9); opacity: 1; }
}

.company-name {
  font-size: 0.75rem;
  font-weight: 600;
  max-width: 100px;
}

/* Dashboard Content */
.dashboard-content {
  flex: 1;
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--space-md) 100px;
}

/* Floating Dock */
.dock-container {
  position: fixed;
  bottom: var(--space-lg);
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0 var(--space-lg);
  pointer-events: none;
  z-index: 1000;
}

.floating-dock {
  pointer-events: auto;
  display: flex;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 8px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
  gap: 4px;
}

.dark-mode .floating-dock {
  background: rgba(15, 20, 25, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.dock-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 8px 4px;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--text-tertiary);
}

.icon-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 1.5rem;
  transition: all 0.3s;
}

.dock-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.dock-item.active {
  color: var(--primary-600);
}

.dock-item.active .icon-wrapper {
  background: var(--primary-100);
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
}

.dark-mode .dock-item.active .icon-wrapper {
  background: rgba(34, 197, 94, 0.15);
}

/* Profile Redesign */
.profile-card {
  padding: var(--space-xl);
  border-radius: var(--radius-2xl);
  background: var(--bg-secondary);
  margin-top: var(--space-md);
}

.avatar-gradient {
  width: 70px;
  height: 70px;
  border-radius: 24px;
  background: linear-gradient(135deg, var(--primary-400), var(--primary-600));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(34, 197, 94, 0.3);
}

.avatar-text {
  font-size: 2rem;
  font-weight: 800;
  color: white;
}

.profile-info h3 {
  font-size: 1.25rem;
  margin-bottom: 2px;
}

.profile-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin: var(--space-xl) 0;
}

.stat-box {
  background: var(--bg-tertiary);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  text-align: center;
  display: flex;
  flex-direction: column;
}

.stat-count {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--primary-600);
}

.stat-meta {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-weight: 600;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.action-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border: none;
  border-radius: var(--radius-lg);
  width: 100%;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all 0.2s;
  cursor: pointer;
}

.action-item:hover {
  background: var(--border-color);
  transform: translateX(4px);
}

.action-icon {
  font-size: 1.25rem;
}

/* Transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.animate-slide-down {
  animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-slide-up {
  animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 480px) {
  .floating-dock {
    max-width: none;
  }
}
</style>
