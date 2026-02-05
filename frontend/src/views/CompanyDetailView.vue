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
import { supabase, COMPANY_TABLES } from '@/services/supabase'

const route = useRoute()

const loading = ref(true)
const company = ref(null)
const reports = ref([])
const stats = ref({ total: 0, today: 0, week: 0 })

const companyId = computed(() => route.params.id)

function getCompanyIcon(code) {
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

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
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
  if (typeof activities === 'string') return truncate(activities, 50)
  if (activities.summary) return truncate(activities.summary, 50)
  return '-'
}

function hasIssues(issues) {
  if (!issues) return false
  if (Array.isArray(issues)) return issues.length > 0
  if (typeof issues === 'object') return Object.keys(issues).length > 0
  return false
}

function getTableConfig() {
  for (const [name, config] of Object.entries(COMPANY_TABLES)) {
    if (config.id === companyId.value) {
      return { name, ...config }
    }
  }
  return null
}

async function loadCompanyData() {
  loading.value = true
  
  try {
    // Get company info
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId.value)
      .single()
    
    if (companyError) throw companyError
    company.value = companyData
    
    // Get table config
    const tableConfig = getTableConfig()
    if (!tableConfig) {
      console.error('No table config found for company')
      return
    }
    
    // Get reports
    const { data: reportsData, error: reportsError } = await supabase
      .from(tableConfig.dailyReports)
      .select('*')
      .order('report_date', { ascending: false })
      .limit(50)
    
    if (!reportsError) {
      reports.value = reportsData || []
    }
    
    // Get stats
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const { count: total } = await supabase
      .from(tableConfig.dailyReports)
      .select('*', { count: 'exact', head: true })
    
    const { count: todayCount } = await supabase
      .from(tableConfig.dailyReports)
      .select('*', { count: 'exact', head: true })
      .eq('report_date', today)
    
    const { count: weekCount } = await supabase
      .from(tableConfig.dailyReports)
      .select('*', { count: 'exact', head: true })
      .gte('report_date', weekAgo)
    
    stats.value = {
      total: total || 0,
      today: todayCount || 0,
      week: weekCount || 0
    }
    
  } catch (err) {
    console.error('Failed to load company data:', err)
  } finally {
    loading.value = false
  }
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
