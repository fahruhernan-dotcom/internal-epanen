<template>
  <div class="main-layout">
    <!-- Aurora Mesh Background Ambience -->
    <div class="aurora-container">
      <div class="aurora-blob blob-1"></div>
      <div class="aurora-blob blob-2"></div>
      <div class="aurora-blob blob-3"></div>
    </div>

    <aside v-if="authStore.user?.role !== 'farmer'" class="sidebar" :class="{ 'collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <AppIcon name="leaf" :size="24" class="logo-icon" />
          <span v-if="!sidebarCollapsed" class="logo-text">SmartFarm</span>
        </div>
        <button class="sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
          <AppIcon :name="sidebarCollapsed ? 'chevron-right' : 'chevron-left'" :size="16" />
        </button>
      </div>

      <nav class="sidebar-nav">
        <template v-for="(item, idx) in navigationItems" :key="idx">
          <!-- Section Label -->
          <div v-if="item.isSection && !sidebarCollapsed" class="nav-section">{{ item.label }}</div>
          
          <!-- Nav Link -->
          <router-link
            v-else-if="!item.isSection && (item.roles ? item.roles.includes(authStore.user?.role) : true)"
            :to="item.to"
            class="nav-item-v2"
            :class="{ active: route.path === item.to }"
          >
            <!-- Physical Icon Pod -->
            <div class="nav-icon-pod" :class="{ 'has-3d': item.customIcon }">
              <div v-if="item.customIcon" class="nav-icon-3d">
                <img :src="item.customIcon" :alt="item.label" class="icon-3d-img" />
              </div>
              <div v-else class="nav-icon-svg">
                <AppIcon :name="item.icon" :size="18" stroke-width="2.5" />
              </div>
            </div>
            
            <span v-if="!sidebarCollapsed" class="nav-text">{{ item.label }}</span>
            
            <!-- Active Indicator Pill -->
            <div v-if="route.path === item.to" class="active-indicator-pill"></div>
          </router-link>
        </template>

        <!-- Company Links -->
        <template v-if="['owner', 'admin', 'ceo'].includes(authStore.user?.role)">
          <div v-if="!sidebarCollapsed" class="nav-section">Perusahaan</div>
          <router-link 
            v-for="company in companies" 
            :key="company.id"
            :to="`/companies/${company.id}`" 
            class="nav-item-v2"
          >
            <div class="nav-icon-pod company-icon">
              <span>{{ getCompanyIcon(company.code) }}</span>
            </div>
            <span v-if="!sidebarCollapsed" class="nav-text">{{ company.name }}</span>
          </router-link>
        </template>
      </nav>

      <div class="sidebar-footer">
        <div class="user-card-premium">
          <router-link to="/profile" class="user-main-info" title="Buka Profil">
            <div class="avatar-glow">
              <AppIcon name="user" :size="20" />
            </div>
            <div class="user-meta-data" v-if="!sidebarCollapsed">
              <span class="u-name">{{ authStore.userName }}</span>
              <span class="u-role">{{ capitalizeRole(authStore.user?.role) }}</span>
            </div>
          </router-link>
          
          <div class="footer-actions-grid" v-if="!sidebarCollapsed">
            <button class="action-btn-mini" @click="themeStore.toggleTheme" title="Toggle Theme">
              <AppIcon :name="themeStore.isDarkMode ? 'sun' : 'moon'" :size="14" />
            </button>
            <button class="action-btn-mini logout" @click="handleLogout" title="Logout">
              <AppIcon name="log-out" :size="14" />
            </button>
          </div>
        </div>
      </div>
    </aside>

    <main class="main-content" :class="{ 'no-sidebar': authStore.user?.role === 'farmer' }">
      <header v-if="authStore.user?.role !== 'farmer'" class="top-header">
        <div class="header-left">
          <!-- Breadcrumbs Navigation -->
          <Breadcrumbs />
          <h2 class="page-title">{{ pageTitle }}</h2>
        </div>
        <div class="header-right">
          <div class="header-action-group">
            <div class="notification-wrapper" v-click-outside="closeNotifications">
              <button class="btn-icon bell-btn" @click="toggleNotifications" :class="{ 'has-unread': notificationStore.unreadCount > 0 }">
                <AppIcon name="bell" :size="20" class="bell-icon" />
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
                    <div class="item-icon" :class="n.type">
                      <AppIcon :name="getNotificationIconName(n.type)" :size="16" />
                    </div>
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
              <AppIcon name="calendar" :size="16" class="date-icon" />
              <span>{{ currentDate }}</span>
            </div>
          </div>
        </div>
      </header>

      <div class="content-area" :class="{ 'no-padding': authStore.user?.role === 'farmer' }">
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
import { navigationConfig } from '@/config/navigation'
import AppIcon from '@/components/AppIcon.vue'
import Breadcrumbs from '@/components/Breadcrumbs.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const notificationStore = useNotificationStore()

const sidebarCollapsed = ref(false)
const showNotifications = ref(false)
const companies = ref([])
let notificationInterval = null

const pageTitle = computed(() => {
    const activeItem = navigationConfig.find(item => item.to === route.path)
    if (activeItem) {
      if (activeItem.label === 'Dashboard') return 'Dashboard Overview'
      if (activeItem.label === 'Monitoring Keuangan') return 'Database Keuangan'
      return activeItem.label
    }
    
    if (route.path.startsWith('/companies/')) {
        const company = companies.value.find(c => c.id === route.params.id)
        return company?.name || 'Detail Perusahaan'
    }
    return 'SmartFarm'
})

const navigationItems = computed(() => navigationConfig)

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

function getNotificationIconName(type) {
  const iconMap = {
    info: 'info',
    success: 'check-circle',
    warning: 'alert-triangle',
    error: 'alert-octagon'
  }
  return iconMap[type] || 'bell'
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
      companies.value = allCompanies.filter(c => c.name === userCompany && c.name !== 'Owner')
    } else {
      // Filter out 'Owner' role from the companies list
      companies.value = allCompanies.filter(c => c.name !== 'Owner' && c.code !== 'OWNER')
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
/* Main Layout */
.main-layout {
  min-height: 100vh;
  /* background-color: var(--bg-main); Removed to let aurora show */
  color: var(--text-main);
  position: relative;
  overflow-x: hidden;
}

/* Aurora Animation & Background */
.aurora-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1; /* Behind everything */
  background: var(--bg-mesh); /* Use the Design Token Mesh */
  overflow: hidden;
  pointer-events: none;
}

.aurora-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 20s infinite alternate;
}

.blob-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: rgba(16, 185, 129, 0.2); animation-delay: 0s; }
.blob-2 { top: 20%; right: -20%; width: 60vw; height: 60vw; background: rgba(59, 130, 246, 0.2); animation-delay: -5s; }
.blob-3 { bottom: -20%; left: 20%; width: 70vw; height: 70vw; background: rgba(139, 92, 246, 0.2); animation-delay: -10s; }

@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(30px, 30px) scale(1.1); }
}

/* Sidebar */
.sidebar {
  width: var(--sidebar-width);
  background: rgba(var(--bg-card-rgb), 0.4);
  backdrop-filter: blur(20px) saturate(180%);
  border-right: 1px solid var(--glass-border);
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 1000;
  overflow: hidden; /* Container stay fixed, internal nav scrolls */
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
}

.sidebar-header {
  height: 72px; /* Matched exactly to .top-header height */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-xl);
  border-bottom: 1px solid var(--glass-border);
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  text-decoration: none;
}

.logo-icon {
  color: var(--color-primary);
  filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.4));
  transition: filter 0.3s ease;
}

.logo-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--text-main);
}

.sidebar-toggle {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  width: 28px;
  height: 28px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.sidebar-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-primary);
}

/* Navigation Items - 3D Icon Overhaul */
.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px; /* Increased gap for 3D weight */
  overflow-y: auto;
  overflow-x: hidden;
}

/* Custom Sidebar Scrollbar */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(var(--bg-card-rgb), 0.1);
  border-radius: 10px;
}

.sidebar-nav:hover::-webkit-scrollbar-thumb {
  background: rgba(16, 185, 129, 0.2);
}

.nav-item-v2 {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 14px;
  color: var(--text-dim);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.825rem;
  border: 1px solid transparent;
  position: relative;
  margin-bottom: 2px;
}

/* physical Icon Pod - The 'Contrast Anchor' */
.nav-icon-pod {
    width: 40px; 
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px; /* Smooth rounded square */
    background: rgba(var(--text-main-rgb), 0.06);
    border: 1px solid rgba(var(--text-main-rgb), 0.08);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    flex-shrink: 0;
    position: relative;
    overflow: hidden; /* CRITICAL: Clips the square PNG backgrounds */
}

.dark-mode .nav-icon-pod {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-item-v2:hover .nav-icon-pod {
    background: rgba(var(--text-main-rgb), 0.08);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.nav-icon-3d {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.icon-3d-img {
    width: 100%;
    height: 100%;
    object-fit: cover; /* Fill the rounded tile */
    filter: saturate(1.2) contrast(1.05);
    mix-blend-mode: multiply; /* Surgical fix: removes white background in Light Mode */
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.dark-mode .icon-3d-img {
    mix-blend-mode: normal; /* Normal for dark mode as backgrounds are usually dark/translucent */
}

.nav-icon-svg {
    opacity: 0.7;
    color: var(--text-dim);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.nav-item-v2:hover {
  background: rgba(var(--bg-card-rgb), 0.25);
  color: var(--text-main);
  border-color: rgba(255, 255, 255, 0.1);
}

.nav-item-v2:hover .nav-icon-pod {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.2);
}

.nav-item-v2:hover .nav-icon-3d {
    transform: scale(1.1) translateY(-2px);
}

.nav-item-v2:hover .nav-icon-svg {
    opacity: 1;
    color: var(--color-primary);
}

.nav-item-v2.active {
  background: rgba(16, 185, 129, 0.12);
  color: var(--color-primary);
  box-shadow: 
    inset 0 0 15px rgba(16, 185, 129, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.05);
  font-weight: 700;
}

.nav-item-v2.active .nav-icon-pod {
    background: rgba(16, 185, 129, 0.18);
    border-color: rgba(16, 185, 129, 0.4);
    box-shadow: 
        0 4px 12px rgba(16, 185, 129, 0.2),
        inset 0 0 10px rgba(16, 185, 129, 0.1);
}

.nav-item-v2.active .icon-3d-img {
    filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.6)) saturate(1.6) contrast(1.2);
    transform: scale(1.1) rotate(-2deg);
}

.nav-item-v2.active .nav-icon-svg {
    opacity: 1;
    color: var(--color-primary);
    filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.5));
    transform: scale(1.1);
}

.active-indicator-pill {
    position: absolute;
    right: 0;
    width: 4px;
    height: 16px;
    background: var(--color-primary);
    border-radius: 4px 0 0 4px;
    box-shadow: -2px 0 8px var(--color-primary);
}

.nav-section {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  padding: 16px 16px 8px;
  opacity: 0.7;
}
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--glass-border);
}

.user-card-premium {
    background: rgba(var(--bg-card-rgb), 0.3);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.user-main-info {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
}

.avatar-glow {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, var(--color-primary), #10b981);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.user-meta-data {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.u-name {
    font-size: 0.8125rem;
    font-weight: 800;
    color: var(--text-main);
    white-space: nowrap;
}

.u-role {
    font-size: 0.6rem;
    font-weight: 700;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.footer-actions-grid {
    display: flex;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--glass-border);
}

.action-btn-mini {
    flex: 1;
    height: 32px;
    background: rgba(var(--bg-card-rgb), 0.2);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.action-btn-mini:hover {
    background: rgba(var(--bg-card-rgb), 0.5);
    color: var(--text-main);
    border-color: var(--text-dim);
}

.action-btn-mini.logout:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
    border-color: rgba(239, 68, 68, 0.3);
}


/* Main Content */
.main-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: transparent; /* aurora mesh visible underneath */
}

.main-content.no-sidebar {
  margin-left: 0 !important;
}

/* Sidebar Collapsed Handling */
.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
}

.sidebar.collapsed + .main-content {
  margin-left: var(--sidebar-collapsed-width);
}

.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-2xl);
  background: rgba(var(--bg-card-rgb), 0.35);
  backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid var(--glass-border);
  position: sticky;
  top: 0;
  z-index: 999; /* Boosted to ensure it overlays all page content including filter bars */
  height: 72px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--text-main);
  letter-spacing: -0.05em;
  margin-top: -2px;
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
.unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  font-size: 0.65rem;
  font-weight: 800;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--bg-card);
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 16px);
  right: 0;
  width: 360px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-main);
  border: 1px solid var(--glass-border);
  overflow: hidden;
  z-index: 2000 !important; /* Force high z-index to overlay filter bars */
}

.current-date {
  background: rgba(var(--bg-card-rgb), 0.5);
  padding: 8px 18px;
  border-radius: 100px;
  border: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--text-main);
  box-shadow: var(--shadow-sm);
  letter-spacing: 0.02em;
}

.date-icon {
    color: var(--color-primary);
}

.bell-btn {
    background: rgba(var(--bg-card-rgb), 0.5);
    border: 1px solid var(--glass-border);
    border-radius: 100px;
    position: relative;
    width: 40px;
    height: 40px;
}

.bell-icon {
    color: #d97706; /* Amber-600 for Light Mode contrast */
    fill: rgba(217, 119, 6, 0.1);
    filter: drop-shadow(0 0 8px rgba(217, 119, 6, 0.2));
    transition: all 0.3s ease;
}

.dark-mode .bell-icon {
    color: #FACC15; /* Yellow-400 for Dark Mode */
    fill: rgba(250, 204, 21, 0.2);
    filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.4));
}

.bell-btn:hover .bell-icon {
    transform: scale(1.1) rotate(15deg);
    filter: drop-shadow(0 0 12px rgba(250, 204, 21, 0.6));
}

.bell-btn.has-unread .bell-icon {
    animation: bell-ring 4s ease-in-out infinite;
}

@keyframes bell-ring {
    0%, 90% { transform: rotate(0); }
    91% { transform: rotate(15deg); }
    93% { transform: rotate(-10deg); }
    95% { transform: rotate(5deg); }
    97% { transform: rotate(-2deg); }
    100% { transform: rotate(0); }
}

.bell-btn:hover {
    background: rgba(var(--bg-card-rgb), 0.8);
    border-color: var(--color-primary);
}

/* Notification Dropdown Content Styles */
.dropdown-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid var(--glass-border);
    background: rgba(var(--bg-card-rgb), 0.5);
    backdrop-filter: blur(10px);
}

.dropdown-header h3 {
    font-size: 0.875rem;
    font-weight: 800;
    color: var(--text-main);
    margin: 0;
}

.btn-text {
    background: none;
    border: none;
    color: var(--color-primary);
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: background 0.2s;
}

.btn-text:hover {
    background: rgba(16, 185, 129, 0.1);
}

.notification-list {
    max-height: 360px;
    overflow-y: auto;
    background: rgba(var(--bg-card-rgb), 0.8);
}

.notification-item {
    display: flex;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--glass-border);
    cursor: pointer;
    transition: background 0.2s;
}

.notification-item:hover {
    background: rgba(var(--bg-card-rgb), 0.95);
}

.notification-item.unread {
    background: rgba(16, 185, 129, 0.05);
}

.item-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(var(--bg-card-rgb), 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    flex-shrink: 0;
    border: 1px solid var(--glass-border);
}

.item-icon.info { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
.item-icon.success { color: #10b981; background: rgba(16, 185, 129, 0.1); }
.item-icon.warning { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
.item-icon.error { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

.item-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.item-title {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-main);
}

.item-message {
    font-size: 0.75rem;
    color: var(--text-muted);
    line-height: 1.4;
}

.item-time {
    font-size: 0.65rem;
    color: var(--text-dim);
    margin-top: 4px;
}

.empty-state {
    padding: 32px;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.875rem;
}

.content-area {
  flex: 1;
  padding: var(--space-2xl);
  position: relative;
}

/* Responsive */
@media (max-width: 1024px) {
  .content-area { padding: var(--space-xl); }
}

@media (max-width: 768px) {
  .sidebar { width: var(--sidebar-collapsed-width); }
  .nav-text, .nav-section, .user-name, .user-role, .logo-text { display: none; }
  .user-info { justify-content: center; }
  .main-content { margin-left: var(--sidebar-collapsed-width); }
  .top-header { padding: 0 var(--space-lg); }
}
</style>
