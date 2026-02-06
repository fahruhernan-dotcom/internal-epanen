<template>
  <div class="company-detail animate-fade-in">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>Memuat data perusahaan...</span>
    </div>

    <template v-else-if="company">
      <!-- Company Header -->
      <div class="company-header card">
        <div class="header-left">
          <span class="company-icon">{{ getCompanyIcon(company.code) }}</span>
          <div class="company-info">
            <h2>{{ company.name }}</h2>
            <span class="company-code">{{ company.code }}</span>
          </div>
        </div>
        <div class="header-right">
          <span class="badge badge-success" v-if="company.is_active">Aktif</span>
          <span class="badge badge-error" v-else>Tidak Aktif</span>
        </div>
      </div>

      <!-- AI Profile Summary -->
      <div v-if="aiSummary || aiLoading" class="card ai-summary-card mb-lg">
        <div class="card-header">
          <div class="flex items-center gap-2">
            <h3>🤖 Profil & Analisis Operasional</h3>
            <span class="badge badge-info">AI Insight</span>
          </div>
          <div class="flex items-center gap-2">
            <button v-if="canModify && getSubmissionUrl()" @click="openUploadForm" class="btn-icon" title="Upload Dokumen Baru">
                📂
            </button>
            <button @click="refreshAISummary" class="btn-icon" title="Analisis Ulang (Refresh)">
                🔄
            </button>
          </div>
        </div>
        
        <div v-if="aiLoading" class="p-md flex justify-center flex-col items-center">
            <div class="spinner-sm mb-sm"></div> 
            <span class="text-muted text-sm">Sedang menganalisis dokumen (Identifikasi Struktur & Aset)...</span>
        </div>
        <div v-else class="markdown-content" v-html="renderMarkdown(aiSummary)"></div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="mini-stat card">
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">Total Laporan</span>
        </div>
        <div class="mini-stat card">
          <span class="stat-value">{{ stats.today }}</span>
          <span class="stat-label">Hari Ini</span>
        </div>
        <div class="mini-stat card">
          <span class="stat-value">{{ stats.week }}</span>
          <span class="stat-label">Minggu Ini</span>
        </div>
        <div class="mini-stat card">
          <span class="stat-value">{{ reports.length }}</span>
          <span class="stat-label">Ditampilkan</span>
        </div>
      </div>

      <!-- Reports Table -->
      <div class="card">
        <div class="card-header">
          <h3>Laporan Harian {{ company.name }}</h3>
        </div>
        
        <div v-if="reports.length === 0" class="empty-state">
          <span class="empty-icon">📭</span>
          <p>Belum ada laporan untuk perusahaan ini</p>
        </div>
        
        <div v-else class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Pelapor</th>
                <th>Aktivitas</th>
                <th>Masalah</th>
                <th>Cuaca</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="report in reports" :key="report.id">
                <td><strong>{{ formatDate(report.report_date) }}</strong></td>
                <td>{{ report.user_id || '-' }}</td>
                <td>{{ getActivitiesSummary(report.activities) }}</td>
                <td>
                  <span v-if="hasIssues(report.issues)" class="badge badge-warning">
                    Ada Masalah
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td>{{ report.weather || '-' }}</td>
                <td>{{ truncate(report.notes, 30) || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <div v-else class="empty-state">
      <span class="empty-icon">❓</span>
      <p>Perusahaan tidak ditemukan</p>
      <router-link to="/" class="btn btn-primary">Kembali ke Dashboard</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { supabase, COMPANY_TABLES, VIEWS } from '@/services/supabase'
import { aiService } from '@/services/ai'

import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

// State
const loading = ref(true)
const aiLoading = ref(false)
const company = ref(null)
const reports = ref([])
const generalDocs = ref([])
const aiSummary = ref('')
const stats = ref({ total: 0, today: 0, week: 0 })

const companyId = computed(() => route.params.id)
const canModify = computed(() => authStore.user && (authStore.isAdmin || authStore.isOwner))

// Helpers defined as const to ensure order and scope 
const getCompanyIcon = (code) => {
  const icons = {
    'Lyori': '🌾',
    'moafarm': '🌱',
    'Kaja': '🥬',
    'EP': '🍏',
    'ePanen': '🍏',
    'ML': '🍈',
    'Melon': '🍈',
    'Owner': '🏢'
  }
  return icons[code] || '🏭'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const truncate = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const getActivitiesSummary = (activities) => {
  if (!activities) return '-'
  if (typeof activities === 'string') return truncate(activities, 50)
  if (activities.summary) return truncate(activities.summary, 50)
  return '-'
}

const hasIssues = (issues) => {
  if (!issues) return false
  if (Array.isArray(issues)) return issues.length > 0
  if (typeof issues === 'object') return Object.keys(issues).length > 0
  return false
}

const renderMarkdown = (text) => {
  if (!text) return ''
  // Simple regex replacement for basic Markdown
  let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^(#+) (.*$)/gm, (match, level, content) => {
          const size = Math.min(6, level.length + 2) // H3 default mapping
          return `<h${size}>${content}</h${size}>`
      })
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      .replace(/- \[(.*?)\]/g, '• $1')
      .replace(/- (.*$)/gm, '• $1')
  
  return html
}

const getTableConfig = () => {
  for (const [name, config] of Object.entries(COMPANY_TABLES)) {
    if (config.id === companyId.value) {
      return { name, ...config }
    }
  }
  return null
}

const loadAISummary = async (companyData, force = false) => {
    aiLoading.value = true
    try {
        // Fetch docs
        const { data: docs } = await supabase
          .from(VIEWS.ALL_GENERAL_DOCS)
          .select('*')
          .ilike('company_name', `%${companyData.name}%`)
          .limit(100)
        
        generalDocs.value = docs || []
        
        // Call AI
        aiSummary.value = await aiService.summarizeCompanyProfile(
            generalDocs.value, 
            companyData.id, 
            companyData.name,
            force // Pass forceRefresh param
        )
    } catch (err) {
        console.error('AI Summary failed:', err)
    } finally {
        aiLoading.value = false
    }
}

const refreshAISummary = () => {
    if (company.value) {
        loadAISummary(company.value, true) // Force refresh
    }
}

const loadCompanyData = async () => {
  loading.value = true
  aiSummary.value = '' 
  
  try {
    // 1. Get company info
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId.value)
      .single()
    
    if (companyError) throw companyError
    company.value = companyData

    // 2. Get table config & reports (Critical Data)
    // 2. Get table config & reports (Critical Data)
    const tableConfig = getTableConfig()
    if (tableConfig) {
        try {
            // Get reports
            const { data: reportsData, error: reportsErr } = await supabase
              .from(tableConfig.dailyReports)
              .select('*')
              .order('report_date', { ascending: false })
              .limit(50)
            
            if (reportsErr) {
                console.warn(`Reports table ${tableConfig.dailyReports} query issue:`, reportsErr.message)
            } else {
                reports.value = reportsData || []
            }
            
            // Get stats
            const today = new Date().toISOString().split('T')[0]
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            
            try {
                const { count: total } = await supabase.from(tableConfig.dailyReports).select('*', { count: 'exact', head: true })
                const { count: todayCount } = await supabase.from(tableConfig.dailyReports).select('*', { count: 'exact', head: true }).eq('report_date', today)
                const { count: weekCount } = await supabase.from(tableConfig.dailyReports).select('*', { count: 'exact', head: true }).gte('report_date', weekAgo)
                
                stats.value = { total: total || 0, today: todayCount || 0, week: weekCount || 0 }
            } catch (statErr) {
                console.warn('Stat fetching failed:', statErr.message)
            }
        } catch (tableErr) {
            console.error('Unexpected error accessing reports table:', tableErr)
        }
    }
  } catch (err) {
    console.error('Failed to load company data:', err)
  } finally {
    // Reveal page immediately
    loading.value = false
  }

  // 3. Load AI Summary in background (Non-blocking)
  if (company.value) {
      loadAISummary(company.value)
  }
}

const DOC_FORMS = {
    'Lyori': 'https://n8n-wrw2bveswawm.cica.sumopod.my.id/form/d0a6df0b-84ff-48e7-9eec-914cda1580f1',
    'moafarm': 'https://n8n-wrw2bveswawm.cica.sumopod.my.id/form/7347fab7-4ffe-4b82-b81d-db4521338ae1',
    'Kaja': 'https://n8n-wrw2bveswawm.cica.sumopod.my.id/form/c1ece8ff-c967-4845-a85a-c8b4a83ac896'
}

const getSubmissionUrl = () => {
    if (!company.value) return null
    // Try matching by name parts since exact names might vary
    const name = company.value.name
    if (name.includes('Lyori')) return DOC_FORMS['Lyori']
    if (name.toLowerCase().includes('moafarm')) return DOC_FORMS['moafarm']
    if (name.includes('Kaja')) return DOC_FORMS['Kaja']
    return null
}

const openUploadForm = () => {
    const url = getSubmissionUrl()
    if (url) window.open(url, '_blank')
}

watch(companyId, () => {
  loadCompanyData()
})

onMounted(() => {
  loadCompanyData()
})
</script>

<style scoped>
.company-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* Company Header */
.company-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.company-icon {
  font-size: 3rem;
}

.company-info h2 {
  margin: 0;
  margin-bottom: var(--space-xs);
}

.company-code {
  font-size: 0.875rem;
  color: var(--text-tertiary);
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
}

.mini-stat {
  text-align: center;
  padding: var(--space-lg);
}

.mini-stat .stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-600);
}

.mini-stat .stat-label {
  font-size: 0.75rem;
  color: var(--text-tertiary);
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

/* Loading & Empty States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  gap: var(--space-md);
  color: var(--text-tertiary);
}

.empty-icon {
  font-size: 3rem;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
