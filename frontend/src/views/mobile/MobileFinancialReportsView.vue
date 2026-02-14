<template>
  <div class="m-finance-container">
    <!-- Sticky Header -->
    <header class="m-header">
      <div class="h-row">
        <div>
          <span class="m-label">Financial Intelligence</span>
          <h1 class="m-title">Laporan Keuangan</h1>
        </div>
        <button class="m-refresh-btn" @click="$emit('refresh')" :disabled="loading">
          <AppIcon name="refresh-cw" :size="18" :class="{ 'spin': loading }" />
        </button>
      </div>
    </header>

    <main class="m-body">
      <!-- Company Chips -->
      <section class="m-sect" v-if="showCompanyFilter">
        <h3 class="m-sect-label">Perusahaan</h3>
        <div class="m-chips-scroll">
          <div 
            class="m-chip"
            :class="{ active: selectedCompany === 'all' }"
            @click="$emit('select-company', 'all')"
          >Semua</div>
          <div 
            v-for="c in companyOptions" 
            :key="c"
            class="m-chip"
            :class="{ active: selectedCompany === c }"
            @click="$emit('select-company', c)"
          >{{ c }}</div>
        </div>
      </section>

      <!-- Period Selector -->
      <section class="m-sect">
        <h3 class="m-sect-label">Rentang Waktu</h3>
        <div class="m-pills">
          <button 
            v-for="t in periodTypes"
            :key="t.value"
            class="m-pill"
            :class="{ active: selectedPeriodType === t.value }"
            @click="$emit('set-period', t.value)"
          >{{ t.label }}</button>
        </div>
      </section>

      <!-- Upload CTA -->
      <section class="m-sect" v-if="canUpload">
        <button class="m-upload-btn" @click="$emit('upload')">
          <AppIcon name="folder-up" :size="16" />
          <span>Unggah PDF Keuangan</span>
        </button>
      </section>

      <!-- Loading State -->
      <section v-if="loading" class="m-state-box">
        <div class="m-spinner"></div>
        <p>Menganalisa data keuangan...</p>
      </section>

      <!-- Empty State -->
      <section v-else-if="!periods.length" class="m-state-box">
        <AppIcon name="inbox" :size="48" class="m-icon-empty" />
        <p>Tidak ada data laporan.</p>
      </section>

      <!-- Period Cards -->
      <section v-else class="m-periods-list">
        <div class="m-sect-label-row">
          <h3 class="m-sect-label">Laporan {{ periodLabel }}</h3>
          <span class="m-count-badge">{{ periods.length }} Periode</span>
        </div>

        <div 
          v-for="(period, idx) in periods" 
          :key="period.id"
          class="m-period-card"
          :style="{ animationDelay: (idx * 0.06) + 's' }"
          @click="toggleExpand(period.id)"
        >
          <div class="pc-header">
            <div class="pc-left">
              <span class="pc-company" :class="getColor(period.company)">{{ period.company }}</span>
              <h4 class="pc-title">{{ period.label }}</h4>
              <span class="pc-count">{{ period.reports?.length || 0 }} dokumen</span>
            </div>
            <AppIcon :name="expandedId === period.id ? 'chevron-up' : 'chevron-down'" :size="18" class="pc-arrow" />
          </div>

          <!-- Financial Summary -->
          <div class="pc-stats-row">
            <div class="pc-stat">
              <span class="sLabel">Pemasukan</span>
              <span class="sValue green">{{ formatMoney(period.revenue) }}</span>
            </div>
            <div class="pc-stat">
              <span class="sLabel">Pengeluaran</span>
              <span class="sValue red">{{ formatMoney(period.expenses) }}</span>
            </div>
            <div class="pc-stat">
              <span class="sLabel">Laba Bersih</span>
              <span class="sValue" :class="period.netProfit >= 0 ? 'green' : 'red'">{{ formatMoney(period.netProfit) }}</span>
            </div>
          </div>

          <!-- AI Insight (if exists) -->
          <div v-if="period.aiSummary" class="pc-ai-box">
            <div class="ai-label"><AppIcon name="sparkles" :size="12" /> Analisa AI</div>
            <p class="ai-text">{{ truncate(period.aiSummary, 150) }}</p>
          </div>

          <!-- Expanded Detail -->
          <transition name="expand">
            <div v-if="expandedId === period.id" class="pc-details">
              <div 
                v-for="doc in period.reports" 
                :key="doc.id" 
                class="doc-item"
              >
                <div class="doc-top">
                  <span class="doc-date">{{ formatDate(doc.report_date || doc.created_at) }}</span>
                  <span class="doc-ref" v-if="doc.ref_number">{{ doc.ref_number }}</span>
                </div>
                <div class="doc-bottom">
                  <div class="doc-money" v-if="doc.metadata?.revenue">
                    <span class="dm green">+{{ formatMoney(doc.metadata.revenue) }}</span>
                    <span class="dm red">-{{ formatMoney(doc.metadata.expenses) }}</span>
                  </div>
                  <span v-if="doc.metadata?.is_ai_normalized" class="ai-badge">AI ✓</span>
                </div>
              </div>

              <button 
                class="m-gen-ai-btn" 
                @click.stop="$emit('generate-ai', period)"
                :disabled="generatingId === period.id"
              >
                <AppIcon name="sparkles" :size="14" />
                <span>{{ generatingId === period.id ? 'Menganalisa...' : 'Generate AI Insight' }}</span>
              </button>
            </div>
          </transition>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps({
  periods: Array,
  companyOptions: Array,
  selectedCompany: String,
  periodTypes: Array,
  selectedPeriodType: String,
  periodLabel: String,
  loading: Boolean,
  showCompanyFilter: Boolean,
  canUpload: Boolean,
  generatingId: String
})

const expandedId = ref(null)

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function formatMoney(val) {
  if (!val && val !== 0) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })
}

function truncate(t, len) {
  if (!t) return ''
  return t.length > len ? t.substring(0, len) + '...' : t
}

function getColor(company) {
  if (['ePanen', 'Kaja'].includes(company)) return 'emerald'
  if (['Moafarm', 'Melon', 'Lyori'].includes(company)) return 'blue'
  return 'neutral'
}
</script>

<style scoped>
.m-finance-container {
  background: #010409;
  min-height: 100vh;
  color: #e6edf3;
  padding-bottom: 40px;
}

/* Header */
.m-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(1, 4, 9, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding: 14px 20px;
}
.h-row { display: flex; justify-content: space-between; align-items: center; }
.m-label {
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #818cf8;
  letter-spacing: 0.1em;
  margin-bottom: 2px;
  display: block;
}
.m-title {
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(to right, #fff, #94a3b8);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.m-refresh-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid #30363d;
  background: #161b22;
  color: #8b949e;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}
.m-refresh-btn:active { background: #21262d; }
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Body */
.m-body { padding: 16px 20px; }
.m-sect { margin-bottom: 20px; }
.m-sect-label {
  font-size: 0.7rem;
  font-weight: 800;
  color: #8b949e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}

.m-sect-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.m-count-badge {
  font-size: 0.65rem;
  font-weight: 800;
  background: rgba(16,185,129,0.1);
  color: #10b981;
  padding: 3px 10px;
  border-radius: 100px;
}

/* Chips */
.m-chips-scroll {
  display: flex;
  overflow-x: auto;
  gap: 8px;
  padding-bottom: 4px;
  scrollbar-width: none;
}
.m-chip {
  flex: 0 0 auto;
  padding: 8px 16px;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 100px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #8b949e;
  transition: all 0.2s;
}
.m-chip.active {
  background: #10b981;
  border-color: #10b981;
  color: #fff;
}

/* Pills */
.m-pills {
  display: flex;
  background: #161b22;
  border-radius: 12px;
  padding: 3px;
  overflow-x: auto;
  scrollbar-width: none;
}
.m-pill {
  flex: 1;
  background: transparent;
  border: none;
  padding: 8px 4px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #8b949e;
  transition: 0.2s;
  white-space: nowrap;
}
.m-pill.active {
  background: #21262d;
  color: #fff;
}

/* Upload CTA */
.m-upload-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #10b981, #047857);
  border: none;
  border-radius: 14px;
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* States */
.m-state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #484f58;
}
.m-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(16,185,129,0.1);
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}
.m-icon-empty { opacity: 0.3; margin-bottom: 12px; }

/* Period Cards */
.m-periods-list { display: flex; flex-direction: column; gap: 16px; }

.m-period-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 18px;
  padding: 16px;
  opacity: 0;
  transform: translateY(16px);
  animation: slideUp 0.4s forwards;
}

@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}

.pc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}
.pc-company {
  font-size: 0.65rem;
  font-weight: 900;
  padding: 3px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  margin-bottom: 4px;
  display: inline-block;
}
.pc-company.emerald { background: rgba(16,185,129,0.1); color: #10b981; }
.pc-company.blue { background: rgba(59,130,246,0.1); color: #3b82f6; }
.pc-company.neutral { background: rgba(255,255,255,0.05); color: #8b949e; }

.pc-title { font-size: 0.95rem; font-weight: 800; color: #f0f6fc; margin: 4px 0 2px; }
.pc-count { font-size: 0.7rem; color: #484f58; font-weight: 600; }
.pc-arrow { color: #484f58; transition: 0.2s; }

/* Stats Row */
.pc-stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid #21262d;
}
.pc-stat { display: flex; flex-direction: column; gap: 2px; }
.sLabel { font-size: 0.6rem; font-weight: 800; color: #484f58; text-transform: uppercase; }
.sValue { font-size: 0.8rem; font-weight: 800; color: #e6edf3; }
.sValue.green { color: #10b981; }
.sValue.red { color: #f85149; }

/* AI Box */
.pc-ai-box {
  background: rgba(99,102,241,0.06);
  border: 1px solid rgba(99,102,241,0.15);
  border-radius: 12px;
  padding: 10px 12px;
  margin-top: 10px;
}
.ai-label { font-size: 0.6rem; font-weight: 800; color: #818cf8; display: flex; align-items: center; gap: 4px; margin-bottom: 4px; }
.ai-text { font-size: 0.75rem; color: #8b949e; line-height: 1.5; margin: 0; }

/* Details */
.pc-details {
  border-top: 1px solid #21262d;
  margin-top: 12px;
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.doc-item {
  background: #0d1117;
  border: 1px solid #21262d;
  border-radius: 10px;
  padding: 10px 12px;
}
.doc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.doc-date { font-size: 0.7rem; font-weight: 700; color: #8b949e; }
.doc-ref { font-size: 0.65rem; color: #484f58; font-family: monospace; }
.doc-bottom { display: flex; justify-content: space-between; align-items: center; }
.doc-money { display: flex; gap: 12px; }
.dm { font-size: 0.75rem; font-weight: 800; }
.dm.green { color: #10b981; }
.dm.red { color: #f85149; }
.ai-badge { font-size: 0.6rem; font-weight: 800; color: #818cf8; background: rgba(99,102,241,0.1); padding: 2px 8px; border-radius: 6px; }

.m-gen-ai-btn {
  width: 100%;
  padding: 10px;
  background: rgba(99,102,241,0.08);
  border: 1px dashed rgba(99,102,241,0.3);
  border-radius: 12px;
  color: #818cf8;
  font-weight: 700;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 6px;
}
.m-gen-ai-btn:disabled { opacity: 0.5; }

/* Transitions */
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to, .expand-leave-from {
  opacity: 1;
  max-height: 1000px;
}
</style>
