<template>
  <div class="main-layout">
    <aside class="sidebar" :class="{ 'collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">🌿</span>
          <span v-if="!sidebarCollapsed" class="logo-text">SmartFarm</span>
        </div>
        <button class="sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
          {{ sidebarCollapsed ? '→' : '←' }}
        </button>
      </div>

      <nav class="sidebar-nav">
        <!-- Dashboard for all -->
        <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
          <span class="nav-icon">📊</span>
          <span v-if="!sidebarCollapsed" class="nav-text">Dashboard</span>
        </router-link>
        
        <!-- Reports View for Owner/Admin and CEO (Farmers only submit) -->
        <router-link 
          v-if="['owner', 'admin', 'ceo'].includes(authStore.user?.role)"
          to="/reports" 
          class="nav-item" 
          :class="{ active: $route.path === '/reports' }"
        >
          <span class="nav-icon">📋</span>
          <span v-if="!sidebarCollapsed" class="nav-text">Monitoring Harian</span>
        </router-link>

        <router-link 
          v-if="['owner', 'admin', 'ceo'].includes(authStore.user?.role)"
          to="/financial-reports" 
          class="nav-item" 
          :class="{ active: $route.path === '/financial-reports' }"
        >
          <span class="nav-icon">💰</span>
          <span v-if="!sidebarCollapsed" class="nav-text">Monitoring Keuangan</span>
        </router-link>

        <!-- AI Intelligence & Analytics - Only for Owner and Admin -->
        <template v-if="authStore.isAdmin || authStore.isOwner">
          <div v-if="!sidebarCollapsed" class="nav-section">Intelligence</div>
          <router-link to="/ai-intelligence" class="nav-item" :class="{ active: $route.path === '/ai-intelligence' }">
            <span class="nav-icon">🧠</span>
            <span v-if="!sidebarCollapsed" class="nav-text">Orchestrator Map</span>
          </router-link>
          <router-link to="/query" class="nav-item" :class="{ active: $route.path === '/query' }">
            <span class="nav-icon">🔍</span>
            <span v-if="!sidebarCollapsed" class="nav-text">RAG Intelligence</span>
          </router-link>
          <router-link to="/analytics" class="nav-item" :class="{ active: $route.path === '/analytics' }">
            <span class="nav-icon">📈</span>
            <span v-if="!sidebarCollapsed" class="nav-text">Trend Analytics</span>
          </router-link>
        </template>

        <!-- SOP Reference - For All Roles -->
        <div v-if="!sidebarCollapsed" class="nav-section">Support</div>
        <router-link to="/sop-reference" class="nav-item" :class="{ active: $route.path === '/sop-reference' }">
          <span class="nav-icon">📖</span>
          <span v-if="!sidebarCollapsed" class="nav-text">Buku Saku SOP</span>
        </router-link>

        <!-- Root Access & Logs - Only for Admin -->
        <template v-if="authStore.isAdmin">
          <div v-if="!sidebarCollapsed" class="nav-section">System Admin</div>
          <router-link to="/admin" class="nav-item" :class="{ active: $route.path === '/admin' }">
            <span class="nav-icon">👥</span>
            <span v-if="!sidebarCollapsed" class="nav-text">Kelola User</span>
          </router-link>
          <router-link to="/logs" class="nav-item" :class="{ active: $route.path === '/logs' }">
            <span class="nav-icon">🕵️</span>
            <span v-if="!sidebarCollapsed" class="nav-text">Audit Logs</span>
          </router-link>
        </template>

        <!-- CEO Submission (Submit Finance) -->
        <template v-if="authStore.user?.role === 'ceo'">
          <div v-if="!sidebarCollapsed" class="nav-section">CEO Actions</div>
          <router-link to="/submit-report" class="nav-item" :class="{ active: $route.path === '/submit-report' }">
            <span class="nav-icon">📤</span>
            <span v-if="!sidebarCollapsed" class="nav-text">Upload Finance</span>
          </router-link>
        </template>

        <!-- Farmer Submission (Submit Daily) -->
        <template v-if="authStore.user?.role === 'farmer'">
          <div v-if="!sidebarCollapsed" class="nav-section">Farmer Actions</div>
          <router-link to="/submit-daily" class="nav-item" :class="{ active: $route.path === '/submit-daily' }">
            <span class="nav-icon">📝</span>
            <span v-if="!sidebarCollapsed" class="nav-text">Isi Laporan</span>
          </router-link>
        </template>

        <!-- Companies (Only for Owner/Admin/CEO) -->
        <template v-if="['owner', 'admin', 'ceo'].includes(authStore.user?.role)">
          <div v-if="!sidebarCollapsed" class="nav-section">Perusahaan</div>
          <router-link 
            v-for="company in companies" 
            :key="company.id"
            :to="`/companies/${company.id}`" 
            class="nav-item"
          >
            <span class="nav-icon">{{ getCompanyIcon(company.code) }}</span>
            <span v-if="!sidebarCollapsed" class="nav-text">{{ company.name }}</span>
          </router-link>
        </template>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info" v-if="!sidebarCollapsed">
          <span class="user-avatar">👤</span>
          <div class="user-details">
            <span class="user-name">{{ authStore.userName }}</span>
            <span class="user-role">{{ capitalizeRole(authStore.user?.role) }}</span>
          </div>
        </div>
        <div class="footer-actions">
          <button class="btn-icon" @click="themeStore.toggleTheme" title="Toggle Theme">
            {{ themeStore.isDarkMode ? '☀️' : '🌙' }}
          </button>
          <button class="btn-icon" @click="handleLogout" title="Logout">
            🚪
          </button>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <header class="top-header">
        <div class="header-left">
          <h2 class="page-title">{{ pageTitle }}</h2>
        </div>
        <div class="header-right">
          <!-- Notifications Bell -->
          <div class="header-action-group">
            <div class="notification-wrapper" v-click-outside="closeNotifications">
              <button class="btn-icon bell-btn" @click="toggleNotifications" :class="{ 'has-unread': notificationStore.unreadCount > 0 }">
                🔔
                <span v-if="notificationStore.unreadCount > 0" class="unread-badge">{{ notificationStore.unreadCount }}</span>
              </button>
              
              <div v-if="showNotifications" class="notification-dropdown glass-premium animate-slide-down">
                <div class="dropdown-header">
                  <h3>Notifikasi</h3>
                  <button v-if="notificationStore.unreadCount > 0" class="btn-text" @click="notificationStore.markAllAsRead">Tandai semua dibaca</button>
                </div>
                
                <div class="notification-list">
                  <div v-if="notificationStore.loading" class="empty-state">Loading...</div>
                  <div v-else-if="notificationStore.notifications.length === 0" class="empty-state">Tidak ada notifikasi</div>
                  
                  <div 
                    v-for="n in notificationStore.notifications" 
                    :key="n.id" 
                    class="notification-item"
                    :class="{ unread: !n.is_read }"
                    @click="handleNotificationClick(n)"
                  >
                    <div class="item-icon" :class="n.type">{{ getNotificationIcon(n.type) }}</div>
                    <div class="item-body">
                      <div class="item-title">{{ n.title }}</div>
                      <div class="item-message">{{ n.message }}</div>
                      <div class="item-time">{{ formatTimeAgo(n.created_at) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="current-date">
              <span class="date-icon">📅</span>
              <span>{{ currentDate }}</span>
            </div>
          </div>
        </div>
      </header>

      <div class="content-area">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useNotificationStore } from '@/stores/notifications'
import { getCompanies } from '@/services/supabase'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const notificationStore = useNotificationStore()

const sidebarCollapsed = ref(false)
const showNotifications = ref(false)
const companies = ref([])
let notificationInterval = null

// Custom directive for clicking outside dropdown
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

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    notificationStore.fetchNotifications()
  }
}

function closeNotifications() {
  showNotifications.value = false
}

function handleNotificationClick(n) {
  notificationStore.markAsRead(n.id)
  if (n.link) {
    router.push(n.link)
    closeNotifications()
  }
}

function getNotificationIcon(type) {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '🚨'
  }
  return icons[type] || '🔔'
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  
  if (diff < 60) return 'Baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return date.toLocaleDateString('id-ID')
}

const pageTitle = computed(() => {
  const titles = {
    '/': 'Dashboard Overview',
    '/reports': 'Laporan Harian',
    '/financial-reports': 'Database Keuangan',
    '/admin': 'Manajemen User',
    '/ai-intelligence': 'AI Orchestrator Intelligence',
  }
  if (route.path.startsWith('/companies/')) {
    const company = companies.value.find(c => c.id === route.params.id)
    return company?.name || 'Detail Perusahaan'
  }
  return titles[route.path] || 'SmartFarm'
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

function getCompanyIcon(code) {
  const icons = {
    'Lyori': '🌾',
    'moafarm': '🌱',
    'Kaja': '🥬',
    'EP': '🍏',
    'ePanen': '🍏',
    'ML': '🍈',
    'Melon': '🍈',
    'Owner': '🏢'
  }
  return icons[code] || '🏭'
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function capitalizeRole(role) {
  if (!role) return 'User'
  const roleMap = {
    'admin': 'Website Admin',
    'owner': 'Owner',
    'ceo': 'CEO',
    'farmer': 'Farmer',
    'manager': 'Manager'
  }
  return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1)
}

onMounted(async () => {
  themeStore.initTheme()
  authStore.initAuth()
  
  if (authStore.isAuthenticated) {
    notificationStore.fetchNotifications()
    // Poll for new notifications every 60 seconds
    notificationInterval = setInterval(() => {
      notificationStore.fetchNotifications()
    }, 60000)
  }

  try {
    const allCompanies = await getCompanies()
    if (authStore.user?.role === 'ceo' || authStore.user?.role === 'farmer') {
      const userCompany = authStore.user?.companies?.name
      companies.value = allCompanies.filter(c => c.name === userCompany)
    } else {
      companies.value = allCompanies
    }
  } catch (err) {
    console.error('Failed to load companies:', err)
  }
})

onUnmounted(() => {
  if (notificationInterval) clearInterval(notificationInterval)
})
</script>

<style scoped>
.main-layout {
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-normal);
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border-color);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.logo-icon {
  font-size: 1.5rem;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-toggle {
  background: var(--bg-tertiary);
  border: none;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.sidebar-toggle:hover {
  background: var(--primary-100);
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: var(--space-md);
  overflow-y: auto;
}

.nav-section {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
  padding: var(--space-lg) var(--space-md) var(--space-sm);
  font-weight: 600;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  margin-bottom: var(--space-xs);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  text-decoration: none;
}

.nav-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.nav-item.active {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
}

.nav-icon {
  font-size: 1.125rem;
  width: 24px;
  text-align: center;
}

.nav-text {
  font-size: 0.875rem;
  font-weight: 500;
}

/* Sidebar Footer */
.sidebar-footer {
  padding: var(--space-md);
  border-top: 1px solid var(--border-color);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.user-avatar {
  font-size: 1.5rem;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.user-role {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.footer-actions {
  display: flex;
  gap: var(--space-sm);
}

.btn-icon {
  background: var(--bg-tertiary);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.btn-icon:hover {
  background: var(--primary-100);
  transform: scale(1.05);
}

/* Main Content */
.main-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  transition: margin-left var(--transition-normal);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.sidebar.collapsed + .main-content,
.sidebar.collapsed ~ .main-content {
  margin-left: var(--sidebar-collapsed-width);
}

.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg) var(--space-xl);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
}

.header-action-group {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

/* Notifications */
.notification-wrapper {
  position: relative;
}

.bell-btn {
  position: relative;
  font-size: 1.25rem;
}

.unread-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: var(--error);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--bg-secondary);
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 320px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-lg);
  overflow: hidden;
  z-index: 1000;
  box-shadow: var(--shadow-2xl);
}

.dropdown-header {
  padding: var(--space-md);
  background: rgba(var(--primary-rgb), 0.1);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-header h3 {
  margin: 0;
  font-size: 1rem;
}

.notification-list {
  overflow-y: auto;
  flex: 1;
}

.notification-item {
  padding: var(--space-md);
  display: flex;
  gap: var(--space-md);
  cursor: pointer;
  transition: background var(--transition-fast);
  border-bottom: 1px solid var(--border-color);
}

.notification-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.notification-item.unread {
  background: rgba(var(--primary-rgb), 0.05);
}

.item-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-icon.success { background: rgba(34, 197, 94, 0.2); }
.item-icon.error { background: rgba(239, 68, 68, 0.2); }
.item-icon.warning { background: rgba(245, 158, 11, 0.2); }
.item-icon.info { background: rgba(59, 130, 246, 0.2); }

.item-body {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 2px;
}

.item-message {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-time {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
}

.current-date {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.content-area {
  flex: 1;
  padding: var(--space-xl);
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    width: var(--sidebar-collapsed-width);
  }
  
  .sidebar-nav .nav-text,
  .sidebar-nav .nav-section,
  .user-info,
  .logo-text {
    display: none;
  }
  
  .main-content {
    margin-left: var(--sidebar-collapsed-width);
  }
}
</style>
