<template>
  <div class="insight-card animate-slide-up">
    <!-- Card Header: Visual Health & Date -->
    <div class="card-header" :class="profitClass" @click="toggleExpand">
      <div class="header-main">
        <div class="period-badge">
          <span class="period-icon">📅</span>
          <span class="period-text">{{ period.label }}</span>
        </div>
        <div class="profit-badge" :class="profitClass">
          {{ formatCurrency(period.netProfit) }}
          <span class="profit-label">Net Profit</span>
        </div>
      </div>
      <div class="expand-icon" :class="{ rotated: isExpanded }">▼</div>
    </div>

    <!-- Card Body: Metrics, Sparkline, AI -->
    <div class="card-body">
      <!-- Left: Key Stats -->
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Omzet</span>
          <span class="stat-value text-success">{{ formatCurrency(period.revenue) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Pengeluaran</span>
          <span class="stat-value text-danger">{{ formatCurrency(period.expenses) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Dokumen</span>
          <span class="stat-value">{{ period.reports.length }} Dokumen</span>
        </div>
      </div>

      <!-- Center: AI Insight -->
      <div class="ai-insight-box">
        <div v-if="period.aiSummary" class="ai-content markdown-body" v-html="formattedAI"></div>
        <div v-else class="ai-placeholder">
          <p>Belum ada analisis AI untuk periode ini.</p>
          <button class="btn-generate" @click.stop="$emit('generate-ai', period)" :disabled="isGenerating">
            {{ isGenerating ? 'Menganalisa...' : '✨ Analisa Sekarang' }}
          </button>
        </div>
      </div>
      
      <!-- Right: Mini Chart (CSS Sparkline) -->
       <div class="trend-box">
        <span class="trend-label">Trend Harian</span>
        <div class="sparkline-container">
            <div 
                v-for="(val, idx) in normalizedTrend" 
                :key="idx" 
                class="spark-bar"
                :style="{ height: `${val}%` }"
                :title="`Day ${idx+1}`"
            ></div>
        </div>
       </div>
    </div>

    <!-- Expanded: Detailed List -->
    <div v-if="isExpanded" class="card-details animate-fade-in">
        <h4 class="details-title">Detail Transaksi</h4>
        <table class="detail-table">
            <thead>
                <tr>
                    <th>Tanggal</th>
                    <th>Judul</th>
                    <th>Nominal</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="rep in period.reports" :key="rep.id">
                    <td>{{ formatDate(rep.metadata?.date || rep.created_at) }}</td>
                    <td>{{ rep.metadata?.title || 'Laporan' }}</td>
                    <td :class="rep.metadata?.revenue ? 'text-success' : 'text-danger'">
                        {{ rep.metadata?.revenue ? '+' + formatCurrency(rep.metadata.revenue) : '-' + formatCurrency(rep.metadata.expenses) }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  period: Object,
  isExpanded: Boolean,
  isGenerating: Boolean
})

const emit = defineEmits(['toggle', 'generate-ai'])

// Computed
const profitClass = computed(() => {
  return props.period.netProfit >= 0 ? 'good-profit' : 'bad-profit'
})

const formattedAI = computed(() => {
    if (!props.period.aiSummary) return ''
    return props.period.aiSummary
        .replace(/\n/g, '<br/>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
})

const normalizedTrend = computed(() => {
    const data = props.period.dailyTrend || [] // Array of numbers
    if (data.length === 0) return []
    const max = Math.max(...data)
    if (max === 0) return data.map(() => 0)
    return data.map(v => (v / max) * 100)
})

function toggleExpand() {
    emit('toggle', props.period.id)
}

function formatCurrency(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}
</script>

<style scoped>
.insight-card {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  margin-bottom: var(--space-lg);
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.insight-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* Header */
.card-header {
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  border-left: 4px solid transparent;
}

.card-header.good-profit { border-left-color: var(--success); }
.card-header.bad-profit { border-left-color: var(--error); }

.header-main { display: flex; gap: var(--space-xl); align-items: center; }

.period-badge {
    display: flex; align-items: center; gap: var(--space-sm);
    font-weight: 600; font-size: 1.1rem;
}

.profit-badge {
    display: flex; flex-direction: column; align-items: flex-end;
    font-size: 1.2rem; font-weight: 700;
}
.profit-badge.good-profit { color: var(--success); }
.profit-badge.bad-profit { color: var(--error); }

.profit-label { font-size: 0.7rem; font-weight: 400; color: var(--text-tertiary); text-transform: uppercase; }

.expand-icon { font-size: 0.8rem; transition: transform 0.3s; }
.expand-icon.rotated { transform: rotate(180deg); }

/* Body */
.card-body {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    gap: var(--space-lg);
    padding: var(--space-lg);
}

.stats-grid { display: flex; flex-direction: column; gap: var(--space-md); }
.stat-item { display: flex; justify-content: space-between; font-size: 0.9rem; }
.stat-label { color: var(--text-tertiary); }
.stat-value { font-weight: 600; }

.text-success { color: var(--success); }
.text-danger { color: var(--error); }

/* AI Box */
.ai-insight-box {
    background: var(--bg-tertiary);
    padding: var(--space-md);
    border-radius: var(--radius-md);
    font-size: 0.9rem;
    line-height: 1.5;
    position: relative;
    max-height: 150px;
    overflow-y: auto;
}

.btn-generate {
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    border: none; color: white; padding: 8px 16px; border-radius: 20px;
    cursor: pointer; font-size: 0.85rem; margin-top: 10px;
}

/* Trend Sparkline */
.trend-box { display: flex; flex-direction: column; gap: 5px; align-items: center; justify-content: flex-end; height: 100%; }
.trend-label { font-size: 0.7rem; color: var(--text-tertiary); }
.sparkline-container {
    display: flex; align-items: flex-end; gap: 2px;
    height: 80px; width: 100%;
}
.spark-bar {
    flex: 1; background: var(--primary-alpha-50);
    border-radius: 2px 2px 0 0;
    transition: height 0.5s ease;
}
.spark-bar:hover { background: var(--primary); }

/* Details */
.card-details {
    border-top: 1px dashed var(--border-color);
    padding: var(--space-lg);
    background: var(--bg-secondary-alpha-50);
}
.details-title { font-size: 0.9rem; margin-bottom: var(--space-md); color: var(--text-secondary); }
.detail-table { width: 100%; font-size: 0.85rem; border-collapse: collapse; }
.detail-table th { text-align: left; color: var(--text-tertiary); padding: 5px; }
.detail-table td { padding: 5px; border-bottom: 1px solid var(--border-color-alpha); }

@media (max-width: 768px) {
    .card-body { grid-template-columns: 1fr; }
    .header-main { gap: var(--space-md); flex-direction: column; align-items: flex-start; }
    .profit-badge { align-items: flex-start; }
}
</style>
