<template>
  <div class="finance-page animate-fade-in">
    <!-- Filters -->
    <div class="filters-bar card">
      <div class="filter-group" v-if="authStore.isAdmin || authStore.isOwner">
        <label class="form-label">Perusahaan</label>
        <select v-model="selectedCompany" class="form-input" @change="loadReports">
          <option value="all">Semua Perusahaan</option>
          <option v-for="company in companyOptions" :key="company" :value="company">
            {{ company }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label class="form-label">Dari Tanggal</label>
        <input type="date" v-model="startDate" class="form-input" @change="loadReports" />
      </div>
      <div class="filter-group">
        <label class="form-label">Sampai Tanggal</label>
        <input type="date" v-model="endDate" class="form-input" @change="loadReports" />
      </div>
      <div class="flex gap-sm">
        <button class="btn btn-primary" @click="loadReports">🔍 Refresh</button>
        <button 
          v-if="reports.length > 0"
          class="btn btn-secondary" 
          @click="generateAISummary"
          :disabled="aiLoading"
        >
          <span v-if="aiLoading" class="spinner"></span>
          <span v-else>🤖 Summary by AI</span>
        </button>
      </div>
    </div>

    <!-- AI Summary Box -->
    <div v-if="aiSummary" class="card glass-premium mb-lg animate-slide-up">
      <div class="card-header border-none">
        <h3>🤖 AI Financial Insight</h3>
        <button class="btn-text" @click="aiSummary = null">Tutup</button>
      </div>
      <div class="ai-content">
        <div class="markdown-body" v-html="formattedAISummary"></div>
      </div>
    </div>

    <!-- Finance Reports Table -->
    <div class="card">
      <div class="card-header">
        <h3>Database Keuangan & RAG</h3>
        <span class="report-count">{{ reports.length }} dokumen</span>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <span>Memuat data keuangan...</span>
      </div>

      <div v-else-if="reports.length === 0" class="empty-state">
        <span class="empty-icon">💸</span>
        <p>Tidak ada data keuangan ditemukan</p>
      </div>

      <div v-else class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Perusahaan</th>
              <th>Judul / Tipe</th>
              <th>Isi Ringkasan</th>
              <th>Metadata</th>
              <th v-if="authStore.isOwner || authStore.isAdmin || authStore.user?.role === 'ceo'">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="report in reports" :key="report.id">
              <td>{{ formatDate(report.metadata?.date || report.created_at) }}</td>
              <td>
                <span class="badge" :class="getCompanyBadgeClass(report._company)">
                  {{ report._company }}
                </span>
              </td>
              <td>
                <strong>{{ report.metadata?.title || 'Laporan' }}</strong>
                <div class="text-tiny">{{ report.metadata?.type || 'Keuangan' }}</div>
              </td>
              <td class="text-wrap">{{ truncate(report.content, 100) }}</td>
              <td>
                <div v-if="report.metadata?.revenue" class="text-tiny">Rev: {{ formatCurrency(report.metadata.revenue) }}</div>
                <div v-if="report.metadata?.expenses" class="text-tiny">Exp: {{ formatCurrency(report.metadata.expenses) }}</div>
                <div class="text-tiny">By: {{ report.metadata?.submitted_by || '-' }}</div>
              </td>
              <td v-if="authStore.isOwner || authStore.isAdmin || authStore.user?.role === 'ceo'">
                <div class="flex gap-sm">
                  <button 
                    class="btn-icon btn-primary" 
                    @click="openReconstructor(report)" 
                    title="Baca Dokumen Asli"
                  >
                    📖
                  </button>
                  <button 
                    v-if="authStore.isOwner"
                    class="btn-icon btn-delete" 
                    @click="confirmDelete(report)" 
                    title="Hapus Laporan"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- RAG Reconstructor Modal -->
    <div v-if="showReconstructor" class="modal-overlay" @click.self="showReconstructor = false">
      <div class="modal-container">
        <button class="modal-close" @click="showReconstructor = false">×</button>
        <RAGDocumentReconstructor 
          v-if="selectedReport"
          :documentId="selectedReport.id"
          :company="selectedReport._company"
          :metadata="selectedReport.metadata"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase, COMPANY_TABLES } from '@/services/supabase'
import { aiService } from '@/services/ai'

// Dynamic import for modal component
const RAGDocumentReconstructor = defineAsyncComponent(() => 
  import('@/components/RAGDocumentReconstructor.vue')
)

const authStore = useAuthStore()
const loading = ref(true)
const aiLoading = ref(false)
const aiSummary = ref(null)
const reports = ref([])
const selectedCompany = ref('all')
const startDate = ref('')
const endDate = ref('')

// Modal State
const showReconstructor = ref(false)
const selectedReport = ref(null)

const companyOptions = computed(() => {
  const all = Object.keys(COMPANY_TABLES).filter(c => c !== 'Owner' && c !== 'Admin')
  if (authStore.user?.role === 'ceo' || authStore.user?.role === 'farmer') {
    const userCompany = authStore.user?.companies?.name
    return all.filter(c => c === userCompany)
  }
  return all
})

function formatCurrency(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val)
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

function truncate(str, len) {
  if (str.length <= len) return str
  return str.slice(0, len) + '...'
}

function getCompanyBadgeClass(company) {
  const classes = {
    'Lyori': 'badge-success',
    'Moafarm': 'badge-info',
    'Kaja': 'badge-warning',
    'ePanen': 'badge-primary'
  }
  return classes[company] || 'badge-secondary'
}

async function loadReports() {
  loading.value = true
  reports.value = []
  
  try {
    let companiesToFetch = []
    
    if (authStore.user?.role === 'ceo' || authStore.user?.role === 'farmer') {
      const userCompany = authStore.user?.companies?.name
      if (!userCompany) throw new Error('Perusahaan user tidak ditemukan.')
      companiesToFetch = [userCompany]
      selectedCompany.value = userCompany
    } else {
      companiesToFetch = selectedCompany.value === 'all' 
        ? companyOptions.value 
        : [selectedCompany.value]
    }

    const allData = []

    for (const company of companiesToFetch) {
      const tableInfo = COMPANY_TABLES[company]
      if (!tableInfo?.finance) continue

      const { data, error } = await supabase
        .from(tableInfo.finance)
        .select('*')
        .order('id', { ascending: false })
        .limit(100)

      if (error) {
        console.error(`Error fetching ${company}:`, error.message)
        continue
      }

      const formatted = (data || []).map(item => ({
        ...item,
        _company: company,
        _table: tableInfo.finance
      }))
      
      allData.push(...formatted)
    }

    // Client-side filtering for safety
    let filteredData = allData
    if (startDate.value) {
      filteredData = filteredData.filter(r => {
        const reportDate = r.metadata?.date || r.created_at
        return reportDate && reportDate >= startDate.value
      })
    }
    if (endDate.value) {
      filteredData = filteredData.filter(r => {
        const reportDate = r.metadata?.date || r.created_at
        return reportDate && reportDate <= endDate.value
      })
    }

    reports.value = filteredData.sort((a, b) => {
      const dateA = new Date(a.metadata?.date || a.created_at || 0)
      const dateB = new Date(b.metadata?.date || b.created_at || 0)
      return dateB - dateA
    })
  } catch (err) {
    console.error('Failed to load financial reports:', err)
  } finally {
    loading.value = false
  }
}

function openReconstructor(report) {
  selectedReport.value = report
  showReconstructor.value = true
}

async function confirmDelete(report) {
  if (!confirm(`Apakah Anda yakin ingin menghapus laporan "${report.metadata?.title || 'ini'}" dari ${report._company}?`)) {
    return
  }

  try {
    const { error } = await supabase
      .from(report._table)
      .delete()
      .eq('id', report.id)

    if (error) throw error
    await loadReports()
  } catch (err) {
    alert('Gagal menghapus: ' + err.message)
  }
}

async function generateAISummary() {
  if (reports.value.length === 0) return
  
  aiLoading.value = true
  aiSummary.value = null
  
  try {
    const period = (startDate.value && endDate.value) 
      ? `${formatDate(startDate.value)} - ${formatDate(endDate.value)}`
      : 'Semua Periode'
      
    aiSummary.value = await aiService.summarizeFinancialPeriod(reports.value, period)
  } catch (err) {
    console.error('AI Insight Error:', err)
    aiSummary.value = "⚠️ Terjadi kesalahan saat menghubungi AI. Periksa koneksi atau API Key Anda."
  } finally {
    aiLoading.value = false
  }
}

const formattedAISummary = computed(() => {
  if (!aiSummary.value) return ''
  // Basic markdown-like replacement
  return aiSummary.value
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/### (.*?)/g, '<h4>$1</h4>')
})

onMounted(() => {
  // Set default dates
  const today = new Date()
  const weekAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  endDate.value = today.toISOString().split('T')[0]
  startDate.value = weekAgo.toISOString().split('T')[0]
  
  loadReports()
})
</script>

<style scoped>
.finance-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.filters-bar {
  display: flex;
  align-items: flex-end;
  gap: var(--space-lg);
}

.filter-group {
  min-width: 200px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--border-color);
}

.report-count {
  font-size: 0.875rem;
  color: var(--text-tertiary);
}

.text-wrap {
  white-space: normal;
  max-width: 300px;
}

.text-tiny {
  font-size: 0.7rem;
  color: var(--text-tertiary);
}

.btn-delete {
  background: var(--error-100);
}

.btn-delete:hover {
  background: var(--error);
  color: white;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-2xl);
  color: var(--text-tertiary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--space-md);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-xl);
}

.modal-container {
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  position: relative;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border: 1px solid var(--border-color);
}

.modal-close {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  background: rgba(0, 0, 0, 0.2);
  border: none;
  font-size: 2rem;
  color: white;
  cursor: pointer;
  z-index: 1100;
  line-height: 1;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--error);
  transform: rotate(90deg);
}
</style>
