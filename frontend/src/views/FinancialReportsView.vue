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
      
      <button class="btn btn-primary" @click="loadReports">🔄 Refresh Data</button>
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
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase, COMPANY_TABLES, TABLES, VIEWS, getFinanceDocs } from '@/services/supabase'
import { aiService } from '@/services/ai'
import { groupChunksToDocuments, parseRefNumber } from '@/utils/financialUtils'
import PeriodInsightCard from '@/components/PeriodInsightCard.vue'

// --- State ---
const authStore = useAuthStore()
const loading = ref(true)
const reports = ref([])

// Filters
const selectedCompany = ref('all')
const selectedPeriodType = ref('monthly') // monthly, 3weeks, 2weeks, weekly, custom
const customStartDate = ref('')
const customEndDate = ref('')

// Consolidated Data
const consolidatedPeriods = ref([])
const expandedPeriodId = ref(null)
const generationStatus = ref({}) // Track loading per card
const normalizationStatus = ref({}) // Track AI normalization progress

// Constants
const periodTypes = [
    { value: 'monthly', label: 'Bulanan' },
    { value: '3weeks', label: '3 Mingguan' },
    { value: '2weeks', label: '2 Mingguan' },
    { value: 'weekly', label: 'Mingguan' },
    { value: 'daily', label: 'Harian' },
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

async function loadReports() {
  loading.value = true
  consolidatedPeriods.value = []
  reports.value = []
  
  try {
    // 1. Fetch all docs from unified view
    const data = await getFinanceDocs({})
    
    if (!data || data.length === 0) {
        console.warn('No financial docs found in v_all_finance_docs')
        return
    }
    
    const allData = data.map(item => ({
        ...item,
        _company: item.company_name 
    }))
    
    reports.value = allData
    
    // 2. Filter by selected company if applicable
    let displayData = allData
    if (selectedCompany.value !== 'all') {
        displayData = allData.filter(d => d._company === selectedCompany.value)
    }

    // 3. Process data
    if (displayData.length > 0) {
        await consolidateData(displayData)
    }

  } catch (err) {
    console.error('Failed to load reports:', err)
  } finally {
    loading.value = false
  }
}

async function consolidateData(rawData) {
    const buckets = []
    
    // Group by Company Name
    const companyGroups = {}
    rawData.forEach(r => {
        const cName = r._company || 'Unknown'
        if (!companyGroups[cName]) companyGroups[cName] = []
        companyGroups[cName].push(r)
    })

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

    for (const company of Object.keys(companyGroups)) {
        if (selectedCompany.value !== 'all' && selectedCompany.value !== company) continue

        const companyData = companyGroups[company]
        
        // Group reports by Month & Year
        const monthlyBuckets = {} // key: "YYYY-MM"
        
        companyData.forEach(r => {
            const date = new Date(r.metadata?.date || r.created_at)
            const year = date.getFullYear()
            const month = date.getMonth()
            const key = `${year}-${String(month + 1).padStart(2, '0')}`
            
            if (!monthlyBuckets[key]) {
                monthlyBuckets[key] = {
                    year,
                    month,
                    reports: []
                }
            }
            monthlyBuckets[key].reports.push(r)
        })

        // Create period items for each month
        for (const [key, meta] of Object.entries(monthlyBuckets)) {
            const uniqueDocs = groupChunksToDocuments(meta.reports)
            const revenue = uniqueDocs.reduce((acc, r) => acc + parseRefNumber(r.metadata?.revenue), 0)
            const expenses = uniqueDocs.reduce((acc, r) => acc + parseRefNumber(r.metadata?.expenses), 0)
            const explicitNet = uniqueDocs.reduce((acc, r) => acc + parseRefNumber(r.metadata?.netProfit), 0)
            
            // First and Last day of the month
            const firstDay = new Date(meta.year, meta.month, 1)
            const lastDay = new Date(meta.year, meta.month + 1, 0)
            const daysInMonth = lastDay.getDate()
            
            // Populate actual daily trend
            const trend = new Array(daysInMonth).fill(0)
            meta.reports.forEach(r => {
                const rDate = new Date(r.metadata?.date || r.created_at)
                // Only if it's actually in our target month/year
                if (rDate.getFullYear() === meta.year && rDate.getMonth() === meta.month) {
                    const dayIdx = rDate.getDate() - 1 // 0-indexed day
                    if (dayIdx >= 0 && dayIdx < daysInMonth) {
                        const net = parseRefNumber(r.metadata?.netProfit) || (parseRefNumber(r.metadata?.revenue) - parseRefNumber(r.metadata?.expenses))
                        trend[dayIdx] += net
                    }
                }
            })

            buckets.push({
                id: `${company}_${key}`,
                company,
                startDate: firstDay.toISOString().split('T')[0],
                endDate: lastDay.toISOString().split('T')[0],
                label: `${monthNames[meta.month]} ${meta.year}`,
                reports: uniqueDocs,
                chunkCount: meta.reports.length,
                revenue,
                expenses,
                netProfit: explicitNet || (revenue - expenses),
                dailyTrend: trend,
                aiSummary: null,
                isNormalizing: false,
                isNormalized: uniqueDocs.every(d => d.metadata.is_ai_normalized)
            })
        }
    }

    // Sort buckets: Most recent company/month first
    buckets.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))

    consolidatedPeriods.value = buckets

    // Automatically trigger normalization if needed
    consolidatedPeriods.value.forEach(p => {
        // If it's empty, we might want to check DB first, which summarizeFinancialPeriod already does.
        // For normalization (numbers), we usually want them fixed if they were already parsed.
        runAINormalization(p)
    })
}

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
            periodType: selectedPeriodType.value,
            companyId: selectedCompany.value === 'all' ? null : COMPANY_TABLES[selectedCompany.value]?.id,
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
    const start = new Date()
    
    if (type === 'custom') {
        return { 
            start: customStartDate.value || null, 
            end: customEndDate.value || null 
        }
    }
    
    // Default fetch range: Last 90 days to capture a few periods
    start.setDate(today.getDate() - 90) 
    return { start: start.toISOString(), end: today.toISOString() }
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
