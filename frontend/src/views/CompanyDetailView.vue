<template>
  <div class="company-detail animate-fade-in-up">
    <!-- Progress Loader -->
    <div v-if="loading" class="flex flex-col items-center justify-center h-[70vh] text-muted">
      <div class="spinner-premium mb-md"></div>
      <span class="text-sm font-bold tracking-widest opacity-50">INITIALIZING SYSTEMS...</span>
    </div>

    <template v-else-if="company">
      <!-- Integrated Dashboard Header (Composite Brand + KPI) -->
      <div class="elite-header-composite mb-lg">
        <div class="brand-unit">
          <div class="brand-icon-pod" :class="getCompanyColorClass(company.code)">
            <AppIcon :name="getCompanyIconName(company.code)" :size="28" />
          </div>
          <div class="brand-info">
            <h1 class="brand-name">{{ company.name }}</h1>
            <div class="brand-badges">
              <span class="badge-code">{{ company.code }}</span>
              <span class="badge-status" :class="company.is_active ? 'active' : 'inactive'">
                {{ company.is_active ? 'LIVE OPERATIONS' : 'SUSPENDED' }}
              </span>
            </div>
          </div>
        </div>

        <div class="kpi-hub">
          <div class="kpi-item">
            <label>TOTAL RECORDS</label>
            <span class="kpi-value">{{ stats.total }}</span>
          </div>
          <div class="kpi-item" :class="{ 'highlight': stats.today > 0 }">
            <label>TODAY VOLUME</label>
            <span class="kpi-value">{{ stats.today }}</span>
          </div>
          <div class="kpi-item">
            <label>7D CYCLE</label>
            <span class="kpi-value">{{ stats.week }}</span>
          </div>
          <div class="kpi-item accent">
            <label>TOTAL VIEWS</label>
            <span class="kpi-value">{{ reports.length }}</span>
          </div>
        </div>
      </div>

      <!-- Main Dashboard Content -->
      <div class="dashboard-workspace">
        <!-- AI Intelligence Layer -->
        <section v-if="aiSummary || aiLoading" class="intelligence-suite mb-xl">
          <div class="suite-header">
            <div class="suite-title">
              <div class="ai-orb"></div>
              <h3>CORTEX BUSINESS INTELLIGENCE</h3>
            </div>
            <div class="suite-actions">
              <button @click="refreshAISummary" class="action-btn" :disabled="aiLoading">
                <AppIcon name="refresh-cw" :size="14" :class="{ 'animate-spin': aiLoading }" />
                <span>REFRESH AI</span>
              </button>

            </div>
          </div>

          <div v-if="aiLoading" class="ai-loading-stream">
            <div class="stream-bar"></div>
            <p>Decoding operational vectors...</p>
          </div>

          <div v-else class="intelligence-grid">
            <div v-for="(section, idx) in filteredInsights" :key="idx" 
                 class="insight-card" :class="section.color">
              <div class="card-header">
                <AppIcon :name="section.icon" :size="16" />
                <h4>{{ section.title }}</h4>
              </div>
              <div class="card-content markdown-body" v-html="sanitizeHTML(section.content)"></div>
            </div>
          </div>
        </section>

        <!-- Operational Log Layer -->
        <div class="log-suite">
          <div class="log-suite-header">
            <div class="flex items-center gap-sm">
              <div class="header-icon" :class="{ 'syncing': loading || reports.length === 0 }">
                <AppIcon :name="loading ? 'refresh-cw' : 'activity'" :size="18" :class="{ 'animate-spin': loading }" />
              </div>
              <div class="header-titles">
                <h3>OPERATIONAL RECORD LOG</h3>
                <p class="header-subtitle">Real-time ledger of field activities and resource allocation</p>
              </div>
            </div>
            <div class="header-meta">
              <div v-if="loading" class="status-badge processing">
                <span class="dot-blink"></span>
                <span>SYNCING NODE...</span>
              </div>
              <span v-else class="count-pill">{{ reports.length }} RECORDS SYNCED</span>
            </div>
          </div>

          <!-- Syncing / Data Viewport -->
          <div class="log-viewport">
            <!-- Dynamic Sync Orchestrator (Shown during loading) -->
            <div v-if="loading" class="log-status-orchestrator syncing">
              <div class="orchestrator-viz">
                <div class="viz-radar active">
                  <div class="radar-line"></div>
                  <div class="radar-circles">
                    <span></span><span></span><span></span>
                  </div>
                  <div class="central-node shadow-glow">
                    <AppIcon name="refresh-cw" :size="32" class="text-primary animate-spin" />
                  </div>
                </div>
                <!-- Animated Data Packets -->
                <div class="data-packets">
                  <div v-for="i in 8" :key="i" class="packet" :style="{ '--delay': (i * 0.2) + 's', '--angle': (i * 45) + 'deg' }"></div>
                </div>
              </div>

              <div class="orchestrator-content">
                <div class="sync-step-container">
                  <div class="sync-pulse-bar"></div>
                  <h4 class="console-text">{{ syncMessage }}</h4>
                </div>
                <p class="empty-message">Mengambil ledger operasional dari server distribusi ePanen...</p>
              </div>
            </div>

            <!-- Table View (Visible when data exists or in skeleton mode if preferred, but we use orchestrator for main loading now) -->
            <table v-if="!loading && reports.length > 0" class="elite-table">
              <thead>
                <tr>
                  <th>OPERATOR / TIMESTAMP</th>
                  <th>ACTIVITY SUMMARY</th>
                  <th>INTELLIGENCE STATUS</th>
                  <th>METRICS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(report, idx) in reports" :key="report.id" 
                    class="table-row animate-fade-in" 
                    :style="{ animationDelay: (idx * 0.05) + 's' }">
                  <td class="cell-op">
                    <div class="op-box">
                      <span class="op-name">{{ formatOperatorName(report.user_id) }}</span>
                      <span class="op-date">{{ formatDate(report.report_date) }}</span>
                    </div>
                  </td>
                  <td class="cell-main">
                    <p class="activity-excerpt text-balance">{{ getActivitiesSummary(report.activities) }}</p>
                  </td>
                  <td class="cell-status">
                    <div :class="['status-pod-v5', hasIssues(report.issues) ? 'issue' : 'nominal']">
                      <div class="glow-point"></div>
                      <span>{{ hasIssues(report.issues) ? 'ALERT DETECTED' : 'NOMINAL' }}</span>
                    </div>
                  </td>
                  <td class="cell-meta">
                    <div class="meta-pills">
                      <div class="pill-v3" :title="'Weather: ' + (report.weather || 'Normal')">
                        <AppIcon name="sun" :size="12" />
                        <span>{{ report.weather || '-' }}</span>
                      </div>
                      <div v-if="report.notes" class="pill-v3 info" :title="report.notes">
                        <AppIcon name="info" :size="12" />
                        <span>DETAIL</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Truly Empty State (Only if not loading and 0 reports) -->
            <div v-if="!loading && reports.length === 0" class="log-status-orchestrator empty">
              <div class="orchestrator-viz">
                <div class="viz-radar">
                  <div class="radar-circles">
                    <span></span><span></span><span></span>
                  </div>
                  <div class="central-node shadow-glow">
                    <AppIcon name="database" :size="32" class="text-primary opacity-20" />
                  </div>
                </div>
              </div>

              <div class="orchestrator-content">
                <h4>INTEGRITAS DATA TERJAGA</h4>
                <p class="empty-message">Belum ada record operasional yang tercatat untuk unit bisnis ini dalam index sistem (Sync-A1).</p>
                
                <div class="orchestrator-actions">

                  <button @click="loadCompanyData" class="action-btn">
                    <AppIcon name="refresh-cw" :size="14" />
                    <span>PERBARUI INDEX</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Error State -->
    <div v-else class="error-slate">
      <div class="error-icon">🏢</div>
      <h2>ENTITY NOT FOUND</h2>
      <p>The requested business unit is not registered in the system index.</p>
      <router-link to="/" class="btn-back">RETURN TO HUB</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { supabase, COMPANY_TABLES, VIEWS } from '@/services/supabase'
import { aiService } from '@/services/ai'
import { useAuthStore } from '@/stores/auth'
import AppIcon from '@/components/AppIcon.vue'
import { sanitizeHTML } from '@/utils/security'

// System: Synchronizing component view state...

const route = useRoute()
const authStore = useAuthStore()

// State
const loading = ref(true)
const aiLoading = ref(false)
const company = ref(null)
const reports = ref([])
const aiSummary = ref('')
const stats = ref({ total: 0, today: 0, week: 0 })
const syncMessage = ref('Establishing secure data tunnel...')

const companyId = computed(() => route.params.id)
const canModify = computed(() => authStore.user && (authStore.isAdmin || authStore.isOwner))

// Sync Message Rotation
const syncMessages = [
  'Establishing secure data tunnel...',
  'Synchronizing with Supabase node-A...',
  'Applying AI intelligence mapping...',
  'Verifying record signatures...',
  'Compiling operational ledger...',
  'Finalizing system index...'
]

let messageIdx = 0
let messageInterval = null

const startSyncSimulation = () => {
  messageIdx = 0
  syncMessage.value = syncMessages[0]
  if (messageInterval) clearInterval(messageInterval)
  messageInterval = setInterval(() => {
    messageIdx = (messageIdx + 1) % syncMessages.length
    syncMessage.value = syncMessages[messageIdx]
  }, 1200)
}

const stopSyncSimulation = () => {
  if (messageInterval) clearInterval(messageInterval)
}

// UI Helpers
const getCompanyIconName = (code) => {
  const iconMap = {
    'Lyori': 'layers', 'moafarm': 'sprout', 'Kaja': 'feather', 'EP': 'layout', 'ePanen': 'layout', 'ML': 'circle', 'Melon': 'circle'
  }
  return iconMap[code] || 'briefcase'
}

const getCompanyColorClass = (code) => {
    if (code === 'Lyori') return 'orange'
    if (code === 'moafarm') return 'emerald'
    return 'blue'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const truncate = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const filteredInsights = computed(() => {
  if (!aiSummary.value) return []
  
  const sections = []
  const parts = aiSummary.value.split(/(?=^#+ |\d\. )/gm)
  
  parts.forEach((part, idx) => {
    if (!part.trim()) return
    
    const titleMatch = part.match(/^(?:#+ |\d\. )(.*?)$/m)
    const title = titleMatch ? titleMatch[1] : `Poin Analisis ${idx + 1}`
    const contentText = part.replace(/^(?:#+ |\d\. ).*$/m, '').trim()
    
    if (!contentText) return

    let icon = 'info'; let color = 'blue'
    if (title.toLowerCase().includes('struktur') || title.toLowerCase().includes('profil')) {
      icon = 'briefcase'; color = 'emerald';
    } else if (title.toLowerCase().includes('risiko') || title.toLowerCase().includes('gap') || title.toLowerCase().includes('audit')) {
      icon = 'shield-alert'; color = 'amber';
    } else if (title.toLowerCase().includes('strategi') || title.toLowerCase().includes('rekomendasi') || title.toLowerCase().includes('prospek')) {
      icon = 'trending-up'; color = 'purple';
    } else if (title.toLowerCase().includes('tim') || title.toLowerCase().includes('organisasi')) {
      icon = 'users'; color = 'blue';
    }
    
    sections.push({ title, icon, color, content: renderMarkdown(contentText) })
  })
  
  return sections
})

const parseInline = (text) => {
  if (!text) return ''
  return text
    // 1. Semantic Key-Value Pair (Labels)
    .replace(/\*\*(.*?)\*\*[:：]/g, '<span class="md-key-label">$1</span><span class="md-key-divider">:</span>')
    .replace(/\*\*(.*?):\*\*/g, '<span class="md-key-label">$1</span><span class="md-key-divider">:</span>')
    
    // 2. Business Model Badges (B2B, B2C, etc)
    .replace(/\b(B2B|B2C|B2G|SaaS|Hulu|Hilir)\b/g, '<span class="md-badge-lite">$1</span>')
    
    // 3. Date & Timeline Recognition (e.g., 23 Mei 2025)
    .replace(/(\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)\s+\d{4})/gi, 
             '<span class="md-date-highlight">$1</span>')
    
    // 4. Standard Markdown
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="md-inline-code">$1</code>')
    
    // 5. High Performance Numerics (Only digits not inside other tags)
    .replace(/(?<![A-Za-z0-9>])(\d+[\d,.]*)(?![A-Za-z0-9<])/g, '<span class="md-num">$1</span>')
}

const renderMarkdown = (text) => {
  if (!text) return ''
  const lines = text.trim().split('\n')
  let result = ''; let inList = false; let inTable = false
  let parentGroup = false 
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    if (!trimmed) { 
      if (inList) { result += '</ul>'; inList = false }
      if (inTable) { result += '</tbody></table></div>'; inTable = false }
      parentGroup = false; continue 
    }
    
    const isTableRow = trimmed.startsWith('|') && trimmed.endsWith('|')
    const isTableDivider = trimmed.match(/^[|\-\s:]+$/) && trimmed.includes('-')
    
    if (isTableRow && !isTableDivider) {
      if (!inTable) {
        result += '<div class="md-table-viewport"><table class="md-table-elite"><thead>'
        const cols = trimmed.split('|').filter(c => c.trim() !== '')
        result += '<tr>' + cols.map(c => `<th>${c.trim()}</th>`).join('') + '</tr></thead><tbody>'
        inTable = true; continue
      }
      const cols = trimmed.split('|').filter(c => (c.trim() || true)).slice(1, -1)
      result += '<tr>' + cols.map(c => `<td>${parseInline(c.trim())}</td>`).join('') + '</tr>'
      continue
    } else if (isTableDivider) continue
    else if (inTable) { result += '</tbody></table></div>'; inTable = false }

    const listMatch = line.match(/^(\s*)([•\-\d+\.]+)\s+(.*)/)
    if (listMatch) {
      if (!inList) { result += '<ul class="md-elite-stack">'; inList = true }
      
      let content = listMatch[3].trim()
      const isParentHeading = content.match(/^\*\*(.*?)\*\*[:：]$/) 
      const hasLabelPrefix = content.match(/^\*\*(.*?)\*\*[:：]/)
      const noIndent = listMatch[1].length === 0
      
      if (hasLabelPrefix && noIndent) {
        parentGroup = isParentHeading
        if (!isParentHeading && i + 1 < lines.length) {
          const nextLine = lines[i+1].match(/^(\s*)([•\-\d+\.]+)\s+(.*)/)
          if (nextLine && !nextLine[3].trim().match(/^\*\*(.*?)\*\*[:：]/)) {
            content += ' ' + nextLine[3].trim(); i++
          }
        }
        result += `<li class="md-parent-item">${parseInline(content)}</li>`
        continue
      }
      
      if (parentGroup) {
        result += `<li class="md-nested-item">${parseInline(content)}</li>`
      } else {
        result += `<li class="md-parent-item">${parseInline(content)}</li>`
      }
    } else if (trimmed.startsWith('#')) {
      if (inList) { result += '</ul>'; inList = false }
      parentGroup = false
      const level = trimmed.match(/^#+/)[0].length
      result += `<h${level + 2} class="md-header-elite">${parseInline(trimmed.replace(/^#+\s+/, ''))}</h${level + 2}>`
    } else {
      if (inList) { result += '</ul>'; inList = false }
      parentGroup = false
      result += `<p class="md-paragraph-elite">${parseInline(trimmed)}</p>`
    }
  }
  
  if (inList) result += '</ul>'
  if (inTable) result += '</tbody></table></div>'
  return result
}

// Logic & Data Fetching
const safeParseJson = (str) => {
  try {
    if (typeof str !== 'string') return str
    const p = JSON.parse(str)
    return typeof p === 'string' ? JSON.parse(p) : p
  } catch { return null }
}

const getActivitiesSummary = (activities) => {
  if (!activities) return '-'
  const data = typeof activities === 'string' ? safeParseJson(activities) : activities
  if (data?.summary) return data.summary
  if (data?.details) return truncate(data.details, 120)
  return typeof activities === 'string' ? truncate(activities, 120) : '-'
}

const formatOperatorName = (userId) => userId ? (userId.length > 20 ? 'OP-' + userId.substring(0, 4).toUpperCase() : userId) : '-'

const hasIssues = (issues) => {
  if (!issues) return false
  if (typeof issues === 'string') {
    const t = issues.trim().toLowerCase()
    return !['-', 'none', '', 'aman', 'tidak ada kendala'].includes(t)
  }
  return Array.isArray(issues) ? issues.length > 0 : !!issues
}

const loadCompanyData = async () => {
  loading.value = true
  aiSummary.value = ''
  startSyncSimulation()
  try {
    const { data: comp } = await supabase.from('companies').select('*').eq('id', companyId.value).single()
    if (!comp) return
    company.value = comp

    const tableConfig = Object.entries(COMPANY_TABLES).find(([_, c]) => c.id === companyId.value)?.[1]
    if (tableConfig) {
      const { data: r } = await supabase.from(tableConfig.dailyReports).select('*').order('report_date', { ascending: false }).limit(50)
      reports.value = r || []

      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const [tRes, todayRes, weekRes] = await Promise.all([
        supabase.from(tableConfig.dailyReports).select('*', { count: 'exact', head: true }),
        supabase.from(tableConfig.dailyReports).select('*', { count: 'exact', head: true }).eq('report_date', today),
        supabase.from(tableConfig.dailyReports).select('*', { count: 'exact', head: true }).gte('report_date', weekAgo)
      ])
      stats.value = { total: tRes.count || 0, today: todayRes.count || 0, week: weekRes.count || 0 }
    }
    loadAISummary(comp)
  } catch (err) { 
    console.error('Data Load Error:', err) 
  } finally { 
    loading.value = false 
    stopSyncSimulation()
  }
}

const loadAISummary = async (comp, force = false) => {
  aiLoading.value = true
  try {
    const { data: docs } = await supabase.from(VIEWS.ALL_GENERAL_DOCS).select('*').ilike('company_name', `%${comp.name}%`).limit(100)
    aiSummary.value = await aiService.summarizeCompanyProfile(docs || [], comp.id, comp.name, force)
  } catch (err) { console.error('AI error', err) } finally { aiLoading.value = false }
}

const refreshAISummary = () => company.value && loadAISummary(company.value, true)



watch(companyId, () => loadCompanyData())
onMounted(() => loadCompanyData())
</script>

<style scoped>
/* Composite Header */
.elite-header-composite {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.5rem 2rem; background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--glass-border); border-radius: 24px;
  backdrop-filter: blur(12px);
}

.brand-unit { display: flex; align-items: center; gap: 1.25rem; }
.brand-icon-pod {
  width: 60px; height: 60px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); color: white;
}
.brand-icon-pod.emerald { background: linear-gradient(135deg, #10b981, #059669); }
.brand-icon-pod.orange { background: linear-gradient(135deg, #f97316, #ea580c); }

.brand-name { font-size: 1.75rem; font-weight: 900; color: var(--text-main); letter-spacing: -0.04em; margin-bottom: 4px; }
.brand-badges { display: flex; gap: 8px; align-items: center; }
.badge-code { font-size: 0.7rem; font-weight: 800; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; color: var(--text-dim); }
.badge-status { font-size: 0.65rem; font-weight: 900; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.05em; }
.badge-status.active { background: rgba(16, 185, 129, 0.1); color: #10b981; }

.kpi-hub { display: flex; gap: 1.5rem; }
.kpi-item { display: flex; flex-direction: column; min-width: 100px; padding: 0.5rem 1rem; border-radius: 16px; background: rgba(255,255,255,0.02); border: 1px solid transparent; }
.kpi-item.highlight { border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.03); }
.kpi-item.accent { border-color: rgba(59, 130, 246, 0.3); background: rgba(59, 130, 246, 0.03); }
.kpi-item label { font-size: 0.6rem; font-weight: 800; color: var(--text-dim); opacity: 0.5; margin-bottom: 2px; }
.kpi-item .kpi-value { font-size: 1.5rem; font-weight: 900; color: var(--text-main); font-family: var(--font-mono); }

/* Workspace Layout */
.dashboard-workspace { display: flex; flex-direction: column; gap: 2rem; }

/* Intelligence Suite */
.intelligence-suite { background: rgba(255,255,255,0.01); border-radius: 32px; padding: 2rem; border: 1px solid var(--glass-border); }
.suite-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.suite-title { display: flex; align-items: center; gap: 10px; }
.ai-orb { width: 12px; height: 12px; border-radius: 50%; background: #10b981; box-shadow: 0 0 15px #10b981; animation: pulse-green 2s infinite; }
.suite-title h3 { font-size: 0.9rem; font-weight: 950; color: var(--text-main); letter-spacing: 0.1em; }

.action-btn {
  display: flex; align-items: center; gap: 8px; padding: 0 16px; height: 38px; border-radius: 12px;
  background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: var(--text-main);
  font-size: 0.75rem; font-weight: 800; cursor: pointer; transition: all 0.2s;
}
.action-btn.primary { background: var(--color-primary); color: white; border: none; }
.action-btn:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }

.intelligence-grid { display: flex; flex-direction: column; gap: 1.5rem; }
.insight-card { 
  background: rgba(255,255,255,0.02); border-radius: 24px; padding: 2rem; border: 1px solid var(--glass-border);
  transition: all 0.3s ease; position: relative; width: 100%;
}
.insight-card:hover { transform: translateY(-4px); background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.15); }
.card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 1rem; }
.card-header h4 { font-size: 1rem; font-weight: 850; color: var(--text-main); }
.insight-card.emerald .card-header { color: #10b981; }
.insight-card.amber .card-header { color: #f59e0b; }
.insight-card.purple .card-header { color: #a855f7; }

/* Markdown Styling with Deep Selectors - Elite Professional System */
:deep(.markdown-body) { font-size: 1rem; color: var(--text-muted); line-height: 1.8; letter-spacing: -0.015em; font-family: 'Inter', sans-serif; }
:deep(.md-header-elite) { font-size: 0.9rem; font-weight: 950; color: var(--color-primary); margin: 2rem 0 1rem; text-transform: uppercase; letter-spacing: 0.15em; border-left: 4px solid var(--color-primary); padding-left: 1rem; }
:deep(.md-paragraph-elite) { margin-bottom: 1.5rem; opacity: 0.9; }

:deep(.md-elite-stack) { list-style: none; padding: 0.5rem 0; margin: 1rem 0; }
:deep(.md-parent-item) { position: relative; padding-left: 1.75rem; margin-bottom: 1.25rem; }
:deep(.md-parent-item::before) { content: ""; position: absolute; left: 0; top: 0.75em; width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary); box-shadow: 0 0 12px var(--color-primary); }

:deep(.md-nested-item) { position: relative; padding-left: 2.5rem; margin-bottom: 0.75rem; opacity: 0.85; }
:deep(.md-nested-item::before) { content: ""; position: absolute; left: 0.75rem; top: 0.85em; width: 12px; height: 1.5px; background: rgba(16, 185, 129, 0.4); border-radius: 2px; }

/* Advanced Semantic Entities */
:deep(.md-key-label) { color: var(--text-main); font-weight: 900; background: rgba(255, 255, 255, 0.05); padding: 2px 8px; border-radius: 6px; letter-spacing: -0.02em; font-size: 0.9em; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05); }
:deep(.md-key-divider) { color: var(--color-primary); font-weight: 900; margin: 0 6px; opacity: 0.6; }
:deep(.md-num) { color: #2dd4bf; font-weight: 800; font-family: var(--font-mono); font-size: 1.05em; background: rgba(45, 212, 191, 0.05); padding: 0 4px; border-radius: 4px; }
:deep(.md-date-highlight) { color: #fbbf24; font-weight: 700; border-bottom: 1px dashed rgba(251, 191, 36, 0.3); padding-bottom: 1px; }
:deep(.md-badge-lite) { font-size: 0.65rem; font-weight: 900; color: #818cf8; border: 1px solid rgba(129, 140, 248, 0.3); padding: 1px 6px; border-radius: 4px; margin: 0 4px; text-transform: uppercase; }
:deep(.md-inline-code) { font-family: var(--font-mono); font-size: 0.85em; background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 6px; color: #f43f5e; box-shadow: 0 0 0 1px rgba(244, 63, 94, 0.1); }

/* Elite Table Design */
:deep(.md-table-viewport) { overflow-x: auto; margin: 2rem 0; border-radius: 16px; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); position: relative; }
:deep(.md-table-elite) { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
:deep(.md-table-elite th) { background: rgba(255,255,255,0.02); color: var(--text-dim); font-weight: 850; text-align: left; padding: 1.25rem 1.5rem; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid var(--glass-border); font-size: 0.7rem; }
:deep(.md-table-elite td) { padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.03); color: var(--text-muted); line-height: 1.5; vertical-align: middle; }
:deep(.md-table-elite tr:last-child td) { border-bottom: none; }
:deep(.md-table-elite tr:hover td) { background: rgba(255,255,255,0.015); color: var(--text-main); }

/* Log Table Layer */
.log-suite { 
  background: rgba(0,0,0,0.15); 
  border-radius: 32px; 
  border: 1px solid var(--glass-border); 
  overflow: hidden; 
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.3);
}

.log-suite-header { 
  padding: 2.25rem 2.25rem 1.75rem; 
  background: rgba(255,255,255,0.01); 
  border-bottom: 1px solid var(--glass-border); 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
}

.header-titles { display: flex; flex-direction: column; }
.log-suite-header h3 { font-size: 1.15rem; font-weight: 950; color: var(--text-main); letter-spacing: -0.02em; line-height: 1; }
.header-subtitle { font-size: 0.75rem; color: var(--text-dim); opacity: 0.5; margin-top: 4px; font-weight: 500; }

.header-icon { 
  padding: 10px; 
  background: rgba(255,255,255,0.03); 
  color: var(--text-dim); 
  border-radius: 14px; 
  border: 1px solid var(--glass-border);
  transition: all 0.3s ease;
}
.header-icon.syncing { border-color: var(--color-primary); color: var(--color-primary); box-shadow: 0 0 15px rgba(16, 185, 129, 0.2); }

.status-badge { 
  display: flex; align-items: center; gap: 8px; 
  padding: 6px 12px; border-radius: 20px; font-size: 0.65rem; font-weight: 850;
  background: rgba(255,255,255,0.05); color: var(--text-dim);
}
.status-badge.processing { color: var(--color-primary); border: 1px solid rgba(16, 185, 129, 0.2); }
.dot-blink { width: 6px; height: 6px; background: var(--color-primary); border-radius: 50%; animation: blink-soft 1s infinite alternate; }

/* Orchestrator Viz (Syncing/Empty state) */
.log-status-orchestrator {
  padding: 6rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

/* Ambient Background Glows */
.log-status-orchestrator::before {
  content: "";
  position: absolute;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
  pointer-events: none;
}

.orchestrator-viz { 
  position: relative; 
  width: 140px; 
  height: 140px; 
  z-index: 1;
}

.viz-radar { 
  width: 100%; 
  height: 100%; 
  border: 1px solid rgba(255,255,255,0.05); 
  border-radius: 50%; 
  position: relative;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.02) 0%, transparent 80%);
}

.radar-line {
  position: absolute; 
  width: 50%; 
  height: 80px; 
  background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.4));
  top: 50%; 
  left: 50%; 
  transform-origin: 0% 0%; 
  opacity: 0;
  clip-path: polygon(0 50%, 100% 0, 100% 100%);
  margin-top: -40px;
}

.viz-radar.active .radar-line { 
  animation: radar-spin 4s linear infinite; 
  opacity: 1; 
}

.radar-circles span {
  position: absolute; 
  border: 1px solid rgba(16, 185, 129, 0.1); 
  border-radius: 50%;
  top: 50%; 
  left: 50%; 
  transform: translate(-50%, -50%);
}
.radar-circles span:nth-child(1) { width: 40%; height: 40%; }
.radar-circles span:nth-child(2) { width: 70%; height: 70%; }
.radar-circles span:nth-child(3) { width: 100%; height: 100%; }

.viz-radar.active .radar-circles span { 
  animation: pulse-ripple 4s infinite cubic-bezier(0.4, 0, 0.2, 1); 
}

.central-node {
  position: absolute; 
  top: 50%; 
  left: 50%; 
  transform: translate(-50%, -50%);
  width: 64px; 
  height: 64px; 
  background: rgba(15, 23, 42, 0.8); 
  border: 1px solid rgba(16, 185, 129, 0.3); 
  border-radius: 20px;
  display: flex; 
  align-items: center; 
  justify-content: center; 
  z-index: 2;
  backdrop-filter: blur(12px);
  box-shadow: 0 0 40px rgba(16, 185, 129, 0.15);
}

.data-packets { 
  position: absolute; 
  inset: -40px; 
  pointer-events: none;
}

.packet {
  position: absolute; 
  width: 4px; 
  height: 4px; 
  background: var(--color-primary); 
  border-radius: 50%;
  filter: blur(1px); 
  top: 50%; 
  left: 50%; 
  opacity: 0;
  box-shadow: 0 0 10px var(--color-primary);
}

.viz-radar.active + .data-packets .packet { 
  animation: fly-in-v2 2.5s infinite ease-in var(--delay); 
}

.orchestrator-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.sync-step-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.sync-pulse-bar {
  width: 120px;
  height: 2px;
  background: rgba(255,255,255,0.05);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.sync-pulse-bar::after {
  content: "";
  position: absolute;
  width: 40px;
  height: 100%;
  background: var(--color-primary);
  left: -40px;
  animation: bar-slide 2s infinite ease-in-out;
  box-shadow: 0 0 15px var(--color-primary);
}

.console-text { 
  font-family: var(--font-mono); 
  color: var(--color-primary); 
  font-size: 0.75rem; 
  font-weight: 800;
  letter-spacing: 0.2em; 
  text-transform: uppercase;
  text-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
}

.orchestrator-content h4 { 
  font-size: 1.25rem; 
  font-weight: 900; 
  color: var(--text-main); 
  letter-spacing: 0.05em; 
  margin: 0;
}

.empty-message { 
  font-size: 0.95rem; 
  color: var(--text-dim); 
  opacity: 0.7; 
  max-width: 440px; 
  margin: 0 auto; 
  line-height: 1.7; 
  font-weight: 400;
}

.orchestrator-actions { 
  display: flex; 
  gap: 1.25rem; 
  margin-top: 1rem; 
  justify-content: center; 
}
.large-btn { height: 44px !important; padding: 0 24px !important; border-radius: 14px !important; }

/* Table View */
.elite-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.elite-table th { 
  padding: 1.25rem 2.25rem; text-align: left; font-size: 0.7rem; font-weight: 950; 
  color: var(--text-dim); opacity: 0.5; border-bottom: 1px solid var(--glass-border); 
  background: rgba(0,0,0,0.1); text-transform: uppercase; letter-spacing: 0.1em;
}

.table-row td { padding: 1.5rem 2.25rem; border-bottom: 1px solid var(--glass-border); transition: all 0.3s; }
.table-row:hover td { background: rgba(255,255,255,0.02); }

.op-box { display: flex; flex-direction: column; gap: 4px; }
.op-name { font-size: 0.9rem; font-weight: 850; color: var(--text-main); }
.op-date { font-size: 0.75rem; color: var(--text-dim); font-family: var(--font-mono); opacity: 0.6; }
.activity-excerpt { font-size: 0.9rem; line-height: 1.6; color: var(--text-muted); font-weight: 500; }

.status-pod-v5 { 
  display: inline-flex; align-items: center; gap: 10px; padding: 6px 12px; 
  border-radius: 8px; font-size: 0.7rem; font-weight: 900; border: 1px solid transparent; 
}
.glow-point { width: 8px; height: 8px; border-radius: 50%; }
.status-pod-v5.nominal { background: rgba(16, 185, 129, 0.08); color: #10b981; border-color: rgba(16, 185, 129, 0.1); }
.status-pod-v5.nominal .glow-point { background: #10b981; box-shadow: 0 0 10px #10b981; }
.status-pod-v5.issue { background: rgba(245, 158, 11, 0.08); color: #f59e0b; border-color: rgba(245, 158, 11, 0.1); }
.status-pod-v5.issue .glow-point { background: #f59e0b; box-shadow: 0 0 10px #f59e0b; }

.pill-v3 { 
  display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 8px; 
  background: rgba(255,255,255,0.03); color: var(--text-dim); font-size: 0.7rem; 
  font-weight: 800; border: 1px solid var(--glass-border); transition: all 0.2s;
}
.pill-v3:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }

/* Custom Animations */
@keyframes radar-spin { 
  from { transform: rotate(0deg); } 
  to { transform: rotate(360deg); } 
}

@keyframes pulse-ripple { 
  0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0; } 
  20% { opacity: 0.4; }
  100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; } 
}

@keyframes fly-in-v2 { 
  0% { opacity: 0; transform: rotate(var(--angle, 0deg)) translateY(-100px) scale(0); } 
  50% { opacity: 1; transform: rotate(var(--angle, 0deg)) translateY(-40px) scale(1.5); } 
  100% { opacity: 0; transform: rotate(var(--angle, 0deg)) translateY(0) scale(0.5); } 
}

@keyframes bar-slide {
  from { left: -40px; }
  to { left: 120px; }
}

@keyframes blink-soft { 
  from { opacity: 0.4; transform: scale(0.9); } 
  to { opacity: 1; transform: scale(1.1); } 
}

/* Skeleton Loading Utilities */
.skeleton-box {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}
.skeleton-box::after {
  content: "";
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  animation: skeleton-shimmer 1.5s infinite;
}
@keyframes skeleton-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

.w-24 { width: 6rem; }
.w-20 { width: 5rem; }
.w-12 { width: 3rem; }
.w-full { width: 100%; }
.w-2\/3 { width: 66.666667%; }
.h-10 { height: 2.5rem; }
.h-6 { height: 1.5rem; }
.h-4 { height: 1rem; }

/* Animation Utils */
.spinner-premium { width: 40px; height: 40px; border: 3px solid rgba(16, 185, 129, 0.1); border-top-color: #10b981; border-radius: 50%; animation: spin 1s linear infinite; }
.ai-loading-stream { padding: 4rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
.stream-bar { width: 48px; height: 3px; background: #10b981; border-radius: 2px; animation: stream-shimmer 2s infinite ease-in-out; }

@keyframes stream-shimmer { 0%, 100% { transform: scaleX(0.5); opacity: 0.2; } 50% { transform: scaleX(2); opacity: 1; } }
@keyframes pulse-green { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1024px) {
  .elite-header-composite {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
    padding: 1.5rem;
  }
  
  .kpi-hub {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 8px;
    -webkit-overflow-scrolling: touch;
  }

  .intelligence-suite {
    padding: 1.5rem;
  }

  .suite-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .suite-actions {
    width: 100%;
    display: flex;
    gap: 8px;
  }

  .suite-actions .action-btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .company-detail {
    padding: 0 !important;
  }

  .brand-name {
    font-size: 1.5rem;
  }

  .brand-icon-pod {
    width: 48px;
    height: 48px;
  }

  .kpi-item {
    min-width: 120px;
  }

  .insight-card {
    padding: 1.25rem;
  }

  .log-viewport {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .elite-table {
    min-width: 700px;
  }

  .log-suite-header {
    padding: 1rem 1.25rem;
  }

  .table-row td {
    padding: 1rem 1.25rem;
  }
}
</style>
