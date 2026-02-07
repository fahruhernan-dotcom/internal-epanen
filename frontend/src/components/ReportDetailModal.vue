<template>
  <div v-if="report" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content glass-premium animate-slide-up">
      <div class="modal-header">
        <div class="header-info">
          <h3>Detail Laporan</h3>
          <p class="text-tertiary">{{ formatDate(report.report_date) }}</p>
        </div>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </div>
      
      <div class="modal-body">
        <!-- Summary Header -->
        <div class="summary-grid mb-lg">
          <div class="summary-item card">
            <span class="summary-icon">🏢</span>
            <div class="summary-text">
              <span class="label">Perusahaan</span>
              <span class="value">{{ report._company || report.company_name || 'SmartFarm' }}</span>
            </div>
          </div>
          <div class="summary-item card">
            <span class="summary-icon">👤</span>
            <div class="summary-text">
              <span class="label">Pelapor</span>
              <span class="value">{{ report.user_id || '-' }}</span>
            </div>
          </div>
          <div class="summary-item card">
            <span class="summary-icon">{{ getWeatherIcon(report.weather) }}</span>
            <div class="summary-text">
              <span class="label">Cuaca</span>
              <span class="value">{{ report.weather || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- Activities Section -->
        <div class="detail-section card mb-md">
          <div class="section-header">
            <span class="section-icon">📝</span>
            <h4>Aktivitas & Pekerjaan</h4>
          </div>
          
          <div class="activity-content">
            <div v-if="report.activities?.summary" class="activity-main">
              <h5>{{ report.activities.summary }}</h5>
              <p v-if="report.activities.details">{{ report.activities.details }}</p>
            </div>
            <div v-else-if="typeof report.activities === 'string'" class="activity-main">
              <p>{{ report.activities }}</p>
            </div>
            <div v-else class="activity-main">
              <pre class="debug-json">{{ formatJSON(report.activities) }}</pre>
            </div>
          </div>
        </div>
        
        <!-- Issues Section -->
        <div class="detail-section card mb-md" :class="{ 'has-issues': hasIssues(report.issues) }">
          <div class="section-header">
            <span class="section-icon">⚠️</span>
            <h4>Kendala & Masalah</h4>
          </div>
          
          <div class="issues-content">
            <div v-if="hasIssues(report.issues)" class="issues-list">
              <div 
                v-for="(issue, idx) in normalizeIssues(report.issues)" 
                :key="idx"
                class="issue-card"
                :class="issue.severity || 'low'"
              >
                <div class="issue-header">
                  <span class="issue-severity-badge">{{ (issue.severity || 'Normal').toUpperCase() }}</span>
                </div>
                <p class="issue-desc">{{ issue.description || issue.content || issue }}</p>
              </div>
            </div>
            <div v-else class="empty-state-p">
              <span class="text-success">✅ Tidak ada kendala atau hama yang dilaporkan.</span>
            </div>
          </div>
        </div>
        
        <!-- Notes Section -->
        <div class="detail-section card">
          <div class="section-header">
            <span class="section-icon">📒</span>
            <h4>Catatan Tambahan</h4>
          </div>
          <p class="notes-text">{{ report.notes || 'Tidak ada catatan tambahan.' }}</p>
        </div>
      </div>
      
      <div class="modal-footer">
        <div class="flex gap-md w-full">
          <button 
            v-if="canDelete" 
            class="btn btn-outline-danger" 
            :disabled="isDeleting"
            @click="handleDelete"
          >
            {{ isDeleting ? 'Menghapus...' : '🗑️ Hapus Laporan' }}
          </button>
          <button class="btn btn-secondary flex-1" @click="$emit('close')">Tutup</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  report: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const reportsStore = useReportsStore()
const authStore = useAuthStore()
const isDeleting = ref(false)

const canDelete = computed(() => {
  if (!props.report) return false
  if (authStore.user?.role === 'admin' || authStore.user?.role === 'owner') return true
  
  // Check if this is the author
  const identifier = authStore.user?.full_name || authStore.user?.phone_number
  return props.report.user_id === identifier
})

async function handleDelete() {
  if (!props.report) return
  
  if (!confirm('Apakah Anda yakin ingin menghapus laporan ini? Data yang dihapus tidak dapat dikembalikan.')) {
    return
  }
  
  isDeleting.value = true
  try {
    const success = await reportsStore.deleteReport(props.report.id, props.report._company || props.report.company_name)
    if (success) {
      alert('Laporan berhasil dihapus.')
      emit('close')
    } else {
      alert('Gagal menghapus laporan. Silakan coba lagi.')
    }
  } catch (err) {
    console.error('Delete error:', err)
    alert('Terjadi kesalahan saat menghapus laporan.')
  } finally {
    isDeleting.value = false
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

function getWeatherIcon(weather) {
  if (!weather) return '🌡️'
  const w = weather.toLowerCase()
  if (w.includes('rain') || w.includes('hujan')) return '🌧️'
  if (w.includes('cloud') || w.includes('mendung')) return '☁️'
  if (w.includes('hot') || w.includes('panas')) return '☀️'
  if (w.includes('clear') || w.includes('cerah')) return '🌤️'
  return '🌡️'
}

function hasIssues(issues) {
  if (!issues) return false
  if (Array.isArray(issues)) return issues.length > 0
  if (typeof issues === 'object') return Object.keys(issues).length > 0
  return false
}

function normalizeIssues(issues) {
  if (!issues) return []
  if (Array.isArray(issues)) return issues
  if (typeof issues === 'object') {
    if (issues.description || issues.content) return [issues]
    return Object.values(issues)
  }
  return [{ description: String(issues), severity: 'low' }]
}

function formatJSON(data) {
  if (!data) return '-'
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: var(--space-lg);
}

.modal-content {
  max-width: 650px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--border-color);
  box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  overflow: hidden;
}

.modal-header {
  padding: var(--space-lg) var(--space-xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.header-info h3 { margin: 0; font-size: 1.25rem; }
.header-info p { margin: 0; font-size: 0.875rem; color: var(--text-tertiary); }

.btn-close {
  background: var(--bg-tertiary); border: none;
  width: 36px; height: 36px; border-radius: 50%;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}

.btn-close:hover { background: var(--error); color: white; transform: rotate(90deg); }

.modal-body {
  padding: var(--space-xl);
  overflow-y: auto;
  flex: 1;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
}

.summary-icon { font-size: 1.5rem; }
.summary-text { display: flex; flex-direction: column; }
.summary-text .label { font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; }
.summary-text .value { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }

.detail-section {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  background: var(--bg-primary);
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
}

.section-header h4 { margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-secondary); }

.activity-main h5 { font-size: 1.1rem; color: var(--primary-600); margin-bottom: 4px; }
.activity-main p { color: var(--text-primary); line-height: 1.6; margin: 0; }

.issue-card {
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  border-left: 4px solid var(--text-tertiary);
  background: var(--bg-tertiary);
}

.issue-card.high, .issue-card.critical { border-left-color: var(--error); background: rgba(239, 68, 68, 0.05); }
.issue-card.medium, .issue-card.warning { border-left-color: var(--warning); background: rgba(234, 179, 8, 0.05); }
.issue-card.low { border-left-color: var(--success); background: rgba(34, 197, 94, 0.05); }

.issue-severity-badge {
  font-size: 0.65rem; font-weight: 800; padding: 2px 6px; border-radius: 4px;
  background: var(--bg-primary); margin-bottom: 8px; display: inline-block;
}

.high .issue-severity-badge { color: var(--error); }
.medium .issue-severity-badge { color: var(--warning); }
.low .issue-severity-badge { color: var(--success); }

.btn-outline-danger {
  background: transparent;
  border: 1px solid var(--error);
  color: var(--error);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-outline-danger:hover:not(:disabled) {
  background: var(--error);
  color: white;
}

.btn-outline-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-footer {
  padding: var(--space-lg) var(--space-xl);
  border-top: 1px solid var(--border-color);
  background: var(--bg-tertiary);
}

.animate-slide-up {
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 640px) {
  .summary-grid { grid-template-columns: 1fr; }
  .modal-content { max-height: 100vh; border-radius: 0; }
}
</style>
