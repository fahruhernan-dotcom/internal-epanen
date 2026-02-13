<template>
  <div class="cashier-page animate-fade-in">
    <!-- Header Section -->
    <div class="cashier-header-premium glass-premium-dark">
      <div class="header-content">
        <div class="brand-group">
          <!-- Global Hamburger for Cashier on Mobile -->
          <button class="global-menu-toggle" @click="dispatchToggleMenu">
            <AppIcon name="menu" :size="24" />
          </button>
          <div class="brand-icon-wrapper desktop-only">
            <AppIcon name="receipt" :size="28" />
          </div>
          <div class="brand-text">
            <h1 class="premium-title">Kasir <span class="text-gradient">ePanen</span></h1>
            <p class="premium-subtitle desktop-only">Terminal Invoice Real-time</p>
          </div>
        </div>

        <div class="header-controls-mobile">
          <div class="mobile-toggles-integrated">
            <button class="tgl-btn" :class="{ 'active': mobileSidebarOpen }" @click="mobileSidebarOpen = !mobileSidebarOpen; mobileMonitorOpen = false">
              <AppIcon name="list" :size="18" />
            </button>
            <button class="tgl-btn" :class="{ 'active': mobileMonitorOpen }" @click="mobileMonitorOpen = !mobileMonitorOpen; mobileSidebarOpen = false">
              <AppIcon name="calendar" :size="18" />
            </button>
          </div>
          <div class="status-indicator-mini" :class="{ 'online': isConnected }">
            <div class="status-dot"></div>
            <span class="desktop-only">{{ isConnected ? 'Sistem Aktif' : 'Offline' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Daily Stats Bar -->
    <div class="cashier-stats-strip">
      <div class="stats-header-row">
        <h3 class="stats-title"><AppIcon name="bar-chart-2" :size="16" /> Ringkasan Penjualan</h3>
        <div class="date-filter-pills">
          <button 
            v-for="f in dateFilters" :key="f.key"
            class="filter-pill" 
            :class="{ active: activeDateFilter === f.key }"
            @click="activeDateFilter = f.key; fetchDailyStats()"
          >{{ f.label }}</button>
        </div>
      </div>
      <div class="stats-grid">
        <div class="stat-mini-card">
          <div class="smc-icon emerald"><AppIcon name="dollar-sign" :size="18" /></div>
          <div class="smc-data">
            <span class="smc-label">TOTAL PENJUALAN</span>
            <span class="smc-value">{{ formatCurrency(dailyStats.totalRevenue) }}</span>
          </div>
        </div>
        <div class="stat-mini-card">
          <div class="smc-icon blue"><AppIcon name="file-text" :size="18" /></div>
          <div class="smc-data">
            <span class="smc-label">JUMLAH INVOICE</span>
            <span class="smc-value">{{ dailyStats.invoiceCount }}</span>
          </div>
        </div>
        <div class="stat-mini-card">
          <div class="smc-icon purple"><AppIcon name="package" :size="18" /></div>
          <div class="smc-data">
            <span class="smc-label">ITEM TERJUAL</span>
            <span class="smc-value">{{ dailyStats.totalItemsSold.toFixed(1) }} kg</span>
          </div>
        </div>
        <div class="stat-mini-card">
          <div class="smc-icon amber"><AppIcon name="trending-up" :size="18" /></div>
          <div class="smc-data">
            <span class="smc-label">RATA-RATA / INV</span>
            <span class="smc-value">{{ formatCurrency(dailyStats.avgPerInvoice) }}</span>
          </div>
        </div>
      </div>

      <!-- Top Products -->
      <Transition name="slide-down">
        <div v-if="showTopProducts && topProducts.length > 0" class="top-products-panel">
          <div class="tp-list">
            <div v-for="(p, i) in topProducts" :key="p.label" class="tp-item">
              <span class="tp-rank">#{{ i + 1 }}</span>
              <span class="tp-name">{{ p.label }}</span>
              <div class="tp-bar-container">
                <div class="tp-bar" :style="{ width: (p.qty / topProducts[0].qty * 100) + '%' }"></div>
              </div>
              <span class="tp-qty">{{ p.qty.toFixed(1) }} kg</span>
              <span class="tp-rev">{{ formatCurrency(p.revenue) }}</span>
            </div>
          </div>
        </div>
      </Transition>
      <button class="btn-toggle-products" @click="showTopProducts = !showTopProducts">
        <AppIcon :name="showTopProducts ? 'chevron-up' : 'chevron-down'" :size="14" />
        <span>{{ showTopProducts ? 'Sembunyikan' : 'Produk Terlaris' }}</span>
      </button>
    </div>

    <!-- Main Content Grid -->
    <div class="main-layout-grid" :class="{ 'sidebar-open': mobileSidebarOpen, 'monitor-open': mobileMonitorOpen }">
      <!-- Sidebar Overlays -->
      <div v-if="mobileSidebarOpen" class="mobile-grid-overlay" @click="mobileSidebarOpen = false"></div>
      <div v-if="mobileMonitorOpen" class="mobile-grid-overlay" @click="mobileMonitorOpen = false"></div>

      <!-- Sidebar: Order List -->
      <aside class="sidebar-panel glass-premium-dark" :class="{ 'mobile-popout': mobileSidebarOpen }">
        <div class="panel-nav">
          <div class="tab-pill-group">
            <button 
              class="tab-pill" 
              :class="{ active: activeTab === 'pending' }" 
              @click="activeTab = 'pending'"
            >
              <AppIcon name="clock" :size="16" />
              <span>Pending</span>
              <span v-if="pendingOrders.length > 0" class="notif-count">{{ pendingOrders.length }}</span>
            </button>
            <button 
              class="tab-pill" 
              :class="{ active: activeTab === 'history' }" 
              @click="fetchHistoryOrders(); activeTab = 'history'"
            >
              <AppIcon name="history" :size="16" />
              <span>Riwayat</span>
            </button>
          </div>
          
          <button v-if="activeTab === 'pending'" class="btn-add-order" @click="showManualModal = true">
            <AppIcon name="plus" :size="18" />
          </button>
        </div>

        <!-- Search Bar (History Tab) -->
        <div v-if="activeTab === 'history'" class="search-bar-compact">
          <AppIcon name="search" :size="14" />
          <input v-model="historySearch" type="text" placeholder="Cari nama / ID invoice..." />
        </div>

        <div class="scroll-area">
          <TransitionGroup name="list-stagger">
            <!-- Pending Orders -->
            <div v-if="activeTab === 'pending'" class="order-stack" key="pending list">
              <div v-if="pendingOrders.length === 0" class="empty-state-card">
                <div class="empty-icon-box">
                  <AppIcon name="coffee" :size="40" />
                </div>
                <h3>Belum ada order</h3>
                <p>Menunggu pesanan baru dari grup WhatsApp atau input manual.</p>
              </div>

              <div 
                v-for="(order, index) in pendingOrders" 
                :key="order.id" 
                class="premium-order-card"
                :class="{ 'selected': selectedOrder?.id === order.id }"
                @click="selectOrder(order)"
                :style="{ animationDelay: `${index * 100}ms` }"
              >
                <div class="card-glow"></div>
                <div class="card-body">
                  <div class="card-meta">
                    <span class="time-stamp">{{ formatTime(order.created_at) }}</span>
                    <span class="order-hash">#{{ order.id }}</span>
                  </div>
                  <h4 class="card-title">{{ order.customer_name || 'Pelanggan Baru' }}</h4>
                  <p class="card-desc">{{ getSummarySnippet(order.summary_text) }}</p>
                  <div class="card-footer">
                    <span class="access-pill pending">PENDING</span>
                    <div class="action-hint">Klik untuk proses <AppIcon name="chevron-right" :size="14" /></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- History Orders -->
            <div v-if="activeTab === 'history'" class="order-stack" key="history list">
              <div v-if="filteredHistoryOrders.length === 0" class="empty-state-card">
                <h3>{{ historySearch ? 'Tidak Ditemukan' : 'Riwayat Kosong' }}</h3>
                <p>{{ historySearch ? 'Coba kata kunci lain.' : 'Terus layani pelanggan Anda!' }}</p>
              </div>

              <div 
                v-for="order in filteredHistoryOrders" 
                :key="order.id" 
                class="premium-order-card history"
                :class="{ 'selected': selectedOrder?.id === order.id }"
                @click="selectOrder(order)"
              >
                <div class="card-body">
                  <div class="card-meta">
                    <span class="time-stamp">{{ formatDate(order.created_at) }}</span>
                    <span class="order-hash">#{{ order.id }}</span>
                  </div>
                  <h4 class="card-title">{{ order.customer_name || 'Pelanggan' }}</h4>
                  <div class="card-footer">
                    <span class="access-pill ready">SELESAI</span>
                    <a v-if="order.pdf_url" :href="order.pdf_url" target="_blank" class="btn-reprint" @click.stop>
                      <AppIcon name="printer" :size="12" /> Cetak
                    </a>
                    <AppIcon v-else name="check-circle" :size="14" class="text-emerald" />
                  </div>
                </div>
              </div>
              <!-- Spacer to force scroll -->
              <div class="scroll-spacer" style="height: 10rem; width: 100%; flex-shrink: 0;"></div>
            </div>
          </TransitionGroup>
        </div>
      </aside>

      <!-- Main Workspace: Processor -->
      <main class="workspace-area">
        <Transition name="fade-scale" mode="out-in">
          <div v-if="selectedOrder" class="workspace-container" :key="selectedOrder.id">
            <!-- Toolbar Area -->
            <div class="workspace-toolbar glass-premium-dark">
              <div class="toolbar-left">
                <div class="order-indicator">
                  <AppIcon name="zap" :size="16" class="text-amber" />
                  <span>Sedang Memproses Order <strong>#{{ selectedOrder.id }}</strong></span>
                </div>
              </div>

              <div class="toolbar-right">
                <button 
                  v-if="selectedOrder.status === 'pending'"
                  class="btn-secondary-dark" 
                  @click="isEditing = !isEditing"
                >
                  <AppIcon :name="isEditing ? 'check' : 'edit-3'" :size="18" />
                  <span>{{ isEditing ? 'Simpan Visual' : 'Edit Invoice' }}</span>
                </button>

                <div class="btn-group">
                  <a 
                    v-if="selectedOrder.pdf_url" 
                    :href="selectedOrder.pdf_url" 
                    target="_blank" 
                    class="btn-emerald"
                  >
                    <AppIcon name="download" :size="18" />
                    Buka PDF
                  </a>

                  <button 
                    v-else
                    class="btn-primary-glow" 
                    @click="generateAndProcess" 
                    :disabled="isProcessing"
                  >
                    <span v-if="isProcessing" class="premium-loader-sm"></span>
                    <template v-else>
                      <AppIcon name="printer" :size="18" />
                      <span>Generate & Upload</span>
                    </template>
                  </button>
                </div>
              </div>
            </div>

            <!-- Content Splitter -->
            <div class="editor-visual-split" :class="{ 'editing-mode': isEditing, 'with-reference': showReference }">
              <!-- Left: Inputs (if editing) -->
              <Transition name="slide-left">
                <div v-if="isEditing" class="editor-sidebar glass-premium-dark">
                  <div class="sidebar-header-flex">
                    <h3 class="editor-title">Modifikasi Data</h3>
                    <button class="btn-ref-toggle" @click="showReference = !showReference">
                      <AppIcon name="trending-up" :size="16" />
                      <span>Harga Pasar</span>
                    </button>
                  </div>
                  <div class="editor-form">
                    <div class="editor-field">
                      <label>Nama Pelanggan</label>
                      <div class="input-glow-wrapper">
                        <AppIcon name="user" :size="16" />
                        <input v-model="localOrderData.customer_name" type="text" placeholder="Nama Pelanggan..." />
                      </div>
                    </div>

                    <div class="editor-field">
                      <label>Items Pesanan</label>
                      <div class="items-editor">
                        <div v-for="(item, idx) in localOrderData.items" :key="idx" class="item-row-edit">
                          <input v-model="item.label" class="item-input label" placeholder="Barang..." @focus="autoSearchReference(item.label)" />
                          <div class="qty-input-wrapper">
                            <input v-model.number="item.qty" type="number" step="any" class="item-input qty" placeholder="1.0" />
                            <span class="unit-label">kg</span>
                          </div>
                          <input v-model.number="item.price" type="number" class="item-input price" placeholder="Harga..." />
                          <button class="btn-remove-item" @click="removeItemEdit(idx)">✕</button>
                        </div>
                        <button class="btn-add-item-sm" @click="addItemEdit">
                          <AppIcon name="plus" :size="14" />
                          <span>Tambah Item</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>

              <!-- Middle: Market Reference (Conditional) -->
              <Transition name="slide-right">
                <div v-if="isEditing && showReference" class="market-reference-panel glass-premium-dark">
                  <div class="ref-header">
                    <div class="ref-title-row">
                      <h4>Harga Pasar Terkini</h4>
                      <span class="ref-count-tag">{{ filteredMarketPrices.length }} Item</span>
                    </div>
                    <div class="ref-search">
                      <AppIcon name="search" :size="14" />
                      <input v-model="refSearch" placeholder="Cari nama produk..." />
                    </div>
                  </div>
                  <div class="ref-list scroll-thin">
                    <div 
                      v-for="price in filteredMarketPrices" 
                      :key="price.id" 
                      class="ref-item"
                      @click="useReferencePrice(price)"
                    >
                      <div class="ref-info">
                        <span class="ref-name">{{ price.product_name }}</span>
                        <div class="ref-sub-meta">
                          <span class="ref-cat">{{ price.category }}</span>
                          <span class="ref-unit-badge">/ {{ price.unit || 'kg' }}</span>
                        </div>
                      </div>
                      <div class="ref-value-group">
                        <div class="ref-value">{{ formatCurrency(price.price) }}</div>
                        <div class="ref-action">Gunakan <AppIcon name="plus" :size="10" /></div>
                      </div>
                    </div>
                    
                    <div v-if="filteredMarketPrices.length === 0" class="ref-empty">
                      <p>Produk tidak ditemukan</p>
                    </div>
                  </div>
                  <div class="ref-footer">
                    <p class="ref-hint">
                      <AppIcon name="refresh-cw" :size="10" /> 
                      Sinkronisasi GSheet Aktif
                    </p>
                  </div>
                </div>
              </Transition>

              <!-- Right: Live Preview -->
              <div class="visual-preview">
                <div class="preview-canvas">
                  <div id="invoice-preview" class="premium-invoice-paper shadow-2xl">
                    <div class="inv-brand-header">
                      <div class="brand-info">
                        <div class="inv-logo">
                          <AppIcon name="sprout" :size="24" />
                          <span>ePanen</span>
                        </div>
                        <div class="company-address">
                          Gedung Hyundai Indonesia Lantai 3A. Jl. Teuku Nyak Arief No.14, RT.4/RW.2<br>
                          Grogol Utara, Kebayoran Lama, Jakarta Selatan, 12210
                        </div>
                      </div>
                      <div class="inv-type">OFFICIAL INVOICE</div>
                    </div>

                    <div class="inv-details">
                      <div class="details-left">
                        <label>DITAGIHKAN KEPADA</label>
                        <div class="client-name">{{ localOrderData.customer_name || 'Pelanggan Umum' }}</div>
                        <div v-if="selectedOrder.customer_phone" class="client-phone">{{ selectedOrder.customer_phone }}</div>
                      </div>
                      <div class="details-right">
                        <div class="meta-row">
                          <label>INVOICE NO.</label>
                          <span>#EP-{{ selectedOrder.id }}</span>
                        </div>
                        <div class="meta-row">
                          <label>TANGGAL</label>
                          <span>{{ formatDate(selectedOrder.created_at) }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="inv-table-header">
                      <span class="col-desc">DESKRIPSI</span>
                      <span class="col-qty">QTY</span>
                      <span class="col-price">HARGA</span>
                      <span class="col-total">TOTAL</span>
                    </div>

                    <div class="inv-body-content">
                      <div v-for="(item, idx) in previewItems" :key="idx" class="inv-item-row">
                        <span class="col-desc">{{ item.label }}</span>
                        <span class="col-qty">{{ item.qty }} kg</span>
                        <span class="col-price">{{ formatCurrency(item.price) }}</span>
                        <span class="col-total">{{ formatCurrency(item.qty * item.price) }}</span>
                      </div>
                      
                      <div v-if="!localOrderData.items.length" class="empty-inv-msg">
                        Belum ada item pesanan.
                      </div>

                      <div class="inv-grand-total">
                        <div class="total-label">TOTAL AKHIR</div>
                        <div class="total-value">{{ formatCurrency(calculateTotal()) }}</div>
                      </div>
                    </div>

                    <div class="inv-footer-premium">
                      <div class="qr-placeholder">
                        <AppIcon name="qr-code" :size="48" style="opacity: 0.1" />
                      </div>
                      <div class="footer-msg">
                        <p class="main-msg">Terima kasih atas kepercayaannya.</p>
                        <p class="sub-msg">Official ePanen System © 2026 Jakarta Selatan, Indonesia</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Selection Empty State -->
          <div v-else class="empty-workspace-premium">
            <div class="hero-graphic">
              <div class="icon-circle animate-pulse-slow">
                <AppIcon name="receipt" :size="64" />
              </div>
              <div class="glow-bg"></div>
            </div>
            <h2>Pilih Pesanan</h2>
            <p>Klik salah satu kartu di sebelah kiri untuk mulai mengolah invoice.</p>
          </div>
        </Transition>
      </main>

      <!-- Delivery Monitor Panel (3rd Column) -->
      <aside class="delivery-monitor-section" :class="{ 'mobile-popout': mobileMonitorOpen }">
        <div class="dm-header">
          <AppIcon name="calendar" :size="16" />
          <span>Antrean Hari Ini</span>
          <div class="dm-badge">{{ todayOrders.length }}</div>
        </div>
        <div class="dm-scroll-view">
          <div 
            v-for="order in todayOrders" 
            :key="order.id" 
            class="dm-mini-card"
            :class="{ 'status-pending': order.status === 'pending' }"
            @click="selectOrder(order)"
          >
            <div class="dm-card-info">
              <span class="dm-time">{{ formatTime(order.created_at) }}</span>
              <span class="dm-name">{{ order.customer_name || 'Pelanggan' }}</span>
            </div>
            <span class="dm-status-dot" :class="order.status"></span>
          </div>
          
          <div v-if="todayOrders.length === 0" class="dm-empty">
            Belum ada order hari ini
          </div>
        </div>
      </aside>
    </div>

    <!-- Modals -->
    <Transition name="modal-fade">
      <div v-if="showManualModal" class="modal-overlay" @click.self="showManualModal = false">
        <div class="modal-card-premium glass-premium-dark animate-pop">
          <div class="modal-header-premium">
            <div class="header-icon-box amber">
              <AppIcon name="plus-circle" :size="24" />
            </div>
            <div class="header-text">
              <h3>Input Order Baru</h3>
              <p>Tambahkan pesanan manual tanpa melalui WhatsApp</p>
            </div>
            <button class="modal-close-btn" @click="showManualModal = false">✕</button>
          </div>

          <div class="modal-form-content">
            <div class="input-field full-width">
              <label>Nama Customer</label>
              <div class="field-container">
                <AppIcon name="user" :size="18" />
                <input v-model="newOrderForm.customer_name" type="text" placeholder="Masukkan nama pelanggan..." required />
              </div>
            </div>

            <div class="input-field full-width">
              <label>Pusat Pesanan (Barang & Harga)</label>
              <div class="items-list-manual">
                <div v-for="(item, idx) in newOrderForm.items" :key="idx" class="manual-item-row-wrapper">
                  <div class="manual-item-row">
                    <div class="relative-field">
                      <input 
                        v-model="item.label" 
                        class="item-input label" 
                        placeholder="Nama Barang..." 
                        @input="onModalInput(item.label, idx)"
                        @focus="onModalInput(item.label, idx)"
                      />
                      <!-- Autocomplete Dropdown -->
                      <Transition name="fade-in-up">
                        <div v-if="activeItemIdxModal === idx && modalSuggestions.length" class="modal-autocomplete-card glass-premium-dark">
                          <div 
                            v-for="s in modalSuggestions.slice(0, 5)" 
                            :key="s.id" 
                            class="suggestion-item"
                            @click="selectSuggestionModal(s, idx)"
                          >
                            <span class="s-name">{{ s.product_name }}</span>
                            <span class="s-price">{{ formatCurrency(s.price) }}</span>
                          </div>
                        </div>
                      </Transition>
                    </div>
                    <div class="qty-input-wrapper-lite">
                      <input v-model.number="item.qty" type="number" step="any" class="item-input qty" placeholder="1.0" />
                      <span class="unit-label-lite">kg</span>
                    </div>
                    <input v-model.number="item.price" type="number" class="item-input price" placeholder="Harga" />
                    <button class="btn-remove-lite" @click="newOrderForm.items.splice(idx, 1)">✕</button>
                  </div>
                </div>
                <button class="btn-add-lite" @click="newOrderForm.items.push({ label: '', qty: 1, price: 0 })">
                   <AppIcon name="plus" :size="14" /> Tambah Item
                </button>
              </div>
            </div>

            <div class="modal-footer-premium" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: flex-end; gap: 1rem; align-items: center;">
              <button type="button" class="btn-cancel" @click="showManualModal = false">BATALKAN</button>
              <button type="button" class="btn-confirm" @click="createManualOrder">SIMPAN ORDER</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue'
import { supabase, TABLES } from '@/services/supabase'
import AppIcon from '@/components/AppIcon.vue'

// Synchronizing view state...

const isConnected = ref(false)
const mobileSidebarOpen = ref(false)
const mobileMonitorOpen = ref(false)
const activeTab = ref('pending')
const pendingOrders = ref([])
const historyOrders = ref([])
const selectedOrder = ref(null)
const isEditing = ref(false)
const isProcessing = ref(false)
const showManualModal = ref(false)
const showReference = ref(false)
const marketPrices = ref([])
const refSearch = ref('')

// === NEW: Stats, Search, Top Products ===
const historySearch = ref('')
const showTopProducts = ref(false)
const activeDateFilter = ref('today')
const completedInvoices = ref([])

const dateFilters = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'week', label: 'Minggu Ini' },
  { key: 'month', label: 'Bulan Ini' }
]

const dailyStats = reactive({
  totalRevenue: 0,
  invoiceCount: 0,
  totalItemsSold: 0,
  avgPerInvoice: 0
})

const localOrderData = reactive({
  customer_name: '',
  items: []
})

const newOrderForm = reactive({
  customer_name: '',
  items: [{ label: '', qty: 1, price: 0 }]
})

const modalSearchQuery = ref('')
const activeItemIdxModal = ref(-1)

const previewItems = computed(() => {
  return localOrderData.items || []
})

const modalSuggestions = computed(() => {
  if (!modalSearchQuery.value || modalSearchQuery.value.length < 2) return []
  const q = modalSearchQuery.value.toLowerCase()
  return marketPrices.value.filter(p => 
    p.product_name.toLowerCase().includes(q)
  )
})

function onModalInput(label, idx) {
  modalSearchQuery.value = label
  activeItemIdxModal.value = idx
}

function selectSuggestionModal(prod, idx) {
  newOrderForm.items[idx].label = prod.product_name;
  newOrderForm.items[idx].price = prod.price;
  activeItemIdxModal.value = -1; // Sembunyikan saran
}

let subscription = null

const todayOrders = ref([])

onMounted(async () => {
  await fetchPendingOrders()
  await fetchMarketPrices()
  await fetchDailyStats()
  await fetchTodayOrders()
  subscribeToOrders()
})

async function fetchTodayOrders() {
  const startISO = new Date(new Date().setHours(0,0,0,0)).toISOString()
  const { data } = await supabase
    .from(TABLES.INVOICES)
    .select('*')
    .gte('created_at', startISO)
    .order('created_at', { ascending: false })
  
  if (data) todayOrders.value = data
}

async function fetchMarketPrices() {
  const { data } = await supabase
    .from(TABLES.MARKET_PRICES)
    .select('*')
    .order('product_name', { ascending: true })
  
  if (data) marketPrices.value = data
}

const filteredMarketPrices = computed(() => {
  if (!refSearch.value) return marketPrices.value
  const q = refSearch.value.toLowerCase()
  return marketPrices.value.filter(p => 
    p.product_name.toLowerCase().includes(q) || 
    p.category.toLowerCase().includes(q)
  )
})

function autoSearchReference(label) {
  if (label && label.length > 2) {
    refSearch.value = label
    showReference.value = true
  }
}

function useReferencePrice(refNode) {
  // Mencari apakah ada item yang sedang difokuskan atau kosong labelnya
  const emptyItemIdx = localOrderData.items.findIndex(i => !i.label)
  
  if (emptyItemIdx !== -1) {
    localOrderData.items[emptyItemIdx].label = refNode.product_name
    localOrderData.items[emptyItemIdx].price = refNode.price
  } else {
    localOrderData.items.push({ 
      label: refNode.product_name, 
      qty: 1, 
      price: refNode.price 
    })
  }
}

onUnmounted(() => {
  if (subscription) supabase.removeChannel(subscription)
})

async function fetchPendingOrders() {
  const { data } = await supabase
    .from(TABLES.INVOICES)
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  
  if (data) pendingOrders.value = data
}

async function fetchHistoryOrders() {
  const { data } = await supabase
    .from(TABLES.INVOICES)
    .select('*')
    .neq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(100)
  
  if (data) historyOrders.value = data
}

// === NEW: Filtered Views ===
const filteredHistoryOrders = computed(() => {
  if (!historySearch.value) return historyOrders.value
  const q = historySearch.value.toLowerCase()
  return historyOrders.value.filter(o =>
    (o.customer_name || '').toLowerCase().includes(q) ||
    String(o.id).includes(q)
  )
})

// === NEW: Fetch Daily Stats ===
function getDateFilterRange() {
  const now = new Date()
  let start
  if (activeDateFilter.value === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (activeDateFilter.value === 'week') {
    const day = now.getDay() || 7
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1)
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
  }
  return start.toISOString()
}

async function fetchDailyStats() {
  const startISO = getDateFilterRange()
  const { data } = await supabase
    .from(TABLES.INVOICES)
    .select('*')
    .neq('status', 'pending')
    .gte('created_at', startISO)
    .order('created_at', { ascending: false })

  if (!data) return
  completedInvoices.value = data

  const invoiceCount = data.length
  let totalRevenue = 0
  let totalItemsSold = 0

  data.forEach(inv => {
    totalRevenue += (inv.total_amount || 0)
    const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || [])
    items.forEach(item => {
      totalItemsSold += (item.qty || 0)
    })
  })

  dailyStats.totalRevenue = totalRevenue
  dailyStats.invoiceCount = invoiceCount
  dailyStats.totalItemsSold = totalItemsSold
  dailyStats.avgPerInvoice = invoiceCount > 0 ? totalRevenue / invoiceCount : 0
}

// === NEW: Top Products (computed from completedInvoices) ===
const topProducts = computed(() => {
  const map = {}
  completedInvoices.value.forEach(inv => {
    const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || [])
    items.forEach(item => {
      const key = (item.label || 'Unknown').trim()
      if (!map[key]) map[key] = { label: key, qty: 0, revenue: 0 }
      map[key].qty += (item.qty || 0)
      map[key].revenue += ((item.qty || 0) * (item.price || 0))
    })
  })
  return Object.values(map)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10)
})

function subscribeToOrders() {
  subscription = supabase
    .channel('public:invoices')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'invoices' }, payload => {
      if (payload.new.status === 'pending') {
        pendingOrders.value.unshift(payload.new)
      }
      fetchTodayOrders()
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'invoices' }, payload => {
      fetchTodayOrders()
      if (payload.new.status !== 'pending') {
        const idx = pendingOrders.value.findIndex(o => o.id === payload.new.id)
        if (idx !== -1) pendingOrders.value.splice(idx, 1)
        if (selectedOrder.value?.id === payload.new.id) {
          selectedOrder.value = { ...selectedOrder.value, ...payload.new }
        }
        // Refresh stats when an invoice is completed
        fetchDailyStats()
      }
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'invoices' }, () => {
      fetchPendingOrders()
      fetchTodayOrders()
    })
    .subscribe(status => {
      isConnected.value = status === 'SUBSCRIBED'
    })
}

function selectOrder(order) {
  selectedOrder.value = order
  localOrderData.customer_name = order.customer_name
  // Items might come as string from legacy or JSONB
  try {
    localOrderData.items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || [])
  } catch(e) {
    localOrderData.items = []
  }
  isEditing.value = false
}

function addItemEdit() {
  localOrderData.items.push({ label: '', qty: 1, price: 0 })
}

function removeItemEdit(idx) {
  localOrderData.items.splice(idx, 1)
}

function calculateTotal() {
  return localOrderData.items.reduce((acc, item) => acc + (item.qty * item.price), 0)
}

function formatCurrency(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function dispatchToggleMenu() {
  window.dispatchEvent(new CustomEvent('toggle-sidebar'))
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getSummarySnippet(text) {
  return text ? text.substring(0, 50) + '...' : 'Tanpa detail'
}

async function createManualOrder() {
  if (!newOrderForm.customer_name || newOrderForm.items.length === 0) return
  
  try {
    const { error } = await supabase
      .from(TABLES.INVOICES)
      .insert({
        customer_name: newOrderForm.customer_name,
        items: newOrderForm.items,
        total_amount: newOrderForm.items.reduce((acc, item) => acc + (item.qty * item.price), 0),
        status: 'pending',
        whatsapp_raw: 'Manual Web Input',
        summary_text: newOrderForm.items.map(i => `${i.qty}kg ${i.label} @${i.price}`).join('\n')
      })

    if (error) throw error
    newOrderForm.customer_name = ''
    newOrderForm.items = [{ label: '', qty: 1, price: 0 }]
    showManualModal.value = false
  } catch (err) {
    alert('Gagal: ' + err.message)
  }
}

async function generateAndProcess() {
  if (!window.html2pdf) {
    alert('Library PDF belum siap!')
    return
  }

  isProcessing.value = true
  const element = document.getElementById('invoice-preview')
  const opt = {
    margin: 0, // No margin to avoid clipping, we use padding in CSS
    filename: `inv_${selectedOrder.value.id}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      logging: false,
      letterRendering: true
    },
    jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
  }

  try {
    const pdfBlob = await window.html2pdf().set(opt).from(element).output('blob')
    const fileName = `public/${Date.now()}_inv_${selectedOrder.value.id}.pdf`
    
    const { error: uploadError } = await supabase.storage.from('invoices').upload(fileName, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true
    })
    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('invoices').getPublicUrl(fileName)
    const publicUrl = urlData.publicUrl

    const { error: updateError } = await supabase.from(TABLES.INVOICES).update({
      status: 'ready',
      pdf_url: publicUrl,
      customer_name: localOrderData.customer_name,
      items: localOrderData.items,
      total_amount: calculateTotal()
    }).eq('id', selectedOrder.value.id)

    if (updateError) throw updateError
    alert('✅ Invoice Siap!')
  } catch (error) {
    alert('Error: ' + error.message)
  } finally {
    isProcessing.value = false
  }
}
</script>

<style scoped>
.cashier-page {
  flex: 1;
  height: 0;
  width: 100%;
  max-width: 100%;
  background: transparent;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  padding: 1rem 1.5rem 1.5rem 1.5rem; /* Restored bottom padding */
  gap: 1rem;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
  box-sizing: border-box;
}

.main-layout-grid {
  display: grid;
  grid-template-columns: 320px 1fr 260px;
  flex: 1;
  min-height: 400px;
  overflow: hidden;
  border-radius: 32px; /* Full rounding */
  background: rgba(15, 23, 42, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05); /* Restored bottom border */
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

/* Stats Strip */
.cashier-stats-strip {
  flex-shrink: 0;
  background: rgba(30, 41, 59, 0.35);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 24px;
  padding: 1rem 1.5rem;
}

.stats-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.stats-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.date-filter-pills {
  display: flex;
  gap: 0.35rem;
}

.filter-pill {
  padding: 4px 12px;
  border-radius: 100px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: transparent;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.filter-pill.active {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.3);
}

.filter-pill:hover:not(.active) {
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.stat-mini-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
}

.smc-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.smc-icon.emerald { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.smc-icon.blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
.smc-icon.purple { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
.smc-icon.amber { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

.smc-data { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.smc-label { font-size: 0.6rem; font-weight: 600; color: #64748b; letter-spacing: 0.04em; text-transform: uppercase; }
.smc-value { font-size: 1rem; font-weight: 800; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Top Products Panel */
.top-products-panel {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.tp-list { 
  display: flex; 
  flex-direction: column; 
  gap: 0.2rem; 
  max-height: 200px; /* Space for roughly 5 items */
  overflow-y: auto;
  padding-right: 4px;
}

.tp-list::-webkit-scrollbar { width: 4px; }
.tp-list::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }

.tp-item {
  display: grid;
  grid-template-columns: 28px 1fr 120px 70px 90px;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  transition: background 0.2s;
}

.tp-item:hover { background: rgba(255, 255, 255, 0.03); }

.tp-rank { font-size: 0.7rem; font-weight: 800; color: #10b981; text-align: center; }
.tp-name { font-size: 0.78rem; font-weight: 600; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.tp-bar-container {
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 100px;
  overflow: hidden;
}

.tp-bar {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #34d399);
  border-radius: 100px;
  transition: width 0.5s ease;
}

.tp-qty { font-size: 0.72rem; font-weight: 700; color: #94a3b8; text-align: right; }
.tp-rev { font-size: 0.72rem; font-weight: 700; color: #10b981; text-align: right; }

.btn-toggle-products {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 100%;
  margin-top: 0.5rem;
  padding: 6px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-toggle-products:hover { color: #10b981; background: rgba(16, 185, 129, 0.05); }

/* Search Bar */
.search-bar-compact {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1rem;
  margin: 0 1rem 0.5rem;
  height: 36px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  color: #64748b;
}

.search-bar-compact input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #e2e8f0;
  font-size: 0.78rem;
  font-family: inherit;
}

.search-bar-compact input::placeholder { color: #475569; }

/* Re-print Button */
.btn-reprint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 8px;
  color: #10b981;
  font-size: 0.65rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reprint:hover { background: rgba(16, 185, 129, 0.2); }

/* Slide Down Transition */
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; max-height: 0; transform: translateY(-8px); }
.slide-down-enter-to, .slide-down-leave-from { opacity: 1; max-height: 300px; }

/* Header Premium */
.cashier-header-premium {
  height: 80px;
  padding: 0 2.5rem;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 50;
  flex-shrink: 0;
  box-sizing: border-box;
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 32px;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand-group {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.brand-icon-wrapper {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05));
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10b981;
  box-shadow: 0 8px 16px -4px rgba(16, 185, 129, 0.2);
}

.premium-title { font-size: 1.5rem; font-weight: 900; letter-spacing: -0.02em; margin: 0; }
.text-gradient { background: linear-gradient(to right, #10b981, #34d399); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.premium-subtitle { font-size: 0.85rem; color: #94a3b8; margin: 0; font-weight: 500; }

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 8px 16px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 100px;
  color: #ef4444;
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.status-indicator.online {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.2);
}

.pulse-ring {
  width: 8px;
  height: 8px;
  background: currentColor;
  border-radius: 50%;
  position: relative;
}

.status-indicator.online .pulse-ring::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid currentColor;
  animation: pulse-ring-anim 2s infinite;
}

@keyframes pulse-ring-anim {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(3); opacity: 0; }
}

/* Sidebar */
.sidebar-panel {
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.panel-nav {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  flex-shrink: 0;
}

.tab-pill-group {
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.tab-pill {
  border: none;
  background: none;
  color: #94a3b8;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.tab-pill.active {
  background: #111827;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.btn-add-order {
  width: 38px;
  height: 38px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
}

.scroll-area { 
  flex: 1; 
  overflow-y: auto; 
  padding: 1.5rem;
  scrollbar-gutter: stable; 
  min-height: 0; 
  height: 100%; 
}

.scroll-area::-webkit-scrollbar { width: 6px; }
.scroll-area::-webkit-scrollbar-track { background: transparent; }
.scroll-area::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }

.order-stack { 
  display: flex; 
  flex-direction: column; 
  gap: 1rem; 
  padding-bottom: 5rem;
}

.premium-order-card {
  position: relative;
  background: rgba(30, 41, 59, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 28px;
  padding: 1.25rem;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.4s ease;
}

.premium-order-card:hover { transform: translateY(-3px); background: rgba(30, 41, 59, 0.5); border-color: rgba(16, 185, 129, 0.4); }
.premium-order-card.selected { background: rgba(16, 185, 129, 0.08); border-color: #10b981; }

.card-meta { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
.time-stamp { font-size: 0.75rem; font-weight: 800; color: #10b981; }
.order-hash { font-size: 0.75rem; color: #64748b; font-family: monospace; }
.card-title { font-size: 1.1rem; font-weight: 800; margin: 0 0 0.5rem 0; color: white; }
.card-desc { font-size: 0.85rem; color: #94a3b8; line-height: 1.5; margin: 0; }

/* Workspace Area */
.workspace-area { 
  flex: 1; 
  position: relative; 
  display: flex; 
  flex-direction: column; 
  padding: 1.5rem; 
  background: rgba(0,0,0,0.2); 
  overflow-y: auto;
  min-height: 0; /* Important for flex-child scrolling */
}
.workspace-area::-webkit-scrollbar { width: 6px; }
.workspace-area::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
.workspace-area:hover::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); }

.workspace-container { display: flex; flex-direction: column; min-height: 100%; gap: 1.5rem; }

.workspace-toolbar {
  padding: 1rem 1.5rem;
  border-radius: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-indicator { display: flex; align-items: center; gap: 12px; font-size: 0.9rem; color: #94a3b8; }
.order-indicator strong { color: white; }
.btn-group { display: flex; gap: 12px; }

.btn-primary-glow {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white; border: none; padding: 10px 24px; border-radius: 24px; font-weight: 800;
  display: flex; align-items: center; gap: 10px; cursor: pointer;
  box-shadow: 0 8px 20px -5px rgba(16, 185, 129, 0.5);
  transition: all 0.3s;
}

.btn-emerald { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 10px 20px; border-radius: 18px; font-weight: 700; text-decoration: none; display: flex; align-items: center; gap: 8px; }
.btn-secondary-dark { background: rgba(255, 255, 255, 0.05); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.1); padding: 10px 20px; border-radius: 18px; cursor: pointer; display: flex; align-items: center; gap: 8px; }

/* Editor & Splitter */
.editor-visual-split { 
  display: grid; 
  grid-template-columns: 1fr;
  flex: 1; 
  gap: 1.5rem; 
  overflow: hidden; 
  transition: all 0.5s ease; 
}
.editor-visual-split.editing-mode { grid-template-columns: 320px 1fr; }
.editor-visual-split.with-reference { grid-template-columns: 320px 300px 1fr; }

.editor-sidebar { border-radius: 32px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
.editor-title { font-size: 1.1rem; font-weight: 800; color: #10b981; margin: 0; }

.editor-field label { display: block; font-size: 0.8rem; font-weight: 700; color: #64748b; margin-bottom: 0.75rem; text-transform: uppercase; }

.input-glow-wrapper {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  gap: 12px;
  color: #64748b;
  transition: all 0.3s;
}

.input-glow-wrapper:focus-within { border-color: #10b981; box-shadow: 0 0 15px rgba(16, 185, 129, 0.1); color: #10b981; }

.input-glow-wrapper input, .input-glow-wrapper textarea {
  background: none; border: none; padding: 12px 0; color: white; width: 100%; font-family: inherit; font-size: 0.95rem; outline: none;
}

.input-glow-wrapper.textarea { align-items: flex-start; }

.items-editor { display: flex; flex-direction: column; gap: 10px; }
.item-row-edit { display: grid; grid-template-columns: 1fr 80px 100px 40px; gap: 8px; align-items: center; }
.item-input { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 8px 12px; color: white; font-size: 0.9rem; width: 100%; box-sizing: border-box; }
.item-input:focus { border-color: #10b981; outline: none; }

.qty-input-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 14px;
  padding-right: 8px;
}
.qty-input-wrapper .item-input.qty { background: transparent; border: none !important; width: 50px !important; padding-right: 0 !important; }
.unit-label { font-size: 0.7rem; color: #10b981; font-weight: 700; }

.btn-remove-item { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; }
.btn-add-item-sm { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px dashed rgba(16, 185, 129, 0.4); padding: 10px; border-radius: 14px; cursor: pointer; font-size: 0.85rem; font-weight: 700; width: 100%; }

/* Market Reference */
.market-reference-panel { border-radius: 32px; display: flex; flex-direction: column; overflow: hidden; background: rgba(15, 23, 42, 0.4); }
.ref-header { padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
.ref-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.ref-title-row h4 { margin: 0; font-size: 0.9rem; color: #10b981; text-transform: uppercase; font-weight: 800; }
.ref-count-tag { font-size: 0.65rem; background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 2px 8px; border-radius: 10px; font-weight: 700; }
.ref-search { background: rgba(0,0,0,0.2); border-radius: 20px; padding: 0 12px; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.05); transition: 0.3s; }
.ref-search:focus-within { border-color: rgba(16, 185, 129, 0.4); background: rgba(0,0,0,0.3); }
.ref-search input { background: none; border: none; padding: 10px 0; color: white; width: 100%; font-size: 0.85rem; outline: none; }

.ref-list { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.ref-item { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.03); border-radius: 18px; padding: 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease; }
.ref-item:hover { background: rgba(16, 185, 129, 0.08); transform: translateX(4px); }
.ref-info { display: flex; flex-direction: column; gap: 2px; }
.ref-name { font-size: 0.9rem; font-weight: 700; color: white; }
.ref-sub-meta { display: flex; align-items: center; gap: 6px; }
.ref-cat { font-size: 0.7rem; color: #64748b; }
.ref-unit-badge { font-size: 0.7rem; color: #475569; font-weight: 500; }
.ref-value-group { text-align: right; display: flex; flex-direction: column; align-items: flex-end; }
.ref-value { font-size: 0.9rem; font-weight: 800; color: #10b981; }
.ref-action { font-size: 0.6rem; color: #475569; font-weight: 700; text-transform: uppercase; margin-top: 2px; opacity: 0; transition: 0.2s; }
.ref-item:hover .ref-action { opacity: 1; }
.ref-empty { padding: 2rem; text-align: center; color: #475569; font-size: 0.85rem; font-style: italic; }
.ref-footer { padding: 10px 1.5rem; border-top: 1px solid rgba(255,255,255,0.03); background: rgba(0,0,0,0.1); }
.ref-hint { font-size: 0.65rem; color: #475569; margin: 0; display: flex; align-items: center; gap: 5px; font-weight: 600; }

/* Visual Preview */
.visual-preview { flex: 1; overflow: auto; padding: 2rem; background: rgba(0,0,0,0.2); display: flex; justify-content: center; }
.preview-canvas { transform: scale(1.1); transform-origin: top center; flex-shrink: 0; }

.premium-invoice-paper {
  background: #ffffff;
  width: 148mm;
  min-height: 210mm;
  padding: 10mm;
  display: flex;
  flex-direction: column;
  color: #1e293b;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
}

.inv-brand-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10mm; border-bottom: 2px solid #f1f5f9; padding-bottom: 4mm; }
.brand-info { display: flex; flex-direction: column; gap: 4px; }
.inv-logo { display: flex; align-items: center; gap: 8px; font-weight: 900; color: #10b981; font-size: 1.2rem; }
.company-address { font-size: 0.65rem; color: #64748b; font-weight: 500; line-height: 1.4; max-width: 80mm; }
.inv-type { font-weight: 800; color: #cbd5e1; letter-spacing: 2px; font-size: 0.8rem; margin-top: 4px; }
.inv-details { display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 8mm; gap: 4mm; }
.inv-details label { font-size: 0.6rem; font-weight: 900; color: #94a3b8; display: block; margin-bottom: 1mm; }
.client-name { font-weight: 700; font-size: 1rem; color: #0f172a; }
.meta-row { display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 2px; font-size: 0.85rem; }
.meta-row span { font-weight: 700; color: #475569; }

.inv-table-header { display: flex; background: #f8fafc; padding: 3mm 4mm; border-radius: 4px; font-weight: 900; font-size: 0.65rem; color: #64748b; margin-bottom: 4mm; }
.inv-item-row { display: flex; padding: 3mm 4mm; border-bottom: 1px solid #f8fafc; font-size: 0.85rem; font-weight: 500; }
.col-desc { flex: 1; }
.col-qty { width: 15mm; text-align: center; }
.col-price { width: 25mm; text-align: right; }
.col-total { width: 25mm; text-align: right; }

.inv-body-content { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.empty-inv-msg { flex: 1; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-style: italic; }
.summary-text-area { white-space: pre-wrap; font-size: 0.95rem; line-height: 1.6; color: #334155; font-family: 'Inter', sans-serif; }

.inv-grand-total { margin-top: auto; padding: 4mm; background: #f8fafc; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
.total-label { font-size: 0.7rem; font-weight: 900; color: #94a3b8; }
.total-value { font-size: 1.2rem; font-weight: 900; color: #10b981; }
.client-phone { font-size: 0.75rem; color: #64748b; margin-top: 1px; }

.inv-footer-premium { margin-top: 10mm; border-top: 1px dashed #e2e8f0; padding-top: 8mm; display: flex; align-items: center; gap: 15px; }
.footer-msg p { margin: 0; }
.main-msg { font-weight: 800; color: #0f172a; font-size: 0.9rem; }
.sub-msg { font-size: 0.75rem; color: #94a3b8; }

/* Modals */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-card-premium { width: 650px; border-radius: 32px; overflow: hidden; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
.modal-header-premium { padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); }
.header-icon-box { min-width: 56px; height: 56px; border-radius: 20px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; }
.header-icon-box.amber { color: #f59e0b; background: rgba(245,158,11,0.1); }
.header-text h3 { margin: 0; font-size: 1.25rem; font-weight: 800; }
.header-text p { margin: 4px 0 0 0; color: #94a3b8; font-size: 0.9rem; }
.modal-close-btn { background: none; border: none; color: #475569; cursor: pointer; font-size: 1.2rem; }
.modal-form-content { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
.input-field label { font-size: 0.85rem; font-weight: 700; color: #64748b; margin-bottom: 10px; display: block; }
.field-container { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; display: flex; align-items: center; padding: 0 1rem; color: #475569; }
.field-container input, .field-container textarea { background: none; border: none; padding: 14px 10px; color: white; width: 100%; font-family: inherit; }
.field-container.textarea { align-items: flex-start; }
.btn-confirm { background: #10b981; color: white; border: none; padding: 14px 32px; border-radius: 20px; font-weight: 800; cursor: pointer; transition: all 0.3s; box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.4); }
.btn-confirm:hover { transform: translateY(-2px); box-shadow: 0 15px 25px -5px rgba(16, 185, 129, 0.5); }
.btn-cancel { background: transparent; color: #64748b; border: none; font-weight: 700; cursor: pointer; padding: 10px 20px; transition: color 0.3s; }
.btn-cancel:hover { color: #f8fafc; }

/* Modal Autocomplete Styles */
.manual-item-row-wrapper { position: relative; }
.relative-field { position: relative; flex: 1; }
.modal-autocomplete-card {
  position: absolute;
  top: 115%;
  left: 0;
  right: 0;
  z-index: 100;
  border-radius: 18px;
  overflow: hidden;
  padding: 6px;
  background: rgba(30, 41, 59, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(16, 185, 129, 0.3);
  box-shadow: 0 15px 30px rgba(0,0,0,0.5);
}
.suggestion-item {
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-radius: 10px;
  transition: 0.2s;
}
.suggestion-item:hover { background: rgba(16, 185, 129, 0.15); }
.s-name { font-size: 0.85rem; font-weight: 700; color: white; }
.s-price { font-size: 0.8rem; color: #10b981; font-weight: 800; }

/* Animations */
.list-stagger-enter-active { animation: slide-in-step 0.4s ease forwards; }
@keyframes slide-in-step { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }

.fade-scale-enter-active { animation: fade-scale-step 0.3s ease; }
@keyframes fade-scale-step { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

.access-pill { font-size: 0.65rem; padding: 4px 10px; border-radius: 12px; font-weight: 900; }
.access-pill.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.access-pill.ready { background: rgba(16, 185, 129, 0.1); color: #10b981; }

.notif-count { background: #ef4444; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; }

/* Manual Modal Items Styling */
.items-list-manual { display: flex; flex-direction: column; gap: 14px; padding-bottom: 10px; }
.manual-item-row { display: grid; grid-template-columns: 1fr 90px 140px 40px; gap: 12px; align-items: center; }
.btn-remove-lite { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); width: 30px; height: 30px; border-radius: 8px; cursor: pointer; }
.btn-add-lite { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px dashed rgba(16, 185, 129, 0.4); padding: 8px; border-radius: 14px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 700; }

.qty-input-wrapper-lite {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 0 10px;
  height: 42px;
}

.qty-input-wrapper-lite .item-input.qty {
  background: transparent;
  border: none !important;
  width: 45px !important;
  padding: 0 !important;
  text-align: center;
}

.unit-label-lite {
  font-size: 0.75rem;
  font-weight: 700;
  color: #10b981;
  text-transform: uppercase;
  opacity: 0.8;
}

/* Empty States */
.empty-workspace-premium { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0.5; }
.icon-circle { width: 120px; height: 120px; background: rgba(30,39,59,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; border: 2px solid rgba(255,255,255,0.05); color: #475569; }

/* Delivery Monitor (3rd Column on the Right) */
.delivery-monitor-section {
  border-left: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(15, 23, 42, 0.2);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.dm-header {
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8rem;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}

.dm-badge {
  margin-left: auto;
  background: #10b981;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
}

.dm-scroll-view {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dm-scroll-view::-webkit-scrollbar { width: 4px; }
.dm-scroll-view::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

.dm-mini-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.8rem;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255,255,255,0.03);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.dm-mini-card:hover { background: rgba(30, 41, 59, 0.6); border-color: rgba(16, 185, 129, 0.3); }
.dm-mini-card.status-pending { border-left: 3px solid #f59e0b; }

.dm-card-info { display: flex; flex-direction: column; gap: 2px; }
.dm-time { font-size: 0.65rem; font-weight: 800; color: #10b981; }
.dm-name { font-size: 0.78rem; font-weight: 600; color: #e2e8f0; }

.dm-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981; /* Selesai */
}
.dm-status-dot.status-pending { background: #f59e0b; }
.dm-status-dot.pending { background: #f59e0b; }

.dm-empty {
  padding: 2rem 0;
  text-align: center;
  font-size: 0.75rem;
  color: #64748b;
  font-style: italic;
}

/* Scrollbar */
.scroll-thin::-webkit-scrollbar { width: 4px; }
.scroll-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
.scroll-thin::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }

/* Responsive Adjustments */
@media (max-width: 1400px) {
  .preview-canvas { transform: scale(1.15); }
}

@media (max-height: 900px) {
  .preview-canvas { transform: scale(1.1); margin-top: 1rem; }
}

@media (max-height: 768px) {
  .preview-canvas { transform: scale(0.95); margin-top: 0; }
}

/* Expert Mobile Polish */
@media (max-width: 1200px) {
  .cashier-page { padding: 0; }
  
  .cashier-header-premium {
    padding: 0.75rem 1rem;
    border-radius: 0;
    margin-bottom: 0;
    position: sticky;
    top: 0;
    z-index: 1100;
  }

  .header-content { justify-content: space-between; gap: 8px; }
  
  .header-controls-mobile {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .mobile-toggles-integrated {
    display: flex;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 2px;
  }

  .tgl-btn {
    width: 40px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    border: none;
    background: transparent;
    color: #64748b;
    cursor: pointer;
    transition: 0.3s;
  }

  .tgl-btn.active {
    background: #10b981;
    color: white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .status-indicator-mini {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(0,0,0,0.2);
    padding: 6px 10px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.05);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ef4444;
  }

  .online .status-dot {
    background: #10b981;
    box-shadow: 0 0 8px #10b981;
  }

  .cashier-stats-strip {
    margin: 10px;
    border-radius: 20px;
    padding: 12px;
  }

  .stats-header-row { margin-bottom: 10px; }
  .stats-title { font-size: 0.75rem; }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .stat-mini-card {
    padding: 10px;
    border-radius: 16px;
  }
  
  .smc-icon { width: 32px; height: 32px; font-size: 1rem; }
  .smc-label { font-size: 0.55rem; }
  .smc-value { font-size: 0.85rem; }

  .main-layout-grid {
    border-radius: 0;
    background: transparent;
    border: none;
    box-shadow: none;
  }

  .sidebar-panel, .delivery-monitor-section {
    top: 60px; /* Space for sticky header */
    bottom: 0;
    border-radius: 0;
  }

  .workspace-area {
    padding: 10px;
  }
}

@media (max-width: 640px) {
  .premium-title { font-size: 1rem; }
  .global-menu-toggle { width: 36px; height: 36px; margin-right: 6px; }
  .sidebar-panel, .delivery-monitor-section { width: 90% !important; }
}

@media (min-width: 1201px) {
  .header-controls-mobile { display: none; }
}
</style>
