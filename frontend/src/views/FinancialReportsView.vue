<template>
  <div class="finance-page animate-fade-in">
    <!-- Filters & Controls -->
    <div class="filters-bar card">
    <div class="filter-group" v-if="compAuth.isAdmin || compAuth.isOwner">
      <label class="form-label">Perusahaan</label>
      <select v-model="selectedCompany" class="form-input" @change="loadReports">
        <option value="all">Semua Perusahaan</option>
        <option v-for="company in companyOptions" :key="company" :value="company">
          {{ company }}
        </option>
      </select>
    </div>
    <div class="filter-group" v-else-if="authStore.user?.companies?.name">
      <label class="form-label">Perusahaan</label>
      <div class="company-badge-static">
        🏢 {{ authStore.user.companies.name }}
      </div>
    </div>

      <!-- New: Period Type Selector -->
      <div class="period-tabs-container">
        <div class="period-tabs">
          <button 
            v-for="type in periodTypes" 
            :key="type.value"
            class="tab-btn" 
            :class="{ active: selectedPeriodType === type.value }"
            @click="setPeriodType(type.value)"
          >
            {{ type.label }}
          </button>
        </div>
      </div>
      
      <!-- Date Range (only for Custom) -->
      <div v-if="selectedPeriodType === 'custom'" class="flex gap-sm animate-fade-in">
        <div class="filter-group">
            <input type="date" v-model="customStartDate" class="form-input" @change="loadReports" />
        </div>
        <div class="filter-group">
            <input type="date" v-model="customEndDate" class="form-input" @change="loadReports" />
        </div>
      </div>

      <div class="flex-spacer"></div>
      
      <button v-if="compAuth.isAdmin || compAuth.isOwner || authStore.user?.role === 'ceo'" 
        class="btn btn-secondary mr-sm" @click="openUploadForm">
        📂 Upload PDF Finance
      </button>

      <button class="btn btn-primary" @click="loadReports(true)">🔄 Refresh Data</button>
      <button v-if="compAuth.isAdmin" class="btn btn-secondary" @click="debugDB">🔍 Debug DB</button>
    </div>

    <!-- Main Content Area -->
    <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <span>Mengambil dan menganalisa data keuangan...</span>
    </div>

    <div v-else class="content-area">
        <!-- New: Smart Insight Cards (Consolidated View) -->
        <div class="cards-container">
            <h3 class="section-title">
                📊 Laporan Keuangan {{ getPeriodLabel() }}
                <span class="report-count">({{ consolidatedPeriods.length }} Periode)</span>
            </h3>

            <div v-if="consolidatedPeriods.length === 0" class="empty-state">
                <span class="empty-icon">📭</span>
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
import PeriodInsightCard from '@/components/PeriodInsightCard.vue'

// --- State ---
const authStore = useAuthStore()
const reportsStore = useReportsStore()
const { loading, consolidatedPeriods, error } = storeToRefs(reportsStore)

// Filters
const selectedCompany = ref('all')
const selectedPeriodType = ref('monthly') // monthly, 3weeks, 2weeks, weekly, custom
const customStartDate = ref('')
const customEndDate = ref('')

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
    'moafarm': 'https://n8n-wrw2bveswawm.cica.sumopod.my.id/form/4a20bcf8-ed90-4910-9451-45631fc26fe5',
    'Kaja': 'https://n8n-wrw2bveswawm.cica.sumopod.my.id/form/ea756b54-6155-4de3-be2a-415bb3cd769e'
}

function openUploadForm() {
    // If admin/owner and 'all' is selected, we need to know WHICH company.
    // For simplicity, if 'all' is selected, we can't open a specific form.
    let companyName = selectedCompany.value
    
    // If it's a CEO, they only have one company anyway
    if (authStore.user?.role === 'ceo') {
        companyName = authStore.user?.companies?.name
    }

    if (!companyName || companyName === 'all') {
        alert('Silakan pilih salah satu perusahaan terlebih dahulu untuk melakukan upload.')
        return
    }
    
    // Exact match or contains
    let url = DOC_FORMS[companyName]
    if (!url) {
        if (companyName.includes('Lyori')) url = DOC_FORMS['Lyori']
        if (companyName.toLowerCase().includes('moafarm')) url = DOC_FORMS['moafarm']
        if (companyName.includes('Kaja')) url = DOC_FORMS['Kaja']
    }
    
    if (url) {
        window.open(url, '_blank')
    } else {
        alert('Form upload untuk perusahaan ini belum tersedia.')
    }
}

// --- Logic ---

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
                let totalRev = 0
                let totalExp = 0
                let totalNet = 0

                normalizedList.forEach(item => {
                    const doc = target.reports.find(r => r.id === item.id)
                    if (doc) {
                        // Math safety: ensure netProfit is calculated if missing
                        const extractedNet = (item.netProfit !== undefined && item.netProfit !== null) ? item.netProfit : (item.revenue - item.expenses)

                        doc.metadata.revenue = item.revenue
                        doc.metadata.expenses = item.expenses
                        doc.metadata.netProfit = extractedNet
                        doc.metadata.aiReasoning = item.reasoning
                        doc.metadata.is_ai_normalized = true 
                        
                        totalRev += item.revenue
                        totalExp += item.expenses
                        totalNet += extractedNet
                    }
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
.finance-page {
  display: flex; flex-direction: column; gap: var(--space-lg);
  padding-bottom: 50px;
}

/* Filters Bar */
.filters-bar {
  display: flex; align-items: center; gap: var(--space-md); flex-wrap: wrap;
  padding: var(--space-md);
  background: var(--bg-primary); 
}

.period-tabs-container {
    background: var(--bg-tertiary); padding: 4px; border-radius: var(--radius-lg);
}

.period-tabs { display: flex; gap: 2px; }

.tab-btn {
    background: transparent; border: none; padding: 6px 14px;
    font-size: 0.85rem; color: var(--text-secondary); cursor: pointer;
    border-radius: var(--radius-md); transition: all 0.2s;
}

.tab-btn.active { background: var(--bg-primary); color: var(--primary); box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-weight: 600; }

.company-badge-static {
    padding: 8px 16px;
    background: var(--primary-50);
    color: var(--primary-700);
    border-radius: var(--radius-md);
    font-weight: 600;
    border: 1px solid var(--primary-100);
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.flex-spacer { flex: 1; }

/* Content */
.section-title { font-size: 1.2rem; margin-bottom: var(--space-md); color: var(--text-primary); display: flex; align-items: center; gap: var(--space-sm); }
.report-count { font-size: 0.8rem; color: var(--text-tertiary); font-weight: normal; }

.cards-container { display: flex; flex-direction: column; gap: var(--space-md); }

.loading-state, .empty-state { text-align: center; padding: 40px; color: var(--text-tertiary); }
.empty-icon { font-size: 3rem; display: block; margin-bottom: 10px; }

@media (max-width: 768px) {
    .filters-bar { flex-direction: column; align-items: stretch; }
    .period-tabs { overflow-x: auto; }
}
</style>
