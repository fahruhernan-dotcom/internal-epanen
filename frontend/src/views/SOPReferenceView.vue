<template>
  <div class="sop-page animate-fade-in" :class="{ 'embedded-mode': embedded }">
    <header v-if="!embedded" class="dashboard-header mb-lg">
      <span class="section-label">Farmer Support</span>
      <h2 class="gradient-text">Buku Saku SOP</h2>
      <p class="text-muted">Panduan standar operasional untuk memastikan kualitas terbaik di setiap panen SmartFarm.</p>
    </header>

    <div class="sop-grid" :class="{ 'single-col': embedded }">
      <!-- SOP List Sidebar -->
      <div v-if="!selectedSOP || !embedded" class="sop-list card glass-premium">
        <div class="search-box mb-md">
          <input type="text" v-model="searchQuery" placeholder="Cari SOP..." class="form-input" />
        </div>
        
        <div class="list-container">
          <div 
            v-for="sop in filteredSOPs" 
            :key="sop.id"
            class="sop-item"
            :class="{ active: selectedSOP?.id === sop.id }"
            @click="selectedSOP = sop"
          >
            <span class="sop-category">{{ sop.category }}</span>
            <div class="sop-title">{{ sop.title }}</div>
            <span class="sop-version">v{{ sop.version }}</span>
          </div>
        </div>
      </div>

      <!-- SOP Content Viewer -->
      <div v-if="selectedSOP" class="sop-content card-nature glass-premium">
        <div class="back-btn-wrapper mb-md" v-if="embedded">
            <button class="btn-text" @click="selectedSOP = null">← Kembali ke Daftar</button>
        </div>

        <div class="sop-viewer">
          <div class="sop-header">
            <div class="flex justify-between items-start">
              <div>
                <span class="badge badge-success mb-sm">{{ selectedSOP.category }}</span>
                <h3>{{ selectedSOP.title }}</h3>
              </div>
              <button class="btn btn-secondary btn-sm" @click="printSOP" aria-label="Print SOP">
                <AppIcon name="printer" :size="16" />
                <span class="ml-sm">Cetak</span>
              </button>
            </div>
            <div class="sop-meta mt-sm text-tiny">
              Diterbitkan: {{ selectedSOP.date }} • Penulis: {{ selectedSOP.author }}
            </div>
          </div>
          
          <div class="sop-body mt-lg" v-html="selectedSOP.content"></div>
          
          <div class="sop-footer mt-xl pt-lg border-top">
            <div class="sop-agreement card glass-premium">
              <p class="text-sm italic">"Saya telah membaca dan memahami SOP ini serta berkomitmen untuk menjalankannya dengan penuh integritas."</p>
              <button class="btn btn-primary mt-sm w-full">Konfirmasi Pemahaman</button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="!embedded" class="empty-state">
        <AppIcon name="book-open" :size="48" />
        <p>Pilih salah satu SOP di sebelah kiri untuk membaca detailnya.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps({
    embedded: { type: Boolean, default: false }
})

const searchQuery = ref('')
const selectedSOP = ref(null)

const sops = ref([
  {
    id: 1,
    title: 'Standar Pemanenan Cabe Merah',
    category: 'Panen',
    version: '2.1',
    date: '15 Jan 2026',
    author: 'Manager Produksi',
    content: `
      <h4>1. Kriteria Matang</h4>
      <p>Cabe harus berwarna merah minimal 90% pada permukaan kulit. Hindari memanen cabe yang masih hijau atau terlalu lembek.</p>
      <h4>2. Teknik Memetik</h4>
      <p>Petik bersama tangkainya secara perlahan. Gunakan keranjang berbahan bambu atau plastik berlubang untuk sirkulasi udara.</p>
      <h4>3. Penanganan Pasca Panen</h4>
      <p>Simpan di tempat teduh dengan suhu optimal 10-12°C. Jangan ditumpuk lebih dari 30cm untuk menghindari pemanasan alami.</p>
    `
  },
  {
    id: 2,
    title: 'Pemberian Nutrisi Lyori Hidroponik',
    category: 'Pemeliharaan',
    version: '1.0',
    date: '10 Feb 2026',
    author: 'Agronom Utama',
    content: `
      <h4>1. Pengukuran PPM</h4>
      <p>Pastikan TDS Meter dikalibrasi. Range nutrisi untuk fase generatif adalah 1200 - 1400 PPM.</p>
      <h4>2. Jadwal Nutrisi</h4>
      <p>Nutrisi diberikan 3 kali sehari: Pukul 07.00, 11.00, dan 16.00.</p>
    `
  }
])

const filteredSOPs = computed(() => {
  if (!searchQuery.value) return sops.value
  const q = searchQuery.value.toLowerCase()
  return sops.value.filter(s => 
    s.title.toLowerCase().includes(q) || 
    s.category.toLowerCase().includes(q)
  )
})

function printSOP() {
  window.print()
}
</script>

<style scoped>
.sop-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
}
.sop-page.embedded-mode {
    height: auto;
    padding-bottom: 80px;
}

.sop-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--space-lg);
  flex: 1;
  min-height: 0;
}
.sop-grid.single-col {
    display: block;
}
.list-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.sop-item {
  padding: var(--space-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.sop-item:hover {
  background: var(--bg-tertiary);
}

.sop-item.active {
  background: var(--primary-50);
  border-color: var(--primary-200);
}

.dark-mode .sop-item.active {
  background: rgba(34, 197, 94, 0.1);
  border-color: var(--primary-500);
}

.sop-category {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--primary-600);
  margin-bottom: 2px;
  display: block;
}

.sop-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}

.sop-version {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.sop-content {
  overflow-y: auto;
  padding: var(--space-xl);
}

.sop-header {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: var(--space-lg);
}

.sop-meta {
  color: var(--text-tertiary);
}

.sop-body {
  line-height: 1.8;
  color: var(--text-secondary);
}

.sop-body h4 {
  margin-top: var(--space-lg);
  color: var(--text-primary);
}

.sop-agreement {
  padding: var(--space-md);
  text-align: center;
  border: 1px solid var(--primary-100);
}

.text-tiny { font-size: 0.75rem; }
.border-top { border-top: 1px solid var(--border-color); }

@media (max-width: 768px) {
  .sop-grid {
    grid-template-columns: 1fr;
  }
}

.ml-sm { margin-left: var(--space-sm); }
</style>
