<template>
  <div class="reports-page animate-fade-in-up">
    <!-- Header Section - Elite Style -->
    <header class="welcome-section-premium animate-fade-in-up">
      <div class="welcome-text">
        <div class="header-meta">
          <span class="status-indicator">
            <span class="status-dot-pulse"></span>
            LIVE MONITORING
          </span>
          <span class="v-divider-v2"></span>
          <span class="role-badge-v2">OPERATIONAL LOG</span>
        </div>
        <h1 class="user-greeting-v2 text-gradient-emerald">
          Monitoring Aktivitas Harian
        </h1>
        <p class="system-desc-v2">Pantau kondisi cuaca, kendala lapangan, dan progres kerja secara real-time.</p>
      </div>

      <div class="quick-status-cards">
        <div class="mini-card-v2">
          <span class="mc-label">Skor Keamanan</span>
          <span class="mc-value" :class="reportsStore.dailyReports.some(r => hasIssues(r.issues)) ? 'text-rose' : 'text-emerald'">
            {{ reportsStore.dailyReports.some(r => hasIssues(r.issues)) ? 'WASPADA' : 'OPTIMAL' }}
          </span>
        </div>
        <div class="mini-card-v2">
          <span class="mc-label">Aktivitas Node</span>
          <span class="mc-value text-emerald">SYNCHRONIZED</span>
        </div>
      </div>
    </header>

    <!-- Control Bar (Filters) -->
    <div class="premium-card filter-card-premium p-xl mt-spacing-hero-xl mb-spacing-hero-2xl animate-fade-in-up stagger-1 flex flex-wrap items-end gap-xl">
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
      <button class="btn-primary-v2 shimmer-btn h-[52px] px-xl ml-auto" @click="loadReports">
        <AppIcon name="search" :size="18" />
        <span class="font-bold ml-sm">Terapkan Filter</span>
      </button>
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
    // Get current date in Indonesian timezone (UTC+7)
    const now = new Date()
    const indonesiaOffset = 7 * 60 // 7 hours in minutes
    const localOffset = now.getTimezoneOffset() // Local timezone offset in minutes

    // Calculate Indonesia date by adjusting for timezone difference
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
        // First day of current month in Indonesia time
        start = new Date(indonesiaDate.getFullYear(), indonesiaDate.getMonth(), 1)
    } else {
        // Calculate days back (7 or 14)
        let daysBack = 7
        if (selectedPeriodType.value === '2weeks') daysBack = 14
        start.setDate(indonesiaDate.getDate() - daysBack)
    }

    // Reset time to midnight for clean date comparison
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999) // End of day

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
    padding-bottom: 5rem;
}

/* --- Control Bar (Filters) --- */
.filter-card-premium {
    background: var(--bg-card);
    backdrop-filter: var(--glass-blur);
    border-radius: var(--radius-xl);
    border: 1px solid var(--glass-border);
    box-shadow: var(--shadow-premium);
    position: relative;
    overflow: visible; /* For dropdowns */
}
.filter-logic-box-v2 {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.filter-label-row-premium {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-left: 4px;
}

.filter-label-premium {
    font-size: 0.65rem;
    font-weight: 800;
    color: var(--text-dim);
    letter-spacing: 0.2em;
    text-transform: uppercase;
}

/* Premium Select v2 */
.premium-select-wrapper-v2 {
    position: relative;
    min-width: 200px;
}

.premium-select-trigger-v2 {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 48px;
    padding: 0 16px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--glass-border);
    border-radius: 14px;
    color: var(--text-main);
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-main);
}

.premium-select-trigger-v2:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(16, 185, 129, 0.4);
    transform: translateY(-2px);
}

.premium-select-trigger-v2.open {
    background: var(--bg-card-solid);
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
}

.select-arrow-v2 {
    transition: transform var(--transition-main);
    color: var(--text-dim);
}

.select-arrow-v2.rotated {
    transform: rotate(180deg);
}

/* Options Menu v2 */
.glass-panel-premium {
    background: var(--bg-card-solid);
    backdrop-filter: blur(24px);
    border: 1px solid var(--glass-border);
    box-shadow: var(--shadow-premium);
}

.premium-options-menu-v2 {
    position: absolute;
    top: calc(100% + 12px);
    left: 0;
    width: 240px;
    border-radius: 20px;
    padding: 10px;
    z-index: 1000;
    overflow: hidden;
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
    border-spacing: 0 16px; /* Row Gap for Card look */
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

.company-tag.LYORI { border-color: #10b981; color: #10b981; background: rgba(16, 185, 129, 0.05); }
.company-tag.KAJA { border-color: #f59e0b; color: #f59e0b; background: rgba(245, 158, 11, 0.05); }

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

/* Spacing Utilities & Global Sync */
.mt-spacing-hero-xl { margin-top: 6rem; }
.mb-spacing-hero-2xl { margin-bottom: 9rem; }

.welcome-section-premium {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.user-greeting-v2 {
    font-size: 3.2rem;
    line-height: 1.05;
    font-weight: 850;
    margin-bottom: 1rem;
    letter-spacing: -0.05em;
}

@media (max-width: 768px) {
    .user-greeting-v2 {
        font-size: 2.2rem;
    }
}

.header-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 2rem;
}

.status-indicator {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    padding: 8px 16px;
    border-radius: 100px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 0.75rem;
    font-weight: 850;
    color: #10b981;
    letter-spacing: 0.12em;
}

.status-dot-pulse {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    animation: pulse-emerald 2s infinite;
}

@keyframes pulse-emerald {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.v-divider-v2 {
    width: 2px;
    height: 16px;
    background: var(--glass-border);
}

.role-badge-v2 {
    font-size: 0.75rem;
    font-weight: 850;
    color: #818cf8;
    letter-spacing: 0.2em;
}

/* Quick Status Boxes in Header */
.quick-status-cards {
    display: flex;
    gap: 20px;
}

.mini-card-v2 {
    background: var(--bg-card);
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    padding: 20px 28px;
    border-radius: 24px;
    display: flex;
    flex-direction: column;
    min-width: 180px;
    box-shadow: var(--shadow-main);
}

.mc-label {
    font-size: 0.65rem;
    font-weight: 900;
    color: var(--text-dim);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 6px;
    opacity: 0.6;
}

.mc-value {
    font-size: 1.25rem;
    font-weight: 900;
    letter-spacing: -0.02em;
}

.text-rose { color: #f43f5e; text-shadow: 0 0 15px rgba(244, 63, 94, 0.3); }
.text-emerald { color: #10b981; text-shadow: 0 0 15px rgba(16, 185, 129, 0.3); }

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


/* Utiltity Classes */
.mb-2xl { margin-bottom: 2rem; }
.mb-xs { margin-bottom: 0.25rem; }
.p-xl { padding: 2rem; }
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
.p-3xl { padding: 3rem; }
.px-lg { padding-left: 1.5rem; padding-right: 1.5rem; }
.pb-lg { padding-bottom: 1.5rem; }
.pt-md { padding-top: 1rem; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.max-w-sm { max-width: 24rem; }
</style>
