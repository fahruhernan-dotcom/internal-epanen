<template>
  <div class="dashboard">
    <!-- Welcome Header -->
    <header class="dashboard-header mb-lg" v-if="authStore.user">
      <span class="section-label">Overview Operasional</span>
      <h2 class="gradient-text">Selamat Datang, {{ authStore.userName }}</h2>
      <p class="text-muted">Berikut adalah ringkasan performa SmartFarm untuk role <strong>{{ roleLabel }}</strong>.</p>
    </header>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <template v-if="loading">
        <div v-for="i in 4" :key="i" class="stat-card skeleton-card">
          <div class="skeleton-avatar skeleton"></div>
          <div class="stat-content w-full">
            <div class="skeleton-title skeleton"></div>
            <div class="skeleton-text skeleton"></div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="stat-card card-nature glow-success">
          <div class="stat-icon total">📊</div>
          <div class="stat-content">
            <span class="stat-value text-neon-green">{{ stats?.totalReports || 0 }}</span>
            <span class="stat-label">Total Laporan</span>
          </div>
        </div>
        
        <div class="stat-card card-nature">
          <div class="stat-icon today">📅</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats?.todayReports || 0 }}</span>
            <span class="stat-label">Hari Ini</span>
          </div>
        </div>
        
        <div class="stat-card card-nature">
          <div class="stat-icon week">📈</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats?.weekReports || 0 }}</span>
            <span class="stat-label">Minggu Ini</span>
          </div>
        </div>
        
        <div class="stat-card card-nature glow-info">
          <div class="stat-icon companies">🏢</div>
          <div class="stat-content">
            <span class="stat-value text-neon-blue">{{ stats?.byCompany ? Object.keys(stats.byCompany).length : 0 }}</span>
            <span class="stat-label">Perusahaan</span>
          </div>
        </div>
      </template>
    </div>

    <!-- CEO Quick Actions -->
    <div v-if="authStore.user?.role === 'ceo'" class="mt-lg animate-slide-up">
      <div class="card glass-premium p-lg flex justify-between items-center">
        <div>
          <h3 class="mb-xs">📂 Submit Laporan Keuangan</h3>
          <p class="text-muted text-sm">Upload PDF laporan keuangan untuk analisis AI & Embedding RAG.</p>
        </div>
        <button @click="openUploadForm" class="btn btn-primary">
          ✨ Upload PDF Sekarang
        </button>
      </div>
    </div>

    <!-- AI Executive Summary Widget -->
    <div v-if="authStore.isAdmin || authStore.isOwner" class="mt-lg animate-slide-up">
      <div class="card glass-premium ai-insight-card">
        <div class="card-header border-none">
          <div class="flex items-center gap-sm">
            <span class="ai-pulse"></span>
            <h3>🤖 Strategic Business Intelligence (This Month)</h3>
          </div>
          <button v-if="!aiLoading && !aiSummary" @click="generateAutoInsight" class="btn btn-secondary btn-sm">Generate Analysis</button>
        </div>
        
        <div class="ai-content p-md">
          <div v-if="aiLoading" class="flex flex-col items-center py-lg">
            <div class="spinner mb-sm"></div>
            <p class="text-muted text-sm italic">AI sedang mengenali pola keuangan Anda bulan ini...</p>
          </div>
          <div v-else-if="aiSummary" class="markdown-body" v-html="formattedAISummary"></div>
          <div v-else class="text-center py-md text-muted">
            <p class="text-sm">Klik 'Generate' untuk mendapatkan ringkasan performa otomatis bulan ini.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-xl">
      <div class="flex justify-between items-center mb-md">
        <h3 class="section-title">{{ authStore.isAdmin || authStore.isOwner ? 'Ringkasan Perusahaan' : 'Perusahaan Saya' }}</h3>
        <span v-if="authStore.isAdmin || authStore.isOwner" class="badge badge-info">Master Access Control</span>
      </div>
      
      <div class="companies-grid">
        <template v-if="loading">
          <div v-for="i in 3" :key="i" class="company-card card skeleton-card">
            <div class="company-header">
              <div class="skeleton-avatar skeleton"></div>
              <div class="skeleton-title w-full skeleton"></div>
            </div>
            <div class="skeleton-rect skeleton"></div>
          </div>
        </template>
        <template v-else>
          <div 
            v-for="(data, company) in Object.fromEntries(Object.entries(stats?.byCompany || {}).filter(([k]) => {
              // Hide 'Owner' company from grid
              if (k === 'Owner') return false;
              // If CEO/Farmer, only show their own company
              if (!authStore.isAdmin && !authStore.isOwner) {
                return k === authStore.user?.companies?.name;
              }
              return true;
            }))" 
            :key="company"
            class="company-card card glass-premium"
            :class="{ 'single-company': !authStore.isOwner && !authStore.isAdmin, 'no-click': !authStore.isOwner && !authStore.isAdmin }"
            @click="goToCompany(company)"
          >
            <div class="company-header">
              <span class="company-icon">{{ getCompanyIcon(company) }}</span>
              <h4 class="company-name">{{ company }}</h4>
            </div>
            <div class="company-stats">
              <div class="company-stat">
                <span class="value">{{ data?.total || 0 }}</span>
                <span class="label">Total</span>
              </div>
              <div class="company-stat">
                <span class="value">{{ data?.today || 0 }}</span>
                <span class="label">Hari Ini</span>
              </div>
              <div class="company-stat">
                <span class="value">{{ data?.week || 0 }}</span>
                <span class="label">Minggu Ini</span>
              </div>
            </div>
            <div v-if="authStore.isOwner || authStore.isAdmin" class="company-footer">
              <span class="view-more">Detail Perusahaan →</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Recent Reports -->
    <div class="mt-xl">
      <h3 class="section-title">Aktivitas Terbaru</h3>
      <div class="card glass-premium">
        <div v-if="loading" class="p-md">
          <div v-for="i in 5" :key="i" class="mb-md">
            <div class="skeleton-text skeleton" style="width: 30%"></div>
            <div class="skeleton-text skeleton"></div>
          </div>
        </div>
        
        <div v-else-if="recentReports.length === 0" class="empty-state">
          <span class="empty-icon">📭</span>
          <p>Belum ada aktivitas terekam untuk company Anda.</p>
        </div>
        
        <div v-else class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Perusahaan</th>
                <th>Pelapor</th>
                <th>Aktivitas Utama</th>
                <th>Cuaca</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="report in recentReports" 
                :key="report.id"
                @click="showReportDetail(report)"
                class="clickable-row"
              >
                <td>{{ formatDate(report.report_date) }}</td>
                <td>
                  <span class="badge" :class="getCompanyBadgeClass(report._company)">{{ report._company }}</span>
                </td>
                <td>{{ report.user_id || '-' }}</td>
                <td class="text-secondary">{{ truncate(getActivitiesSummary(report.activities), 60) }}</td>
                <td>
                  <span class="weather-icon">{{ getWeatherIcon(report.weather) }}</span>
                  {{ report.weather || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="card-footer" v-if="!loading && recentReports.length > 0">
          <router-link to="/reports" class="btn btn-secondary">
            Buka Monitoring Lengkap →
          </router-link>
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
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useReportsStore } from '@/stores/reports'
import { useAuthStore } from '@/stores/auth'
import { COMPANY_TABLES, supabase } from '@/services/supabase'
import { aiService } from '@/services/ai'
import { groupChunksToDocuments, parseRefNumber } from '@/utils/financialUtils'

const ReportDetailModal = defineAsyncComponent(() => import('@/components/ReportDetailModal.vue'))

const DOC_FORMS = {
    'Lyori': 'https://n8n-wrw2bveswawm.cica.sumopod.my.id/form/72b3dbbe-34c7-48f0-b7de-f2e7c017d519',
    'moafarm': 'https://n8n-wrw2bveswawm.cica.sumopod.my.id/form/4a20bcf8-ed90-4910-9451-45631fc26fe5',
    'Kaja': 'https://n8n-wrw2bveswawm.cica.sumopod.my.id/form/ea756b54-6155-4de3-be2a-415bb3cd769e'
}

const router = useRouter()
const route = useRoute()
const reportsStore = useReportsStore()
const authStore = useAuthStore()

const loading = ref(true)
const aiLoading = ref(false)
const aiSummary = ref(null)
const stats = ref({
  totalReports: 0,
  todayReports: 0,
  weekReports: 0,
  byCompany: {}
})
const recentReports = ref([])
const selectedReport = ref(null)

const roleLabel = computed(() => {
  const roles = {
    'admin': 'Website Administrator',
    'owner': 'Owner',
    'ceo': 'CEO Perusahaan',
    'farmer': 'Farmer Utama'
  }
  return roles[authStore.user?.role] || 'User'
})

function getCompanyIcon(company) {
  const icons = {
    'Lyori': '🌿',
    'Moafarm': '🐄',
    'Kaja': '🌶️',
    'ePanen': '🍏',
    'Melon': '🍈'
  }
  return icons[company] || '🏢'
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

function getWeatherIcon(weather) {
  if (!weather) return ''
  const w = weather.toLowerCase()
  if (w.includes('rain') || w.includes('hujan')) return '🌧️'
  if (w.includes('cloud') || w.includes('mendung')) return '☁️'
  if (w.includes('hot') || w.includes('panas')) return '☀️'
  if (w.includes('clear') || w.includes('cerah')) return '🌤️'
  return '🌡️'
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
  if (!text) return '-'
  return text.length > length ? text.substring(0, length) + '...' : text
}

function getActivitiesSummary(activities) {
  if (!activities) return '-'
  if (typeof activities === 'string') return activities
  if (activities.summary) return activities.summary
  if (Array.isArray(activities)) return activities.join(', ')
  return JSON.stringify(activities).replace(/[{}"]/g, '')
}

function goToCompany(companyName) {
  if (!authStore.isOwner && !authStore.isAdmin) return
  
  const config = COMPANY_TABLES[companyName]
  if (config) {
    router.push(`/companies/${config.id}`)
  }
}

function showReportDetail(report) {
  selectedReport.value = report
}

function openUploadForm() {
    const userCompany = authStore.user?.companies?.name
    if (!userCompany) return
    
    // Exact match or contains
    let url = DOC_FORMS[userCompany]
    if (!url) {
        if (userCompany.includes('Lyori')) url = DOC_FORMS['Lyori']
        if (userCompany.toLowerCase().includes('moafarm')) url = DOC_FORMS['moafarm']
        if (userCompany.includes('Kaja')) url = DOC_FORMS['Kaja']
    }
    
    if (url) {
        window.open(url, '_blank')
    } else {
        alert('Form upload untuk perusahaan Anda belum tersedia.')
    }
}

async function generateAutoInsight() {
  aiLoading.value = true
  try {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    
    // Fetch some financial data to analyze from all companies
    const allFinanceData = []
    const companies = Object.keys(COMPANY_TABLES).filter(c => c !== 'Owner')
    
        // Use the new VIEW that contains all finance docs with content + metadata
        // Instead of querying COMPANY_TABLES[company].finance individually, let's try the unified view if possible,
        // OR sticking to the loop but using the util to Group.
        
        // For Dashboard, we want 'This Month's' overview.
        // Let's use the unified view 'v_all_finance_docs' directly if we can, but since we are looping companies...
        // Actually, better to query the individual finance tables CORRECTLY or use the unified view.
        // Let's use the unified view for simplicity and accuracy.

    
    // Fetch from Unified View 'v_all_finance_docs'
    let query = supabase
      .from('v_all_finance_docs')
      .select('*')
      .gte('created_at', firstDay)

    // Role-based filtering for AI Insight
    if (!authStore.isAdmin && !authStore.isOwner && authStore.user?.company_id) {
        query = query.eq('company_id', authStore.user.company_id)
    }
      
    const { data: unifiedData } = await query
      
    if (unifiedData) {
        // Apply Smart Grouping to fix "10 chunks vs 1 doc" and extract financial usage
        const groupedDocs = groupChunksToDocuments(unifiedData)
        
        // Filter by Date (metadata.date > firstDay)
        const currentMonthDocs = groupedDocs.filter(d => {
             const dDate = new Date(d.metadata?.date || d.created_at)
             return dDate >= new Date(firstDay)
        })

        // Prepare data for AI (Total Revenue/Expense calculation is now safe here too)
        allFinanceData.push(...currentMonthDocs)
    }

    /* 
    // OLD LOOP REMOVED - it was checking wrong tables or raw chunks without grouping
    for (const company of companies) { ... } 
    */

    if (allFinanceData.length === 0) {
      aiSummary.value = "### 🤖 Insight Belum Tersedia\nBelum ada data keuangan yang cukup untuk bulan ini untuk dianalisis oleh AI."
    } else {
      aiSummary.value = await aiService.summarizeFinancialPeriod(allFinanceData, "Bulan Ini")
    }
  } catch (err) {
    console.error('AI Insight Error:', err)
  } finally {
    aiLoading.value = false
  }
}

const formattedAISummary = computed(() => {
  if (!aiSummary.value) return ''
  return aiSummary.value
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/### (.*?)/g, '<h4>$1</h4>')
})

onMounted(async () => {
  loading.value = true
  
  // Redirect farmers to their specialized mobile dashboard
  if (authStore.user?.role === 'farmer' && route.path === '/') {
    router.push('/submit-daily')
    return
  }

  try {
    stats.value = await reportsStore.getReportStats()
    await reportsStore.fetchAllDailyReports({ limit: 5 })
    recentReports.value = reportsStore.dailyReports.slice(0, 5)
    
    // Auto initiate AI if Admin/Owner
    if (authStore.isAdmin || authStore.isOwner) {
       // We can trigger automatically or wait for first visit
       // For now let's not auto-trigger API calls to save quota, but add it here if desired:
       // generateAutoInsight()
    }
  } catch (err) {
    console.error('Failed to load dashboard data:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-lg);
}

.stat-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  transition: all var(--transition-normal);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-icon.total { background: linear-gradient(135deg, var(--primary-100), var(--primary-200)); }
.stat-icon.today { background: linear-gradient(135deg, #dbeafe, #bfdbfe); }
.stat-icon.week { background: linear-gradient(135deg, #fef3c7, #fde68a); }
.stat-icon.companies { background: linear-gradient(135deg, #e0e7ff, #c7d2fe); }

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-card.skeleton-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  padding: var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  border-radius: var(--radius-lg);
}

.skeleton-card .skeleton-avatar {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  margin-top: var(--space-xs);
}

.p-md { padding: var(--space-md); }
.border-bottom { border-bottom: 1px solid var(--border-color); }

.company-card.no-click {
  cursor: default;
  transform: none !important;
  box-shadow: none !important;
  border-color: var(--border-color) !important;
}

.company-card.single-company {
  max-width: 400px;
}

.company-card.no-click .view-more {
  display: none;
}

/* Section Title */
.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

/* Companies Grid */
.companies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-lg);
}

.company-card {
  cursor: pointer;
  transition: all var(--transition-normal);
}

.company-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-300);
}

.company-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.company-icon {
  font-size: 2rem;
}

.company-name {
  font-size: 1.125rem;
  font-weight: 600;
}

.company-stats {
  display: flex;
  justify-content: space-between;
  padding: var(--space-md) 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.company-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.company-stat .value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-600);
}

.company-stat .label {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.company-footer {
  margin-top: var(--space-md);
  text-align: right;
}

.view-more {
  font-size: 0.875rem;
  color: var(--primary-600);
  font-weight: 500;
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

/* AI Insight Card */
.ai-insight-card {
  border-left: 4px solid var(--primary-500);
}

.ai-pulse {
  width: 10px;
  height: 10px;
  background-color: var(--primary-500);
  border-radius: 50%;
  display: inline-block;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

.markdown-body {
  line-height: 1.6;
  font-size: 0.95rem;
}

.markdown-body h4 {
  margin-top: var(--space-md);
  margin-bottom: var(--space-sm);
  color: var(--primary-700);
}

.ai-content {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}

.empty-icon {
  font-size: 3rem;
}

/* Card Footer */
.card-footer {
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-color);
  text-align: center;
}
</style>
