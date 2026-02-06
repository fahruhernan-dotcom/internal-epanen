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
import { supabase, COMPANY_TABLES, TABLES } from '@/services/supabase'
import { aiService } from '@/services/ai'
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

// Constants
const periodTypes = [
    { value: 'monthly', label: 'Bulanan' },
    { value: '3weeks', label: '3 Mingguan' },
    { value: '2weeks', label: '2 Mingguan' },
    { value: 'weekly', label: 'Mingguan' },
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
async function loadReports() {
  loading.value = true
  consolidatedPeriods.value = []
  reports.value = [] // Reset raw data
  
  try {
    // 1. Determine Date Range based on Period Type
    const { start, end } = calculateDateRange(selectedPeriodType.value)
    
    // 2. Fetch Raw Financial Reports
    let companiesToFetch = []
    if (selectedCompany.value === 'all') {
        companiesToFetch = companyOptions.value
    } else {
        companiesToFetch = [selectedCompany.value]
    }

    const allData = []
    
    for (const company of companiesToFetch) {
        const tableInfo = COMPANY_TABLES[company]
        if (!tableInfo?.finance) continue

        let query = supabase
            .from(tableInfo.finance)
            .select('*')
            .order('created_at', { ascending: false })
        
        if (start) query = query.gte('created_at', start)
        if (end) query = query.lte('created_at', end)
            
        const { data, error } = await query
        
        if (!error && data) {
            allData.push(...data.map(item => ({...item, _company: company})))
        }
    }
    
    reports.value = allData

    // 3. Consolidate/Group Logic
    await consolidateData(allData, start, end)

  } catch (err) {
    console.error('Failed to load reports:', err)
  } finally {
    loading.value = false
  }
}

// Helper: Parse ID currency format vs Number
function parseRefNumber(val) {
    if (typeof val === 'number') return val
    if (!val) return 0
    // Remove "Rp", spaces, and non-numeric chars except . and ,
    let str = String(val).replace(/Rp|\s/g, '')
    
    // Check format: "1.000.000" (ID) vs "1,000,000" (US)
    // Assumption: reports are in ID format (dot = thousands, comma = decimal)
    if (str.includes('.') && !str.includes(',')) {
        // e.g. "1.000.000" -> "1000000"
        return parseFloat(str.replace(/\./g, ''))
    }
    
    if (str.includes('.') && str.includes(',')) {
        // e.g. "1.000.000,50" -> "1000000.50"
        return parseFloat(str.replace(/\./g, '').replace(',', '.'))
    }
    
    // Fallback cleanup
    return parseFloat(str.replace(/[^0-9.-]/g, '')) || 0
}

// Helper: Extract financial data from text content (Fallback)
function extractFinancialsFromText(text) {
    if (!text) return { revenue: 0, expenses: 0 }
    
    const parseValue = (patterns) => {
        for (const regex of patterns) {
            const match = text.match(regex)
            if (match) {
                let cleanStr = match[1]
                const multiplierStr = (match[2] || match[3] || '').trim().toLowerCase()
                
                // --- Smart Number Parsing ---
                
                // Case 1: English-style decimals with suffix "M"/"K" often use dot as decimal "7.91M"
                // Heuristic: If it has a dot, and that dot is followed by 1 or 2 digits ONLY (at end), treat as decimal.
                // e.g. "7.91" -> Decimal. "7.910" -> Thousands.
                const decimalLookalike = /\.(\d{1,2})$/.test(cleanStr)
                
                if (decimalLookalike) {
                    // "7.91" -> "7.91" (keep dot)
                    // If mixed "1,000.50" -> "1000.50"
                    cleanStr = cleanStr.replace(/,/g, '') 
                } else {
                    // Standard ID format: "11.200.000" -> remove dots
                    // "11,2" -> replace comma with dot
                    if (cleanStr.includes('.') && !cleanStr.includes(',')) {
                         cleanStr = cleanStr.replace(/\./g, '')
                    } else if (cleanStr.includes(',')) {
                         cleanStr = cleanStr.replace(/\./g, '').replace(',', '.')
                    }
                }
                
                let val = parseFloat(cleanStr)
                
                // --- Multiplier Handling ---
                if (multiplierStr.includes('juta') || multiplierStr.includes('jt') || multiplierStr === 'm') val *= 1000000
                if (multiplierStr.includes('milyar') || multiplierStr.includes('mn') || multiplierStr === 'b') val *= 1000000000
                if (multiplierStr === 'k' || multiplierStr === 'rb') val *= 1000
                
                // Extra safety: If val is very small (e.g. < 1000) and NO multiplier was found, 
                // but text says "Revenue", it might be an error or millions implied?
                // For now, trust the parsing.
                
                if (val > 0) return val
            }
        }
        return 0
    }

    // Patterns for REVENUE
    const revRaw = parseValue([
        // "Revenue: Rp 11,2 juta" or "Rp 7.91M"
        /(?:Revenue|Omzet|Pendapatan|Pemasukan)[\s\S]{0,20}Rp\s*([\d.,]+)\s*([MmKk]|juta|milyar|jt|rb)?/i,
        // "Total Revenue ... 11.200.000" (Table format)
        /(?:Total\s+Revenue|Total\s+Pendapatan|Total\s+Omzet)[\s\S]{0,30}?([\d.,]+)\s*([MmKk]|juta|milyar|jt|rb)?/i
    ])

    // Patterns for EXPENSES
    const expRaw = parseValue([
        // "Costs: Rp 7.91M"
        /(?:Expenses|Pengeluaran|Biaya\s+Produksi)[\s\S]{0,20}Rp\s*([\d.,]+)\s*([MmKk]|juta|milyar|jt|rb)?/i,
        // "Total Costs ... 7.910.000"
        // "Total Biaya ... 7.91M"
        /(?:Total\s+Costs|Total\s+Biaya|Total\s+Pengeluaran)[\s\S]{0,30}?([\d.,]+)\s*([MmKk]|juta|milyar|jt|rb)?/i
    ])
    
    return { revenue: revRaw, expenses: expRaw }
}

// Helper: Group RAG chunks into logical documents
function groupChunksToDocuments(rawChunks) {
    const grouped = {}
    
    rawChunks.forEach(chunk => {
        const title = chunk.metadata?.title || 'Untitled'
        const date = chunk.metadata?.date || chunk.created_at
        const company = chunk._company
        
        const dateStr = new Date(date).toISOString().split('T')[0]
        const key = `${company}_${dateStr}_${title}`.trim()
        
        if (!grouped[key]) {
            grouped[key] = {
                id: chunk.id,
                _company: company,
                created_at: chunk.created_at,
                metadata: { ...chunk.metadata }, // Start with first chunk's metadata
                chunks: []
            }
        }
        
        // Merge Logic: If this new chunk has better metadata, overwrite!
        const doc = grouped[key]
        let currentRev = parseRefNumber(doc.metadata.revenue)
        let currentExp = parseRefNumber(doc.metadata.expenses)
        
        // 1. Try Metadata from chunk
        let newRev = parseRefNumber(chunk.metadata?.revenue)
        let newExp = parseRefNumber(chunk.metadata?.expenses)
        
        // 2. Fallback: Parse from Content if metadata is missing
        if (!newRev && !newExp && chunk.content) {
            const extracted = extractFinancialsFromText(chunk.content)
            newRev = extracted.revenue
            newExp = extracted.expenses
        }
        
        // Update if better
        if (!currentRev && newRev) doc.metadata.revenue = newRev
        if (!currentExp && newExp) doc.metadata.expenses = newExp
        
        grouped[key].chunks.push(chunk)
    })
    
    return Object.values(grouped)
}

// Core Logic: Grouping & AI Summary Integration
async function consolidateData(rawData, globalStart, globalEnd) {
    const buckets = []
    const now = new Date()
    
    // Define bucket size in days
    let daysPerBucket = 30
    if (selectedPeriodType.value === 'weekly') daysPerBucket = 7
    if (selectedPeriodType.value === '2weeks') daysPerBucket = 14
    if (selectedPeriodType.value === '3weeks') daysPerBucket = 21

    // Generate buckets going BACKWARDS from today (or endDate)
    let currentCursor = new Date(now)
    if (customEndDate.value) currentCursor = new Date(customEndDate.value)

    // Limit lookback
    const stopDate = new Date()
    stopDate.setFullYear(stopDate.getFullYear() - 1) 
    
    while (currentCursor > stopDate) {
        const bucketEnd = new Date(currentCursor)
        const bucketStart = new Date(currentCursor)
        bucketStart.setDate(bucketStart.getDate() - daysPerBucket + 1)
        
        // 1. Filter raw chunks for this timeframe
        const rawBucketChunks = rawData.filter(r => {
            const rDate = new Date(r.metadata?.date || r.created_at)
            return rDate >= bucketStart && rDate <= bucketEnd
        })

        if (rawBucketChunks.length > 0) {
            // 2. GROUP CHUNKS into Logical Documents
            const uniqueDocs = groupChunksToDocuments(rawBucketChunks)
            
            // 3. Aggregate metrics based on UNIQUE DOCUMENTS (using strict parsing)
            const revenue = uniqueDocs.reduce((acc, r) => acc + parseRefNumber(r.metadata?.revenue), 0)
            const expenses = uniqueDocs.reduce((acc, r) => acc + parseRefNumber(r.metadata?.expenses), 0)
            
            // Build daily trend using Unique Docs
            const dailyTrends = new Array(daysPerBucket).fill(0)
            uniqueDocs.forEach(r => {
                const rDate = new Date(r.metadata?.date || r.created_at)
                const diffDays = Math.floor((rDate - bucketStart) / (1000 * 60 * 60 * 24))
                if (diffDays >= 0 && diffDays < daysPerBucket) {
                    dailyTrends[diffDays] += parseRefNumber(r.metadata?.revenue)
                }
            })

            const startDateStr = bucketStart.toISOString().split('T')[0]
            const endDateStr = bucketEnd.toISOString().split('T')[0]
            
            // Fetch saved AI Summary
            const savedSummary = await aiService.fetchSavedSummary({
                startDate: startDateStr,
                endDate: endDateStr,
                periodType: selectedPeriodType.value,
                companyId: selectedCompany.value === 'all' ? null : COMPANY_TABLES[selectedCompany.value]?.id
            })

            buckets.push({
                id: `${startDateStr}_${endDateStr}`,
                startDate: startDateStr,
                endDate: endDateStr,
                label: `${formatDateShort(bucketStart)} - ${formatDateShort(bucketEnd)}`,
                reports: uniqueDocs, // Pass the UNIQUE docs
                chunkCount: rawBucketChunks.length, 
                revenue,
                expenses,
                netProfit: revenue - expenses,
                dailyTrend: dailyTrends,
                aiSummary: savedSummary
            })
        }
        
        currentCursor.setDate(currentCursor.getDate() - daysPerBucket)
        if (customStartDate.value && currentCursor < new Date(customStartDate.value)) break
    }

    consolidatedPeriods.value = buckets
}


// --- AI Generation ---
async function generateInsight(period) {
    if (generationStatus.value[period.id]) return
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
        })
        
        // Update local state
        const idx = consolidatedPeriods.value.findIndex(p => p.id === period.id)
        if (idx !== -1) {
            consolidatedPeriods.value[idx].aiSummary = result
        }
        
    } catch (err) {
        alert('Gagal generate AI')
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
