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
              <button v-if="canModify && getSubmissionUrl()" @click="openUploadForm" class="action-btn primary">
                <AppIcon name="plus" :size="14" />
                <span>INPUT DATA</span>
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
              <div class="card-content markdown-body" v-html="section.content"></div>
            </div>
          </div>
        </section>

        <!-- Operational Log Layer -->
        <div class="log-suite">
          <div class="log-suite-header">
            <div class="flex items-center gap-sm">
              <div class="header-icon">
                <AppIcon name="activity" :size="18" />
              </div>
              <h3>OPERATIONAL RECORD LOG</h3>
            </div>
            <div class="header-meta">
              <span class="count-pill">{{ reports.length }} RECORDS SYNCED</span>
            </div>
          </div>

          <div v-if="reports.length === 0" class="log-empty">
            <AppIcon name="database" :size="48" class="opacity-10" />
            <p>Waiting for operational data synchronization...</p>
          </div>

          <div v-else class="log-viewport">
            <table class="elite-table">
              <thead>
                <tr>
                  <th>OPERATOR / TIMESTAMP</th>
                  <th>ACTIVITY SUMMARY</th>
                  <th>INTELLIGENCE STATUS</th>
                  <th>METRICS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="report in reports" :key="report.id" class="table-row">
                  <td class="cell-op">
                    <div class="op-box">
                      <span class="op-name">{{ formatOperatorName(report.user_id) }}</span>
                      <span class="op-date">{{ formatDate(report.report_date) }}</span>
                    </div>
                  </td>
                  <td class="cell-main">
                    <p class="activity-excerpt">{{ getActivitiesSummary(report.activities) }}</p>
                  </td>
                  <td class="cell-status">
                    <div :class="['status-pod', hasIssues(report.issues) ? 'issue' : 'nominal']">
                      <div class="dot"></div>
                      <span>{{ hasIssues(report.issues) ? 'ALERT DETECTED' : 'NOMINAL' }}</span>
                    </div>
                  </td>
                  <td class="cell-meta">
                    <div class="meta-pills">
                      <div class="pill" title="Weather">
                        <AppIcon name="sun" :size="12" />
                        <span>{{ report.weather || '-' }}</span>
                      </div>
                      <div v-if="report.notes" class="pill info" :title="report.notes">
                        <AppIcon name="info" :size="12" />
                        <span>DETAIL</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
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

const companyId = computed(() => route.params.id)
const canModify = computed(() => authStore.user && (authStore.isAdmin || authStore.isOwner))

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
  } catch (err) { console.error('Data Load Error:', err) } finally { loading.value = false }
}

const loadAISummary = async (comp, force = false) => {
  aiLoading.value = true
  try {
    const { data: docs } = await supabase.from(VIEWS.ALL_GENERAL_DOCS).select('*').ilike('company_name', `%${comp.name}%`).limit(100)
    aiSummary.value = await aiService.summarizeCompanyProfile(docs || [], comp.id, comp.name, force)
  } catch (err) { console.error('AI error', err) } finally { aiLoading.value = false }
}

const refreshAISummary = () => company.value && loadAISummary(company.value, true)

const getSubmissionUrl = () => {
  if (!company.value) return null
  const name = company.value.name.toLowerCase()
  if (name.includes('lyori')) return 'https://n8n-wrw2bveswawm.cica.sumopod.my.id/form/72b3dbbe-34c7-48f0-b7de-f2e7c017d519'
  if (name.includes('moafarm')) return 'https://n8n-wrw2bveswawm.cica.sumopod.my.id/form/4a20bcf8-ed90-4910-9451-45631fc26fe5'
  if (name.includes('kaja')) return 'https://n8n-wrw2bveswawm.cica.sumopod.my.id/form/ea756b54-6155-4de3-be2a-415bb3cd769e'
  return null
}

const openUploadForm = () => { const url = getSubmissionUrl(); if (url) window.open(url, '_blank') }

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

/* Log Table */
.log-suite { background: rgba(0,0,0,0.15); border-radius: 28px; border: 1px solid var(--glass-border); overflow: hidden; }
.log-suite-header { padding: 1.5rem 2rem; background: rgba(255,255,255,0.01); border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; }
.log-suite-header h3 { font-size: 1rem; font-weight: 900; color: var(--text-main); }
.header-icon { padding: 8px; background: rgba(16,185,129,0.1); color: #10b981; border-radius: 10px; }

.elite-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.elite-table th { padding: 1rem 2rem; text-align: left; font-size: 0.65rem; font-weight: 950; color: var(--text-dim); opacity: 0.4; border-bottom: 1px solid var(--glass-border); }
.table-row td { padding: 1.25rem 2rem; border-bottom: 1px solid var(--glass-border); transition: background 0.2s; }
.table-row:hover td { background: rgba(255,255,255,0.02); }

.op-box { display: flex; flex-direction: column; }
.op-name { font-size: 0.85rem; font-weight: 800; color: var(--text-main); }
.op-date { font-size: 0.7rem; color: var(--text-dim); font-family: var(--font-mono); }
.activity-excerpt { font-size: 0.85rem; line-height: 1.5; color: var(--text-muted); }

.status-pod { display: inline-flex; align-items: center; gap: 8px; padding: 4px 10px; border-radius: 6px; font-size: 0.65rem; font-weight: 900; }
.status-pod .dot { width: 6px; height: 6px; border-radius: 50%; }
.status-pod.nominal { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.status-pod.nominal .dot { background: #10b981; box-shadow: 0 0 5px #10b981; }
.status-pod.issue { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.status-pod.issue .dot { background: #f59e0b; box-shadow: 0 0 5px #f59e0b; }

.meta-pills { display: flex; gap: 8px; }
.pill { display: flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px; background: rgba(255,255,255,0.03); color: var(--text-dim); font-size: 0.65rem; font-weight: 700; border: 1px solid var(--glass-border); }

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
