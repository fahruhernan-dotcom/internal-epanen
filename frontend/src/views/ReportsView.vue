<template>
  <div class="reports-page animate-fade-in">
    <!-- Filters -->
    <div class="filters-bar card">
      <div class="filter-group" v-if="authStore?.isAdmin || authStore?.isOwner">
        <label class="form-label">Perusahaan</label>
        <select v-model="selectedCompany" class="form-input" @change="loadReports">
          <option value="all">Semua Perusahaan</option>
          <option v-for="company in companyOptions" :key="company" :value="company">
            {{ company }}
          </option>
        </select>
      </div>
      <div class="filter-group" v-else-if="authStore.user?.companies?.name">
        <label class="form-label">Perusahaan</label>
        <div class="company-badge-static">
          🏢 {{ authStore.user.companies.name }}
        </div>
      </div>

      <!-- Period Tabs -->
      <div class="period-tabs-container">
        <label class="form-label mb-xs block">Periode</label>
        <div class="period-tabs">
          <button 
            v-for="type in periodTypes" 
            :key="type.value"
            class="tab-btn" 
            :class="{ active: selectedPeriodType === type.value }"
            @click="setPeriodType(type.value)"
          >
            {{ type.label }}
          </button>
        </div>
      </div>
      
      <!-- Custom Date Inputs -->
      <div v-if="selectedPeriodType === 'custom'" class="flex gap-sm animate-fade-in filter-group">
        <div>
            <label class="form-label">Dari</label>
            <input type="date" v-model="customStartDate" class="form-input" @change="loadReports" />
        </div>
        <div>
            <label class="form-label">Sampai</label>
            <input type="date" v-model="customEndDate" class="form-input" @change="loadReports" />
        </div>
      </div>
      
      <div class="flex-spacer"></div>

      <button class="btn btn-primary" @click="loadReports">
        🔍 Filter
      </button>
    </div>

    <!-- Reports Table -->
    <div class="card">
      <div class="card-header">
        <h3>Laporan Harian</h3>
        <span class="report-count">{{ reportsStore?.dailyReports?.length || 0 }} laporan</span>
      </div>
      
      <div v-if="reportsStore?.loading" class="loading-state">
        <div class="spinner"></div>
        <span>Memuat laporan...</span>
      </div>
      
      <div v-else-if="(reportsStore?.dailyReports?.length || 0) === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>Tidak ada laporan ditemukan</p>
        <span class="empty-hint">Coba ubah filter pencarian</span>
      </div>
      
      <div v-else class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Perusahaan</th>
              <th>Pelapor</th>
              <th>Aktivitas</th>
              <th>Masalah</th>
              <th>Cuaca</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="report in reportsStore.dailyReports" 
              :key="report.id"
              @click="showReportDetail(report)"
              class="clickable-row rich-row"
            >
              <td class="col-date">
                <div class="flex flex-col">
                  <span class="day-label">{{ getRelativeDate(report.report_date) }}</span>
                  <span class="date-sub">{{ formatDateShort(report.report_date) }}</span>
                </div>
              </td>
              <td class="col-company">
                <span class="badge badge-outline" :class="getCompanyBadgeClass(report._company)">
                  {{ report._company }}
                </span>
              </td>
              <td class="col-user">
                <div class="user-info">
                  <span class="avatar-mini">👤</span>
                  <span class="user-name">{{ report.user_id || '-' }}</span>
                </div>
              </td>
              <td class="col-activity">
                <div class="activity-rich-content">
                  <span class="activity-main-text">{{ getActivitiesSummary(report.activities) }}</span>
                  <p v-if="getActivityDetails(report.activities)" class="activity-snippet">
                    {{ truncate(getActivityDetails(report.activities), 80) }}
                  </p>
                </div>
              </td>
              <td class="col-issues">
                <div v-if="hasIssues(report.issues)" class="issue-rich-content">
                  <span class="badge badge-warning mb-xs">
                    {{ getIssueCount(report.issues) }} Masalah
                  </span>
                  <p class="issue-snippet">{{ truncate(getIssuePreview(report.issues), 60) }}</p>
                </div>
                <span v-else class="text-success text-sm font-semibold">✓ Aman</span>
              </td>
              <td class="col-weather">
                <span class="weather-badge-rich" :title="report.weather">
                  <span class="weather-icon-lg">{{ getWeatherIcon(report.weather) }}</span>
                  <span class="weather-text-sm">{{ report.weather || '-' }}</span>
                </span>
              </td>
              <td class="col-notes">
                <span class="notes-preview" v-if="report.notes">
                  {{ truncate(report.notes, 40) }}
                </span>
                <span v-else class="text-muted italic text-xs">Tidak ada catatan</span>
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
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { useAuthStore } from '@/stores/auth'
import { COMPANY_TABLES } from '@/services/supabase'

const ReportDetailModal = defineAsyncComponent(() => import('@/components/ReportDetailModal.vue'))

const reportsStore = useReportsStore()
const authStore = useAuthStore()

const selectedCompany = ref('all')
const selectedReport = ref(null)

// Filtering State
const selectedPeriodType = ref('weekly') // Default to weekly for operational
const customStartDate = ref('')
const customEndDate = ref('')

const periodTypes = [
    { value: 'monthly', label: 'Bulanan' },
    { value: '3weeks', label: '3 Mingguan' },
    { value: '2weeks', label: '2 Mingguan' },
    { value: 'weekly', label: 'Mingguan' },
    { value: 'custom', label: 'Custom' }
]

const companyOptions = computed(() => Object.keys(COMPANY_TABLES))

function setPeriodType(type) {
    selectedPeriodType.value = type
    loadReports()
}

function calculateDateRange() {
    const today = new Date()
    const end = today // Default end is today
    let start = new Date()

    if (selectedPeriodType.value === 'custom') {
        return { 
            start: customStartDate.value || undefined, 
            end: customEndDate.value || undefined 
        }
    }
    
    // Logic for presets
    if (selectedPeriodType.value === 'monthly') {
        // Strict start of month
        start = new Date(today.getFullYear(), today.getMonth(), 1)
    } else {
        let daysBack = 7
        if (selectedPeriodType.value === '2weeks') daysBack = 14
        if (selectedPeriodType.value === '3weeks') daysBack = 21
        start.setDate(today.getDate() - daysBack)
    }
    
    start.setHours(0, 0, 0, 0)
    
    return { 
        start: start.toISOString().split('T')[0], 
        end: end.toISOString().split('T')[0] 
    }
}


function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatDateShort(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short'
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
  if (typeof activities === 'string') return activities
  if (activities.summary) return activities.summary
  return 'Aktivitas Harian'
}

function getActivityDetails(activities) {
    if (!activities || typeof activities === 'string') return null
    return activities.details || null
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

function getIssuePreview(issues) {
    if (!issues) return ''
    if (Array.isArray(issues) && issues.length > 0) {
        const first = issues[0]
        return typeof first === 'string' ? first : (first.description || first.content || '')
    }
    if (typeof issues === 'object') {
        const first = Object.values(issues)[0]
        if (typeof first === 'string') return first
        return first?.description || first?.content || ''
    }
    return String(issues)
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

function getCompanyBadgeClass(company) {
  const classes = {
    'ePanen': 'badge-success',
    'Moafarm': 'badge-info',
    'Lyori': 'badge-warning',
    'Kaja': 'badge-success',
    'Melon': 'badge-info'
  }
  return classes[company] || 'badge-info'
}

function formatJSON(data) {
  if (!data) return '-'
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

function showReportDetail(report) {
  selectedReport.value = report
}

// Redundant normalizeIssues helper removed

async function loadReports() {
  const { start, end } = calculateDateRange()
  
  reportsStore.setSelectedCompany(selectedCompany.value)
  await reportsStore.fetchAllDailyReports({
    startDate: start,
    endDate: end
  })
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
    
    loadReports()
})
</script>

<style scoped>
.reports-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding-bottom: 50px;
}

/* Filters */
.filters-bar {
  display: flex;
  align-items: center; /* Changed from flex-end */
  flex-wrap: wrap;
  gap: var(--space-md);
  padding: var(--space-md);
}

.period-tabs-container {
    background: var(--bg-tertiary); padding: 4px; border-radius: var(--radius-lg);
    display: flex; flex-direction: column; justify-content: center;
}

.period-tabs { display: flex; gap: 2px; }

.tab-btn {
    background: transparent; border: none; padding: 6px 14px;
    font-size: 0.85rem; color: var(--text-secondary); cursor: pointer;
    border-radius: var(--radius-md); transition: all 0.2s;
}

.tab-btn.active { background: var(--bg-primary); color: var(--primary); box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-weight: 600; }

.company-badge-static {
    padding: 8px 16px;
    background: var(--primary-50);
    color: var(--primary-700);
    border-radius: var(--radius-md);
    font-weight: 600;
    border: 1px solid var(--primary-100);
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.flex-spacer { flex: 1; }

.filter-group {
  min-width: 150px;
}

.filter-group .form-label {
  font-size: 0.75rem;
  margin-bottom: var(--space-xs);
}

.filter-group .form-input {
  width: 100%;
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--border-color);
}

.card-header h3 {
  margin: 0;
}

.report-count {
  font-size: 0.875rem;
  color: var(--text-tertiary);
}

/* Table Enhancements */
.clickable-row {
  cursor: pointer;
}

.clickable-row:hover {
  background: var(--bg-tertiary);
}

.weather-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 0.875rem;
}

/* Loading & Empty States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  gap: var(--space-sm);
  color: var(--text-tertiary);
}

.empty-icon {
  font-size: 3rem;
}

.empty-hint {
  font-size: 0.875rem;
}


/* Rich Table Styles */
.rich-row {
  border-bottom: 8px solid transparent; /* Spacing between rows */
  background-clip: padding-box;
}

.rich-row td {
  padding: var(--space-lg) var(--space-md);
  vertical-align: top;
}

.rich-row:hover {
  background: var(--bg-tertiary);
  transform: scale(1.002);
}

.day-label {
    display: block;
    font-weight: 700;
    color: var(--primary-600);
    font-size: 0.95rem;
}

.date-sub {
    font-size: 0.75rem;
    color: var(--text-tertiary);
}

.user-info {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.avatar-mini {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-tertiary);
    border-radius: 50%;
    font-size: 0.75rem;
}

.user-name {
    font-weight: 600;
    font-size: 0.875rem;
}

.activity-rich-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.activity-main-text {
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--text-primary);
}

.activity-snippet {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.4;
    margin: 0;
}

.issue-rich-content {
    display: flex;
    flex-direction: column;
}

.issue-snippet {
    font-size: 0.8rem;
    color: var(--error);
    margin: 0;
    font-style: italic;
}

.weather-badge-rich {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--bg-tertiary);
    padding: 6px 12px;
    border-radius: var(--radius-lg);
    min-width: 60px;
}

.weather-icon-lg {
    font-size: 1.25rem;
}

.weather-text-sm {
    font-size: 0.65rem;
    text-transform: uppercase;
    font-weight: 800;
    letter-spacing: 0.05em;
    color: var(--text-tertiary);
}

.notes-preview {
    font-size: 0.85rem;
    color: var(--text-tertiary);
    line-height: 1.4;
    display: block;
}

.badge-outline {
    background: transparent !important;
    border: 1px solid currentColor;
}

.mb-xs { margin-bottom: 4px; }

/* Responsive adjustments */
@media (max-width: 1024px) {
  .col-notes { display: none; }
  .col-weather { display: none; }
}
</style>
