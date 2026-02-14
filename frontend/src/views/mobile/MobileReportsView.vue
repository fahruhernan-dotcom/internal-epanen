<template>
  <div class="mobile-reports-container">
    <!-- Sticky Header -->
    <header class="m-sticky-header">
       <div class="h-content">
          <div class="h-left">
             <span class="m-section-label">Monitoring</span>
             <h1 class="m-title">Aktivitas Harian</h1>
          </div>
          <div class="h-right">
             <div class="live-pulse"></div>
          </div>
       </div>
    </header>

    <!-- App Content Area -->
    <main class="m-content">
      <!-- Horizontal Filter Scroll -->
      <section class="m-section">
        <h3 class="s-label">Pilih Entitas</h3>
        <div class="m-filters-scroll">
           <div 
             class="m-filter-chip"
             :class="{ active: selectedCompany === 'all' }"
             @click="$emit('select-company', 'all')"
           >
             Semua
           </div>
           <div 
             v-for="company in companyOptions" 
             :key="company"
             class="m-filter-chip"
             :class="{ active: selectedCompany === company }"
             @click="$emit('select-company', company)"
           >
             {{ company }}
           </div>
        </div>
      </section>

      <!-- Period Tabs -->
      <section class="m-section">
        <h3 class="s-label">Rentang Waktu</h3>
        <div class="m-period-pills">
           <button 
             v-for="type in periodTypes" 
             :key="type.value"
             class="m-pill"
             :class="{ active: selectedPeriodType === type.value }"
             @click="$emit('set-period', type.value)"
           >
             {{ type.label }}
           </button>
        </div>
      </section>

      <!-- Reports List -->
      <section class="m-section no-gap">
        <div class="list-meta">
           <span class="l-count">{{ reports.length }} Laporan Ditemukan</span>
        </div>

        <div v-if="loading" class="m-state">
           <div class="m-spinner"></div>
           <p>Sinkronisasi data...</p>
        </div>
        
        <div v-else-if="!reports.length" class="m-state">
           <AppIcon name="inbox" :size="48" class="m-empty-icon" />
           <p>Belum ada data laporan.</p>
        </div>

        <div v-else class="m-stack">
           <div 
             v-for="(rep, index) in reports" 
             :key="rep.id" 
             class="m-card-premium"
             :style="{ animationDelay: (index * 0.08) + 's' }"
             @click="$emit('view-detail', rep)"
           >
              <div class="c-header">
                 <span class="c-company" :class="getCompanyColor(rep._company)">{{ rep._company }}</span>
                 <span class="c-date">{{ formatDate(rep.report_date) }}</span>
              </div>
              
              <div class="c-body">
                 <h4 class="c-title">{{ getActivitiesSummary(rep.activities) }}</h4>
                 <p class="c-summary">{{ truncate(getActivityDetails(rep.activities), 80) }}</p>
              </div>

              <div class="c-footer">
                 <div class="c-status" :class="{ 'has-issues': hasIssues(rep.issues) }">
                    <AppIcon :name="hasIssues(rep.issues) ? 'alert-circle' : 'check-circle'" :size="12" />
                    <span>{{ hasIssues(rep.issues) ? 'Ada Kendala' : 'Lancar' }}</span>
                 </div>
                 <div class="c-weather" v-if="rep.weather">
                    <span>{{ getWeatherIcon(rep.weather) }}</span>
                    <small>{{ rep.weather }}</small>
                 </div>
              </div>
           </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import AppIcon from '@/components/AppIcon.vue'

defineProps({
  reports: Array,
  companyOptions: Array,
  selectedCompany: String,
  periodTypes: Array,
  selectedPeriodType: String,
  loading: Boolean
})

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

function truncate(text, length) {
  if (!text) return 'Laporan operasional harian.'
  return text.length > length ? text.substring(0, length) + '...' : text
}

function getActivitiesSummary(activities) {
  if (!activities) return 'Aktivitas Harian'
  let data = activities
  if (typeof activities === 'string' && activities.trim().startsWith('{')) {
    try { data = JSON.parse(activities) } catch (e) { return activities }
  }
  if (typeof data === 'string') return data
  return data.summary || 'Aktivitas Harian'
}

function getActivityDetails(activities) {
  if (!activities) return ''
  let data = activities
  if (typeof activities === 'string' && activities.trim().startsWith('{')) {
    try { data = JSON.parse(activities) } catch (e) { return '' }
  }
  if (typeof data === 'string') return ''
  return data.details || ''
}

function hasIssues(issues) {
  if (!issues) return false
  if (Array.isArray(issues)) return issues.length > 0
  if (typeof issues === 'object') return Object.keys(issues).length > 0
  return false
}

function getWeatherIcon(weather) {
  if (!weather) return '🌡️'
  const w = weather.toLowerCase()
  if (w.includes('rain') || w.includes('hujan')) return '🌧️'
  if (w.includes('cloud') || w.includes('mendung')) return '☁️'
  if (w.includes('hot') || w.includes('panas')) return '☀️'
  if (w.includes('clear') || w.includes('cerah')) return '🌤️'
  return '🌡️'
}

function getCompanyColor(company) {
    if (['ePanen', 'Kaja'].includes(company)) return 'emerald'
    if (['Moafarm', 'Melon', 'Lyori'].includes(company)) return 'blue'
    return 'neutral'
}
</script>

<style scoped>
.mobile-reports-container {
  background: #010409;
  min-height: 100vh;
  padding-bottom: 40px;
  color: #e6edf3;
}

/* Sticky Header */
.m-sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(1, 4, 9, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 16px 20px;
}

.h-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.m-section-label {
  display: block;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #10b981;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}

.m-title {
  font-size: 1.25rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(to right, #fff, #94a3b8);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.live-pulse {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 10px #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
}

/* Main Content Area */
.m-content { padding: 20px; }
.m-section { margin-bottom: 24px; }
.m-section.no-gap { margin-top: 32px; }

.s-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: #8b949e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

/* Chips and Buttons */
.m-filters-scroll {
  display: flex;
  overflow-x: auto;
  gap: 10px;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.m-filter-chip {
  flex: 0 0 auto;
  padding: 10px 18px;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #8b949e;
  transition: all 0.2s;
}

.m-filter-chip.active {
  background: #10b981;
  border-color: #10b981;
  color: #fff;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.m-period-pills {
  display: flex;
  background: #161b22;
  border-radius: 12px;
  padding: 4px;
}

.m-pill {
  flex: 1;
  background: transparent;
  border: none;
  padding: 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #8b949e;
  transition: all 0.2s;
}

.m-pill.active {
  background: #21262d;
  color: #fff;
}

/* List Area */
.list-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 0 4px;
}

.l-count { font-size: 0.7rem; font-weight: 800; color: #484f58; text-transform: uppercase; }

.m-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.m-card-premium {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 20px;
  padding: 18px;
  opacity: 0;
  transform: translateY(20px);
  animation: slideIn 0.5s forwards;
}

@keyframes slideIn {
  to { opacity: 1; transform: translateY(0); }
}

.c-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.c-company { 
  font-size: 0.7rem; 
  font-weight: 900; 
  padding: 4px 10px; 
  border-radius: 6px; 
  text-transform: uppercase;
}
.c-company.emerald { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.c-company.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.c-company.neutral { background: rgba(255, 255, 255, 0.05); color: #8b949e; }

.c-date { font-size: 0.75rem; color: #484f58; font-weight: 700; }

.c-title {
  font-size: 0.95rem;
  font-weight: 800;
  margin: 0 0 6px 0;
  color: #f0f6fc;
}

.c-summary {
  font-size: 0.8rem;
  color: #8b949e;
  line-height: 1.5;
  margin: 0 0 16px 0;
}

.c-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 14px;
  border-top: 1px solid #30363d;
}

.c-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 800;
  color: #10b981;
}

.c-status.has-issues { color: #f85149; }

.c-weather { display: flex; align-items: center; gap: 8px; }
.c-weather span { font-size: 1.1rem; }
.c-weather small { font-size: 0.65rem; color: #484f58; font-weight: 700; text-transform: uppercase; }

/* States */
.m-state {
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
  border: 3px solid rgba(16, 185, 129, 0.1);
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin { to { transform: rotate(360deg); } }

.m-empty-icon { opacity: 0.3; margin-bottom: 12px; }
</style>
