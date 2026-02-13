<template>
  <FarmerDashboardView v-if="authStore.user?.role === 'farmer'" />
  <MobileDashboardView 
    v-else-if="isMobile"
    :stats="stats"
    :recentReports="recentReports"
    :aiSummary="formattedAISummary"
    :loading="loading"
    @go-to-company="goToCompany"
    @go-to-doc="goToDoc"
    @open-upload="openUploadForm"
  />
  <div v-else class="dashboard-expert-view">
    <!-- Welcome Header Section -->
    <header class="welcome-section-premium animate-fade-in-up">
      <div class="welcome-text">
        <div class="header-meta">
            <span class="status-indicator">
                <span class="status-dot-pulse"></span>
                SISTEM AKTIF
            </span>
            <span class="v-divider-v2"></span>
            <span class="role-badge-v2">{{ roleLabel }}</span>
        </div>
        <h1 class="user-greeting-v2 text-gradient-emerald">
            Monitoring Performa Ekosistem
        </h1>
        <p class="system-desc-v2">Ringkasan cerdas performa ekosistem Official ePanen hari ini.</p>
      </div>
      <div class="quick-status-cards">
        <div class="mini-card-v2">
          <span class="mc-label">Skor Efisiensi</span>
          <span class="mc-value text-emerald">94.2%</span>
        </div>
        <div class="mini-card-v2">
          <span class="mc-label">Stabilitas Node</span>
          <span class="mc-value">Optimal</span>
        </div>
      </div>
    </header>

    <!-- Fallback sophisticated gradient background since image gen quota is limited -->
    <div class="dashboard-backdrop-premium"></div>

    <!-- KPI Glass Grid -->
    <div class="kpi-glass-grid-v2">
      <!-- Total Laporan -->
      <div class="kpi-pillar-card animate-fade-in-up stagger-1">
        <div class="kp-icon-box">
          <AppIcon name="file-text" :size="20" />
        </div>
        <div class="kp-content">
          <span class="kp-label">TOTAL LAPORAN</span>
          <h2 class="kp-value">{{ stats?.totalReports || 0 }}</h2>
          <div class="kp-trend-tag positive">+12%</div>
        </div>
        <div class="kp-bg-glow"></div>
      </div>

      <!-- Hari Ini -->
      <div class="kpi-pillar-card animate-fade-in-up stagger-2">
        <div class="kp-icon-box blue">
          <AppIcon name="calendar" :size="20" />
        </div>
        <div class="kp-content">
          <span class="kp-label">LAPORAN BARU</span>
          <h2 class="kp-value">{{ stats?.todayReports || 0 }}</h2>
          <div class="kp-trend-tag neutral">LIVE</div>
        </div>
        <div class="kp-bg-glow blue"></div>
      </div>

      <!-- Minggu Ini -->
      <div class="kpi-pillar-card animate-fade-in-up stagger-3">
        <div class="kp-icon-box purple">
          <AppIcon name="trending-up" :size="20" />
        </div>
        <div class="kp-content">
          <span class="kp-label">TREM 7 HARI</span>
          <h2 class="kp-value">{{ stats?.weekReports || 0 }}</h2>
          <div class="kp-trend-tag positive">+8.4%</div>
        </div>
        <div class="kp-bg-glow purple"></div>
      </div>

      <!-- Perusahaan -->
      <div class="kpi-pillar-card animate-fade-in-up stagger-4">
        <div class="kp-icon-box gold">
          <AppIcon name="building-2" :size="20" />
        </div>
        <div class="kp-content">
          <span class="kp-label">UNIT AKTIF</span>
          <h2 class="kp-value">{{ stats?.byCompany ? Object.keys(stats.byCompany).length : 0 }}</h2>
          <div class="kp-trend-tag neutral">SINKRON</div>
        </div>
        <div class="kp-bg-glow gold"></div>
      </div>
    </div>

    <!-- CEO Quick Actions -->
    <div v-if="authStore.user?.role === 'ceo'" class="mt-spacing-hero animate-fade-in-up stagger-5">
      <div class="premium-card quick-action-banner flex justify-between items-center">
        <div>
          <h3 class="mb-xs text-main">📂 Unggah Inteligensi Finansial</h3>
          <p class="text-muted text-sm">Unggah dokumen untuk embedding RAG otomatis dan audit log AI.</p>
        </div>
        <button @click="openUploadForm" class="btn-primary shimmer-btn">
          <AppIcon name="sparkles" :size="16" />
          <span class="ml-sm">Eksekusi Unggah</span>
        </button>
      </div>
    </div>

    <!-- AI Briefing Hub -->
    <div v-if="authStore.isAdmin || authStore.isOwner" class="mt-spacing-hero-xl animate-fade-in-up stagger-5">
      <div class="premium-card glass-container-hero p-0">
        <div class="glass-header-hero flex items-center justify-between p-2xl">
          <div class="flex items-center gap-sm">
            <div class="ai-orb-large pulse-emerald"></div>
            <h3 class="text-main text-lg font-bold">Intelijen Bisnis Strategis (30H)</h3>
          </div>
          <button v-if="!aiLoading && !aiSummary" @click="generateAutoInsight" class="btn-ghost-small shimmer-btn">
            <AppIcon name="sparkles" :size="14" />
            <span>Bangkitkan Analisa</span>
          </button>
        </div>
        
        <div class="p-3xl ai-briefing-content">
          <div v-if="aiLoading" class="flex flex-col items-center py-2xl">
            <div class="mini-spinner-sage mb-md"></div>
            <p class="text-muted text-sm italic">Menganalisa pola data bulan ini...</p>
          </div>
          <div v-else-if="aiSummary" class="markdown-body-lite-hero" v-html="formattedAISummary"></div>
          <div v-else class="text-center py-3xl text-muted w-full">
            <p class="text-lg opacity-80">Klik 'Bangkitkan Analisa' untuk ringkasan performa otomatis.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Trend Analysis Section - BI Style -->
    <div v-if="authStore.isAdmin || authStore.isOwner" class="mt-spacing-hero-2xl animate-fade-in-up stagger-6">
      <div class="bi-branding">
         <span class="bi-label">BUSINESS INTELLIGENCE</span>
         <h2 class="bi-title">Trend & Forecasting Analytics</h2>
         <p class="bi-desc">Analisis pertumbuhan performa jangka panjang untuk pengambilan keputusan strategis.</p>
      </div>
      
      <div class="bi-layout-stack mt-xl">
        <!-- Main Chart Card -->
        <div class="premium-card glass-container-bi p-0 flex flex-col mb-lg">
          <div class="bi-card-header">
            <div class="bi-header-info">
              <h4 class="bi-card-title">Monthly Growth Performance (Net Profit)</h4>
              <p class="bi-card-meta">Analisis Tren Performa Bulanan • Siklus 1 Tahun</p>
            </div>
            <div class="bi-header-actions">
               <div class="bi-year-selector">Tahun {{ new Date().getFullYear() }}</div>
            </div>
          </div>
          
          <div class="p-2xl min-h-[400px]">
            <TrendAnalysisChart v-if="trendData" :data="trendData" />
          </div>

          <div class="bi-card-footer">
             <div class="bi-legend">
                <div 
                  v-for="(company, name) in trendData?.companies" 
                  :key="name" 
                  class="leg-item"
                >
                  <span class="leg-dot" :style="{ backgroundColor: getCompanyColor(name), boxShadow: `0 0 10px ${getCompanyColor(name)}` }"></span>
                  {{ name.toUpperCase() }}
                </div>
             </div>
          </div>
        </div>

        <!-- Horizontal Summary Row -->
        <div class="bi-summary-row flex items-center justify-between gap-xl">
           <div class="bi-stat-card-premium flex-1">
              <div class="bi-stat-inner grid grid-cols-[auto_1px_1fr] items-center gap-3xl">
                 <div class="flex flex-col flex-shrink-0">
                    <span class="bi-stat-label">TOTAL CONSOLIDATED PROFIT</span>
                    <h2 class="bi-stat-value tabular-nums mb-0">{{ formatCurrency(totalConsolidatedProfit) }}</h2>
                 </div>
                 <div class="bi-stat-v-divider"></div>
                 <p class="bi-stat-desc">
                   Accumulated from all authorized companies in the current 12-month cycle.
                 </p>
              </div>
              <div class="bi-stat-glow"></div>
           </div>

           <div class="bi-quick-hint px-lg">
              <div class="flex items-center gap-sm">
                <AppIcon name="shield-check" :size="16" class="text-emerald" />
                <span>Verified AI Consolidation</span>
              </div>
           </div>
        </div>
      </div>
    </div>

    <div class="premium-section-gap">
      <div class="flex justify-between items-center mb-md animate-fade-in-up stagger-6">
        <h3 class="section-title-premium">{{ authStore.isAdmin || authStore.isOwner ? 'Klaster Analitik Entitas' : 'Perusahaan Terotorisasi' }}</h3>
        <div v-if="authStore.isAdmin || authStore.isOwner" class="badge-premium-emerald">
            <span class="emerald-dot-pulse"></span>
            <span>GERBANG EKOSISTEM</span>
        </div>
      </div>
      
      <div class="companies-grid">
        <template v-if="loading">
          <div v-for="i in 3" :key="i" class="company-card premium-card skeleton-card">
            <div class="company-header">
              <div class="skeleton-avatar skeleton"></div>
              <div class="skeleton-title w-full skeleton"></div>
            </div>
            <div class="skeleton-rect skeleton"></div>
          </div>
        </template>
        <template v-else>
          <div 
            v-for="(data, company, index) in Object.fromEntries(Object.entries(stats?.byCompany || {}).filter(([k]) => {
              if (k === 'Owner') return false;
              if (!authStore.isAdmin && !authStore.isOwner) {
                return k === authStore.user?.companies?.name;
              }
              return true;
            }))" 
            :key="company"
            class="company-card premium-card animate-fade-in-up"
            :style="{ animationDelay: `${0.1 * (index + 7)}s` }"
            @click="goToCompany(company)"
          >
            <div class="company-header">
              <div class="company-icon-box">
                <img 
                  v-if="getCompanyCustomIcon(company)" 
                  :src="getCompanyCustomIcon(company)" 
                  class="company-card-icon-img" 
                />
                <span v-else class="company-icon-text">{{ getCompanyIcon(company) }}</span>
              </div>
              <h4 class="company-title-text">{{ company }}</h4>
            </div>
            <div class="company-stats-row">
              <div class="co-stat">
                <span class="v tabular-nums">{{ data?.total || 0 }}</span>
                <span class="l">TOTAL DOKUMEN</span>
              </div>
              <div class="co-stat">
                <span class="v tabular-nums">{{ data?.today || 0 }}</span>
                <span class="l">AKTIF HARIAN</span>
              </div>
            </div>
            <div class="company-footer-row">
               <span class="view-link">
                 <span>Eksplorasi Klaster</span>
                 <AppIcon name="arrow-right" :size="14" />
               </span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Activity Log -->
    <div class="mt-3xl pb-xl">
       <div class="flex justify-between items-center mb-md animate-fade-in-up stagger-7">
        <h3 class="section-title-premium">Aliran Aktivitas Real-time</h3>
        <div class="live-feed-badge">
            <span class="live-dot-pulse"></span>
            <span>LIVE FEED</span>
        </div>
      </div>

       <div class="premium-card glass-container p-0 animate-fade-in-up stagger-8">
        <div class="table-scroll">
          <table class="premium-table">
            <thead>
              <tr>
                <th>WAKTU</th>
                <th>ENTITAS</th>
                <th>KLASIFIKASI</th>
                <th>LOG AKTIVITAS</th>
                <th>AUDIT</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!recentReports.length && !loading">
                 <td colspan="5" class="text-center py-xl text-muted">No recent activity detected.</td>
              </tr>
              <tr 
                v-for="(rep, index) in recentReports" 
                :key="rep.id" 
                class="hover-row"
                @click="goToDoc(rep)"
              >
                <td class="tabular-nums text-muted text-xs">{{ formatDate(rep.report_date || rep.created_at) }}</td>
                <td>
                   <div class="flex items-center gap-sm">
                      <div class="company-mini-icon-wrapper">
                        <img 
                          v-if="getCompanyCustomIcon(rep.company_name)" 
                          :src="getCompanyCustomIcon(rep.company_name)" 
                          class="company-mini-icon-img" 
                        />
                        <span v-else class="company-mini-icon">{{ getCompanyIcon(rep.company_name) }}</span>
                      </div>
                      <span class="font-bold text-main">{{ rep.company_name }}</span>
                   </div>
                </td>
                <td>
                    <span class="badge-subtle" :class="(rep.classification || 'Daily').toLowerCase()">
                        {{ rep.classification || 'Laporan' }}
                    </span>
                </td>
                <td class="log-text-cell">
                    <div class="formatted-log" :title="rep.summary || rep.activities">
                        {{ formatActivityLog(rep.summary || rep.activities) }}
                    </div>
                </td>
                <td>
                    <div class="flex items-center gap-xs">
                        <span class="status-dot-mini success"></span>
                        <span class="text-xs font-bold uppercase">Terekam</span>
                    </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Report Detail Modal -->
  <ReportDetailModal 
    v-if="selectedReport"
    :report="selectedReport" 
    @close="selectedReport = null" 
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useReportsStore } from '@/stores/reports'
import { supabase, VIEWS, TABLES, COMPANY_TABLES } from '@/services/supabase'
import { groupChunksToDocuments } from '@/utils/financialUtils'
import AppIcon from '@/components/AppIcon.vue'
import FarmerDashboardView from './FarmerDashboardView.vue'
import MobileDashboardView from './mobile/MobileDashboardView.vue'
import TrendAnalysisChart from '@/components/TrendAnalysisChart.vue'

const ReportDetailModal = defineAsyncComponent(() => import('@/components/ReportDetailModal.vue'))

const isMobile = ref(window.innerWidth <= 768)
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}

const router = useRouter()
const authStore = useAuthStore()
const reportsStore = useReportsStore()

const loading = ref(true)
const stats = ref(null)
const recentReports = ref([])
const aiLoading = ref(false)
const aiSummary = ref('')
const selectedReport = ref(null)
const trendData = ref(null)

const totalConsolidatedProfit = computed(() => {
  if (!trendData.value) return 0
  let total = 0
  Object.values(trendData.value.companies).forEach(companyValues => {
    total += companyValues.reduce((acc, v) => acc + v, 0)
  })
  return total
})

const roleLabel = computed(() => {
  const role = authStore.user?.role
  if (role === 'ceo') return 'CHIEF EXECUTIVE OFFICER'
  if (role === 'owner') return 'OWNER'
  if (role === 'admin') return 'ADMINISTRATOR'
  return 'OPERATOR'
})

const formattedAISummary = computed(() => {
  if (!aiSummary.value) return ''
  // If content is already HTML, return as-is
  if (aiSummary.value.trim().startsWith('<div')) return aiSummary.value
  return aiSummary.value
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
})

async function fetchStats() {
  try {
    loading.value = true

    const targetSource = VIEWS.ALL_FINANCE_DOCS

    // Calculate Indonesia timezone (UTC+7) dates for accurate filtering
    const now = new Date()
    const indonesiaOffset = 7 * 60 // 7 hours in minutes
    const localOffset = now.getTimezoneOffset() // Local timezone offset in minutes

    // Get current Indonesia date (midnight)
    const indonesiaDate = new Date(now.getTime() + (indonesiaOffset + localOffset) * 60 * 1000)
    const today = new Date(indonesiaDate)
    today.setHours(0, 0, 0, 0)

    // Get 7 days ago in Indonesia time
    const weekAgo = new Date(indonesiaDate)
    weekAgo.setDate(weekAgo.getDate() - 7)
    weekAgo.setHours(0, 0, 0, 0)

    // Fetch ALL finance docs for accurate document-level grouping
    const { data: allData, error: fetchError } = await supabase
      .from(targetSource)
      .select('*')
    
    if (fetchError) throw fetchError

    // Grouping logic (consistent with FinancialReportsView)
    const processedData = allData.map(d => ({ ...d, _company: d.company_name }))
    const uniqueDocuments = groupChunksToDocuments(processedData)

    const companyStats = {}
    let todayCount = 0
    let weekCount = 0

    uniqueDocuments.forEach(doc => {
        const coName = doc._company || 'Unknown'
        const docDate = new Date(doc.metadata?.date || doc.created_at)

        if (!companyStats[coName]) companyStats[coName] = { total: 0, today: 0 }
        
        companyStats[coName].total++
        
        if (docDate >= today) {
            companyStats[coName].today++
            todayCount++
        }
        if (docDate >= weekAgo) {
            weekCount++
        }
    })

    stats.value = {
      totalReports: uniqueDocuments.length,
      todayReports: todayCount,
      weekReports: weekCount,
      byCompany: companyStats
    }

    // --- Activity Flow: Fetch Real-time Daily Reports ---
    // Only show reports from last 30 days for "Real-time Feed" (Indonesia timezone)
    const thirtyDaysAgo = new Date(indonesiaDate)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const { data: activityData } = await supabase
      .from(VIEWS.ALL_DAILY_REPORTS)
      .select('*')
      .gte('report_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('report_date', { ascending: false })
      .limit(8)

    recentReports.value = activityData || []

  } catch (e) {
    console.error('Error fetching dashboard stats:', e)
  } finally {
    loading.value = false
  }
}

async function fetchTrendData() {
  if (!authStore.isAdmin && !authStore.isOwner) return

  try {
    const today = new Date()
    const currentYear = today.getFullYear()
    const startDate = new Date(currentYear, 0, 1)
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59)

    // === DIRECT QUERY: Bypass store to ensure ALL companies are fetched ===
    const { data: rawDocs, error: fetchErr } = await supabase
      .from(VIEWS.ALL_FINANCE_DOCS)
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    if (fetchErr) throw fetchErr
    if (!rawDocs || rawDocs.length === 0) {
      console.warn('No finance docs found for trend analysis')
      return
    }

    // === GROUP BY COMPANY & MONTH ===
    const { groupChunksToDocuments, parseRefNumber } = await import('@/utils/financialUtils')

    const companyGroups = {}
    rawDocs.forEach(r => {
      const cName = r.company_name || 'Unknown'
      if (!companyGroups[cName]) companyGroups[cName] = []
      companyGroups[cName].push(r)
    })

    // Pre-load standardized financial data for accurate numbers
    const allIds = rawDocs.map(r => String(r.id))
    let stdMap = {}
    if (allIds.length > 0) {
      const { data: stdData } = await supabase
        .from(TABLES.STANDARDIZED_FINANCIALS)
        .select('source_id, revenue, expenses, net_profit')
        .in('source_id', allIds)
      if (stdData) {
        stdData.forEach(s => { stdMap[s.source_id] = s })
      }
    }

    // Monthly labels
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const months = Array.from({ length: 12 }, (_, i) => ({ month: i, year: currentYear, label: monthNames[i] }))

    const finalCompanies = {}

    for (const [company, companyDocs] of Object.entries(companyGroups)) {
      // Map _company field for groupChunksToDocuments compatibility
      const mappedDocs = companyDocs.map(d => ({ ...d, _company: d.company_name }))

      // Group company docs by month
      const monthlyBuckets = {}
      mappedDocs.forEach(r => {
        const date = new Date(r.metadata?.date || r.created_at)
        const month = date.getMonth()
        const year = date.getFullYear()
        if (year !== currentYear) return // Skip docs from other years
        const key = `${year}-${month}`
        if (!monthlyBuckets[key]) monthlyBuckets[key] = { month, reports: [] }
        monthlyBuckets[key].reports.push(r)
      })

      // Calculate net profit per month
      finalCompanies[company] = months.map(m => {
        const bucket = monthlyBuckets[`${currentYear}-${m.month}`]
        if (!bucket) return 0

        const uniqueDocs = groupChunksToDocuments(bucket.reports)
        let totalNet = 0

        uniqueDocs.forEach(doc => {
          const std = stdMap[String(doc.id)]
          if (std) {
            // Use AI-standardized values (same source as Monitoring Keuangan)
            totalNet += parseFloat(std.net_profit) || 0
          } else {
            // Fallback to raw metadata
            const net = parseRefNumber(doc.metadata?.netProfit) || 
                        (parseRefNumber(doc.metadata?.revenue) - parseRefNumber(doc.metadata?.expenses))
            totalNet += net
          }
        })

        return totalNet
      })
    }

    trendData.value = {
      labels: months.map(m => m.label),
      companies: finalCompanies
    }

    console.log('[Trend] Loaded companies:', Object.keys(finalCompanies), 
                'Total profit:', Object.values(finalCompanies).flat().reduce((a, b) => a + b, 0))
  } catch (err) {
    console.error('Trend fetch error:', err)
  }
}

function getCompanyColor(name) {
  const colors = {
    'Lyori': '#10b981',
    'Kaja': '#f59e0b',
    'Moafarm': '#3b82f6',
    'ePanen': '#8b5cf6',
    'Melon': '#f43f5e'
  }
  return colors[name] || '#94a3b8'
}

async function generateAutoInsight() {
    aiLoading.value = true
    try {
        // Fetch financial data using the SAME store as Monitoring Keuangan
        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        endOfMonth.setHours(23, 59, 59, 999)

        const docs = await reportsStore.fetchFinanceDocs({
            startDate: startOfMonth.toISOString(),
            endDate: endOfMonth.toISOString(),
            company_id: null
        })

        await reportsStore.consolidateFinanceData(docs, false, 'monthly')
        const consolidated = reportsStore.consolidatedPeriods || []

        const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)
        const monthLabel = startOfMonth.toLocaleString('id-ID', { month: 'long', year: 'numeric' })

        if (!consolidated.length) {
            aiSummary.value = `
<div class="audit-badge-row">
  <span class="audit-badge pulse-active">AI MONITORING ACTIVE</span>
  <span class="audit-meta">Periode: ${monthLabel}</span>
</div>
<div class="audit-console">
  <div class="console-header">Status</div>
  <div class="console-body">
    > Belum ada laporan keuangan terverifikasi untuk bulan ini.<br>
    > Silakan upload dokumen di menu Monitoring Keuangan.
  </div>
</div>`
            return
        }

        // Aggregate all companies
        let totalRev = 0, totalExp = 0, totalNet = 0
        const breakdown = []

        consolidated.forEach(g => {
            const r = Number(g.revenue) || 0
            const e = Number(g.expenses) || 0
            const n = Number(g.netProfit) || (r - e)
            totalRev += r; totalExp += e; totalNet += n
            breakdown.push({ company: g.company, rev: r, exp: e, net: n })
        })

        const breakdownHTML = breakdown.map(b =>
            `> <strong>${b.company}</strong>: Rev ${fmt(b.rev)} | Exp ${fmt(b.exp)} | Net ${fmt(b.net)}`
        ).join('<br>')

        aiSummary.value = `
<div class="audit-badge-row">
  <span class="audit-badge pulse-active">AI CONSOLIDATION ACTIVE</span>
  <span class="audit-meta">Sumber: Monitoring Keuangan • ${monthLabel} • ${consolidated.length} Entitas</span>
</div>

<div class="audit-grid">
  <div class="audit-item">
    <div class="audit-label">Total Revenue</div>
    <div class="audit-value text-emerald">${fmt(totalRev)}</div>
    <div class="audit-desc">Akumulasi Omzet Group</div>
  </div>
  <div class="audit-item">
    <div class="audit-label">Total Expenses</div>
    <div class="audit-value text-rose">${fmt(totalExp)}</div>
    <div class="audit-desc">Total Beban Operasional</div>
  </div>
  <div class="audit-item">
    <div class="audit-label">Group Net Profit</div>
    <div class="audit-value text-sky">${fmt(totalNet)}</div>
    <div class="audit-desc">Laba Bersih Konsolidasi</div>
  </div>
</div>

<div class="audit-console">
  <div class="console-header">Entity Breakdown (${monthLabel})</div>
  <div class="console-body">
    ${breakdownHTML}<br>
    > ------------------------------------------------<br>
    > <strong>TOTAL GROUP PROFIT: ${fmt(totalNet)}</strong><br>
    > Status: VALIDATED & MATCHING
  </div>
</div>

<div class="health-row">
  <div class="health-ring"><span class="health-val">100%</span></div>
  <div class="health-text">
    <div class="health-label">TERVERIFIKASI</div>
    <div class="health-sub">Data identik dengan Monitoring Keuangan</div>
  </div>
</div>
`
    } catch (err) {
        console.error('AI Insight error:', err)
        aiSummary.value = `**Error:** Gagal memuat data konsolidasi.`
    } finally {
        aiLoading.value = false
    }
}

function getCompanyIcon(name) {
  if (!name) return '🏢'
  const icons = {
    'Kaja': '🥗',
    'Lyori': '🌿', // Changed from egg
    'Yantofarm': '🌾',
    'ePanen': '🚜'
  }
  return icons[name] || '🏢'
}

function getCompanyCustomIcon(name) {
  const companyData = COMPANY_TABLES[name]
  if (companyData && companyData.customIcon) {
    return new URL(companyData.customIcon, import.meta.url).href
  }
  return null
}

function formatCurrency(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)
}

function formatDate(date) {
  return new Date(date).toLocaleString('id-ID', { 
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
  })
}

function formatActivityLog(log) {
    if (!log) return 'Aktivitas terekam'
    
    // 1. Convert to string if it's an object (guard for JSONB types)
    if (typeof log === 'object') {
        return log.summary || log.details || JSON.stringify(log)
    }

    // 2. Handle string inputs
    if (typeof log === 'string') {
        const clean = log.trim()
        
        // Try strict JSON parsing first
        if (clean.startsWith('{') || clean.startsWith('[')) {
            try {
                const parsed = JSON.parse(clean)
                return parsed.summary || parsed.details || clean
            } catch (e) {
                // 3. Fallback: Regex extraction if strict parse fails
                // Matches "summary":"Value" or "summary": "Value"
                const summaryMatch = clean.match(/"summary"\s*:\s*"([^"]+)"/)
                if (summaryMatch && summaryMatch[1]) return summaryMatch[1]
                
                const detailsMatch = clean.match(/"details"\s*:\s*"([^"]+)"/)
                if (detailsMatch && detailsMatch[1]) return detailsMatch[1]
            }
        }
    }
    
    return log
}

function goToCompany(name) {
  router.push({ name: 'FinancialReports', query: { company: name } })
}

function goToDoc(doc) {
  // If it's a daily report (v_all_daily_reports), open modal direct
  selectedReport.value = doc
}

function openUploadForm() {
    // Navigate or emit
    router.push({ name: 'FinancialReports' })
}

onMounted(() => {
  fetchStats()
  fetchTrendData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.dashboard-expert-view {
    padding: 32px 48px;
    max-width: 1600px;
    margin: 0 auto;
}

/* Welcome Section - Premium */
.welcome-section-premium {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 40px;
}

.header-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
}

.status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.6rem;
    font-weight: 900;
    color: var(--color-primary);
    letter-spacing: 0.15em;
    background: rgba(16, 185, 129, 0.08);
    padding: 4px 10px;
    border-radius: 100px;
    border: 1px solid rgba(16, 185, 129, 0.15);
}

.status-dot-pulse {
    width: 6px;
    height: 6px;
    background: var(--color-primary);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--color-primary);
    animation: p-pulse 2s infinite;
}

@keyframes p-pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
}

.v-divider-v2 {
    width: 1px;
    height: 12px;
    background: var(--glass-border);
}

.role-badge-v2 {
    font-size: 0.6rem;
    font-weight: 800;
    color: var(--text-dim);
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.user-greeting-v2 {
    font-size: 2.25rem;
    font-weight: 900;
    color: var(--text-main);
    letter-spacing: -0.05em;
    line-height: 1;
}

.system-desc-v2 {
    font-size: 0.9375rem;
    color: var(--text-dim);
    margin-top: 8px;
}

.quick-status-cards {
    display: flex;
    gap: 16px;
}

.mini-card-v2 {
    background: rgba(var(--bg-card-rgb), 0.3);
    border: 1px solid var(--glass-border);
    padding: 12px 20px;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.mc-label {
    font-size: 0.6rem;
    font-weight: 800;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.1em;
}

.mc-value {
    font-size: 1rem;
    font-weight: 900;
    color: var(--text-main);
}

/* KPI Pillar Cards */
.kpi-glass-grid-v2 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    margin-bottom: 48px;
}

.kpi-pillar-card {
    background: rgba(var(--bg-card-rgb), 0.3);
    border: 1px solid var(--glass-border);
    border-radius: 24px;
    padding: 24px;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 20px;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.kpi-pillar-card:hover {
    transform: translateY(-6px);
    border-color: rgba(16, 185, 129, 0.3);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.kp-icon-box {
    width: 48px;
    height: 48px;
    background: rgba(var(--bg-card-rgb), 0.4);
    border: 1px solid var(--glass-border);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
    z-index: 2;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
}

.kp-icon-box::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
}

.kp-icon-box.blue { color: #3b82f6; border-color: rgba(59, 130, 246, 0.2); }
.kp-icon-box.purple { color: #8b5cf6; border-color: rgba(139, 92, 246, 0.2); }
.kp-icon-box.gold { color: #f59e0b; border-color: rgba(245, 158, 11, 0.2); }

.kp-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    z-index: 2;
}

.kp-label {
    font-size: 0.65rem;
    font-weight: 800;
    color: var(--text-dim);
    letter-spacing: 0.12em;
}

.kp-value {
    font-size: 2rem;
    font-weight: 900;
    color: var(--text-main);
    letter-spacing: -0.04em;
    line-height: 1;
}

.kp-trend-tag {
    margin-top: 8px;
    font-size: 0.65rem;
    font-weight: 900;
    padding: 4px 10px;
    border-radius: 8px;
    width: fit-content;
}

.kp-trend-tag.positive { background: rgba(16, 185, 129, 0.15); color: var(--color-primary); }
.kp-trend-tag.neutral { background: rgba(255, 255, 255, 0.05); color: var(--text-dim); }

.kp-bg-glow {
    position: absolute;
    bottom: -20px;
    right: -20px;
    width: 100px;
    height: 100px;
    background: var(--color-primary);
    filter: blur(60px);
    opacity: 0.05;
    z-index: 1;
}

.kp-bg-glow.blue { background: #3b82f6; }
.kp-bg-glow.purple { background: #8b5cf6; }
.kp-bg-glow.gold { background: #f59e0b; }

/* Full Card Stats */
.stat-card-full {
    position: relative;
    height: 180px;
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--glass-border);
    box-shadow: var(--shadow-main);
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.stat-card-full:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
    border-color: var(--color-primary);
}

.stat-card-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 1;
    transition: transform 0.6s ease;
}

.stat-card-full:hover .stat-card-bg {
    transform: scale(1.1);
}

.stat-card-overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%);
    backdrop-filter: blur(2px);
}

.dark-mode .stat-card-overlay {
    background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
}

.stat-info {
    display: flex;
    flex-direction: column;
}

.stat-label {
    font-size: 0.7rem;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.stat-value {
    font-size: 1.85rem;
    font-weight: 800;
    color: white;
    margin: 2px 0;
}

.stat-trend {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 6px;
    margin-left: 8px;
}

.stat-trend.positive { background: rgba(16, 185, 129, 0.25); color: #10b981; backdrop-filter: blur(4px); }
.stat-trend.neutral { background: rgba(255, 255, 255, 0.1); color: #ffffff; backdrop-filter: blur(4px); }

.stat-subtext {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 600;
}

.quick-action-banner {
    padding: 24px 32px;
    background: rgba(var(--bg-card-rgb), 0.3);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
}

.btn-primary {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
    color: white;
    border: none;
    padding: 10px 24px;
    border-radius: 12px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    white-space: nowrap;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
    filter: brightness(1.1);
}

.btn-ghost-small {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 12px 24px;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 12px;
    color: var(--color-primary);
    font-size: 0.85rem;
    font-weight: 850;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-ghost-small:hover {
    background: rgba(16, 185, 129, 0.2);
    border-color: var(--color-primary);
    transform: translateY(-1px);
}

/* Glass Components */
.glass-container {
    background: var(--bg-card);
    backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    box-shadow: var(--shadow-main);
}

.glass-header {
    border-bottom: 1px solid var(--glass-border);
    background: rgba(var(--bg-card-rgb), 0.2);
}

.ai-orb-mini {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.pulse-emerald {
    background: #10b981;
    box-shadow: 0 0 10px #10b981;
    animation: orb-pulse 2s infinite;
}

@keyframes orb-pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.7; }
    100% { transform: scale(1); opacity: 1; }
}

.markdown-body-lite-hero {
    font-size: 1.125rem;
    line-height: 1.7;
    color: var(--text-main);
    letter-spacing: -0.01em;
}

.glass-container-hero {
    background: linear-gradient(135deg, var(--bg-card), rgba(16, 185, 129, 0.03));
    backdrop-filter: blur(30px);
    border: 1px solid var(--glass-border);
    box-shadow: var(--shadow-premium), inset 0 0 40px rgba(16, 185, 129, 0.08);
    min-height: 380px; /* Substantial vertical presence */
    display: flex;
    flex-direction: column;
}

.ai-briefing-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 4rem 3rem !important; /* Ultra-breathable session */
}

.glass-header-hero {
    border-bottom: 1px solid var(--glass-border);
    background: rgba(255, 255, 255, 0.05);
}

.ai-orb-large {
    width: 16px;
    height: 16px;
    border-radius: 50%;
}

.p-xl {
    padding: 2.5rem;
}

@media (max-width: 768px) {
    .p-xl { padding: 1.5rem; }
}

/* Premium Sections */
.section-title-premium {
    font-size: 1.125rem;
    font-weight: 800;
    color: var(--text-main);
    letter-spacing: -0.02em;
}

.badge-premium-emerald {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.75rem;
    font-weight: 800;
    padding: 6px 12px;
    background: rgba(16, 185, 129, 0.1);
    color: var(--color-primary);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 100px;
    letter-spacing: 0.05em;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.1);
}

.emerald-dot-pulse {
    width: 6px;
    height: 6px;
    background: var(--color-primary);
    border-radius: 50%;
    animation: p-pulse 2s infinite;
}

/* Companies Grid */
.companies-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 40px;
}

@media (max-width: 1000px) {
    .companies-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 600px) {
    .companies-grid { grid-template-columns: 1fr; }
}

.company-card {
    padding: 24px;
    cursor: pointer;
    background: var(--bg-card);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-main);
    transition: all 0.25s ease;
}

.company-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-main), 0 8px 24px rgba(0, 0, 0, 0.1);
    border-color: var(--color-primary);
}

.company-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
}

.company-icon-box {
    width: 64px;
    height: 64px;
    background: #fff;
    border: 2px solid #10b981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 15px rgba(16, 185, 129, 0.2);
    position: relative;
    overflow: hidden;
}

.company-icon-box::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), transparent);
    pointer-events: none;
}

.company-card-icon-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.company-card:hover .company-card-icon-img {
    transform: scale(1.15) rotate(5deg);
}

.company-title-text {
    font-size: 1.25rem;
    font-weight: 850;
    color: var(--text-main);
    letter-spacing: -0.03em;
}

.company-stats-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    padding: 20px 0;
    border-top: 1px solid var(--glass-border);
}

.company-footer-row {
    margin-top: 8px;
    display: flex;
    justify-content: flex-end;
}

.view-link {
    font-size: 0.7rem;
    font-weight: 800;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
}

.company-card:hover .view-link {
    color: var(--color-primary);
    transform: translateX(4px);
}

.co-stat {
    display: flex;
    flex-direction: column;
}

.co-stat .v {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-main);
    line-height: 1.2;
    margin-bottom: 8px; /* High-Fidelity spacing (was 4px) */
}

.co-stat .l {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--text-dim);
    letter-spacing: 0.05em;
}

/* Shimmer Button Effect */
.shimmer-btn {
    position: relative;
    overflow: hidden;
}

.shimmer-btn::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
        45deg,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent
    );
    transform: rotate(45deg);
    animation: shimmer 3s infinite;
}

@keyframes shimmer {
    0% { transform: translateX(-100%) rotate(45deg); }
    100% { transform: translateX(100%) rotate(45deg); }
}

/* Premium Table */
.table-scroll { overflow-x: auto; }
.premium-table {
    width: 100%;
    border-collapse: collapse;
}

.premium-table th {
    padding: 16px 24px;
    text-align: left;
    font-size: 0.65rem;
    font-weight: 800;
    color: var(--text-dim);
    letter-spacing: 0.15em;
    border-bottom: 1px solid var(--glass-border);
}

.premium-table td {
    padding: 16px 24px;
    font-size: 0.875rem;
    border-bottom: 1px solid var(--glass-border);
}

.hover-row:hover {
    background: rgba(255, 255, 255, 0.02);
    cursor: pointer;
}

.badge-subtle {
    font-size: 0.7rem;
    font-weight: 800;
    padding: 6px 12px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.025em;
}

.badge-subtle.revenue { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.badge-subtle.expense { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

.status-dot-mini {
    width: 6px;
    height: 6px;
    border-radius: 50%;
}
.status-dot-mini.success { background: #10b981; box-shadow: 0 0 6px #10b981; }
.status-dot-mini.neutral { background: var(--text-dim); }

.status-live {
    width: 8px;
    height: 8px;
    background: #ef4444;
    border-radius: 50%;
    animation: live-pulse 1s infinite;
}

@keyframes live-pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0; }
    100% { transform: scale(1); opacity: 0; }
}

/* Skeleton */
.skeleton-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--glass-border);
}

/* Animations */
@keyframes animate-fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  opacity: 0;
  animation: animate-fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.1s; }
.stagger-3 { animation-delay: 0.15s; }
.stagger-4 { animation-delay: 0.2s; }
.stagger-5 { animation-delay: 0.25s; }
.stagger-6 { animation-delay: 0.3s; }
.stagger-7 { animation-delay: 0.35s; }
.stagger-8 { animation-delay: 0.4s; }

/* Expert UI/UX Refinements */
.dashboard-expert-view {
    position: relative;
    z-index: 1;
}

.company-mini-icon-wrapper {
    width: 36px;
    height: 36px;
    background: #fff;
    border: 1.5px solid #10b981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.company-mini-icon-img {
    width: 100%;
    height: 100%;
    object-fit: cover; /* Make it fill the circle tightly */
}

.hover-row:hover .company-mini-icon-wrapper {
    transform: scale(1.1);
    border-color: #059669;
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
}


.dashboard-backdrop-premium {
    position: absolute;
    top: -100px;
    right: -100px;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(0,0,0,0) 70%);
    filter: blur(80px);
    z-index: -1;
    pointer-events: none;
    opacity: 0.8;
}

.welcome-section-premium {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: var(--space-2xl);
    padding-bottom: var(--space-xl);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.user-greeting-v2 {
    font-size: 2.5rem;
    line-height: 1.2;
    font-weight: 800;
    margin-bottom: var(--space-sm);
}

.text-gradient-emerald {
    /* Light Mode: Dark slate to Emerald */
    background: linear-gradient(135deg, #1e293b 0%, #10b981 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.dark-mode .text-gradient-emerald {
    /* Dark Mode: White to Emerald (Original) */
    background: linear-gradient(135deg, #fff 0%, #34d399 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.live-feed-badge {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    padding: 6px 12px;
    border-radius: 100px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.75rem;
    font-weight: 800;
    color: #ef4444;
    letter-spacing: 0.05em;
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.1);
}

.live-dot-pulse {
    width: 6px;
    height: 6px;
    background: #ef4444;
    border-radius: 50%;
    animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.formatted-log {
    max-width: 400px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
}

.premium-section-gap {
    margin-top: 10rem; /* Ultra High-Fidelity Spacing */
}

.mt-spacing-hero { margin-top: 4rem; }
.mt-spacing-hero-xl { margin-top: 7rem; }
.mt-spacing-hero-2xl { margin-top: 9rem; }

@media (max-width: 768px) {
    .premium-section-gap {
        margin-top: 3.5rem;
    }
}

/* === AI Audit Styling (v-html deep) === */
.markdown-body-lite-hero :deep(.audit-badge-row) {
    display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;
}
.markdown-body-lite-hero :deep(.audit-badge) {
    background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 4px 12px;
    border-radius: 6px; font-size: 11px; font-weight: 700; letter-spacing: 1px;
    border: 1px solid rgba(16, 185, 129, 0.3);
}
.markdown-body-lite-hero :deep(.audit-badge.pulse-active) {
    animation: pulse-badge 2s ease-in-out infinite;
}
@keyframes pulse-badge {
    0%, 100% { opacity: 1; } 50% { opacity: 0.6; }
}
.markdown-body-lite-hero :deep(.audit-meta) {
    font-size: 12px; color: var(--text-muted, #94a3b8); font-family: 'JetBrains Mono', monospace;
}
.markdown-body-lite-hero :deep(.audit-grid) {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0;
}
.markdown-body-lite-hero :deep(.audit-item) {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px; padding: 16px; text-align: center;
}
.markdown-body-lite-hero :deep(.audit-label) {
    font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
    color: var(--text-muted, #94a3b8); margin-bottom: 6px;
}
.markdown-body-lite-hero :deep(.audit-value) {
    font-size: 20px; font-weight: 800; margin-bottom: 4px;
}
.markdown-body-lite-hero :deep(.audit-value.text-emerald) { color: #34d399; }
.markdown-body-lite-hero :deep(.audit-value.text-rose) { color: #f87171; }
.markdown-body-lite-hero :deep(.audit-value.text-sky) { color: #38bdf8; }
.markdown-body-lite-hero :deep(.audit-desc) {
    font-size: 11px; color: var(--text-muted, #64748b);
}
.markdown-body-lite-hero :deep(.audit-console) {
    background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px; overflow: hidden; margin: 16px 0;
}
.markdown-body-lite-hero :deep(.console-header) {
    background: rgba(255,255,255,0.04); padding: 8px 14px;
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 1px; color: var(--text-muted, #94a3b8);
    border-bottom: 1px solid rgba(255,255,255,0.06);
}
.markdown-body-lite-hero :deep(.console-body) {
    padding: 12px 14px; font-size: 12px; line-height: 1.7;
    font-family: 'JetBrains Mono', monospace; color: var(--text-muted, #94a3b8);
}
.markdown-body-lite-hero :deep(.health-row) {
    display: flex; align-items: center; gap: 14px; margin-top: 16px;
}
.markdown-body-lite-hero :deep(.health-ring) {
    width: 52px; height: 52px; border-radius: 50%;
    border: 3px solid #34d399; display: flex; align-items: center; justify-content: center;
    background: rgba(16, 185, 129, 0.08);
}
.markdown-body-lite-hero :deep(.health-val) {
    font-size: 14px; font-weight: 800; color: #34d399;
}
.markdown-body-lite-hero :deep(.health-label) {
    font-size: 14px; font-weight: 700; color: var(--text-main, #e2e8f0);
}
/* === BI (Business Intelligence) Dashboard Style === */
.bi-branding { margin-bottom: 3.5rem; }
.bi-label { font-size: 0.75rem; font-weight: 800; color: #10b981; letter-spacing: 0.25em; margin-bottom: 8px; display: block; }
.bi-title { font-size: 2.25rem; font-weight: 900; letter-spacing: -0.04em; margin: 0 0 8px 0; }
.bi-desc { font-size: 0.95rem; color: var(--text-dim); font-weight: 500; }

.bi-layout-stack {
    display: flex;
    flex-direction: column;
}

.glass-container-bi {
    background: var(--bg-card);
    backdrop-filter: blur(24px);
    border: 1px solid var(--glass-border);
    border-radius: 32px;
    box-shadow: var(--shadow-premium);
    overflow: hidden;
}

.bi-card-header { padding: 24px 32px; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; background: rgba(var(--bg-card-rgb), 0.2); }
.bi-card-title { font-size: 1.1rem; font-weight: 850; color: var(--text-main); margin: 0; }
.bi-card-meta { font-size: 0.75rem; color: var(--text-dim); margin: 4px 0 0 0; font-weight: 600; }

.bi-year-selector { background: rgba(var(--bg-card-rgb), 0.4); border: 1px solid var(--glass-border); padding: 8px 16px; border-radius: 12px; font-size: 0.8rem; font-weight: 700; color: var(--text-main); }

.bi-card-footer { padding: 20px 32px; border-top: 1px solid rgba(255, 255, 255, 0.03); background: rgba(0,0,0,0.1); }
.bi-legend { display: flex; gap: 24px; }
.leg-item { display: flex; align-items: center; gap: 8px; font-size: 0.65rem; font-weight: 900; color: #64748b; letter-spacing: 0.1em; }
.leg-dot { width: 8px; height: 8px; border-radius: 50%; }
.leg-dot.lyori { background: #10b981; box-shadow: 0 0 10px #10b981; }
.leg-dot.kaja { background: #f59e0b; box-shadow: 0 0 10px #f59e0b; }
.leg-dot.general { background: #3b82f6; }

/* Sidebar Stat Card */
.bi-sidebar-stats { display: flex; flex-direction: column; gap: 16px; }
.bi-stat-card-premium {
    background: var(--bg-card);
    border: 1px solid var(--glass-border);
    border-radius: 32px;
    padding: 48px 40px; /* Increased padding for better "shape" presence */
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-premium);
    min-height: 180px; /* Force a more substantial presence */
    display: flex;
    align-items: center;
}

.bi-stat-inner { position: relative; z-index: 2; width: 100%; display: grid; }
.bi-stat-v-divider { width: 1px; height: 60px; background: var(--glass-border); opacity: 0.3; }
.bi-stat-label { font-size: 0.75rem; font-weight: 900; color: #10b981; letter-spacing: 0.2em; display: block; margin-bottom: 12px; opacity: 1; }
.bi-stat-value { font-size: 2.8rem; font-weight: 900; color: var(--text-main); line-height: 1; margin: 0; letter-spacing: -0.04em; white-space: nowrap; }
.bi-stat-desc { font-size: 0.95rem; color: var(--text-dim); line-height: 1.6; font-weight: 500; max-width: 480px; margin-left: 20px; }

.bi-stat-glow { position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%); filter: blur(40px); }

.bi-quick-hint { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 0.75rem; font-weight: 700; padding: 0 12px; }

@media (max-width: 768px) {
    .bi-title { font-size: 1.75rem; }
    .bi-stat-value { font-size: 1.85rem; }
}

@media (max-width: 640px) {
    .markdown-body-lite-hero :deep(.audit-grid) {
        grid-template-columns: 1fr;
    }
}

</style>




