<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { useAuthStore } from '@/stores/auth'
import TrendAnalysisChart from '@/components/TrendAnalysisChart.vue'

const props = defineProps({
  stats: Object,
  recentReports: Array,
  aiSummary: String,
  trendData: Object,
  totalConsolidatedProfit: Number,
  loading: Boolean
})

const authStore = useAuthStore()

const roleLabel = computed(() => {
  const role = authStore.user?.role
  if (role === 'ceo') return 'CHIEF EXECUTIVE OFFICER'
  if (role === 'owner') return 'OWNER'
  if (role === 'admin') return 'ADMINISTRATOR'
  return 'OPERATOR'
})

const activeUnitsCount = computed(() => {
  return props.stats?.byCompany ? Object.keys(props.stats.byCompany).length : 0
})

function getCompanyIcon(name) {
  const icons = { 'Lyori': '🍓', 'Kaja': '🥗', 'Moafarm': '🐄', 'ePanen': '🌾', 'Melon': '🍈' }
  return icons[name] || '🏢'
}

function getCompanyColor(name) {
  const colors = {
    'Lyori': '#10b981',
    'Kaja': '#f59e0b',
    'Moafarm': '#3b82f6',
    'ePanen': '#8b5cf6',
    'Melon': '#f43f5e'
  }
  return colors[name] || '#94a3b8'
}

function formatCurrency(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('id-ID', { 
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
  })
}
</script>

<template>
  <div class="mobile-dashboard-hub">
    <!-- Quick Status Bar -->
    <header class="mobile-header-mini">
      <div class="header-left">
        <span class="status-chip">
          <span class="status-dot-pulse"></span>
          SISTEM AKTIF
        </span>
      </div>
      <div class="header-right">
        <span class="role-chip">{{ roleLabel }}</span>
      </div>
    </header>

    <!-- Main Hero Dashboard -->
    <section class="mobile-hero-section">
      <div class="hero-stats-row">
         <div class="mini-status-pod">
            <span class="pod-label">Efisiensi</span>
            <span class="pod-value emerald">94.2%</span>
         </div>
         <div class="mini-status-pod">
            <span class="pod-label">Stabilitas</span>
            <span class="pod-value">Optimal</span>
         </div>
      </div>
      
      <h1 class="mobile-title text-gradient-emerald">Monitoring <br/>Performa Ekosistem</h1>
      <p class="mobile-subtitle">Ringkasan cerdas performa hari ini.</p>
      
      <div class="mobile-kpi-scroll">
        <div class="m-kpi-card emerald">
          <div class="m-icon"><AppIcon name="file-text" :size="18" /></div>
          <div class="m-data">
            <span class="m-label">TOTAL LAPORAN</span>
            <span class="m-value">{{ stats?.totalReports || 0 }}</span>
            <div class="m-trend">+12%</div>
          </div>
        </div>
        <div class="m-kpi-card blue">
          <div class="m-icon"><AppIcon name="calendar" :size="18" /></div>
          <div class="m-data">
            <span class="m-label">LAPORAN BARU</span>
            <span class="m-value">{{ stats?.todayReports || 0 }}</span>
            <div class="m-trend">LIVE</div>
          </div>
        </div>
        <div class="m-kpi-card purple">
          <div class="m-icon"><AppIcon name="trending-up" :size="18" /></div>
          <div class="m-data">
            <span class="m-label">TREM 7 HARI</span>
            <span class="m-value">{{ stats?.weekReports || 0 }}</span>
            <div class="m-trend">+8.4%</div>
          </div>
        </div>
        <div class="m-kpi-card gold">
          <div class="m-icon"><AppIcon name="building-2" :size="18" /></div>
          <div class="m-data">
            <span class="m-label">UNIT AKTIF</span>
            <span class="m-value">{{ activeUnitsCount }}</span>
            <div class="m-trend">SINKRON</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Action Center -->
    <section class="mobile-actions-grid" v-if="authStore.user?.role === 'ceo' || authStore.isAdmin">
       <button class="m-action-btn shimmer" @click="$emit('open-upload')">
          <AppIcon name="upload-cloud" :size="24" />
          <span>Upload Intelligence</span>
       </button>
    </section>

    <!-- Intelligence Briefing -->
    <section class="mobile-ai-section" v-if="aiSummary">
       <div class="ai-glass-card-premium">
          <div class="ai-header-premium">
             <div class="ai-orb-mini"></div>
             <span>Intelijen Bisnis Strategis (30H)</span>
          </div>
          <div class="ai-body-mobile-premium markdown-body-lite-hero" v-html="aiSummary"></div>
       </div>
    </section>

    <!-- Trend Chart Section (BI) -->
    <section class="mobile-bi-section" v-if="trendData">
       <div class="bi-branding-mini">
          <span class="bi-tag">BUSINESS INTELLIGENCE</span>
          <h2 class="bi-title-mini">Trend Forecasting</h2>
       </div>

       <div class="m-chart-card">
          <div class="m-chart-header">
             <span class="m-chart-title">Monthly Net Profit</span>
             <div class="m-chart-year">2026</div>
          </div>
          <div class="m-chart-body">
             <TrendAnalysisChart :data="trendData" />
          </div>
          <div class="m-chart-footer">
             <div class="m-legend-grid">
                <div v-for="(company, name) in trendData?.companies" :key="name" class="m-leg-item">
                   <span class="m-leg-dot" :style="{ background: getCompanyColor(name) }"></span>
                   <span class="m-leg-text">{{ name }}</span>
                </div>
             </div>
          </div>
       </div>

       <div class="m-profit-pod">
          <div class="p-pod-content">
             <span class="p-pod-label">TOTAL CONSOLIDATED PROFIT</span>
             <h2 class="p-pod-value">{{ formatCurrency(totalConsolidatedProfit) }}</h2>
          </div>
          <AppIcon name="shield-check" :size="20" class="text-emerald" />
       </div>
    </section>

    <!-- Navigation Hub -->
    <section class="mobile-nav-hub">
       <h3 class="group-title">Entitas Unit Bisnis</h3>
       <div class="m-list-stack">
          <div 
            v-for="(data, company) in stats?.byCompany" 
            :key="company"
            class="m-list-item"
            @click="$emit('go-to-company', company)"
          >
            <div class="m-item-icon">{{ getCompanyIcon(company) }}</div>
            <div class="m-item-content">
               <span class="m-company-name">{{ company }}</span>
               <span class="m-company-stat">{{ data.total }} Laporan Tersimpan</span>
            </div>
            <AppIcon name="chevron-right" :size="20" class="m-arrow" />
          </div>
       </div>
    </section>

    <!-- Activity Timeline -->
    <section class="mobile-timeline">
       <h3 class="group-title">Aktivitas Terakhir</h3>
       <div class="m-timeline-item" v-for="rep in recentReports" :key="rep.id" @click="$emit('go-to-doc', rep)">
          <div class="t-line"></div>
          <div class="t-dot"></div>
          <div class="t-card">
             <div class="t-header">
                <span class="t-company">{{ rep.company_name }}</span>
                <span class="t-time">{{ formatDate(rep.report_date) }}</span>
             </div>
             <p class="t-desc">{{ rep.summary || 'Laporan operasional harian' }}</p>
          </div>
       </div>
    </section>
  </div>
</template>

<style scoped>
.mobile-dashboard-hub {
  padding: 16px;
  padding-top: 80px; /* Space for sticky header if any */
  padding-bottom: 40px;
  background: #0f172a;
  min-height: 100vh;
}

.mobile-header-mini {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.status-chip {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 0.65rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-dot-pulse {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px #10b981;
}

.role-chip {
  background: rgba(255,255,255,0.05);
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: bold;
}

.mobile-hero-section {
  margin-bottom: 32px;
}

.mobile-title {
  font-size: 1.6rem;
  font-weight: 900;
  margin: 0;
  color: white;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.text-gradient-emerald {
  background: linear-gradient(135deg, #fff 30%, #10b981);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.mobile-subtitle {
  color: #64748b;
  font-size: 0.85rem;
  margin: 8px 0 24px 0;
  font-weight: 600;
}

.hero-stats-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.mini-status-pod {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  padding: 4px 12px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pod-label { font-size: 0.6rem; font-weight: 800; color: #475569; text-transform: uppercase; }
.pod-value { font-size: 0.65rem; font-weight: 900; color: white; }
.pod-value.emerald { color: #10b981; }

.mobile-kpi-scroll {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.m-kpi-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 18px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  overflow: hidden;
}

.m-kpi-card::after {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 40px; height: 40px;
  background: radial-gradient(circle at top right, rgba(255,255,255,0.03), transparent);
  border-radius: 0 0 0 100%;
}

.m-kpi-card.emerald .m-icon { color: #10b981; background: rgba(16, 185, 129, 0.08); }
.m-kpi-card.blue .m-icon { color: #3b82f6; background: rgba(59, 130, 246, 0.08); }
.m-kpi-card.purple .m-icon { color: #8b5cf6; background: rgba(139, 92, 246, 0.08); }
.m-kpi-card.gold .m-icon { color: #f59e0b; background: rgba(245, 158, 11, 0.08); }

.m-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-data { display: flex; flex-direction: column; }
.m-label { font-size: 0.55rem; font-weight: 800; color: #475569; letter-spacing: 0.05em; margin-bottom: 2px; }
.m-value { font-size: 1.4rem; font-weight: 900; color: white; line-height: 1; }
.m-trend { font-size: 0.6rem; font-weight: 800; color: #10b981; margin-top: 4px; }
.m-kpi-card.blue .m-trend { color: #60a5fa; }
.m-kpi-card.purple .m-trend { color: #a78bfa; }
.m-kpi-card.gold .m-trend { color: #fbbf24; }

/* AI Card Premium */
.ai-glass-card-premium {
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 1px;
  margin-bottom: 32px;
  position: relative;
  overflow: hidden;
}

.ai-header-premium {
  background: rgba(255,255,255,0.02);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  color: white;
  font-weight: 800;
  font-size: 0.75rem;
}

.ai-orb-mini {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 10px #10b981;
  animation: pulse-emerald 2s infinite;
}

@keyframes pulse-emerald {
  0% { opacity: 0.4; scale: 1; }
  50% { opacity: 1; scale: 1.2; }
  100% { opacity: 0.4; scale: 1; }
}

.ai-body-mobile-premium {
  padding: 16px;
  font-size: 0.8rem;
}

/* BI Section */
.mobile-bi-section {
  margin-bottom: 32px;
}

.bi-branding-mini {
  margin-bottom: 16px;
}

.bi-tag {
  font-size: 0.55rem;
  font-weight: 900;
  color: #10b981;
  letter-spacing: 0.15em;
}

.bi-title-mini {
  font-size: 1.25rem;
  font-weight: 900;
  color: white;
  margin: 2px 0;
}

.m-chart-card {
  background: #141c2e;
  border: 1px solid rgba(255,255,255,0.03);
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 12px;
}

.m-chart-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.m-chart-title { font-size: 0.75rem; font-weight: 800; color: #94a3b8; }
.m-chart-year { font-size: 0.7rem; font-weight: 800; color: #475569; }

.m-chart-body {
  height: 250px;
  margin-bottom: 16px;
}

.m-chart-footer {
  padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,0.02);
}

.m-legend-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.m-leg-item { display: flex; align-items: center; gap: 6px; }
.m-leg-dot { width: 6px; height: 6px; border-radius: 50%; }
.m-leg-text { font-size: 0.6rem; font-weight: 700; color: #64748b; text-transform: uppercase; }

.m-profit-pod {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(0,0,0,0));
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.p-pod-label { font-size: 0.55rem; font-weight: 800; color: #475569; letter-spacing: 0.05em; display: block; }
.p-pod-value { font-size: 1rem; font-weight: 900; color: white; margin-top: 2px; }

.group-title {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #475569;
  margin-bottom: 16px;
  font-weight: 800;
}

.m-list-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 32px;
}

.m-list-item {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  padding: 16px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.m-item-icon { font-size: 1.25rem; }
.m-item-content { flex: 1; display: flex; flex-direction: column; }
.m-company-name { font-weight: 800; color: white; font-size: 0.9rem; }
.m-company-stat { font-size: 0.7rem; color: #64748b; }
.m-arrow { color: #334155; }

.mobile-timeline {
  display: flex;
  flex-direction: column;
}

.m-timeline-item {
  position: relative;
  padding-left: 32px;
  padding-bottom: 24px;
}

.t-line {
  position: absolute;
  left: 11px;
  top: 24px;
  bottom: 0;
  width: 2px;
  background: rgba(255,255,255,0.05);
}

.t-dot {
  position: absolute;
  left: 6px;
  top: 10px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #10b981;
  border: 3px solid #0f172a;
}

.t-card {
  background: rgba(255,255,255,0.02);
  border-radius: 12px;
  padding: 12px;
}

.t-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.t-company { font-size: 0.75rem; font-weight: 800; color: #10b981; }
.t-time { font-size: 0.65rem; color: #475569; }
.t-desc { font-size: 0.8rem; color: #94a3b8; margin: 0; }

.m-action-btn {
  width: 100%;
  background: #10b981;
  color: white;
  border: none;
  padding: 16px;
  border-radius: 16px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 32px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.shimmer {
  position: relative;
  overflow: hidden;
}

.shimmer::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
  transform: rotate(45deg);
  animation: shimmer-anim 2s infinite;
}

@keyframes shimmer-anim {
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}
</style>
