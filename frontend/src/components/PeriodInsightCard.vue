<template>
  <div class="insight-card animate-fade-in-up">
    <!-- Card Header: Visual Health & Date -->
    <div class="card-header glass-header" :class="profitClass" @click="toggleExpand">
      <div class="header-main">
        <div class="period-badge">
          <div class="period-icon-box">
            <AppIcon name="calendar" :size="18" />
          </div>
          <div class="period-info">
            <span class="period-label-text">{{ period.label }}</span>
            <span v-if="showCompany" class="company-subtag">{{ period.company }}</span>
          </div>
        </div>
        
        <div class="header-stats-row">
            <!-- Executive Net Profit -->
            <div class="h-stat-executive">
                <div class="h-value-hero tabular-nums" :class="profitClass">
                    {{ formatCurrency(period.netProfit) }}
                </div>
                <div class="h-label-row">
                    <span class="h-label-muted">NET PROFIT</span>
                    <div v-if="period.isNormalized" class="ai-pill-verified-premium pulse-purple-tight ml-md-plus">
                        <AppIcon name="sparkles" :size="10" />
                        <span>TERVERIFIKASI AI</span>
                    </div>
                    <div v-else-if="isNormalizing" class="ai-pill-loading-small ml-md-plus">
                        <div class="mini-spinner-sage"></div>
                        <span>KALIBRASI...</span>
                    </div>
                </div>
            </div>
            
            <div v-if="healthStatus" class="h-stat-divider"></div>

            <div v-if="healthStatus" class="h-stat-secondary">
                <span class="h-label-muted">HEALTH</span>
                <div class="health-indicator">
                    <span class="indicator-dot" :class="healthStatus.class"></span>
                    <span class="indicator-text">{{ healthStatus.label }}</span>
                </div>
            </div>
        </div>
      </div>
      <div class="expand-icon-box" :class="{ rotated: isExpanded }">
        <AppIcon name="chevron-down" :size="18" />
      </div>
    </div>

    <!-- Card Body: Metrics, Sparkline, AI -->
    <div class="card-body">
      <!-- Left: Key Stats -->
      <div class="metrics-grid">
        <div class="metric-item">
          <span class="m-label">TOTAL OMZET</span>
          <span class="m-value text-emerald tabular-nums">{{ formatCurrency(period.revenue) }}</span>
        </div>
        <div class="metric-item">
          <span class="m-label">PENGELUARAN</span>
          <span class="m-value text-danger tabular-nums">{{ formatCurrency(period.expenses) }}</span>
        </div>
        <div class="metric-item">
          <span class="m-label">AKTIVITAS</span>
          <span class="m-value tabular-nums">{{ period.reports.length }} Dokumen</span>
        </div>
      </div>

      <!-- Center: AI Executive Analysis (Now with Scrollable Minimalize feature) -->
      <div class="executive-analysis" :class="{ 'is-loading': isGenerating }">
        <div class="analysis-header">
            <!-- Replacing brain icon with Premium AI Orb -->
            <div class="ai-orb-wrapper pulse-border">
                <img src="@/assets/images/ai-orb-premium.png" alt="AI Core" class="ai-orb-icon" />
            </div>
            <span class="analysis-title">EXECUTIVE BRIEF</span>
        </div>

        <div v-if="isGenerating" class="analysis-skeleton">
            <div class="skeleton line-1"></div>
            <div class="skeleton line-2"></div>
            <div class="skeleton line-3"></div>
        </div>

        <div v-else-if="period.aiSummary" class="analysis-content scrollable-brief">
          <div class="markdown-body-lite" v-html="sanitizeHTML(formattedAI)"></div>
          <div class="analysis-footer">
            <button class="btn-action-small" @click.stop="$emit('generate-ai', period)">
                <AppIcon name="refresh-cw" :size="12" />
                <span>Regenerate Analysis</span>
            </button>
          </div>
        </div>
        
        <div v-else class="analysis-placeholder">
          <p>Belum ada ringkasan eksekutif periode ini.</p>
          <button class="btn-primary-small" @click.stop="$emit('generate-ai', period)">
             <AppIcon name="sparkles" :size="14" />
             <span>Analisa Sekarang</span>
          </button>
        </div>
      </div>
      
      <!-- Right: Smooth Sparkline Curve -->
       <div class="visual-trend">
        <span class="v-label">TREND HARIAN</span>
        <div class="curve-container">
            <svg class="spark-svg" viewBox="0 0 100 40" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.2" />
                        <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0" />
                    </linearGradient>
                </defs>
                <path :d="curveAreaPath" fill="url(#curveGradient)" />
                <path :d="curveLinePath" fill="none" class="curve-line" stroke-width="2" />
            </svg>
        </div>
        <div class="trend-meta">
            <span class="meta-item">LOW</span>
            <span class="meta-item">HIGH</span>
        </div>
       </div>
    </div>

    <!-- Expanded: Detailed List -->
    <div v-if="isExpanded" class="details-section animate-fade-in">
        <div class="details-inner">
            <div class="section-title">DETIL DOKUMEN & AUDIT LOG</div>
            <div class="nodes-list">
                <div v-for="rep in period.reports" :key="rep.id" class="node-card">
                    <div class="node-header" @click="toggleDoc(rep.id)">
                        <div class="node-main">
                            <span class="node-date">{{ formatDateShort(rep.metadata?.date || rep.created_at) }}</span>
                            <span class="node-title">{{ rep.metadata?.title || 'System Log' }}</span>
                        </div>
                        <div class="node-amount tabular-nums" :class="rep.metadata?.revenue ? 'text-emerald' : 'text-danger'">
                            {{ rep.metadata?.revenue ? '+' + formatCurrency(rep.metadata.revenue) : '-' + formatCurrency(rep.metadata.expenses) }}
                        </div>
                        <div class="node-toggle" :class="{ rotated: expandedDocId === rep.id }">
                            <AppIcon name="chevron-right" :size="14" />
                        </div>
                    </div>

                    <!-- AI Reasoning / Normalization Note -->
                        <div v-if="expandedDocId === rep.id" class="node-expanded animate-fade-in">
                            <div class="audit-top-bar">
                                <div class="audit-badge-premium">
                                    <div class="pulse-ring"></div>
                                    <AppIcon name="cpu" :size="16" />
                                    <span>AI INTEGRITY AUDIT ACTIVE</span>
                                </div>
                                <div class="audit-summary-text">Mencocokkan Business Logic & Validasi Data RAG</div>
                            </div>
                            
                            <div class="audit-logic-grid">
                                <div v-for="item in getDocLogic(rep)" :key="item.label" class="logic-row-card" :class="item.type">
                                    <div class="logic-identity">
                                        <div class="logic-icon-box" :class="item.color">
                                            <AppIcon :name="item.icon" :size="18" />
                                        </div>
                                        <div class="logic-meta">
                                            <span class="l-label">{{ item.label }}</span>
                                            <span class="l-value tabular-nums" :class="item.type">
                                                {{ item.type === 'score' ? item.val + '%' : (item.val !== null ? formatCurrency(item.val) : '-') }}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="logic-analysis">
                                        <div class="analysis-bubble" v-html="sanitizeHTML(highlightAnalysis(item.note))"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="node-actions-area">
                                <button class="btn-premium-outline" @click.stop="toggleChunks(rep.id)">
                                    <AppIcon :name="expandedChunksId === rep.id ? 'eye-off' : 'database'" :size="14" />
                                    <span>{{ expandedChunksId === rep.id ? 'Sembunyikan Silsilah Data' : 'Tinjau Silsilah Sumber (RAG)' }}</span>
                                </button>
                            </div>

                        <!-- Chunks -->
                        <div v-if="expandedChunksId === rep.id" class="rag-chunks animate-fade-in">
                            <div v-for="(chunk, idx) in rep.chunks" :key="chunk.id" class="chunk-box">
                                <div class="chunk-head">
                                    <span>CHUNK #{{ idx + 1 }}</span>
                                    <code>{{ chunk.id.substring(0,8) }}</code>
                                </div>
                                <div class="chunk-body">{{ chunk.content }}</div>
                            </div>
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
import AppIcon from '@/components/AppIcon.vue'
import { sanitizeHTML } from '@/utils/security'

const props = defineProps({
  period: Object,
  isExpanded: Boolean,
  isGenerating: Boolean,
  isNormalizing: Boolean,
  showCompany: Boolean
})

const emit = defineEmits(['toggle', 'generate-ai', 'normalize-ai'])
const expandedDocId = ref(null)
const expandedChunksId = ref(null)

// Computed
const profitClass = computed(() => {
  return props.period.netProfit >= 0 ? 'good-profit' : 'bad-profit'
})

const formattedAI = computed(() => {
    if (!props.period.aiSummary) return ''
    
    let html = props.period.aiSummary
        // Headers
        .replace(/^### (.*$)/gim, '<h3 class="brief-h3">$1</h3>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Numeric Lists
        .replace(/^\d\.\s+(.*$)/gim, '<div class="brief-list-item"><span class="list-num">$&</span></div>')
        // Clean up numeric list span (keep just the number and content)
        .replace(/<span class="list-num">(\d\.)\s+(.*?)<\/span>/gim, '<span class="list-num">$1</span><span class="list-content">$2</span>')
        // Paragraphs (double newlines)
        .replace(/\n\n/g, '</p><p>')
        // Single newlines
        .replace(/\n/g, '<br/>')

    return `<p>${html}</p>`
})

// Smooth SVG Curve Sparkline
const normalizedTrend = computed(() => {
    const data = props.period.dailyTrend || []
    if (data.length === 0) return Array(10).fill(0)
    const max = Math.max(...data)
    if (max === 0) return data.map(() => 0)
    return data.map(v => (v / max) * 100)
})

const curveLinePath = computed(() => {
    const data = normalizedTrend.value
    if (data.length < 2) return ''
    const stepX = 100 / (data.length - 1)
    
    return data.reduce((path, val, i) => {
        const x = i * stepX
        const y = 40 - (val * 0.35 + 2)
        if (i === 0) return `M ${x},${y}`
        
        const prevX = (i - 1) * stepX
        const prevY = 40 - (data[i-1] * 0.35 + 2)
        const cx = (prevX + x) / 2
        return `${path} Q ${prevX},${prevY} ${cx},${(prevY + y) / 2} T ${x},${y}`
    }, '')
})

const curveAreaPath = computed(() => {
    const line = curveLinePath.value
    if (!line) return ''
    return `${line} L 100,40 L 0,40 Z`
})

function toggleExpand() { emit('toggle', props.period.id) }

function toggleDoc(id) {
    if (expandedDocId.value === id) {
        expandedDocId.value = null
        expandedChunksId.value = null
    } else {
        expandedDocId.value = id
    }
}

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
    if (score >= 80) return { label: 'HEALTHY', class: 'dot-emerald' }
    if (score >= 50) return { label: 'WARNING', class: 'dot-warning' }
    return { label: 'CRITICAL', class: 'dot-danger' }
})

function getDocLogic(rep) {
    let reasoning = rep.metadata?.aiReasoning
    if (!reasoning) return []
    if (typeof reasoning === 'string' && reasoning.trim().startsWith('{')) {
        try { reasoning = JSON.parse(reasoning) } catch (e) {}
    }
    
    const profitAnalysis = reasoning.profit_analysis || `LABA BERSIH secara eksplisit disebutkan: ${formatCurrency(rep.metadata?.netProfit || 0)}`

    if (typeof reasoning === 'object' && !Array.isArray(reasoning)) {
        return [
            { icon: 'trending-up', label: 'Omzet', val: rep.metadata?.revenue, type: 'plus', note: reasoning.revenue, color: 'success' },
            { icon: 'trending-down', label: 'Beban', val: rep.metadata?.expenses, type: 'minus', note: reasoning.expenses, color: 'danger' },
            { icon: 'wallet', label: 'Net Profit', val: rep.metadata?.netProfit, type: 'total', note: profitAnalysis, color: 'primary' },
            { icon: 'shield-check', label: 'Audit Log', val: null, type: 'status', note: reasoning.audit, color: 'warning' },
            { icon: 'activity', label: 'Health Index', val: reasoning.score, type: 'score', note: reasoning.status, color: 'emerald' }
        ]
    }
    return [{ icon: 'shield-check', label: 'Audit', val: rep.metadata?.netProfit, type: 'total', note: reasoning, color: 'primary' }]
}

function highlightAnalysis(text) {
    if (!text) return '-'
    // Highlight Currency (Rp 123.456)
    // Highlight Percentages (98%)
    // Highlight Numbers (135M)
    return text
        .replace(/(Rp\s?[\d.,]+)/g, '<strong class="hl-val">$1</strong>')
        .replace(/(\d+%)/g, '<strong class="hl-val">$1</strong>')
        .replace(/(\d+(\.\d+)?[MK])/g, '<strong class="hl-val">$1</strong>')
}

function getScoreClass(score) {
    if (!score) return ''
    if (score >= 90) return 'text-emerald'
    if (score >= 70) return 'text-warning'
    return 'text-danger'
}

function formatCurrency(val) {
  if (val === undefined || val === null) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

function formatDateShort(date) {
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}
</script>

<style scoped>
.insight-card {
    background: var(--bg-card);
    backdrop-filter: var(--glass-blur);
    border-radius: var(--radius-lg);
    border: 1px solid var(--glass-border);
    box-shadow: var(--shadow-main);
    margin-bottom: var(--space-xl);
    transition: var(--transition-main);
    overflow: hidden;
}

/* Glass Header */
.glass-header {
    padding: 24px 32px;
    background: rgba(var(--bg-card-rgb), 0.4);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--glass-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
}

.glass-header.good-profit { border-left: 4px solid var(--color-primary); }
.glass-header.bad-profit { border-left: 4px solid #ef4444; }

.header-main {
    display: flex;
    align-items: center;
    gap: 40px;
    flex: 1;
}

/* Period Badge */
.period-badge {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 180px;
}

.period-icon-box {
    width: 44px;
    height: 44px;
    background: rgba(16, 185, 129, 0.1);
    color: var(--color-primary);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.period-info {
    display: flex;
    flex-direction: column;
}

.period-label-text {
    font-size: 1.125rem;
    font-weight: 800;
    color: var(--text-main);
    letter-spacing: -0.02em;
}

.company-subtag {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* Executive Stat Layout */
.h-stat-executive {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.h-value-hero {
    font-size: 1.75rem;
    font-weight: 850;
    line-height: 1.1;
    color: var(--text-main);
    letter-spacing: -0.04em;
}

.h-value-hero.good-profit { color: var(--text-main); }
.h-value-hero.bad-profit { color: #ef4444; }

.h-label-row {
    display: flex;
    align-items: center;
    margin-top: 6px;
}

.h-label-muted {
    font-size: 0.65rem;
    font-weight: 800;
    color: var(--text-dim);
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.h-stat-secondary {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
}

.h-stat-divider {
    width: 1px;
    height: 40px;
    background: var(--glass-border);
    margin: 0 16px;
}

.expand-icon-box {
    color: var(--text-dim);
    transition: transform 0.3s;
}

.expand-icon-box.rotated { transform: rotate(180deg); }

/* Body Area */
.card-body {
    display: grid;
    grid-template-columns: 180px 1fr 180px;
    gap: 32px;
    padding: 32px;
    background: rgba(var(--bg-card-rgb), 0.2);
}

.metrics-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
    border-right: 1px solid var(--glass-border);
}

.metric-item {
    display: flex;
    flex-direction: column;
}

.m-label {
    font-size: 0.625rem;
    font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 0.05em;
    margin-bottom: 2px;
}

.m-value {
    font-size: 1.125rem;
    font-weight: 800;
    color: var(--text-main);
}

.text-emerald { color: var(--color-primary); }
.text-danger { color: #ef4444; }

/* AI Executive Analysis */
.executive-analysis {
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-radius: 20px; /* Softened edges from standard */
    padding: 2px; /* Slight padding if needed for glow spread */
}

.analysis-header {
    display: flex;
    align-items: center;
    gap: 10px; /* More breathing room */
    padding-left: 4px;
}

/* Premium AI Orb Styles - Wrapper Refactor */
.ai-orb-wrapper {
    position: relative;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden; /* Clips the zoomed image */
    
    /* The fixed border ring */
    border: 1px solid rgba(16, 185, 129, 0.5);
    background: rgba(16, 185, 129, 0.05);
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.2) inset;
    
    display: flex;
    align-items: center;
    justify-content: center;
}

.ai-orb-icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: drop-shadow(0 0 5px rgba(16, 185, 129, 0.4));
    
    /* Slightly less aggressive zoom - Sweet Spot */
    transform: scale(1.25);
    transform-origin: center;
    animation: orbImageBreath 3s ease-in-out infinite;
}

.pulse-border {
    animation: borderBreath 3s ease-in-out infinite;
}

@keyframes borderBreath {
    0%, 100% { border-color: rgba(16, 185, 129, 0.4); box-shadow: 0 0 5px rgba(16, 185, 129, 0.2) inset; }
    50% { border-color: rgba(16, 185, 129, 0.9); box-shadow: 0 0 15px rgba(16, 185, 129, 0.4) inset; }
}

@keyframes orbImageBreath {
    0%, 100% { transform: scale(1.25); filter: drop-shadow(0 0 5px rgba(16, 185, 129, 0.4)); }
    50% { transform: scale(1.35); filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.7)); }
}

.analysis-title {
    font-size: 0.8rem; /* Slightly larger text */
    font-weight: 800;
    color: var(--text-muted);
    letter-spacing: 0.15em;
}

.analysis-content {
    background: rgba(var(--bg-card-rgb), 0.3);
    padding: 20px;
    border-radius: 16px;
    border: 1px solid var(--glass-border);
}

.scrollable-brief {
    max-height: 200px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--glass-border) transparent;
}

.scrollable-brief::-webkit-scrollbar { width: 6px; }
.scrollable-brief::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 10px; }

.markdown-body-lite {
    font-size: 0.9375rem;
    line-height: 1.7;
    color: var(--text-main);
}

.markdown-body-lite :deep(p) {
    margin-bottom: 16px;
}

.markdown-body-lite :deep(.brief-h3) {
    font-size: 0.75rem;
    font-weight: 800;
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 24px 0 12px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.markdown-body-lite :deep(.brief-h3)::before {
    content: "";
    width: 4px;
    height: 12px;
    background: var(--color-primary);
    border-radius: 2px;
    display: inline-block;
}

.markdown-body-lite :deep(.brief-list-item) {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
    padding-left: 4px;
}

.markdown-body-lite :deep(.list-num) {
    font-weight: 800;
    color: var(--color-primary);
    min-width: 20px;
}

.markdown-body-lite :deep(.list-content) {
    flex: 1;
}

.markdown-body-lite :deep(strong) {
    color: var(--color-primary);
    font-weight: 700;
}

.analysis-footer {
    margin-top: 16px;
}

.btn-action-small {
    background: transparent;
    border: 1px solid var(--glass-border);
    color: var(--text-muted);
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
}

.btn-action-small:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
    background: rgba(16, 185, 129, 0.05);
}

/* Visual Trend */
.visual-trend {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.v-label {
    font-size: 0.625rem;
    font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 0.05em;
}

.curve-container {
    height: 80px;
    width: 100%;
    position: relative;
}

.spark-svg { width: 100%; height: 100%; overflow: visible; }
.curve-line { stroke: var(--color-primary); filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3)); }

.trend-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.6rem;
    font-weight: 700;
    color: var(--text-dim);
}

/* Details Section */
.details-section {
    padding: 0 32px 32px;
}

.details-inner {
    border-top: 1px dashed var(--glass-border);
    padding-top: 24px;
}

.section-title {
    font-size: 0.75rem;
    font-weight: 800;
    color: var(--text-dim);
    letter-spacing: 0.1em;
    margin-bottom: 16px;
}

.nodes-list { display: flex; flex-direction: column; gap: 12px; }

.node-card {
    background: rgba(var(--bg-card-rgb), 0.2);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    overflow: hidden;
}

.node-header {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: background 0.2s;
}

.node-header:hover { background: rgba(var(--bg-card-rgb), 0.3); }

.node-main { display: flex; flex-direction: column; flex: 1; }
.node-date { font-size: 0.75rem; color: var(--text-muted); }
.node-title { font-size: 0.9375rem; font-weight: 700; color: var(--text-main); }
.node-amount { font-weight: 800; font-size: 1rem; margin: 0 24px; }
.node-toggle { color: var(--text-dim); transition: transform 0.2s; }
.node-toggle.rotated { transform: rotate(90deg); }

/* Node Expanded Audit Overhaul - Modern Grid */
.node-expanded {
    padding: 32px;
    background: rgba(var(--bg-card-rgb), 0.1);
    border-top: 1px solid var(--glass-border);
}

.audit-top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--glass-border);
}

.audit-badge-premium {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(16, 185, 129, 0.1);
    color: var(--color-primary);
    padding: 6px 16px;
    border-radius: 100px;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    position: relative;
    border: 1px solid rgba(16, 185, 129, 0.2);
}

.pulse-ring {
    width: 6px;
    height: 6px;
    background: var(--color-primary);
    border-radius: 50%;
    animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(3); opacity: 0; }
}

.audit-summary-text {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-dim);
}

.audit-logic-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.logic-row-card {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 24px;
    background: rgba(var(--bg-card-rgb), 0.3);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    padding: 20px;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.logic-row-card:hover {
    background: rgba(var(--bg-card-rgb), 0.5);
    border-color: var(--text-dim);
    transform: translateX(4px);
}

.logic-row-card.total {
    background: linear-gradient(90deg, rgba(16, 185, 129, 0.05), transparent);
    border-left: 4px solid var(--color-primary);
}

.logic-identity {
    display: flex;
    align-items: center;
    gap: 16px;
}

.logic-icon-box {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--bg-card-rgb), 0.5);
    border: 1px solid var(--glass-border);
    flex-shrink: 0;
}

.logic-icon-box.success { color: var(--color-primary); border-color: rgba(16, 185, 129, 0.3); }
.logic-icon-box.danger { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }
.logic-icon-box.primary { color: #6366f1; border-color: rgba(99, 102, 241, 0.3); }
.logic-icon-box.warning { color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); }
.logic-icon-box.emerald { color: #10b981; border-color: rgba(16, 185, 129, 0.3); }

.logic-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.l-label {
    font-size: 0.65rem;
    font-weight: 800;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.l-value {
    font-size: 1.1rem;
    font-weight: 850;
    color: var(--text-main);
}

.l-value.plus { color: var(--color-primary); }
.l-value.minus { color: #ef4444; }

.logic-analysis {
    display: flex;
    align-items: center;
    padding-left: 24px;
    border-left: 1px dashed var(--glass-border);
}

.analysis-bubble {
    font-size: 0.85rem;
    line-height: 1.6;
    color: var(--text-muted);
}

:deep(.hl-val) {
    color: var(--text-main);
    font-weight: 800;
    background: rgba(var(--bg-card-rgb), 0.1);
    padding: 0 4px;
    border-radius: 4px;
}

.node-actions-area {
    margin-top: 32px;
    display: flex;
    justify-content: flex-start;
}

.btn-premium-outline {
    background: rgba(var(--bg-card-rgb), 0.4);
    border: 1px solid var(--glass-border);
    color: var(--text-muted);
    padding: 10px 20px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s;
}

.btn-premium-outline:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: rgba(16, 185, 129, 0.05);
    transform: translateY(-2px);
}

/* AI Pill Premium */
.ai-pill-verified-premium {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(124, 58, 237, 0.04);
    color: #7c3aed;
    padding: 2px 8px;
    border: 1px solid rgba(124, 58, 237, 0.12);
    border-radius: 8px;
    font-size: 0.58rem;
    font-weight: 800;
}

@keyframes pulse-purple-tight {
    0% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.2); }
    70% { box-shadow: 0 0 0 6px rgba(124, 58, 237, 0); }
    100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
}

.pulse-purple-tight { animation: pulse-purple-tight 3s infinite; }
.ml-md-plus { margin-left: 10px; }
</style>
