<template>
  <div class="mobile-dashboard-hub">
    <!-- Quick Status Bar -->
    <header class="mobile-header-mini">
      <div class="header-left">
        <span class="status-chip">
          <span class="status-dot-pulse"></span>
          ACTIVE
        </span>
      </div>
      <div class="header-right">
        <span class="role-chip">{{ roleLabel }}</span>
      </div>
    </header>

    <!-- Main Hero Dashboard -->
    <section class="mobile-hero-section">
      <h1 class="mobile-title">Ringkasan Sistem</h1>
      <p class="mobile-subtitle">Performa ePanen hari ini</p>
      
      <div class="mobile-kpi-scroll">
        <div class="m-kpi-card emerald">
          <div class="m-icon"><AppIcon name="file-text" :size="20" /></div>
          <div class="m-data">
            <span class="m-label">TOTAL LAPORAN</span>
            <span class="m-value">{{ stats?.totalReports || 0 }}</span>
          </div>
        </div>
        <div class="m-kpi-card blue">
          <div class="m-icon"><AppIcon name="calendar" :size="20" /></div>
          <div class="m-data">
            <span class="m-label">BARU HARI INI</span>
            <span class="m-value">{{ stats?.todayReports || 0 }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Action Center -->
    <section class="mobile-actions-grid" v-if="authStore.user?.role === 'ceo'">
       <button class="m-action-btn shimmer" @click="$emit('open-upload')">
          <AppIcon name="upload-cloud" :size="24" />
          <span>Upload Intelligence</span>
       </button>
    </section>

    <!-- Intelligence Briefing -->
    <section class="mobile-ai-section" v-if="aiSummary">
       <div class="ai-glass-card">
          <div class="ai-header">
             <AppIcon name="sparkles" :size="18" />
             <span>Analisa Bisnis Strategis</span>
          </div>
          <div class="ai-body-mobile" v-html="aiSummary"></div>
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

<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  stats: Object,
  recentReports: Array,
  aiSummary: String,
  loading: Boolean
})

const authStore = useAuthStore()

const roleLabel = computed(() => {
  const role = authStore.user?.role
  if (role === 'ceo') return 'CEO'
  if (role === 'owner') return 'OWNER'
  return 'ADMIN'
})

function getCompanyIcon(name) {
  const icons = { 'Lyori': '🍓', 'Kaja': '🦆', 'Moafarm': '🐄', 'ePanen': '🌾', 'Melon': '🍈' }
  return icons[name] || '🏢'
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}
</script>

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
  font-size: 1.75rem;
  font-weight: 900;
  margin: 0;
  color: white;
}

.mobile-subtitle {
  color: #94a3b8;
  font-size: 0.9rem;
  margin: 4px 0 20px 0;
}

.mobile-kpi-scroll {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.m-kpi-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 20px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.m-kpi-card.emerald .m-icon { color: #10b981; background: rgba(16, 185, 129, 0.1); }
.m-kpi-card.blue .m-icon { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }

.m-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-data { display: flex; flex-direction: column; }
.m-label { font-size: 0.55rem; font-weight: 800; color: #64748b; letter-spacing: 0.05em; }
.m-value { font-size: 1.5rem; font-weight: 900; color: white; }

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

/* AI Card */
.ai-glass-card {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(0,0,0,0));
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 32px;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #34d399;
  font-weight: 800;
  font-size: 0.85rem;
  margin-bottom: 12px;
}

.ai-body-mobile {
  font-size: 0.85rem;
  color: #ccd6e0;
  line-height: 1.6;
}

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
  background: linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent);
  transform: rotate(45deg);
  animation: shimmer-anim 2s infinite;
}

@keyframes shimmer-anim {
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}
</style>
