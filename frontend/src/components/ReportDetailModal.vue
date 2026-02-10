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
            <span class="summary-icon">
              <AppIcon name="building-2" :size="24" />
            </span>
            <div class="summary-text">
              <span class="label">Perusahaan</span>
              <span class="value">{{ report._company || report.company_name || 'SmartFarm' }}</span>
            </div>
          </div>
          <div class="summary-item card">
            <span class="summary-icon">
              <AppIcon name="user" :size="24" />
            </span>
            <div class="summary-text">
              <span class="label">Pelapor</span>
              <span class="value">{{ report.user_id || '-' }}</span>
            </div>
          </div>
          <div class="summary-item card">
            <span class="summary-icon">
              <AppIcon :name="getWeatherIconName(report.weather)" :size="24" />
            </span>
            <div class="summary-text">
              <span class="label">Cuaca</span>
              <span class="value">{{ report.weather || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- Activities Section -->
        <div class="detail-section card mb-md">
          <div class="section-header">
            <span class="section-icon">
              <AppIcon name="file-text" :size="20" />
            </span>
            <h4>Aktivitas & Pekerjaan</h4>
          </div>
          
          <div class="activity-content">
            <div v-if="normalizeActivities(report.activities)?.summary" class="activity-main">
              <h5>{{ normalizeActivities(report.activities).summary }}</h5>
              <p v-if="normalizeActivities(report.activities).details">{{ normalizeActivities(report.activities).details }}</p>
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
            <span class="section-icon">
              <AppIcon name="alert-triangle" :size="20" />
            </span>
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
                <p class="issue-desc">{{ issue.description || issue.content || issue.notes || issue }}</p>
              </div>
            </div>
            <div v-else class="empty-state-p">
              <span class="text-success">
                <AppIcon name="check-circle" :size="16" />
                <span class="ml-sm">Tidak ada kendala atau hama yang dilaporkan.</span>
              </span>
            </div>
          </div>
        </div>
        
        <!-- Notes Section -->
        <div class="detail-section card">
          <div class="section-header">
            <span class="section-icon">
              <AppIcon name="book" :size="20" />
            </span>
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
            aria-label="Delete report"
          >
            {{ isDeleting ? 'Menghapus...' : '' }}
            <AppIcon v-if="!isDeleting" name="trash-2" :size="16" />
            <span class="ml-sm">{{ isDeleting ? '' : 'Hapus Laporan' }}</span>
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
import AppIcon from '@/components/AppIcon.vue'

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

function getWeatherIconName(weather) {
  if (!weather) return 'thermometer'
  const w = weather.toLowerCase()
  if (w.includes('rain') || w.includes('hujan')) return 'cloud-rain'
  if (w.includes('cloud') || w.includes('mendung')) return 'cloud'
  if (w.includes('hot') || w.includes('panas')) return 'sun'
  if (w.includes('clear') || w.includes('cerah')) return 'cloud-sun'
  return 'thermometer'
}

function normalizeActivities(activities) {
  if (!activities) return null
  if (typeof activities === 'object') return activities
  
  if (typeof activities === 'string' && activities.trim().startsWith('{')) {
    try {
      return JSON.parse(activities)
    } catch (e) {
      return null
    }
  }
  return null
}

function hasIssues(issues) {
  if (!issues) return false
  if (Array.isArray(issues)) return issues.length > 0
  if (typeof issues === 'object') return Object.keys(issues).length > 0
  return false
}

function normalizeIssues(issues) {
  if (!issues) return []
  
  // 1. Handle String (JSON or Plain Text)
  if (typeof issues === 'string') {
    const trimmed = issues.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(issues)
        return normalizeIssues(parsed) // Recursively normalize
      } catch (e) {
        // Not valid JSON, treat as plain text
        return [{ description: issues, severity: 'low' }]
      }
    }
    return [{ description: issues, severity: 'low' }]
  }

  // 2. Handle Array
  if (Array.isArray(issues)) {
    return issues.map(i => {
      if (typeof i === 'string') return { description: i, severity: 'low' }
      return {
        description: i.description || i.content || i.notes || JSON.stringify(i),
        severity: (i.severity || 'low').toLowerCase(),
        status: (i.status || 'ongoing').toLowerCase()
      }
    })
  }

  // 3. Handle Object
  if (typeof issues === 'object') {
    // Check if it's a single issue object
    const desc = issues.description || issues.content || issues.notes
    if (desc) {
      return [{
        description: desc,
        severity: (issues.severity || 'low').toLowerCase(),
        status: (issues.status || 'ongoing').toLowerCase()
      }]
    }
    // Fallback: try to use values if it's a map of issues
    return Object.values(issues).flatMap(v => normalizeIssues(v))
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
  background: rgba(0, 0, 0, 0.6); /* Darker dim for focus */
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.modal-content {
  max-width: 600px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  
  /* Premium Glass Effect */
  background: rgba(var(--bg-card-rgb), 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  
  border-radius: 24px; /* Smooth large radius */
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.5), /* Deep shadow */
    0 0 0 1px rgba(255, 255, 255, 0.05) inset; /* Inner bezel */
    
  overflow: hidden;
  transform: translateZ(0); /* Hardware accel */
}

/* Header */
.modal-header {
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  background: rgba(var(--bg-card-rgb), 0.3);
}

.dark-mode .modal-header {
  border-color: rgba(255,255,255,0.05);
}

.header-info h3 { 
  margin: 0; 
  font-size: 1.5rem; 
  font-weight: 800; 
  color: var(--text-main);
  letter-spacing: -0.02em;
}

.header-info p { 
  margin: 4px 0 0; 
  font-size: 0.9rem; 
  font-weight: 500;
  color: var(--text-muted); 
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-close {
  background: rgba(var(--text-main-rgb), 0.05);
  border: 1px solid transparent;
  color: var(--text-muted);
  width: 32px; 
  height: 32px; 
  border-radius: 12px;
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  font-size: 1.2rem;
  line-height: 1;
}

.btn-close:hover { 
  background: rgba(239, 68, 68, 0.1); 
  color: #ef4444; 
  transform: rotate(90deg) scale(1.1);
}

/* Body */
.modal-body {
  padding: 24px 28px;
  overflow-y: auto;
  flex: 1;
  
  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--text-main-rgb), 0.2) transparent;
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}
.modal-body::-webkit-scrollbar-track {
  background: transparent;
}
.modal-body::-webkit-scrollbar-thumb {
  background-color: rgba(var(--text-main-rgb), 0.2);
  border-radius: 10px;
}

/* Summary Cards */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 16px;
  
  background: rgba(var(--text-main-rgb), 0.03);
  border: 1px solid rgba(var(--text-main-rgb), 0.05);
  border-radius: 16px; /* Smooth rounded */
  transition: all 0.2s;
}

.summary-item:hover {
  background: rgba(var(--text-main-rgb), 0.05);
  transform: translateY(-2px);
}

.summary-icon { 
  color: var(--color-primary);
  background: rgba(16, 185, 129, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.summary-text { display: flex; flex-direction: column; }
.summary-text .label { font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 2px;}
.summary-text .value { font-size: 0.95rem; font-weight: 700; color: var(--text-main); line-height: 1.2; }

/* Detail Sections */
.detail-section {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(var(--bg-card-rgb), 0.4);
  border: 1px solid rgba(var(--glass-border), 0.5);
  border-radius: 20px;
  margin-bottom: 16px;
}

.detail-section:last-child { margin-bottom: 0; }

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.section-icon {
  color: var(--text-muted);
  opacity: 0.7;
}

.section-header h4 { margin: 0; font-size: 0.9rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

.activity-main h5 { 
  font-size: 1.1rem; 
  font-weight: 700;
  color: var(--color-primary); 
  margin: 0 0 8px 0; 
}
.activity-main p { 
  color: var(--text-main); 
  line-height: 1.6; 
  margin: 0; 
  font-size: 0.95rem;
}

/* Issues */
.has-issues .detail-section {
  border-color: rgba(239, 68, 68, 0.2);
  background: rgba(239, 68, 68, 0.02);
}

.issue-card {
  padding: 16px;
  border-radius: 14px;
  border-left: 4px solid var(--text-dim);
  background: rgba(var(--bg-card-rgb), 0.6);
  border: 1px solid rgba(var(--glass-border), 0.5);
  border-left-width: 4px;
}

.issue-card.high, .issue-card.critical { border-left-color: #ef4444; background: rgba(239, 68, 68, 0.05); }
.issue-card.medium, .issue-card.warning { border-left-color: #f59e0b; background: rgba(245, 158, 11, 0.05); }
.issue-card.low { border-left-color: #10b981; background: rgba(16, 185, 129, 0.05); }

.issue-severity-badge {
  font-size: 0.6rem; font-weight: 800; padding: 4px 8px; border-radius: 6px;
  background: var(--bg-main); margin-bottom: 8px; display: inline-block;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.high .issue-severity-badge { color: #ef4444; }
.medium .issue-severity-badge { color: #f59e0b; }
.low .issue-severity-badge { color: #10b981; }

.issue-desc {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-main);
    line-height: 1.5;
    margin: 0;
}

/* Footer */
.modal-footer {
  padding: 20px 28px;
  border-top: 1px solid rgba(0,0,0,0.05);
  background: rgba(var(--bg-card-rgb), 0.2);
}

.dark-mode .modal-footer {
    border-color: rgba(255,255,255,0.05);
}

.btn {
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  border: none;
}

.btn-secondary {
  background: rgba(var(--text-main-rgb), 0.05);
  color: var(--text-main);
}
.btn-secondary:hover {
  background: rgba(var(--text-main-rgb), 0.1);
}

.btn-outline-danger {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-outline-danger:hover:not(:disabled) {
  background: #ef4444;
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* Animations */
.animate-slide-up {
  animation: modalPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalPop {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@media (max-width: 640px) {
  .summary-grid { grid-template-columns: 1fr 1fr; }
  .summary-item:nth-child(3) { grid-column: span 2; }
  .modal-content { max-height: 95vh; margin: 16px; border-radius: 20px; }
  .modal-header, .modal-body, .modal-footer { padding: 20px; }
}

.ml-sm { margin-left: 8px; }
.text-success { color: var(--color-primary); display: flex; align-items: center; font-weight: 500;}
</style>
