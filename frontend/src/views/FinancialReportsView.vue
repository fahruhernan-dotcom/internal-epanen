<template>
  <div class="finance-page animate-fade-in-up">
    <!-- Header Section - Elite Style -->
    <header class="welcome-section-premium animate-fade-in-up">
      <div class="welcome-text">
        <div class="header-meta">
          <span class="status-indicator">
            <span class="status-dot-pulse"></span>
            LIVE MONITORING
          </span>
          <span class="v-divider-v2"></span>
          <span class="role-badge-v2">FINANCIAL INTELLIGENCE</span>
        </div>
        <h1 class="user-greeting-v2">
          <span class="text-muted font-light">Monitoring</span><br>
          <span class="text-gradient-emerald">Laporan Keuangan</span>
        </h1>
        <p class="system-desc-v2">Analisa konsolidasi profit, arus kas, dan validasi data finansial berbasis AI secara transparan.</p>
      </div>

      <div class="quick-status-cards">
        <div class="mini-card-v2">
          <span class="mc-label">Skor Akurasi</span>
          <span class="mc-value text-emerald">98.5%</span>
        </div>
        <div class="mini-card-v2">
          <span class="mc-label">Aktivitas Node</span>
          <span class="mc-value text-emerald">SYNCHRONIZED</span>
        </div>
      </div>
    </header>

    <!-- Filters & Controls Overhaul -->
    <div class="filters-bar animate-in stagger-1 mt-spacing-hero-xl">
      <div class="filters-left-group">
        <!-- Company Selector -->
        <div class="filter-logic-box" v-if="compAuth.isAdmin || compAuth.isOwner">
          <div class="filter-label-row">
            <AppIcon name="building-2" :size="14" class="text-emerald" />
            <span class="filter-label">PERUSAHAAN</span>
          </div>
          <div class="premium-select-wrapper" v-click-outside="() => isCompanyDropdownOpen = false">
            <div 
              class="premium-select-trigger" 
              :class="{ open: isCompanyDropdownOpen }"
              @click="isCompanyDropdownOpen = !isCompanyDropdownOpen"
            >
              <span>{{ selectedCompany === 'all' ? 'Semua Entitas' : selectedCompany }}</span>
              <AppIcon 
                name="chevron-down" 
                :size="16" 
                class="select-arrow" 
                :class="{ rotated: isCompanyDropdownOpen }" 
              />
            </div>
            
            <transition name="dropdown-slide">
              <div class="premium-options-menu glass-panel" v-if="isCompanyDropdownOpen">
                <div 
                  class="premium-option" 
                  :class="{ selected: selectedCompany === 'all' }"
                  @click="selectCompany('all')"
                >
                  <span>Semua Entitas</span>
                  <AppIcon v-if="selectedCompany === 'all'" name="check" :size="14" class="text-emerald" />
                </div>
                <div 
                  class="premium-option" 
                  v-for="company in companyOptions" 
                  :key="company"
                  :class="{ selected: selectedCompany === company }"
                  @click="selectCompany(company)"
                >
                  <span>{{ company }}</span>
                  <AppIcon v-if="selectedCompany === company" name="check" :size="14" class="text-emerald" />
                </div>
              </div>
            </transition>
          </div>
        </div>
        
        <div class="filter-logic-box" v-else-if="authStore.user?.companies?.name">
          <div class="filter-label-row">
            <AppIcon name="building-2" :size="14" class="text-emerald" />
            <span class="filter-label">KORPORASI</span>
          </div>
          <div class="company-badge-static">
            <span>{{ authStore.user.companies.name }}</span>
          </div>
        </div>

        <div class="v-divider"></div>

        <!-- Period Tabs -->
        <div class="filter-logic-box">
          <div class="filter-label-row">
            <AppIcon name="calendar" :size="14" class="text-emerald" />
            <span class="filter-label">RENTANG WAKTU</span>
          </div>
          <div class="period-tabs-wrapper">
            <button 
              v-for="type in periodTypes" 
              :key="type.value"
              class="tab-btn-v2" 
              :class="{ active: selectedPeriodType === type.value }"
              @click="setPeriodType(type.value)"
            >
              {{ type.label }}
            </button>
          </div>
        </div>

        <!-- Custom Date (conditional) -->
        <div v-if="selectedPeriodType === 'custom'" class="date-range-group animate-fade-in">
          <input type="date" v-model="customStartDate" class="premium-date-input" @change="loadReports" />
          <span class="date-sep">-</span>
          <input type="date" v-model="customEndDate" class="premium-date-input" @change="loadReports" />
        </div>
      </div>

      <div class="flex-spacer"></div>
      
      <div class="actions-group">
        <button v-if="compAuth.isAdmin || compAuth.isOwner || authStore.user?.role === 'ceo'"
          class="btn-primary-cta" @click="openUploadForm">
          <AppIcon name="folder-up" :size="18" />
          <span>Unggah PDF Keuangan</span>
        </button>

        <div class="action-divider"></div>

        <button class="btn-icon-action" @click="loadReports(true)" title="Refresh Data">
          <AppIcon name="refresh-cw" :size="18" :class="{ 'animate-spin': loading }" />
        </button>

        <button v-if="compAuth.isAdmin" class="btn-icon-action danger" @click="debugDB" title="Debug DB">
          <AppIcon name="terminal" :size="18" />
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <span>Mengambil dan menganalisa data keuangan...</span>
    </div>

    <div v-else class="content-area">
        <!-- New: Smart Insight Cards (Consolidated View) -->
        <div class="cards-container animate-in stagger-2">
            <h3 class="section-title">
                <AppIcon name="bar-chart-3" :size="24" />
                <span class="ml-sm">Laporan Keuangan {{ getPeriodLabel() }}</span>
                <span class="report-count">({{ consolidatedPeriods.length }} Periode)</span>
            </h3>

            <div v-if="consolidatedPeriods.length === 0" class="empty-state">
                <AppIcon name="inbox" :size="48" />
                <p>Tidak ada data laporan untuk rentang waktu ini.</p>
            </div>
            
            <PeriodInsightCard 
                v-for="period in consolidatedPeriods" 
                :key="period.id"
                :period="period"
                :is-expanded="expandedPeriodId === period.id"
                :is-generating="generationStatus[period.id]"
                :is-normalizing="normalizationStatus[period.id]"
                :show-company="selectedCompany === 'all'"
                @toggle="togglePeriod"
                @generate-ai="generateInsight"
            />
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useReportsStore } from '@/stores/reports'
import { supabase, COMPANY_TABLES, VIEWS } from '@/services/supabase'
import { aiService } from '@/services/ai'
import { parseRefNumber } from '@/utils/financialUtils'
import PeriodInsightCard from '@/components/PeriodInsightCard.vue'
import AppIcon from '@/components/AppIcon.vue'

// --- State ---
const authStore = useAuthStore()
const reportsStore = useReportsStore()
const { loading, consolidatedPeriods, error } = storeToRefs(reportsStore)

// Filters
const selectedCompany = ref('all')
const selectedPeriodType = ref('monthly') // monthly, 3weeks, 2weeks, weekly, custom
const customStartDate = ref('')
const customEndDate = ref('')
const isCompanyDropdownOpen = ref(false)

// UI state
const expandedPeriodId = ref(null)
const generationStatus = ref({}) // Track loading per card
const normalizationStatus = ref({}) // Track AI normalization progress

// Constants
const periodTypes = [
    { value: '1year', label: '1 Tahun' },
    { value: '3months', label: '3 Bulanan' },
    { value: '2months', label: '2 Bulanan' },
    { value: 'monthly', label: 'Bulanan' },
    { value: 'custom', label: 'Custom' }
]

// Auth wrapper
const compAuth = computed(() => ({
    isAdmin: authStore.user?.role === 'admin',
    isOwner: authStore.user?.role === 'owner',
    userRole: authStore.user?.role
}))

const companyOptions = computed(() => {
  const all = Object.keys(COMPANY_TABLES).filter(c => c !== 'Owner' && c !== 'Admin')
  if (compAuth.value.isOwner || compAuth.value.isAdmin) return all
  const userCompany = authStore.user?.companies?.name
  return userCompany ? [userCompany] : []
})

const DOC_FORMS = {
    'Lyori': 'https://n8n-wrw2bveswawm.cica.sumopod.my.id/form/72b3dbbe-34c7-48f0-b7de-f2e7c017d519',
    'Moafarm': 'https://n8n-wrw2bveswawm.cica.sumopod.my.id/form/4a20bcf8-ed90-4910-9451-45631fc26fe5',
    'Kaja': 'https://n8n-wrw2bveswawm.cica.sumopod.my.id/form/ea756b54-6155-4de3-be2a-415bb3cd769e',
    'ePanen': 'https://n8n-wrw2bveswawm.cica.sumopod.my.id/form/8487ffd0-325f-455e-bf06-98709dd3b108'
}

function openUploadForm() {
    let companyName = selectedCompany.value
    
    if (authStore.user?.role === 'ceo') {
        companyName = authStore.user?.companies?.name
    }

    if (!companyName || companyName === 'all') {
        alert('Silakan pilih salah satu perusahaan terlebih dahulu untuk melakukan upload.')
        return
    }
    
    // Normalize: remove hyphens, spaces, and case
    const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const searchName = normalize(companyName)
    let url = null

    // Find the best match by comparing normalized names
    const keys = Object.keys(DOC_FORMS)
    const matchKey = keys.find(k => {
        const normKey = normalize(k)
        return normKey === searchName || searchName.includes(normKey) || normKey.includes(searchName)
    })
    
    if (matchKey) {
        url = DOC_FORMS[matchKey]
    }
    
    if (url) {
        window.open(url, '_blank')
    } else {
        alert(`Form upload untuk "${companyName}" belum tersedia di sistem.`)
    }
}

// --- Logic ---

// Custom directive for clicking outside dropdown
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}

function selectCompany(company) {
    selectedCompany.value = company
    isCompanyDropdownOpen.value = false
    loadReports()
}

function setPeriodType(type) {
    selectedPeriodType.value = type
    loadReports()
}

function getPeriodLabel() {
    return periodTypes.find(t => t.value === selectedPeriodType.value)?.label || 'Custom'
}

function togglePeriod(id) {
    expandedPeriodId.value = expandedPeriodId.value === id ? null : id
}

// Data Fetching
const debugDB = async () => {
    console.log('--- DB DEBUG START ---')
    const tables = ['finance_epanen', 'finance_kaja', 'finance_lyori', 'finance_moafarm']
    for (const t of tables) {
        const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true })
        console.log(`Table ${t}:`, count, error || 'OK')
    }
    const { data: viewData, error: viewError } = await supabase.from(VIEWS.ALL_FINANCE_DOCS).select('*').limit(5)
    console.log('View v_all_finance_docs sample:', viewData?.length, viewError || 'OK')
    console.log('--- DB DEBUG END ---')
    alert('Debug info sent to console (F12)')
}

async function loadReports(force = false) {
  const { start, end } = calculateDateRange(selectedPeriodType.value)
  
  reportsStore.setSelectedCompany(selectedCompany.value)
  
  const data = await reportsStore.fetchFinanceDocs({
    startDate: start,
    endDate: end,
    company_id: selectedCompany.value === 'all' ? null : COMPANY_TABLES[selectedCompany.value]?.id
  })
  
  if (data) {
    await reportsStore.consolidateFinanceData(data, force, selectedPeriodType.value)
    
    // Only auto-normalize if not already normalized in this session
    consolidatedPeriods.value.forEach(p => {
        if (!p.isNormalized) {
            runAINormalization(p)
        }
    })
  }
}

// No longer needed here, moved to reports.js

// --- AI Generation ---
async function runAINormalization(period, force = false) {
    if (normalizationStatus.value[period.id]) return
    
    // Lazy check: If all reports already have AI-verified data, skip call UNLESS forced
    const allNormalized = period.reports.every(r => 
        r.metadata?.revenue !== undefined && 
        r.metadata?.revenue !== 0 && 
        r.metadata?.is_ai_normalized // Require AI verification to skip
    )
    
    if (allNormalized && !force) {
        console.log(`[AI] Skipping normalization for ${period.company}, data already exists.`)
        return
    }

    normalizationStatus.value[period.id] = true

    try {
        console.log(`[AI] Normalizing financials for ${period.company}...`)
        const normalizedList = await aiService.extractFinancialDataWithAI(period.reports, force)
        
        if (normalizedList && Array.isArray(normalizedList)) {
            // Update the period and its reports
            const idx = consolidatedPeriods.value.findIndex(p => p.id === period.id)
            if (idx !== -1) {
                const target = consolidatedPeriods.value[idx]
                
                // Track totals

                normalizedList.forEach(item => {
                    const doc = target.reports.find(r => r.id === item.id)
                    if (doc) {
                        const extractedNet = (item.netProfit !== undefined && item.netProfit !== null) ? item.netProfit : (item.revenue - item.expenses)

                        doc.metadata.revenue = item.revenue
                        doc.metadata.expenses = item.expenses
                        doc.metadata.netProfit = extractedNet
                        doc.metadata.aiReasoning = item.reasoning
                        doc.metadata.is_ai_normalized = true 
                    }
                })

                // Recalculate totals from ALL reports in target (AI normalized + Fallback for others)
                let totalRev = 0
                let totalExp = 0
                let totalNet = 0
                
                target.reports.forEach(doc => {
                    totalRev += parseRefNumber(doc.metadata?.revenue)
                    totalExp += parseRefNumber(doc.metadata?.expenses)
                    totalNet += parseRefNumber(doc.metadata?.netProfit) || (parseRefNumber(doc.metadata?.revenue) - parseRefNumber(doc.metadata?.expenses))
                })

                target.revenue = totalRev
                target.expenses = totalExp
                target.netProfit = totalNet
                target.isNormalized = true
            }
        }
    } catch (err) {
        console.error('Normalization failed:', err)
    } finally {
        normalizationStatus.value[period.id] = false
    }
}

async function generateInsight(period) {
    if (generationStatus.value[period.id]) return
    
    // For manual triggers (button clicks), we ALWAYS want to force a re-normalization 
    // to ensure accuracy, especially if the initial auto-run extracted garbage data.
    await runAINormalization(period, true)
    
    generationStatus.value[period.id] = true
    try {
        const result = await aiService.summarizeFinancialPeriod(period.reports, period.label, {
            startDate: period.startDate,
            endDate: period.endDate,
            periodType: 'monthly', // HARDCODE: month cards always use monthly index regardless of view tab
            companyId: COMPANY_TABLES[period.company]?.id || null,
            totalRevenue: period.revenue,
            totalExpenses: period.expenses,
            reportCount: period.reports.length
        }, true) // Force true for manual triggers
        
        const idx = consolidatedPeriods.value.findIndex(p => p.id === period.id)
        if (idx !== -1) {
            consolidatedPeriods.value[idx].aiSummary = result
        }
    } catch (err) {
        console.error('AI Insight Error:', err)
    } finally {
        generationStatus.value[period.id] = false
    }
}


// --- Helpers ---
function calculateDateRange(type) {
    const today = new Date()
    const end = today
    let start = new Date()
    
    if (type === 'custom') {
        return { 
            start: customStartDate.value ? new Date(customStartDate.value).toISOString() : null, 
            end: customEndDate.value ? new Date(customEndDate.value).toISOString() : null 
        }
    }
    
    // Strict calendar-based ranges
    if (type === 'monthly') {
        // Start of current month
        start = new Date(today.getFullYear(), today.getMonth(), 1)
    } else if (type === '2months') {
        // Start of previous month (Total 2 calendar months)
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    } else if (type === '3months') {
        // Start of 2 months ago (Total 3 calendar months)
        start = new Date(today.getFullYear(), today.getMonth() - 2, 1)
    } else if (type === '1year') {
        // Start of 11 months ago (Total 12 calendar months)
        start = new Date(today.getFullYear(), today.getMonth() - 11, 1)
    } else {
        // Fallback to start of current month
        start = new Date(today.getFullYear(), today.getMonth(), 1)
    }
    
    // Set time to start of day for consistency
    start.setHours(0, 0, 0, 0)
    
    return { 
        start: start.toISOString(), 
        end: end.toISOString() 
    }
}

function formatDateShort(date) {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })
}

onMounted(() => {
    // Init dates
    const today = new Date()
    customEndDate.value = today.toISOString().split('T')[0]
    today.setMonth(today.getMonth() - 1)
    customStartDate.value = today.toISOString().split('T')[0]

    // Set initial company based on user role
    if (!compAuth.value.isAdmin && !compAuth.value.isOwner) {
        const userCompany = authStore.user?.companies?.name
        if (userCompany) {
            selectedCompany.value = userCompany
        }
    }

    loadReports()
})
</script>

<style scoped>
/* Page Layout & Elite Sync */
.finance-page {
    max-width: 1600px;
    margin: 0 auto;
    padding-bottom: 5rem;
}

.welcome-section-premium {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.user-greeting-v2 {
    font-size: 2.75rem;
    line-height: 1.1;
    font-weight: 850;
    margin-bottom: 0.75rem;
    letter-spacing: -0.04em;
}

.header-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 1.5rem;
}

.status-indicator {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    padding: 6px 14px;
    border-radius: 100px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.7rem;
    font-weight: 850;
    color: #10b981;
    letter-spacing: 0.1em;
}

.status-dot-pulse {
    width: 6px;
    height: 6px;
    background: #10b981;
    border-radius: 50%;
    animation: pulse-emerald 2s infinite;
}

@keyframes pulse-emerald {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.v-divider-v2 {
    width: 1px;
    height: 14px;
    background: var(--glass-border);
}

.role-badge-v2 {
    font-size: 0.7rem;
    font-weight: 800;
    color: #818cf8;
    letter-spacing: 0.15em;
}

.quick-status-cards {
    display: flex;
    gap: 16px;
}

.mini-card-v2 {
    background: var(--bg-card);
    backdrop-filter: blur(10px);
    border: 1px solid var(--glass-border);
    padding: 16px 24px;
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    min-width: 160px;
    box-shadow: var(--shadow-main);
}

.mc-label {
    font-size: 0.65rem;
    font-weight: 800;
    color: var(--text-dim);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 4px;
}

.mc-value {
    font-size: 1.1rem;
    font-weight: 850;
    letter-spacing: -0.02em;
}

.system-desc-v2 {
    font-size: 0.95rem;
    color: var(--text-muted);
    font-weight: 500;
    max-width: 500px;
}

.mt-spacing-hero-xl { margin-top: 6rem; }

/* Filter Bar Styles */
.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: rgba(var(--bg-card-rgb), 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  box-shadow: var(--shadow-premium);
  position: relative;
  z-index: 50; /* Ensure dropdowns go over content */
}

.filters-left-group {
    display: flex;
    align-items: center;
    gap: 24px;
}

.filter-logic-box {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.filter-label-row {
    display: flex;
    align-items: center;
    gap: 6px;
}

.filter-label {
    font-size: 0.65rem;
    font-weight: 800;
    color: var(--text-dim);
    letter-spacing: 0.12em;
}

.v-divider {
    width: 1px;
    height: 32px;
    background: var(--glass-border);
}

/* Custom Period Tabs */
.period-tabs-wrapper {
    background: rgba(var(--bg-card-rgb), 0.5);
    padding: 3px;
    border-radius: 12px;
    display: flex;
    gap: 2px;
    border: 1px solid var(--glass-border);
}

.tab-btn-v2 {
    background: transparent;
    border: none;
    padding: 6px 14px;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: 9px;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.tab-btn-v2.active {
    background: var(--color-primary);
    color: white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.tab-btn-v2:not(.active):hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-main);
}

/* Premium Form Elements */
.premium-select {
    background: rgba(var(--bg-card-rgb), 0.6);
    border: 1px solid var(--glass-border);
    border-radius: 10px;
    padding: 6px 12px;
    color: var(--text-main);
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    min-width: 160px;
    outline: none;
}

.premium-select:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
}

.company-badge-static {
    padding: 6px 12px;
    background: rgba(var(--bg-card-rgb), 0.6);
    color: var(--text-main);
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.875rem;
    border: 1px solid var(--glass-border);
}

.date-range-group {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-left: 12px;
    border-left: 1px dashed var(--glass-border);
}

.premium-date-input {
    background: rgba(var(--bg-card-rgb), 0.3);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    padding: 4px 8px;
    color: var(--text-main);
    font-size: 0.75rem;
    font-weight: 600;
    color-scheme: dark;
}

/* Action Group */
.actions-group {
    display: flex;
    align-items: center;
    gap: 16px;
}

.action-divider {
    width: 1px;
    height: 24px;
    background: var(--glass-border);
}

.btn-primary-cta {
    background: linear-gradient(135deg, var(--color-primary), #10b981);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 12px;
    font-weight: 800;
    font-size: 0.8125rem;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 4px 15px rgba(16, 184, 166, 0.2);
}

.btn-primary-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(16, 184, 166, 0.3);
    filter: brightness(1.1);
}

.btn-icon-action {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: rgba(var(--bg-card-rgb), 0.5);
    border: 1px solid var(--glass-border);
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-icon-action:hover {
    background: rgba(var(--bg-card-rgb), 0.8);
    color: var(--text-main);
    border-color: var(--text-dim);
}

.btn-icon-action.danger:hover {
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.05);
}

/* Content Area */
.section-title {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-top: var(--space-xl);
  margin-bottom: var(--space-xl);
  letter-spacing: -0.03em;
}

.report-count {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--color-primary);
  background: rgba(16, 185, 129, 0.1);
  padding: 4px 12px;
  border-radius: 100px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.cards-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* Custom Premium Select Dropdown */
.premium-select-wrapper {
  position: relative;
  min-width: 180px;
  z-index: 20;
}

.premium-select-trigger {
    background: rgba(var(--bg-card-rgb), 0.5);
    border: 1px solid var(--glass-border);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    color: var(--text-main);
    font-weight: 700;
    font-size: 0.875rem;
    box-shadow: 0 4px 6px rgba(0,0,0,0.02);
}

.premium-select-trigger:hover {
    background: rgba(var(--bg-card-rgb), 0.7);
    border-color: rgba(var(--text-main-rgb), 0.1);
    transform: translateY(-1px);
}

.premium-select-trigger.open {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}

.select-arrow {
    color: var(--text-muted);
    transition: transform 0.3s ease;
}

.select-arrow.rotated {
    transform: rotate(180deg);
    color: var(--color-primary);
}

.premium-options-menu {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    width: 100%;
    min-width: 200px;
    background: rgba(var(--bg-card-rgb), 0.95);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 6px;
    box-shadow: var(--shadow-premium);
    overflow: hidden;
    backdrop-filter: blur(20px);
}

.premium-option {
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--text-muted);
    font-weight: 600;
    font-size: 0.875rem;
    transition: all 0.2s ease;
}

.premium-option:hover {
    background: rgba(16, 185, 129, 0.08); /* Primary fade */
    color: var(--text-main);
}

.premium-option.selected {
    background: rgba(16, 185, 129, 0.12);
    color: var(--color-primary);
    font-weight: 700;
}

/* Transitions */
.dropdown-slide-enter-active,
.dropdown-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-slide-enter-from,
.dropdown-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>
