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
      
      <div class="filter-group">
        <label class="form-label">Dari Tanggal</label>
        <input 
          type="date" 
          v-model="startDate" 
          class="form-input"
          @change="loadReports"
        />
      </div>
      
      <div class="filter-group">
        <label class="form-label">Sampai Tanggal</label>
        <input 
          type="date" 
          v-model="endDate" 
          class="form-input"
          @change="loadReports"
        />
      </div>
      
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
              class="clickable-row"
            >
              <td>
                <strong>{{ formatDate(report.report_date) }}</strong>
              </td>
              <td>
                <span class="badge" :class="getCompanyBadgeClass(report._company)">
                  {{ report._company }}
                </span>
              </td>
              <td>{{ report.user_id || '-' }}</td>
              <td>{{ truncate(getActivitiesSummary(report.activities), 40) }}</td>
              <td>
                <span v-if="hasIssues(report.issues)" class="badge badge-warning">
                  {{ getIssueCount(report.issues) }} masalah
                </span>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <span class="weather-badge">
                  {{ getWeatherIcon(report.weather) }} {{ report.weather || '-' }}
                </span>
              </td>
              <td>{{ truncate(report.notes, 30) || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Report Detail Modal -->
    <div v-if="selectedReport" class="modal-overlay" @click.self="selectedReport = null">
      <div class="modal-content card">
        <div class="modal-header">
          <h3>Detail Laporan</h3>
          <button class="btn-close" @click="selectedReport = null">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="detail-row">
            <span class="detail-label">Tanggal:</span>
            <span class="detail-value">{{ formatDate(selectedReport.report_date) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Perusahaan:</span>
            <span class="detail-value">{{ selectedReport._company }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Pelapor:</span>
            <span class="detail-value">{{ selectedReport.user_id || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Cuaca:</span>
            <span class="detail-value">{{ selectedReport.weather || '-' }}</span>
          </div>
          
          <div class="detail-section">
            <h4>Aktivitas</h4>
            <pre class="detail-json">{{ formatJSON(selectedReport.activities) }}</pre>
          </div>
          
          <div class="detail-section">
            <h4>Masalah</h4>
            <pre class="detail-json">{{ formatJSON(selectedReport.issues) }}</pre>
          </div>
          
          <div class="detail-section">
            <h4>Catatan</h4>
            <p>{{ selectedReport.notes || 'Tidak ada catatan' }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { useAuthStore } from '@/stores/auth'
import { COMPANY_TABLES } from '@/services/supabase'

const reportsStore = useReportsStore()
const authStore = useAuthStore()

const selectedCompany = ref('all')
const startDate = ref('')
const endDate = ref('')
const selectedReport = ref(null)

const companyOptions = computed(() => Object.keys(COMPANY_TABLES))

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function truncate(text, length) {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

function getActivitiesSummary(activities) {
  if (!activities) return '-'
  if (typeof activities === 'string') return activities
  if (activities.summary) return activities.summary
  return JSON.stringify(activities).replace(/[{}"]/g, '').substring(0, 80)
}

function hasIssues(issues) {
  if (!issues) return false
  if (Array.isArray(issues)) return issues.length > 0
  if (typeof issues === 'object') return Object.keys(issues).length > 0
  return false
}

function getIssueCount(issues) {
  if (Array.isArray(issues)) return issues.length
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

async function loadReports() {
  reportsStore.setSelectedCompany(selectedCompany.value)
  await reportsStore.fetchAllDailyReports({
    startDate: startDate.value || undefined,
    endDate: endDate.value || undefined
  })
}

onMounted(() => {
  // Set default date range (last 7 days)
  const today = new Date()
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  endDate.value = today.toISOString().split('T')[0]
  startDate.value = weekAgo.toISOString().split('T')[0]
  
  loadReports()
})
</script>

<style scoped>
.reports-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* Filters */
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-lg);
}

.filter-group {
  flex: 1;
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

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-lg);
}

.modal-content {
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
}

.btn-close {
  background: var(--bg-tertiary);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.btn-close:hover {
  background: var(--error);
  color: white;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.detail-row {
  display: flex;
  gap: var(--space-md);
}

.detail-label {
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 100px;
}

.detail-value {
  color: var(--text-primary);
}

.detail-section {
  margin-top: var(--space-md);
}

.detail-section h4 {
  font-size: 0.875rem;
  margin-bottom: var(--space-sm);
  color: var(--text-secondary);
}

.detail-json {
  background: var(--bg-tertiary);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  font-family: monospace;
  font-size: 0.8rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Responsive */
@media (max-width: 768px) {
  .filters-bar {
    flex-direction: column;
  }
  
  .filter-group {
    width: 100%;
  }
}
</style>
