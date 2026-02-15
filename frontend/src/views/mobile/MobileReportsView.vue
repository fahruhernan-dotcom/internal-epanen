<template>
  <div class="mobile-reports-container">
    <header class="m-premium-header">
       <div class="h-glass-effect"></div>
       <div class="h-content">
          <div class="h-left">
             <div class="h-meta-row">
                <span class="m-badge-mini">LIVE</span>
                <span class="m-divider"></span>
                <span class="m-category">MONITORING</span>
             </div>
             <h1 class="m-title-premium">Aktivitas <span class="text-gradient">Harian</span></h1>
          </div>
          <div class="h-right">
             <div class="status-orb-halo">
               <div class="orb"></div>
             </div>
          </div>
       </div>
    </header>

    <!-- App Content Area -->
    <main class="m-content">
      <!-- Horizontal Filter Scroll -->
      <!-- Filter & Control Hub -->
      <div class="m-control-hub animate-fade-in-up">
        <section class="hub-section">
          <div class="hub-label-row">
            <AppIcon name="building-2" :size="12" />
            <span>PILIH ENTITAS</span>
          </div>
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

        <section class="hub-section mt-4">
          <div class="hub-label-row">
            <AppIcon name="calendar" :size="12" />
            <span>RENTANG WAKTU</span>
          </div>
          <div class="m-period-group">
             <button 
               v-for="type in periodTypes" 
               :key="type.value"
               class="m-period-btn"
               :class="{ active: selectedPeriodType === type.value }"
               @click="$emit('set-period', type.value)"
             >
               {{ type.label }}
             </button>
          </div>
        </section>
      </div>

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
  background: #0f172a;
  min-height: 100vh;
  padding-bottom: 90px;
  color: #f1f5f9;
}

/* Premium Header */
.m-premium-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  padding: 16px 20px;
  overflow: hidden;
}

.h-glass-effect {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.h-content {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.h-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.m-badge-mini {
  font-size: 0.55rem;
  font-weight: 900;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.m-divider {
  width: 3px;
  height: 3px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.m-category {
  font-size: 0.6rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.15em;
}

.m-title-premium {
  font-size: 1.5rem;
  font-weight: 900;
  margin: 0;
  color: white;
  letter-spacing: -0.02em;
}

.text-gradient {
  background: linear-gradient(135deg, #fff, #10b981);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.status-orb-halo {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16, 185, 129, 0.05);
  border-radius: 50%;
}

.orb {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 10px #10b981;
  animation: pulse-halo 2s infinite;
}

@keyframes pulse-halo {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.3; }
  100% { transform: scale(1); opacity: 1; }
}

/* Control Hub */
.m-content { padding: 16px; }

.m-control-hub {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
}

.hub-label-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #64748b;
}

.hub-label-row span {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.m-filters-scroll {
  display: flex;
  overflow-x: auto;
  gap: 8px;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.m-filter-chip {
  flex: 0 0 auto;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #94a3b8;
  transition: all 0.3s;
}

.m-filter-chip.active {
  background: #10b981;
  color: white;
  border-color: #10b981;
  box-shadow: 0 8px 20px -5px rgba(16, 185, 129, 0.4);
}

.m-period-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.m-period-btn {
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  transition: all 0.3s;
}

.m-period-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-color: rgba(255, 255, 255, 0.2);
}

/* Report Stack */
.list-meta {
  padding: 0 4px;
  margin-bottom: 16px;
}

.l-count {
  font-size: 0.7rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.05em;
}

.m-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.m-card-premium {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.4);
  animation: slide-up 0.5s ease backwards;
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.c-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.c-company {
  font-size: 0.6rem;
  font-weight: 900;
  padding: 4px 10px;
  border-radius: 6px;
  letter-spacing: 0.05em;
}

.c-company.emerald { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.c-company.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }

.c-date {
  font-size: 0.75rem;
  font-weight: 800;
  color: #64748b;
}

.c-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: white;
  margin-bottom: 8px;
}

.c-summary {
  font-size: 0.85rem;
  color: #94a3b8;
  line-height: 1.5;
  margin-bottom: 20px;
}

.c-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.c-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 800;
  color: #10b981;
}

.c-status.has-issues { color: #f43f5e; }

.c-weather {
  display: flex;
  align-items: center;
  gap: 6px;
}

.c-weather span { font-size: 1.1rem; }
.c-weather small { font-size: 0.6rem; font-weight: 800; color: #64748b; text-transform: uppercase; }

/* States */
.m-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.m-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(16, 185, 129, 0.1);
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin { to { transform: rotate(360deg); } }

.m-empty-icon { color: #64748b; opacity: 0.2; margin-bottom: 16px; }
.m-state p { font-size: 0.9rem; color: #64748b; font-weight: 600; }
</style>
