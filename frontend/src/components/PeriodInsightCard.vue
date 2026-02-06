<template>
  <div class="insight-card animate-slide-up">
    <!-- Card Header: Visual Health & Date -->
    <div class="card-header" :class="profitClass" @click="toggleExpand">
      <div class="header-main">
        <div class="period-badge">
          <span class="period-icon">📅</span>
          <span class="period-text">{{ period.label }}</span>
          <span v-if="showCompany" class="company-tag">{{ period.company }}</span>
        </div>
        <div class="card-profit" :class="profitClass">
        <div v-if="isNormalizing" class="ai-loader">
            <div class="mini-spinner"></div>
            <span>AI Mengkalibrasi...</span>
        </div>
        <template v-else>
            <div class="profit-wrapper">
                <span class="profit-amount" :class="{ 'pulse-text': isNormalizing }">{{ formatCurrency(period.netProfit) }}</span>
                <div v-if="healthStatus" class="health-pill" :class="healthStatus.class">
                    {{ healthStatus.label }} ({{ healthScore }}%)
                </div>
            </div>
            <span class="profit-label">
                NET PROFIT 
                <span v-if="period.isNormalized" class="ai-badge" title="Data dikalibrasi ulang menggunakan AI">✨ Terverifikasi AI</span>
                <span v-if="isNormalizing" class="ai-badge pulse-bg">✨ AI Sedang Menghitung...</span>
            </span>
        </template>
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
      <div class="ai-insight-box" :class="{ 'is-loading': isGenerating }">
        <!-- Premium Processing Overlay -->
        <div v-if="isGenerating" class="premium-ai-overlay">
          <div class="processing-content">
            <div class="ai-orb"></div>
            <div class="processing-text">
               <span class="main-msg">AI Sedang Menganalisa...</span>
               <span class="sub-msg">Mengevaluasi setiap baris laporan untuk akurasi maksimal</span>
            </div>
          </div>
        </div>

        <div v-if="period.aiSummary">
          <div class="ai-content markdown-body" v-html="formattedAI"></div>
          <button class="btn-regenerate" @click.stop="$emit('generate-ai', period)">
            🔄 Regenerate Analysis
          </button>
        </div>
        <div v-else class="ai-placeholder">
          <p>Belum ada analisis AI untuk periode ini.</p>
          <button class="btn-generate" @click.stop="$emit('generate-ai', period)">
             ✨ Analisa Sekarang
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
        <h4 class="details-title">Detail Transaksi & Chunks</h4>
        <div class="transaction-list">
            <div v-for="rep in period.reports" :key="rep.id" class="doc-item">
                <div class="doc-header" @click="toggleDoc(rep.id)">
                    <div class="doc-info">
                        <span class="doc-date">{{ formatDate(rep.metadata?.date || rep.created_at) }}</span>
                        <span class="doc-title">{{ rep.metadata?.title || 'Laporan' }}</span>
                        <span class="chunk-badge">{{ rep.chunks?.length || 1 }} chunks</span>
                    </div>
                    <div class="doc-amount" :class="rep.metadata?.revenue ? 'text-success' : 'text-danger'">
                        {{ rep.metadata?.revenue ? '+' + formatCurrency(rep.metadata.revenue) : '-' + formatCurrency(rep.metadata.expenses) }}
                    </div>
                    <span class="doc-arrow" :class="{ rotated: expandedDocId === rep.id }">▼</span>
                </div>

                <!-- AI Reasoning / Normalization Note -->
                <div v-if="expandedDocId === rep.id" class="ai-reasoning-box animate-fade-in">
                    <div class="ai-logic-header">
                        <span class="sparkle-icon">🧠</span>
                        <strong>AI Business Logic Analysis</strong>
                    </div>
                    <!-- New Audit Table UI -->
                    <div class="logic-table-wrapper">
                        <table class="logic-table">
                            <thead>
                                <tr>
                                    <th>Kategori</th>
                                    <th>Nilai</th>
                                    <th>Analisa Audit AI</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in getDocLogic(rep)" :key="item.label" :class="['l-row', item.type]">
                                    <td class="l-label">
                                        <span v-if="item.type === 'plus'" class="l-icon text-success">⊕</span>
                                        <span v-if="item.type === 'minus'" class="l-icon text-danger">⊖</span>
                                        <span v-if="item.type === 'total'" class="l-icon text-primary">∑</span>
                                        <span v-if="item.type === 'status'" class="l-icon">⚖️</span>
                                        <strong>{{ item.label }}</strong>
                                    </td>
                                    <td class="l-val">{{ item.val !== null ? formatCurrency(item.val) : '-' }}</td>
                                    <td class="l-note">{{ item.note }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- New Source Text Toggle -->
                    <div class="logic-footer">
                        <button class="btn-source-toggle" @click.stop="toggleChunks(rep.id)">
                            {{ expandedChunksId === rep.id ? 'Sembunyikan Sumber Data' : '🔍 Lihat Sumber Teks (RAG Chunks)' }}
                        </button>
                    </div>
                </div>

                <!-- Chunk Breakdown (Now triggered via toggleChunks) -->
                <div v-if="expandedChunksId === rep.id" class="chunk-breakdown animate-fade-in">
                    <div v-for="(chunk, idx) in rep.chunks" :key="chunk.id" class="chunk-item">
                        <div class="chunk-meta">
                            <span class="chunk-label">CHUNK #{{ idx + 1 }}</span>
                            <span class="chunk-id">{{ chunk.id.substring(0,8) }}...</span>
                        </div>
                        <div class="chunk-content">{{ chunk.content }}</div>
                        <div class="chunk-footer">
                            <pre class="metadata-json">{{ JSON.stringify(chunk.metadata, null, 2) }}</pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  period: Object,
  isExpanded: Boolean,
  isGenerating: Boolean,
  isNormalizing: Boolean,
  showCompany: Boolean
})

const emit = defineEmits(['toggle', 'generate-ai', 'normalize-ai'])
const expandedDocId = ref(null)

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

function toggleDoc(id) {
    if (expandedDocId.value === id) {
        expandedDocId.value = null
        expandedChunksId.value = null
    } else {
        expandedDocId.value = id
    }
}

const expandedChunksId = ref(null)
function toggleChunks(id) {
    expandedChunksId.value = expandedChunksId.value === id ? null : id
}

const healthScore = computed(() => {
    const reports = props.period.reports || []
    const scores = reports
        .map(r => r.metadata?.aiReasoning?.score)
        .filter(s => s !== undefined)
    
    if (scores.length === 0) return null
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
})

const healthStatus = computed(() => {
    const score = healthScore.value
    if (score === null) return null
    if (score >= 80) return { label: 'SEHAT', class: 'status-sehat' }
    if (score >= 50) return { label: 'WASPADA', class: 'status-waspada' }
    return { label: 'KRITIS', class: 'status-kritis' }
})

function getDocLogic(rep) {
    const reasoning = rep.metadata?.aiReasoning
    if (!reasoning) return []
    
    // If it's the new structured object
    if (typeof reasoning === 'object' && !Array.isArray(reasoning)) {
        return [
            { label: 'Omzet', val: rep.metadata?.revenue, type: 'plus', note: reasoning.revenue },
            { label: 'Beban', val: rep.metadata?.expenses, type: 'minus', note: reasoning.expenses },
            { label: 'Net Profit', val: rep.metadata?.netProfit, type: 'total', note: reasoning.netProfit },
            { label: 'Audit / Match', val: null, type: 'status', note: reasoning.audit },
            { label: 'Health Score', val: reasoning.score, type: 'score', note: reasoning.status }
        ]
    }

    // Fallback for old string reasoning
    return [
        { label: 'Analisa Terpadu', val: rep.metadata?.netProfit, type: 'total', note: reasoning }
    ]
}

function formatCurrency(val) {
  if (val === undefined || val === null) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
/* Logic Footer & Source Toggle */
.logic-footer {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px dashed rgba(0,0,0,0.05);
    display: flex;
    justify-content: flex-end;
}

.btn-source-toggle {
    background: transparent;
    border: none;
    color: var(--primary-color);
    font-size: 0.72rem;
    font-weight: 600;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 8px;
    transition: all 0.2s;
    opacity: 0.8;
}

.btn-source-toggle:hover {
    background: rgba(99,102,241, 0.08);
    opacity: 1;
}
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
.company-tag {
    background: var(--bg-tertiary);
    color: var(--primary);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-left: 8px;
    border: 1px solid var(--primary-alpha-20);
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
    max-height: 250px;
    overflow-y: auto;
    transition: all 0.3s ease;
    border: 1px solid var(--border-color);
}

.ai-insight-box.is-loading {
    min-height: 150px;
}

/* Premium AI Overlay */
.premium-ai-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(8px);
    z-index: 10;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: var(--radius-md);
    animation: fadeIn 0.3s ease;
}

.processing-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    text-align: center;
}

.ai-orb {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    border-radius: 50%;
    filter: blur(2px);
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.4);
    animation: orbPulse 2s infinite ease-in-out;
}

.processing-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.main-msg {
    font-weight: 700;
    color: var(--primary);
    font-size: 0.95rem;
}

.sub-msg {
    font-size: 0.7rem;
    color: var(--text-tertiary);
    font-style: italic;
}

@keyframes orbPulse {
    100% { transform: scale(0.9); opacity: 0.6; box-shadow: 0 0 10px rgba(34, 197, 94, 0.3); }
    50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 30px rgba(34, 197, 94, 0.6); }
    100% { transform: scale(0.9); opacity: 0.6; box-shadow: 0 0 10px rgba(34, 197, 94, 0.3); }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.btn-generate {
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    border: none; color: white; padding: 8px 16px; border-radius: 20px;
    cursor: pointer; font-size: 0.85rem; margin-top: 10px;
}

.btn-regenerate {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-tertiary);
    padding: 4px 12px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 0.7rem;
    margin-top: 15px;
    transition: all 0.2s;
}

.btn-regenerate:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background: rgba(99,102,241, 0.05);
}

/* Trend Sparkline */
.trend-box { display: flex; flex-direction: column; gap: 5px; align-items: center; justify-content: flex-end; height: 100%; }
/* AI Normalization UI */
.ai-loader {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    color: var(--text-tertiary);
    animation: pulse 1.5s infinite ease-in-out;
}

.mini-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--border-color);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

/* AI Reasoning UI */
.ai-reasoning-box {
    background: rgba(99, 102, 241, 0.05);
    border: 1px solid rgba(99, 102, 241, 0.1);
    border-radius: var(--radius-lg);
    padding: var(--space-md);
    margin: var(--space-sm) var(--space-md);
}

.ai-logic-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    color: var(--primary-color);
    margin-bottom: 8px;
}

.logic-text {
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-style: italic;
    line-height: 1.4;
    margin-bottom: 12px;
}

/* Audit Table UI */
.logic-table-wrapper {
    margin-bottom: 15px;
    background: rgba(255, 255, 255, 0.4);
    border-radius: var(--radius-md);
    border: 1px solid rgba(0, 0, 0, 0.05);
    overflow: hidden;
}

.logic-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
}

.logic-table th {
    text-align: left;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.03);
    color: var(--text-tertiary);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.65rem;
    letter-spacing: 0.05em;
}

.l-row td {
    padding: 10px 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.03);
    vertical-align: top;
}

.l-label {
    white-space: nowrap;
    width: 120px;
    color: var(--text-secondary);
}

.l-icon { margin-right: 6px; font-style: normal; }

.l-val {
    font-weight: 700;
    white-space: nowrap;
    width: 140px;
}

.l-note {
    color: var(--text-tertiary);
    line-height: 1.4;
    font-style: italic;
}

/* Row Specific Colors */
.plus .l-val { color: var(--success-color); }
.minus .l-val { color: var(--danger-color); }
.total { background: rgba(99, 102, 241, 0.03); }
.total .l-val { color: var(--primary-color); }
.status { background: rgba(0, 0, 0, 0.02); }
.status .l-note { font-weight: 600; color: var(--text-secondary); font-style: normal; }

.ai-badge {
    background: rgba(99, 102, 241, 0.1);
    color: #818cf8;
    padding: 2px 6px;
    border-radius: 12px;
    font-size: 0.65rem;
    font-weight: 600;
    margin-left: 6px;
    border: 1px solid rgba(99, 102, 241, 0.2);
    text-transform: uppercase;
}

/* Profit & Health Header */
.profit-wrapper {
    display: flex;
    align-items: center;
    gap: var(--space-md);
}

.health-pill {
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: var(--shadow-sm);
}

.status-sehat { background: #22c55e; color: white; }
.status-waspada { background: #eab308; color: white; }
.status-kritis { background: #ef4444; color: white; }

/* Table Row: Score */
.score { background: rgba(34, 197, 94, 0.04); }
.score .l-val { color: #16a34a; }
.score .l-note { font-weight: 700; text-transform: uppercase; color: #16a34a; font-size: 0.7rem; }

.profit-amount {
    font-size: 1.5rem;
    font-weight: 700;
}

.profit-label {
    display: flex;
    align-items: center;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
}

.pulse-text {
    animation: textPulse 1.5s infinite ease-in-out;
}

.pulse-bg {
    animation: bgPulse 1.5s infinite ease-in-out;
    background: rgba(99, 102, 241, 0.2);
}

@keyframes textPulse {
    0% { opacity: 0.7; transform: scale(0.98); }
    50% { opacity: 1; transform: scale(1.02); }
    100% { opacity: 0.7; transform: scale(0.98); }
}

@keyframes bgPulse {
    0% { background: rgba(99, 102, 241, 0.1); }
    50% { background: rgba(99, 102, 241, 0.3); }
    100% { background: rgba(99, 102, 241, 0.1); }
}

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
/* Transaction & Chunk List */
.transaction-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.doc-item {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    overflow: hidden;
}

.doc-header {
    padding: var(--space-sm) var(--space-md);
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: background 0.2s;
}

.doc-header:hover {
    background: var(--bg-tertiary);
}

.doc-info {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    flex: 1;
}

.doc-date {
    font-size: 0.8rem;
    color: var(--text-tertiary);
    min-width: 80px;
}

.doc-title {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-secondary);
}

.chunk-badge {
    background: var(--bg-tertiary);
    color: var(--text-tertiary);
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 10px;
}

.doc-amount {
    font-weight: 700;
    font-size: 0.9rem;
    margin-right: 15px;
}

.doc-arrow {
    font-size: 0.7rem;
    color: var(--text-tertiary);
    transition: transform 0.2s;
}
.doc-arrow.rotated { transform: rotate(180deg); }

/* Chunk Breakdown Details */
.chunk-breakdown {
    background: var(--bg-tertiary-alpha-50);
    padding: var(--space-md);
    border-top: 1px solid var(--border-color-alpha);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

.chunk-item {
    background: var(--bg-primary);
    border-left: 3px solid var(--primary);
    padding: var(--space-md);
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
    box-shadow: var(--shadow-sm);
}

.chunk-meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--border-color-alpha);
    padding-bottom: 4px;
}

.chunk-label {
    font-size: 0.7rem;
    font-weight: 800;
    color: var(--primary);
}

.chunk-id {
    font-family: monospace;
    font-size: 0.7rem;
    color: var(--text-tertiary);
}

.chunk-content {
    font-size: 0.85rem;
    line-height: 1.4;
    white-space: pre-wrap;
    color: var(--text-primary);
    margin-bottom: 10px;
}

.chunk-footer {
    background: #00000010;
    padding: 8px;
    border-radius: 4px;
}

.metadata-json {
    font-family: monospace;
    font-size: 0.75rem;
    color: #0066cc;
    margin: 0;
    overflow-x: auto;
}

@media (max-width: 768px) {
    .card-body { grid-template-columns: 1fr; }
    .header-main { gap: var(--space-md); flex-direction: column; align-items: flex-start; }
    .profit-badge { align-items: flex-start; }
}
</style>
