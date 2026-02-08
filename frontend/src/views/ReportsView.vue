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

.reports-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* Filters */
.filters-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-lg);
  padding: var(--space-xl);
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.period-tabs-container {
  background: var(--bg-main);
  padding: 4px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
}

.period-tabs {
  display: flex;
  gap: 2px;
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 8px 16px;
  font-size: 0.875rem;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.2s ease;
  font-weight: 600;
}

.tab-btn.active {
  background: white;
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.filter-group {
  min-width: 180px;
}

.form-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.form-input {
  background: var(--bg-main);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.9375rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  border-color: var(--color-primary);
  background: white;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
}

/* Table Card */
.reports-card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xl);
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.card-header h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
}

.report-count {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-primary);
  background: rgba(16, 185, 129, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
}

/* Table Styles */
.table th {
  background: var(--bg-main);
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  padding: var(--space-lg);
  text-align: left;
}

.table td {
  padding: var(--space-lg);
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  vertical-align: middle;
}

.clickable-row:hover {
  background: rgba(16, 185, 129, 0.02);
}

.day-label {
  font-weight: 800;
  color: var(--text-main);
  font-size: 1rem;
}

.date-sub {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.badge-outline {
  border: 1.5px solid currentColor;
  background: transparent !important;
  font-weight: 700;
  padding: 4px 10px;
}

.user-name {
  font-weight: 700;
  color: var(--text-main);
}

.activity-main-text {
  font-weight: 700;
  color: var(--text-main);
  display: block;
}

.activity-snippet {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.weather-badge-rich {
  background: var(--bg-main);
  padding: 8px 12px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.weather-icon-lg {
  font-size: 1.25rem;
}

.weather-text-sm {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
}

