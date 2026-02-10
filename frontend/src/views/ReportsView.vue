<template>
  <div class="reports-page animate-fade-in-up">
    <!-- Header Section -->
    <div class="page-header mb-2xl">
      <div>
        <h2 class="text-gradient-emerald text-3xl font-bold mb-xs">Monitoring Harian</h2>
        <p class="text-muted">Pantau aktivitas, kondisi cuaca, dan kendala lapangan secara real-time.</p>
      </div>
    </div>

    <!-- Control Bar (Filters) -->
    <div class="premium-card filter-card p-lg mb-2xl flex flex-wrap items-end gap-lg">
      <!-- Company Filter -->
      <div class="filter-group">
        <label class="input-label">Entitas Perusahaan</label>
        <div class="custom-select-container" v-if="authStore?.isAdmin || authStore?.isOwner" ref="companyDropdownRef">
          <button class="custom-select-trigger" @click="toggleCompanyDropdown" :class="{ 'is-open': isDropdownOpen }">
            <span class="font-bold">{{ selectedCompany === 'all' ? 'Semua Entitas' : selectedCompany }}</span>
            <AppIcon name="chevron-down" :size="18" class="transition-transform duration-200" :class="{ 'rotate-180': isDropdownOpen }" />
          </button>
          
          <transition name="dropdown-fade">
            <div class="custom-dropdown-menu" v-if="isDropdownOpen">
              <div 
                class="dropdown-item" 
                :class="{ 'selected': selectedCompany === 'all' }"
                @click="selectCompany('all')"
              >
                <span>Semua Entitas</span>
                <AppIcon v-if="selectedCompany === 'all'" name="check" :size="16" class="text-primary" />
              </div>
              
              <div class="dropdown-divider"></div>
              
              <div 
                v-for="company in companyOptions" 
                :key="company" 
                class="dropdown-item"
                :class="{ 'selected': selectedCompany === company }"
                @click="selectCompany(company)"
              >
                <span>{{ company }}</span>
                <AppIcon v-if="selectedCompany === company" name="check" :size="16" class="text-primary" />
              </div>
            </div>
          </transition>
        </div>
        <div v-else class="company-badge-static">
           <AppIcon name="briefcase" :size="16" />
           <span class="font-bold">{{ authStore?.user?.companies?.name || 'User' }}</span>
        </div>
      </div>

      <!-- Time Period Selector (Segmented Control) -->
      <div class="filter-group flex-grow">
        <label class="input-label">Rentang Waktu</label>
        <div class="segmented-control">
          <button 
            v-for="type in periodTypes" 
            :key="type.value"
            class="segment-btn" 
            :class="{ active: selectedPeriodType === type.value }"
            @click="setPeriodType(type.value)"
          >
            {{ type.label }}
          </button>
        </div>
      </div>

      <!-- Custom Date Inputs -->
      <div v-if="selectedPeriodType === 'custom'" class="flex gap-md animate-scale-up">
        <div class="filter-group">
          <label class="input-label">Mulai</label>
          <input type="date" v-model="customStartDate" class="elite-input date-input" @change="loadReports" />
        </div>
        <div class="filter-group">
          <label class="input-label">Sampai</label>
          <input type="date" v-model="customEndDate" class="elite-input date-input" @change="loadReports" />
        </div>
      </div>

      <!-- Refresh Button -->
      <button class="btn-primary-new h-[46px] px-lg ml-auto hover-lift" @click="loadReports">
        <AppIcon name="search" :size="18" />
        <span class="font-semibold ml-sm">Terapkan Filter</span>
      </button>
    </div>

    <!-- Reports Table Section -->
    <div class="premium-card overflow-hidden">
        <div class="card-header-flex p-xl border-b border-glass">
            <div class="flex items-center gap-md">
                <div class="icon-box-sm emerald">
                    <AppIcon name="clipboard" :size="20" />
                </div>
                <div>
                   <h3 class="font-bold text-lg text-main">Log Laporan Lapangan</h3>
                   <p class="text-xs text-muted">{{ reportsStore?.dailyReports?.length || 0 }} laporan ditemukan periode ini</p>
                </div>
            </div>
             <button class="btn-ghost-sm" @click="loadReports" title="Refresh Data">
                <AppIcon name="refresh-cw" :size="18" :class="{ 'animate-spin': reportsStore.loading }" />
            </button>
        </div>

      <div v-if="reportsStore?.loading" class="p-3xl flex flex-col items-center justify-center text-muted min-h-[300px]">
        <div class="spinner-premium mb-md"></div>
        <span class="animate-pulse">Menarik data laporan terbaru...</span>
      </div>
      
      <div v-else-if="(reportsStore?.dailyReports?.length || 0) === 0" class="empty-state min-h-[300px] flex flex-col items-center justify-center">
        <div class="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-lg">
             <AppIcon name="inbox" :size="40" class="text-muted opacity-50" />
        </div>
        <h4 class="text-lg font-bold text-muted mb-xs">Tidak Ada Laporan</h4>
        <p class="text-sm text-muted">Belum ada data laporan yang masuk untuk kriteria ini.</p>
      </div>
      
      <div v-else class="table-responsive px-lg pb-lg pt-md">
        <table class="elite-table">
          <thead>
            <tr>
              <th width="15%">Waktu</th>
              <th width="12%">Entitas</th>
              <th width="15%">Pelapor</th>
              <th width="30%">Aktivitas Utama</th>
              <th width="15%">Status</th>
              <th width="13%">Kondisi</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="report in reportsStore.dailyReports" 
              :key="report.id"
              @click="showReportDetail(report)"
              class="hover-row cursor-pointer"
            >
              <!-- Date Column -->
              <td>
                <div class="flex flex-col">
                  <span class="font-bold text-main text-sm">{{ getRelativeDate(report.report_date) }}</span>
                  <span class="text-xs font-mono text-muted mt-1">{{ formatDateShort(report.report_date) }}</span>
                </div>
              </td>

              <!-- Company Column -->
              <td>
                <span class="company-tag" :class="getCompanyColorClass(report._company)">
                  {{ report._company || 'N/A' }}
                </span>
              </td>

              <!-- User Column -->
              <td>
                 <div class="user-cell">
                  <div class="avatar-circle-sm" :style="{ background: stringToColor(report.user_id) }">
                    {{ (report.user_id || '?').charAt(0).toUpperCase() }}
                  </div>
                  <span class="font-medium text-sm text-main truncate max-w-[100px]" :title="report.user_id">
                    {{ report.user_id || 'Unknown' }}
                  </span>
                </div>
              </td>

              <!-- Activity Column -->
              <td>
                <div class="flex flex-col gap-1 max-w-sm">
                  <span class="font-semibold text-sm text-main truncate">
                    {{ getActivitiesSummary(report.activities) }}
                  </span>
                  <span class="text-xs text-muted truncate" v-if="getActivityDetails(report.activities)">
                    {{ truncate(getActivityDetails(report.activities), 60) }}
                  </span>
                </div>
              </td>

              <!-- Issues Column -->
              <td>
                 <div v-if="hasIssues(report.issues)" class="status-badge warning">
                    <AppIcon name="alert-circle" :size="14" />
                    <span class="truncate max-w-[80px]">{{ getIssueCount(report.issues) }} Kendala</span>
                 </div>
                 <div v-else class="status-badge success">
                    <AppIcon name="check-circle" :size="14" />
                    <span>Aman</span>
                 </div>
              </td>

              <!-- Weather Column -->
              <td>
                <div class="weather-pill" :title="report.weather">
                   <span class="text-lg">{{ getWeatherIcon(report.weather) }}</span>
                   <span class="text-xs font-bold uppercase text-muted truncate max-w-[60px]">{{ report.weather || '-' }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Report Detail Modal -->
    <ReportDetailModal 
      :report="selectedReport" 
      @close="selectedReport = null" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, defineAsyncComponent } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { useAuthStore } from '@/stores/auth'
import { COMPANY_TABLES } from '@/services/supabase'
import AppIcon from '@/components/AppIcon.vue'

const ReportDetailModal = defineAsyncComponent(() => import('@/components/ReportDetailModal.vue'))

const reportsStore = useReportsStore()
const authStore = useAuthStore()

const selectedCompany = ref('all')
const selectedReport = ref(null)

// Filtering State
const selectedPeriodType = ref('weekly')
const customStartDate = ref('')
const customEndDate = ref('')

const periodTypes = [
    { value: 'weekly', label: '7 Hari Terakhir' },
    { value: '2weeks', label: '14 Hari' },
    { value: 'monthly', label: 'Bulanan' },
    { value: 'custom', label: 'Kustom' }
]

const companyOptions = computed(() => {
    // Filter out Owner and Admin from the list as they are not "companies" with reports
    const all = Object.keys(COMPANY_TABLES).filter(c => c !== 'Owner' && c !== 'Admin')
    
    // If Admin/Owner, show all valid companies
    if (authStore.isAdmin || authStore.isOwner) return all
    
    // If regular user, only show their company
    const userCompany = authStore.user?.companies?.name
    return userCompany ? [userCompany] : []
})

function setPeriodType(type) {
    selectedPeriodType.value = type
    loadReports()
}

function calculateDateRange() {
    const today = new Date()
    const end = today
    let start = new Date()

    if (selectedPeriodType.value === 'custom') {
        return { 
            start: customStartDate.value || undefined, 
            end: customEndDate.value || undefined 
        }
    }
    
    if (selectedPeriodType.value === 'monthly') {
        start = new Date(today.getFullYear(), today.getMonth(), 1)
    } else {
        let daysBack = 7
        if (selectedPeriodType.value === '2weeks') daysBack = 14
        start.setDate(today.getDate() - daysBack)
    }
    
    start.setHours(0, 0, 0, 0)
    
    return { 
        start: start.toISOString().split('T')[0], 
        end: end.toISOString().split('T')[0] 
    }
}


function formatDateShort(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function getRelativeDate(dateStr) {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) return 'Hari Ini'
    if (date.toDateString() === yesterday.toDateString()) return 'Kemarin'
    
    return date.toLocaleDateString('id-ID', { weekday: 'long' })
}

function truncate(text, length) {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

function getActivitiesSummary(activities) {
  if (!activities) return 'Laporan Tanpa Judul'
  
  let data = activities
  if (typeof activities === 'string' && activities.trim().startsWith('{')) {
    try {
      data = JSON.parse(activities)
    } catch (e) {
      return activities
    }
  }

  if (typeof data === 'string') return data
  if (data.summary) return data.summary
  return 'Aktivitas Harian'
}

function getActivityDetails(activities) {
    if (!activities) return null
    
    let data = activities
    if (typeof activities === 'string' && activities.trim().startsWith('{')) {
      try {
        data = JSON.parse(activities)
      } catch (e) {
        return null
      }
    }

    if (typeof data === 'string') return null
    return data.details || null
}

function hasIssues(issues) {
  if (!issues) return false
  if (Array.isArray(issues)) return issues.length > 0
  if (typeof issues === 'object') return Object.keys(issues).length > 0
  return false
}

function getIssueCount(issues) {
  if (Array.isArray(issues)) return issues.length
  if (typeof issues === 'object') return Object.keys(issues).length
  return 1
}

function getWeatherIcon(weather) {
  if (!weather) return ''
  const w = weather.toLowerCase()
  if (w.includes('rain') || w.includes('hujan')) return '🌧️'
  if (w.includes('cloud') || w.includes('mendung')) return '☁️'
  if (w.includes('hot') || w.includes('panas')) return '☀️'
  if (w.includes('clear') || w.includes('cerah')) return '🌤️'
  return '🌡️'
}

function getCompanyColorClass(company) {
    if (['ePanen', 'Kaja'].includes(company)) return 'emerald'
    if (['Moafarm', 'Melon', 'Lyori'].includes(company)) return 'blue'
    return 'neutral'
}

function stringToColor(str) {
    if (!str) return '#ccc'
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + "00000".substring(0, 6 - c.length) + c;
}

function showReportDetail(report) {
  selectedReport.value = report
}

async function loadReports() {
  const { start, end } = calculateDateRange()
  reportsStore.setSelectedCompany(selectedCompany.value)
  await reportsStore.fetchAllDailyReports({
    startDate: start,
    endDate: end
  })
}

// Custom Dropdown Logic
const isDropdownOpen = ref(false)
const companyDropdownRef = ref(null)

function toggleCompanyDropdown() {
    isDropdownOpen.value = !isDropdownOpen.value
}

function closeCompanyDropdown(e) {
    if (companyDropdownRef.value && !companyDropdownRef.value.contains(e.target)) {
        isDropdownOpen.value = false
    }
}

function selectCompany(company) {
    selectedCompany.value = company
    isDropdownOpen.value = false
    loadReports()
}

onMounted(() => {
    // Init Custom Dates
    const today = new Date()
    customEndDate.value = today.toISOString().split('T')[0]
    today.setDate(today.getDate() - 7)
    customStartDate.value = today.toISOString().split('T')[0]

    // Set initial company based on user role
    if (!authStore.isAdmin && !authStore.isOwner) {
        const userCompany = authStore.user?.companies?.name
        if (userCompany) {
            selectedCompany.value = userCompany
        }
    }
    
    // Global click listener for dropdown
    document.addEventListener('click', closeCompanyDropdown)
    
    loadReports()
})

onUnmounted(() => {
    document.removeEventListener('click', closeCompanyDropdown)
})
</script>

<style scoped>
/* Page Layout */
.reports-page {
  max-width: 1400px;
  margin: 0 auto;
  padding-bottom: 64px;
}

/* Spacing Utilities (Local Definition) */
.p-lg { padding: 24px; }
.mb-2xl { margin-bottom: 48px; }
.mb-xs { margin-bottom: 4px; }
.gap-lg { gap: 24px; }
.gap-md { gap: 16px; }
.ml-auto { margin-left: auto; }
.ml-sm { margin-left: 8px; }
.px-lg { padding-left: 24px; padding-right: 24px; }
.pb-lg { padding-bottom: 24px; }
.pt-md { padding-top: 16px; }
.p-xl { padding: 32px; }
.p-3xl { padding: 48px; }
.w-full { width: 100%; }

/* Premium Card & Layout */
.premium-card {
  background: rgba(var(--bg-card-rgb), 0.3);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: visible; /* Allowing Select dropdowns to overflow */
}

/* Specific override for Filter Card to ensure Dropdowns flow out */
.filter-card {
    overflow: visible !important;
    z-index: 50; /* Ensure it stacks above the table card */
}

/* FILTER SECTION */
.filter-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.input-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
}

/* CUSTOM ELITE DROPDOWN */
.custom-select-container {
    position: relative;
    min-width: 220px;
    z-index: 50; /* Ensure it floats above other elements */
}

.custom-select-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 12px 16px;
    background: rgba(var(--text-main-rgb), 0.03);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    color: var(--text-main);
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 5px rgba(0,0,0,0.02);
}

.custom-select-trigger:hover {
    background: rgba(var(--text-main-rgb), 0.06);
    transform: translateY(-1px);
    border-color: rgba(16, 185, 129, 0.3);
}

.custom-select-trigger.is-open {
    border-color: var(--color-primary);
    background: rgba(var(--bg-main-rgb), 0.8);
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
}

/* Dropdown Menu */
.custom-dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    width: 260px; /* Slightly wider for better readability */
    background: var(--bg-card-solid);
    border: 1px solid var(--glass-border);
    border-radius: 16px; /* Smooth corners */
    padding: 8px;
    box-shadow: 0 20px 50px -10px rgba(0,0,0,0.5); /* Deep shadow for lifting */
    max-height: 320px;
    overflow-y: auto;
    z-index: 9999; /* Top level priority */
    backdrop-filter: blur(20px);
}

.dropdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s;
    user-select: none;
}

.dropdown-item:hover {
    background: rgba(var(--text-main-rgb), 0.04);
    color: var(--text-main);
}

.dropdown-item.selected {
    background: rgba(16, 185, 129, 0.1);
    color: var(--color-primary);
    font-weight: 700;
}

.dropdown-divider {
    height: 1px;
    background: var(--glass-border);
    margin: 6px 0;
}

/* Animations */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
    transition: all 0.2s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

/* Reusing Elite Input Style */
.elite-input {
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid var(--glass-border);
    background: rgba(var(--text-main-rgb), 0.03);
    color: var(--text-main);
    font-size: 0.9rem;
    transition: all 0.2s;
}
.elite-input:focus {
    border-color: var(--color-primary);
    outline: none;
    background: rgba(var(--text-main-rgb), 0.05);
}

.company-badge-static {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: rgba(var(--text-main-rgb), 0.05);
    border-radius: 10px;
    color: var(--text-main);
    border: 1px solid var(--glass-border);
}

/* SEGMENTED CONTROL (The Period Selector) */
.segmented-control {
    display: inline-flex;
    background: rgba(var(--text-main-rgb), 0.05);
    padding: 4px;
    border-radius: 12px;
    border: 1px solid var(--glass-border);
}

.segment-btn {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-muted);
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
}

.segment-btn:hover {
    color: var(--text-main);
}

.segment-btn.active {
    background: var(--bg-card); /* Should adapt to theme */
    color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.dark-mode .segment-btn.active {
    background: #2d2d2d;
}

/* TABLE STYLING */
.premium-card.overflow-hidden {
    overflow: hidden; /* Restoring overflow hidden for table card */
}

.card-header-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.icon-box-sm {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.icon-box-sm.emerald {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
}

.btn-ghost-sm {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    color: var(--text-muted);
    transition: background 0.2s;
}
.btn-ghost-sm:hover {
    background: rgba(var(--text-main-rgb), 0.05);
    color: var(--text-main);
}

/* Elite Table Implementation */
.elite-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 12px;
}

.elite-table th {
    text-align: left;
    padding: 12px 16px;
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border: none;
}

.elite-table td {
    padding: 20px 24px;
    background: rgba(255, 255, 255, 0.02); /* Very subtle card bg */
    border-top: 1px solid var(--glass-border);
    border-bottom: 1px solid var(--glass-border);
    vertical-align: middle;
    color: var(--text-main);
    transition: all 0.2s;
}

.elite-table td:first-child {
    border-left: 1px solid var(--glass-border);
    border-top-left-radius: 16px;
    border-bottom-left-radius: 16px;
}

.elite-table td:last-child {
    border-right: 1px solid var(--glass-border);
    border-top-right-radius: 16px;
    border-bottom-right-radius: 16px;
}

.hover-row:hover td {
    background: rgba(var(--text-main-rgb), 0.03);
    transform: translateY(-2px);
    border-color: rgba(var(--color-primary-rgb), 0.3);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

/* Cell Contents */
.company-tag {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
}
.company-tag.emerald { color: #10b981; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); }
.company-tag.blue { color: #3b82f6; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); }
.company-tag.neutral { color: var(--text-muted); background: rgba(var(--text-main-rgb), 0.05); }

.user-cell {
    display: flex;
    align-items: center;
    gap: 10px;
}

.avatar-circle-sm {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 600;
}
.status-badge.warning { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.status-badge.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }

.weather-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(var(--text-main-rgb), 0.03);
    padding: 4px 10px;
    border-radius: 20px;
    width: fit-content;
}

/* Button New */
.btn-primary-new {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.btn-primary-new:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.4);
}

/* Animations */
/* animate-fade-in-up is inherited from global CSS to ensure correct forwards behavior */
.animate-scale-up { animation: scaleUp 0.3s ease-out forwards; }
@keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>
