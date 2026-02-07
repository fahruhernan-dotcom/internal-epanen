<template>
  <div class="history-list">
    <div class="card header-card mb-md">
      <h2>Riwayat Laporan</h2>
      <p class="subtitle">Aktivitas yang telah Anda laporkan</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Memuat riwayat...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="reports.length === 0" class="empty-state">
      <span class="empty-icon">📝</span>
      <p>Belum ada laporan yang dikirim.</p>
    </div>

    <!-- Report List -->
    <div v-else class="reports-container">
      <div 
        v-for="report in reports" 
        :key="report.id" 
        class="report-card card animate-slide-up"
        @click="showReportDetail(report)"
      >
        
        <!-- Header: Date & Weather -->
        <div class="report-header">
          <div class="date-badge">
            <span class="day">{{ getDay(report.report_date) }}</span>
            <span class="month">{{ getMonth(report.report_date) }}</span>
          </div>
          <div v-if="report.weather" class="weather-badge">
            {{ getWeatherIcon(report.weather) }} {{ report.weather }}
          </div>
        </div>

        <!-- Content -->
        <div class="report-body">
          <h4 class="activity-summary">{{ getSummary(report) }}</h4>
          
          <!-- Issues Preview -->
          <div v-if="report.issues && report.issues.length > 0" class="issues-preview">
            <span class="issue-tag" :class="getSeverityClass(report.issues[0].severity)">
              ⚠️ {{ report.issues.length }} Masalah dilaporkan
            </span>
          </div>
        </div>

        <!-- Footer -->
        <div class="report-footer">
          <span class="time-ago">{{ formatDate(report.created_at) }}</span>
          <span class="status-indicator">Terkirim ✅</span>
        </div>
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
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useReportsStore } from '@/stores/reports'

const ReportDetailModal = defineAsyncComponent(() => import('@/components/ReportDetailModal.vue'))

const reportsStore = useReportsStore()
const { reportHistory: reports, loading } = storeToRefs(reportsStore)
const selectedReport = ref(null)

onMounted(async () => {
  await reportsStore.fetchReportHistory(20)
})

// Helpers
function getDay(dateStr) { return new Date(dateStr).getDate() }
function getMonth(dateStr) { return new Date(dateStr).toLocaleDateString('id-ID', { month: 'short' }) }
function formatDate(isoStr) { return new Date(isoStr).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) }

function getWeatherIcon(w) {
  const map = { 'cerah': '☀️', 'berawan': '☁️', 'hujan': '🌧️', 'badai': '⚡' }
  return map[w] || '🌡️'
}

function getSummary(r) {
  if (r.activities && typeof r.activities === 'object') return r.activities.summary || 'Tidak ada ringkasan'
  return r.activities || 'Laporan Harian' 
}

function getSeverityClass(sev) {
  if (sev === 'high') return 'critical'
  if (sev === 'medium') return 'warning'
  return 'low'
}

function showReportDetail(report) {
  selectedReport.value = {
    ...report,
    _company: report.company_name // Ensure consistent property name for modal
  }
}
</script>

<style scoped>
.history-list { padding-bottom: 80px; }

.header-card {
  background: linear-gradient(135deg, var(--primary), var(--primary-600));
  color: white; padding: var(--space-lg);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  margin: -1rem -1rem var(--space-md) -1rem;
}
.subtitle { opacity: 0.9; font-size: 0.9rem; }

.report-card { 
  margin-bottom: var(--space-md); 
  padding: var(--space-md); 
  border-left: 4px solid var(--primary); 
  cursor: pointer;
  transition: transform 0.2s;
}
.report-card:active { transform: scale(0.98); }

.report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-sm); }

.date-badge {
  display: flex; flex-direction: column; align-items: center;
  background: var(--bg-tertiary); padding: 4px 10px; border-radius: var(--radius-md);
  min-width: 50px;
}
.day { font-size: 1.2rem; font-weight: 800; line-height: 1; color: var(--text-primary); }
.month { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-tertiary); }

.weather-badge { font-size: 0.8rem; background: var(--bg-tertiary); padding: 2px 8px; border-radius: 12px; }

.activity-summary { font-size: 1rem; font-weight: 600; margin-bottom: var(--space-xs); color: var(--text-primary); }

.issues-preview { margin-top: 8px; }
.issue-tag { font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; display: inline-block; font-weight: 600; }
.issue-tag.critical { background: rgba(239,68,68,0.1); color: var(--error); }
.issue-tag.warning { background: rgba(234,179,8,0.1); color: var(--warning); }
.issue-tag.low { background: rgba(34,197,94,0.1); color: var(--success); }

.report-footer { display: flex; justify-content: space-between; margin-top: var(--space-md); font-size: 0.75rem; color: var(--text-tertiary); border-top: 1px solid var(--border-color); padding-top: 8px; }

.loading-container, .empty-state { text-align: center; padding: 3rem; color: var(--text-tertiary); }
.empty-icon { font-size: 3rem; display: block; margin-bottom: 10px; }
</style>
