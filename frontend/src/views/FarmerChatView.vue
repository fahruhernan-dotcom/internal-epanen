<template>
  <div class="farmer-chat-view animate-fade-in">
    <div class="chat-page-header mb-lg">
      <span class="section-label">📝 Laporan Harian</span>
      <h2 class="gradient-text">Chat dengan Asisten</h2>
      <p class="text-muted">
        Ceritakan kegiatan harian Anda dengan bahasa biasa. Asisten akan membantu menyusun laporan untuk
        <strong>{{ authStore.user?.companies?.name || 'perusahaan Anda' }}</strong>
      </p>
    </div>

    <!-- Today's Submission Status -->
    <div v-if="todayReport" class="today-status-card card mb-lg">
      <div class="status-icon success">✓</div>
      <div class="status-content">
        <h4>Laporan Hari Ini Sudah Terkirim</h4>
        <p class="text-muted">Laporan terakhir: {{ formatTime(todayReport.created_at) }}</p>
      </div>
      <button @click="showNewChat = true" class="btn btn-secondary">
        + Buat Laporan Tambahan
      </button>
    </div>

    <!-- Main Chat Interface -->
    <div class="chat-container card">
      <FarmerChatInterface
        v-if="showNewChat || !todayReport"
        :on-save="handleSaveReport"
      />

      <!-- Today's Report Summary -->
      <div v-else class="today-summary">
        <div class="summary-header">
          <span class="summary-icon">📋</span>
          <h3>Ringkasan Laporan Hari Ini</h3>
        </div>

        <div class="summary-content">
          <div class="summary-section">
            <span class="section-label">Kegiatan</span>
            <p>{{ getActivitiesSummary(todayReport.activities) }}</p>
          </div>

          <div v-if="todayReport.issues && todayReport.issues.length > 0" class="summary-section">
            <span class="section-label">Masalah / Kendala</span>
            <div class="issues-list">
              <div
                v-for="(issue, index) in todayReport.issues"
                :key="index"
                class="issue-badge"
                :class="`severity-${issue.severity}`"
              >
                <span class="issue-severity">{{ getSeverityLabel(issue.severity) }}</span>
                <span class="issue-notes">{{ issue.notes }}</span>
                <span class="issue-status">{{ issue.status === 'resolved' ? '✓' : '⏳' }}</span>
              </div>
            </div>
          </div>

          <div v-if="todayReport.weather" class="summary-section">
            <span class="section-label">Cuaca</span>
            <p>
              <span class="weather-icon">{{ getWeatherIcon(todayReport.weather) }}</span>
              {{ todayReport.weather }}
            </p>
          </div>

          <div v-if="todayReport.notes" class="summary-section">
            <span class="section-label">Catatan</span>
            <p>{{ todayReport.notes }}</p>
          </div>
        </div>

        <div class="summary-footer">
          <button @click="showNewChat = true" class="btn btn-primary">
            + Tambah Laporan Baru
          </button>
        </div>
      </div>
    </div>

    <!-- Info Cards -->
    <div class="info-cards mt-lg">
      <div class="info-card card">
        <span class="info-icon">💡</span>
        <h4>Tips Mengisi Laporan</h4>
        <ul class="info-list">
          <li>Gunakan bahasa sehari-hari (Indonesia/Jawa)</li>
          <li>Sebutkan kegiatan yang sudah dilakukan</li>
          <li>Lapor jika ada masalah atau kendala</li>
          <li>Sebutkan blok/area jika perlu</li>
        </ul>
      </div>

      <div class="info-card card">
        <span class="info-icon">🗣️</span>
        <h4>Contoh Cara Mengisi</h4>
        <ul class="info-list">
          <li>"Pagi mas, tadi aku nyiram 2x terus tak kasih pupuk NPK"</li>
          <li>"Daune akeh sing kuning, tak pangkas kabeh"</li>
          <li>"Blok A ku semprot hama, aman mas"</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSupabaseReports } from '@/composables/useSupabaseReports'
import FarmerChatInterface from '@/components/FarmerChatInterface.vue'

const authStore = useAuthStore()
const reports = useSupabaseReports()

const todayReport = ref(null)
const showNewChat = ref(false)

async function handleSaveReport(data) {
  const result = await reports.submitDailyReport(data)

  if (result.success) {
    // Refresh today's report
    todayReport.value = await reports.getTodayReport()
    showNewChat.value = false
  }

  return result
}

function getActivitiesSummary(activities) {
  if (!activities) return '-'
  if (typeof activities === 'string') return activities
  if (activities.summary) return activities.summary
  if (activities.details) return activities.details.substring(0, 150) + '...'
  return JSON.stringify(activities)
}

function getSeverityLabel(severity) {
  const labels = {
    low: 'Ringan',
    medium: 'Sedang',
    high: 'Berat'
  }
  return labels[severity] || severity
}

function getWeatherIcon(weather) {
  if (!weather) return '🌡️'
  const w = weather.toLowerCase()
  if (w.includes('hujan') || w.includes('rain')) return '🌧️'
  if (w.includes('mendung') || w.includes('cloud')) return '☁️'
  if (w.includes('cerah') || w.includes('clear')) return '☀️'
  return '🌡️'
}

function formatTime(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  // Check if user already submitted today
  todayReport.value = await reports.getTodayReport()
})
</script>

<style scoped>
.farmer-chat-view {
  max-width: 900px;
  margin: 0 auto;
}

.chat-page-header {
  text-align: center;
}

.section-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-tertiary);
  font-weight: 600;
}

.gradient-text {
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.text-muted {
  color: var(--text-tertiary);
  margin-top: var(--space-sm);
}

/* Today's Status Card */
.today-status-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
  border: 1px solid var(--primary-300);
}

.status-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
}

.status-icon.success {
  background: var(--primary-500);
  color: white;
}

.status-content {
  flex: 1;
}

.status-content h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.status-content p {
  font-size: 0.875rem;
  margin-top: 2px;
}

/* Chat Container */
.chat-container {
  min-height: 600px;
  max-height: 700px;
  display: flex;
  flex-direction: column;
}

/* Today's Summary */
.today-summary {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border-color);
}

.summary-icon {
  font-size: 2rem;
}

.summary-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
}

.summary-content {
  flex: 1;
  padding: var(--space-lg);
  overflow-y: auto;
}

.summary-section {
  margin-bottom: var(--space-lg);
}

.summary-section .section-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-tertiary);
  margin-bottom: var(--space-xs);
  text-transform: uppercase;
}

.summary-section p {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.weather-icon {
  font-size: 1.25rem;
  margin-right: var(--space-xs);
}

/* Issues List */
.issues-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.issue-badge {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.issue-badge.severity-low {
  background: rgba(34, 197, 94, 0.1);
  border-left: 3px solid var(--primary-500);
}

.issue-badge.severity-medium {
  background: rgba(245, 158, 11, 0.1);
  border-left: 3px solid #f59e0b;
}

.issue-badge.severity-high {
  background: rgba(239, 68, 68, 0.1);
  border-left: 3px solid var(--error);
}

.issue-severity {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.issue-badge.severity-low .issue-severity {
  background: var(--primary-500);
  color: white;
}

.issue-badge.severity-medium .issue-severity {
  background: #f59e0b;
  color: white;
}

.issue-badge.severity-high .issue-severity {
  background: var(--error);
  color: white;
}

.issue-notes {
  flex: 1;
}

.issue-status {
  font-size: 1rem;
}

.summary-footer {
  padding: var(--space-lg);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: center;
}

/* Info Cards */
.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-md);
}

.info-card {
  padding: var(--space-md);
}

.info-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: var(--space-sm);
}

.info-card h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: var(--space-sm);
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-list li {
  font-size: 0.875rem;
  color: var(--text-secondary);
  padding-left: var(--space-md);
  margin-bottom: var(--space-xs);
  position: relative;
  line-height: 1.5;
}

.info-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--primary-500);
  font-weight: 700;
}

/* Responsive */
@media (max-width: 768px) {
  .chat-container {
    max-height: 500px;
  }

  .today-status-card {
    flex-direction: column;
    text-align: center;
  }

  .info-cards {
    grid-template-columns: 1fr;
  }
}
</style>
