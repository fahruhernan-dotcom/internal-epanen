<template>
  <div class="mobile-reports-container">
    <!-- Header -->
    <header class="m-header">
       <h1 class="m-title">Monitoring Aktivitas</h1>
       <div class="m-meta">
          <span class="m-badge">LIVE MONITORING</span>
       </div>
    </header>

    <!-- Simple Filter Scroll -->
    <div class="m-filters-scroll">
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

    <!-- Period Selection -->
    <div class="m-period-tabs">
       <button 
         v-for="type in periodTypes" 
         :key="type.value"
         class="p-tab"
         :class="{ active: selectedPeriodType === type.value }"
         @click="$emit('set-period', type.value)"
       >
         {{ type.label }}
       </button>
    </div>

    <!-- Reports List -->
    <div class="m-reports-list">
       <div v-if="loading" class="m-loading">Memuat data...</div>
       <div v-else-if="!reports.length" class="m-empty">Tidak ada laporan ditemukan.</div>
       <div 
         v-for="rep in reports" 
         :key="rep.id" 
         class="m-report-card"
         @click="$emit('view-detail', rep)"
       >
          <div class="m-card-top">
             <span class="m-card-company">{{ rep.company_name }}</span>
             <span class="m-card-date">{{ formatDate(rep.report_date) }}</span>
          </div>
          <p class="m-card-summary">{{ rep.summary || 'Entri laporan harian operasional.' }}</p>
          <div class="m-card-footer">
             <span class="m-status" :class="{ 'warning': rep.issues }">
               {{ rep.issues ? 'Waspada' : 'Optimal' }}
             </span>
             <AppIcon name="chevron-right" :size="16" />
          </div>
       </div>
    </div>
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
</script>

<style scoped>
.mobile-reports-container {
  padding: 16px;
  background: #0f172a;
  min-height: 100vh;
}

.m-header { margin-bottom: 24px; }
.m-title { font-size: 1.5rem; font-weight: 900; color: white; margin: 0; }
.m-meta { margin-top: 8px; }
.m-badge { 
  font-size: 0.65rem; 
  font-weight: 800; 
  color: #10b981; 
  background: rgba(16, 185, 129, 0.1); 
  padding: 4px 10px; 
  border-radius: 100px;
}

.m-filters-scroll {
  display: flex;
  overflow-x: auto;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.m-filter-chip {
  flex: 0 0 auto;
  padding: 8px 16px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: 700;
}

.m-filter-chip.active {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.m-period-tabs {
  display: flex;
  background: rgba(255,255,255,0.03);
  padding: 4px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.p-tab {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 800;
  border-radius: 8px;
}

.p-tab.active {
  background: rgba(255,255,255,0.07);
  color: white;
}

.m-reports-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.m-report-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 16px;
}

.m-card-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.m-card-company { font-weight: 800; color: #10b981; font-size: 0.85rem; }
.m-card-date { font-size: 0.75rem; color: #475569; }
.m-card-summary { font-size: 0.85rem; color: #94a3b8; line-height: 1.5; margin: 0 0 16px 0; }

.m-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.m-status { font-size: 0.7rem; font-weight: 800; color: #10b981; text-transform: uppercase; }
.m-status.warning { color: #f43f5e; }

.m-loading, .m-empty { text-align: center; color: #475569; padding: 40px 0; font-size: 0.9rem; }
</style>
