<template>
  <MobileReportsView 
    v-if="isMobile"
    :reports="reportsStore.dailyReports"
    :company-options="companyOptions"
    :selected-company="selectedCompany"
    :period-types="periodTypes"
    :selected-period-type="selectedPeriodType"
    :loading="reportsStore.loading"
    @select-company="selectCompany"
    @set-period="setPeriodType"
    @view-detail="showReportDetail"
  />
  <div v-else class="reports-page animate-fade-in-up">
    <!-- Header Section - Elite Style -->
    <header class="hero-header-premium animate-fade-in-up">
      <div class="hero-main-content">
        <div class="hero-badge-row">
          <div class="status-orb-pill">
            <span class="status-dot-pulse"></span>
            LIVE MONITORING
          </div>
          <span class="pill-divider"></span>
          <span class="context-tag">OPERATIONAL LOG</span>
        </div>
        
        <h1 class="hero-title-v3">
          Monitoring <span class="text-gradient-emerald">Aktivitas Harian</span>
        </h1>
        <p class="hero-subtitle-v3">Pantau kondisi cuaca, kendala lapangan, dan progres kerja sektor harian secara real-time.</p>
      </div>

      <div class="hero-status-hub">
        <div class="status-pod-v4">
          <div class="pod-header">
             <AppIcon name="shield-check" :size="14" class="pod-icon" />
             <span class="pod-label">SKOR KEAMANAN</span>
          </div>
          <div class="pod-body">
             <span class="pod-value" :class="reportsStore.dailyReports.some(r => hasIssues(r.issues)) ? 'text-rose' : 'text-emerald'">
               {{ reportsStore.dailyReports.some(r => hasIssues(r.issues)) ? 'WASPADA' : 'OPTIMAL' }}
             </span>
          </div>
          <div class="pod-bg-glow" :class="{ 'rose': reportsStore.dailyReports.some(r => hasIssues(r.issues)) }"></div>
        </div>

        <div class="status-pod-v4">
          <div class="pod-header">
             <AppIcon name="cpu" :size="14" class="pod-icon" />
             <span class="pod-label">AKTIVITAS NODE</span>
          </div>
          <div class="pod-body">
             <span class="pod-value text-emerald">SYNCHRONIZED</span>
          </div>
          <div class="pod-bg-glow"></div>
        </div>
      </div>
    </header>

    <!-- Control Bar (Filters) -->
    <div class="premium-card filter-card-premium animate-fade-in-up stagger-1">
      <div class="filter-header-mini">
         <span class="filter-tag">FILTRASI EKOSISTEM</span>
      </div>
      
      <div class="filter-flex-row">
        <!-- Company Filter -->
        <div class="filter-logic-box-v2">
          <div class="filter-label-row-premium">
            <AppIcon name="building-2" :size="14" class="text-emerald" />
            <span class="filter-label-premium">ENTITAS PERUSAHAAN</span>
          </div>
          
          <div v-if="authStore?.isAdmin || authStore?.isOwner" class="premium-select-wrapper-v2" ref="companyDropdownRef">
            <div 
              class="premium-select-trigger-v2" 
              :class="{ open: isDropdownOpen }"
              @click="toggleCompanyDropdown"
            >
              <span>{{ selectedCompany === 'all' ? 'Semua Entitas' : selectedCompany }}</span>
              <AppIcon 
                name="chevron-down" 
                :size="16" 
                class="select-arrow-v2" 
                :class="{ rotated: isDropdownOpen }" 
              />
            </div>
            
            <transition name="dropdown-slide-v2">
              <div class="premium-options-menu-v2 glass-panel-premium" v-if="isDropdownOpen">
                <div 
                  class="premium-option-v2" 
                  :class="{ selected: selectedCompany === 'all' }"
                  @click="selectCompany('all')"
                >
                  <span>Semua Entitas</span>
                  <AppIcon v-if="selectedCompany === 'all'" name="check" :size="14" class="text-emerald" />
                </div>
                <div 
                  class="premium-option-v2" 
                  v-for="company in companyOptions" 
                  :key="company"
                  :class="{ selected: selectedCompany === company }"
                  @click="selectCompany(company)"
                >
                  <span>{{ company }}</span>
                  <AppIcon v-if="selectedCompany === company" name="check" :size="14" class="text-emerald" />
                </div>
              </div>
            </transition>
          </div>
          <div v-else class="company-badge-static-v2">
             <span class="font-bold text-main">{{ authStore?.user?.companies?.name || 'User' }}</span>
          </div>
        </div>

        <!-- Time Period Selector -->
        <div class="filter-logic-box-v2 flex-grow">
          <div class="filter-label-row-premium">
            <AppIcon name="calendar" :size="14" class="text-emerald" />
            <span class="filter-label-premium">RENTANG WAKTU</span>
          </div>
          <div class="period-tabs-wrapper-v2">
            <button 
              v-for="type in periodTypes" 
              :key="type.value"
              class="tab-btn-v2" 
              :class="{ active: selectedPeriodType === type.value }"
              @click="setPeriodType(type.value)"
            >
              {{ type.label }}
            </button>
          </div>
        </div>

        <!-- Custom Date Inputs -->
        <div v-if="selectedPeriodType === 'custom'" class="flex gap-md animate-scale-up">
          <div class="filter-logic-box-v2">
            <div class="filter-label-row-premium">
              <span class="filter-label-premium">MULAI</span>
            </div>
            <input type="date" v-model="customStartDate" class="premium-date-input-v2" @change="loadReports" />
          </div>
          <div class="filter-logic-box-v2">
            <div class="filter-label-row-premium">
              <span class="filter-label-premium">SAMPAI</span>
            </div>
            <input type="date" v-model="customEndDate" class="premium-date-input-v2" @change="loadReports" />
          </div>
        </div>

        <!-- Apply Button -->
        <button class="btn-primary-v2 shimmer-btn" @click="loadReports">
          <AppIcon name="zap" :size="18" />
          <span class="font-bold">Sync Data</span>
        </button>
      </div>
    </div>


    <!-- Reports Table Section -->
    <div class="premium-card overflow-hidden">
        <div class="card-header-flex p-3xl border-b border-glass bg-black/20">
            <div class="header-title-group">
                <div class="ai-orb pulse-emerald"></div>
                <div class="title-stack">
                   <h3 class="log-title">Log Aktivitas Lapangan</h3>
                   <span class="log-subtitle">{{ reportsStore?.dailyReports?.length || 0 }} Feed Data Terdeteksi</span>
                </div>
            </div>
             <button class="btn-refresh-premium shimmer-btn" @click="loadReports" title="Sync Data">
                <AppIcon name="refresh-cw" :size="20" :class="{ 'animate-spin': reportsStore.loading }" />
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
                  <span class="font-bold text-main text-sm tracking-tight">{{ getRelativeDate(report.report_date) }}</span>
                  <span class="text-[10px] font-black uppercase tracking-widest text-emerald/60 mt-0.5 font-mono">{{ formatDateShort(report.report_date) }}</span>
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
import MobileReportsView from './mobile/MobileReportsView.vue'

const ReportDetailModal = defineAsyncComponent(() => import('@/components/ReportDetailModal.vue'))

const isMobile = ref(window.innerWidth <= 768)
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}

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
    const all = Object.keys(COMPANY_TABLES).filter(c => c !== 'Owner' && c !== 'Admin')
    if (authStore.isAdmin || authStore.isOwner) return all
    const userCompany = authStore.user?.companies?.name
    return userCompany ? [userCompany] : []
})

function setPeriodType(type) {
    selectedPeriodType.value = type
    loadReports()
}

function calculateDateRange() {
    const now = new Date()
    const indonesiaOffset = 7 * 60
    const localOffset = now.getTimezoneOffset()
    const indonesiaDate = new Date(now.getTime() + (indonesiaOffset + localOffset) * 60 * 1000)

    const end = indonesiaDate
    let start = new Date(indonesiaDate)

    if (selectedPeriodType.value === 'custom') {
        return {
            start: customStartDate.value || undefined,
            end: customEndDate.value || undefined
        }
    }

    if (selectedPeriodType.value === 'monthly') {
        start = new Date(indonesiaDate.getFullYear(), indonesiaDate.getMonth(), 1)
    } else {
        let daysBack = 7
        if (selectedPeriodType.value === '2weeks') daysBack = 14
        start.setDate(indonesiaDate.getDate() - daysBack)
    }

    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

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
    try { data = JSON.parse(activities) } catch (e) { return activities }
  }
  if (typeof data === 'string') return data
  if (data.summary) return data.summary
  return 'Aktivitas Harian'
}

function getActivityDetails(activities) {
    if (!activities) return null
    let data = activities
    if (typeof activities === 'string' && activities.trim().startsWith('{')) {
      try { data = JSON.parse(activities) } catch (e) { return null }
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
    const today = new Date()
    customEndDate.value = today.toISOString().split('T')[0]
    today.setDate(today.getDate() - 7)
    customStartDate.value = today.toISOString().split('T')[0]

    if (!authStore.isAdmin && !authStore.isOwner) {
        const userCompany = authStore.user?.companies?.name
        if (userCompany) {
            selectedCompany.value = userCompany
        }
    }
    
    document.addEventListener('click', closeCompanyDropdown)
    window.addEventListener('resize', handleResize)
    
    loadReports()
})

onUnmounted(() => {
    document.removeEventListener('click', closeCompanyDropdown)
    window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* Page Layout */
.reports-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 0 64px 0;
}

/* Spacing Utilities */
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
    padding-bottom: 5rem;
}

/* --- Control Bar (Filters) --- */
.filter-card-premium {
    background: rgba(255, 255, 255, 0.01);
    backdrop-filter: blur(40px);
    border-radius: 32px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 32px;
    margin-bottom: 4rem;
    box-shadow: 0 40px 80px -20px rgba(0,0,0,0.4);
}

.filter-header-mini {
    margin-bottom: 24px;
    padding-left: 4px;
}

.filter-tag {
    font-size: 0.6rem;
    font-weight: 900;
    color: #10b981;
    letter-spacing: 0.3em;
    opacity: 0.8;
}

.filter-flex-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 32px;
}

.premium-option-v2 {
    padding: 12px 14px;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.2s;
}

.premium-option-v2:hover {
    background: rgba(16, 185, 129, 0.08);
    color: var(--color-primary);
    padding-left: 18px;
}

.premium-option-v2.selected {
    background: rgba(16, 185, 129, 0.12);
    color: var(--color-primary);
    font-weight: 800;
}

/* Period Tabs v2 */
.period-tabs-wrapper-v2 {
    display: flex;
    background: rgba(var(--bg-card-rgb), 0.5);
    padding: 4px;
    border-radius: 14px;
    border: 1px solid var(--glass-border);
}

.tab-btn-v2 {
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-dim);
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all var(--transition-main);
}

.tab-btn-v2:hover {
    color: var(--text-main);
}

.tab-btn-v2.active {
    background: var(--bg-card-solid);
    color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Inputs v2 */
.premium-date-input-v2 {
    height: 48px;
    padding: 0 16px;
    background: rgba(var(--bg-card-rgb), 0.3);
    border: 1px solid var(--glass-border);
    border-radius: 14px;
    color: var(--text-main);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-main);
    width: 160px;
}

.premium-date-input-v2:focus {
    outline: none;
    border-color: var(--color-primary);
    background: var(--bg-card-solid);
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
}

/* Button v2 */
.btn-primary-v2 {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
    color: white;
    border: none;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 0 32px;
    height: 52px;
    cursor: pointer;
    transition: all var(--transition-main);
    box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.3);
    white-space: nowrap;
    font-weight: 700;
}

.btn-primary-v2:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 15px 30px -8px rgba(16, 185, 129, 0.5);
}

/* --- Report Table Section --- */
.elite-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 16px;
    margin-top: -16px;
}

.elite-table th {
    padding: 12px 24px;
    text-align: left;
    font-size: 0.65rem;
    font-weight: 800;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.15em;
    opacity: 0.6;
}

.elite-table td {
    background: rgba(var(--bg-card-rgb), 0.3);
    padding: 24px;
    vertical-align: middle;
    border-top: 1px solid var(--glass-border);
    border-bottom: 1px solid var(--glass-border);
}

.elite-table td:first-child {
    border-left: 1px solid var(--glass-border);
    border-top-left-radius: 20px;
    border-bottom-left-radius: 20px;
}

.elite-table td:last-child {
    border-right: 1px solid var(--glass-border);
    border-top-right-radius: 20px;
    border-bottom-right-radius: 20px;
}

.hover-row {
    transition: all var(--transition-main);
}

.hover-row:hover td {
    background: rgba(var(--bg-card-rgb), 0.6);
    border-color: rgba(16, 185, 129, 0.3);
    transform: scale(1.005) translateY(-4px);
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.2);
}

/* Badges & Tags */
.company-tag {
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.6rem;
    font-weight: 900;
    background: rgba(var(--bg-card-rgb), 0.4);
    color: var(--text-dim);
    border: 1px solid var(--glass-border);
    letter-spacing: 0.1em;
}

.company-tag.emerald { border-color: #10b981; color: #10b981; background: rgba(16, 185, 129, 0.05); }
.company-tag.blue { border-color: #3b82f6; color: #3b82f6; background: rgba(59, 130, 246, 0.05); }

.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 700;
}

.status-badge.success {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-badge.warning {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
}

.weather-pill {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(var(--bg-card-rgb), 0.35);
    padding: 6px 14px;
    border-radius: 100px;
    border: 1px solid var(--glass-border);
}

/* User Avatar Cell */
.user-cell {
    display: flex;
    align-items: center;
    gap: 12px;
}

.avatar-circle-sm {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.8rem;
    font-weight: 800;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

/* --- Hero Header Overhaul --- */
.hero-header-premium {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 24px 0 16px;
    margin-bottom: 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    gap: 40px;
}

.hero-main-content {
    flex: 1;
    max-width: 800px;
}

.hero-badge-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
}

.status-orb-pill {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    padding: 6px 14px;
    border-radius: 100px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.65rem;
    font-weight: 900;
    color: #10b981;
    letter-spacing: 0.15rem;
}

.pill-divider {
    width: 1px;
    height: 12px;
    background: rgba(255,255,255,0.1);
}

.context-tag {
    font-size: 0.65rem;
    font-weight: 800;
    color: #94a3b8;
    letter-spacing: 0.2em;
    text-transform: uppercase;
}

.hero-title-v3 {
    font-size: 2.75rem;
    font-weight: 850;
    color: white;
    letter-spacing: -0.04em;
    line-height: 1.1;
    margin: 0 0 16px 0;
}

.hero-subtitle-v3 {
    font-size: 1rem;
    color: #94a3b8;
    max-width: 500px;
    line-height: 1.6;
    margin: 0;
}

/* Status Hub System */
.hero-status-hub {
    display: flex;
    gap: 20px;
    flex-shrink: 0;
}

.status-pod-v4 {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 20px 24px;
    border-radius: 20px;
    min-width: 200px;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);
}

.pod-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.pod-icon {
    color: #10b981;
    opacity: 0.7;
}

.pod-label {
    font-size: 0.6rem;
    font-weight: 950;
    color: #475569;
    letter-spacing: 0.1em;
}

.pod-body {
    position: relative;
    z-index: 1;
}

.pod-value {
    font-size: 1.25rem;
    font-weight: 900;
    letter-spacing: -0.01em;
}

.pod-bg-glow {
    position: absolute;
    top: -20px;
    right: -20px;
    width: 60px;
    height: 60px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.1), transparent 70%);
}

.pod-bg-glow.rose {
    background: radial-gradient(circle, rgba(244, 63, 94, 0.1), transparent 70%);
}

.text-rose { color: #f43f5e; }
.text-emerald { color: #10b981; }

@media (max-width: 1100px) {
    .hero-header-premium {
        flex-direction: column;
        align-items: flex-start;
    }
}

/* Card Header Specifics */
.card-header-flex {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
}

.header-title-group {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.title-stack {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.log-title {
    font-size: 1.5rem;
    font-weight: 850;
    color: var(--text-main);
    letter-spacing: -0.02em;
    margin: 0;
}

.log-subtitle {
    font-size: 0.7rem;
    color: #10b981;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.3em;
    opacity: 0.9;
}

.btn-refresh-premium {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--glass-border);
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-refresh-premium:hover {
    background: rgba(16, 185, 129, 0.1);
    border-color: var(--color-primary);
    color: var(--color-primary);
    transform: rotate(30deg) scale(1.1);
}

.ai-orb {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    background: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 25px rgba(16, 185, 129, 0.6);
}

/* Utility Classes */
.mb-2xl { margin-bottom: 2rem; }
.mb-xs { margin-bottom: 0.25rem; }
.gap-md { gap: 1rem; }
.ml-auto { margin-left: auto; }
.ml-sm { margin-left: 0.5rem; }
.font-bold { font-weight: 700; }
.text-lg { font-size: 1.125rem; }
.text-main { color: var(--text-main); }
.text-xs { font-size: 0.75rem; }
.text-muted { color: var(--text-muted); }
.border-b { border-bottom-width: 1px; }
.border-glass { border-color: var(--glass-border); }
.min-h-\[300px\] { min-height: 300px; }
.flex-col { flex-direction: column; }
.justify-center { justify-content: center; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.max-w-sm { max-width: 24rem; }
</style>
