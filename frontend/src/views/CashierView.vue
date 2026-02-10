<template>
  <div class="cashier-page animate-fade-in">
    <!-- Header Section -->
    <div class="cashier-header-premium glass-premium-dark">
      <div class="header-content">
        <div class="brand-group">
          <div class="brand-icon-wrapper">
            <AppIcon name="receipt" :size="28" />
          </div>
          <div class="brand-text">
            <h1 class="premium-title">SmartFarm <span class="text-gradient">Cashier</span></h1>
            <p class="premium-subtitle">Terminal Pemrosesan Invoice Real-time</p>
          </div>
        </div>

        <div class="header-status">
          <div class="status-indicator" :class="{ 'online': isConnected }">
            <div class="pulse-ring"></div>
            <span>{{ isConnected ? 'Sistem Aktif' : 'Menghubungkan...' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="main-layout-grid">
      <!-- Sidebar: Order List -->
      <aside class="sidebar-panel glass-premium-dark">
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
              <div v-if="historyOrders.length === 0" class="empty-state-card">
                <h3>Riwayat Kosong</h3>
                <p>Terus layani pelanggan Anda!</p>
              </div>

              <div 
                v-for="order in historyOrders" 
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
                    <AppIcon name="check-circle" :size="14" class="text-emerald" />
                  </div>
                </div>
              </div>
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
            <div class="editor-visual-split" :class="{ 'with-reference': showReference }">
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
                          <input v-model.number="item.qty" type="number" class="item-input qty" placeholder="1" />
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
                    <h4>Market Price (ZONA 1)</h4>
                    <div class="ref-search">
                      <AppIcon name="search" :size="14" />
                      <input v-model="refSearch" placeholder="Cari harga..." />
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
                        <span class="ref-cat">{{ price.category }}</span>
                      </div>
                      <div class="ref-value">{{ formatCurrency(price.zona_1) }}</div>
                    </div>
                  </div>
                  <p class="ref-hint">*Sumber: Sinkronisasi GSheet Up-to-date</p>
                </div>
              </Transition>

              <!-- Right: Live Preview -->
              <div class="visual-preview">
                <div class="preview-canvas">
                  <div id="invoice-preview" class="premium-invoice-paper shadow-2xl">
                    <div class="inv-brand-header">
                      <div class="inv-logo">
                        <AppIcon name="sprout" :size="24" />
                        <span>SmartFarm</span>
                      </div>
                      <div class="inv-type">OFFICIAL INVOICE</div>
                    </div>

                    <div class="inv-details">
                      <div class="details-left">
                        <label>DITAGIHKAN KEPADA</label>
                        <div class="client-name">{{ localOrderData.customer_phone || 'Pelanggan Umum' }}</div>
                      </div>
                      <div class="details-right">
                        <div class="meta-row">
                          <label>INVOICE NO.</label>
                          <span>#SF-{{ selectedOrder.id }}</span>
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
                      <div v-for="(item, idx) in localOrderData.items" :key="idx" class="inv-item-row">
                        <span class="col-desc">{{ item.label }}</span>
                        <span class="col-qty">{{ item.qty }}</span>
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
                        <p class="main-msg">Terima kasih atas kepercayaan Anda.</p>
                        <p class="sub-msg">Internal Automation System © 2026 SmartFarm Solo</p>
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
                <div v-for="(item, idx) in newOrderForm.items" :key="idx" class="manual-item-row">
                   <input v-model="item.label" class="item-input label" placeholder="Nama Barang..." />
                   <input v-model.number="item.qty" type="number" class="item-input qty" placeholder="Qty" />
                   <input v-model.number="item.price" type="number" class="item-input price" placeholder="Harga Satuan" />
                   <button class="btn-remove-lite" @click="newOrderForm.items.splice(idx, 1)">✕</button>
                </div>
                <button class="btn-add-lite" @click="newOrderForm.items.push({ label: '', qty: 1, price: 0 })">
                   <AppIcon name="plus" :size="14" /> Tambah Item
                </button>
              </div>
            </div>

            <div class="modal-footer-premium mt-lg">
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

const isConnected = ref(false)
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

const localOrderData = reactive({
  customer_name: '',
  items: []
})

const newOrderForm = reactive({
  customer_name: '',
  items: [{ label: '', qty: 1, price: 0 }]
})

let subscription = null

onMounted(async () => {
  await fetchPendingOrders()
  await fetchMarketPrices()
  subscribeToOrders()
})

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
  // If editing an item, we need to know WHICH item. 
  // For simplicity, let's auto-append or update the LAST focused/empty item.
  const emptyItemIdx = localOrderData.items.findIndex(i => !i.label)
  if (emptyItemIdx !== -1) {
    localOrderData.items[emptyItemIdx].label = refNode.product_name
    localOrderData.items[emptyItemIdx].price = refNode.zona_1
  } else {
    localOrderData.items.push({ label: refNode.product_name, qty: 1, price: refNode.zona_1 })
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
    .limit(50)
  
  if (data) historyOrders.value = data
}

function subscribeToOrders() {
  subscription = supabase
    .channel('public:invoices')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'invoices' }, payload => {
      if (payload.new.status === 'pending') {
        pendingOrders.value.unshift(payload.new)
      }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'invoices' }, payload => {
      if (payload.new.status !== 'pending') {
        const idx = pendingOrders.value.findIndex(o => o.id === payload.new.id)
        if (idx !== -1) pendingOrders.value.splice(idx, 1)
        if (selectedOrder.value?.id === payload.new.id) {
          selectedOrder.value = { ...selectedOrder.value, ...payload.new }
        }
      }
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
        whatsapp_raw: 'Manual Web Input'
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
    margin: 10,
    filename: `inv_${selectedOrder.value.id}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 3 },
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
  height: 100vh;
  background: radial-gradient(circle at top right, #111827, #0a0f18);
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
}

/* Header Premium */
.cashier-header-premium {
  padding: 1.25rem 2.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 50;
}

.header-content {
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
  border-radius: 14px;
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
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(3); opacity: 0; }
}

/* Layout Grid */
.main-layout-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  flex: 1;
  overflow: hidden;
}

/* Sidebar */
.sidebar-panel {
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
}

.panel-nav {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.tab-pill-group {
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.tab-pill {
  border: none;
  background: none;
  color: #94a3b8;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.scroll-area { flex: 1; overflow-y: auto; padding: 1.5rem; }
.order-stack { display: flex; flex-direction: column; gap: 1rem; }

.premium-order-card {
  position: relative;
  background: rgba(30, 41, 59, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 18px;
  padding: 1.25rem;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.premium-order-card:hover { transform: translateY(-3px) scale(1.02); background: rgba(30, 41, 59, 0.5); border-color: rgba(16, 185, 129, 0.4); }
.premium-order-card.selected { background: rgba(16, 185, 129, 0.08); border-color: #10b981; box-shadow: 0 10px 30px -10px rgba(16, 185, 129, 0.3); }

.card-meta { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
.time-stamp { font-size: 0.75rem; font-weight: 800; color: #10b981; }
.order-hash { font-size: 0.75rem; color: #64748b; font-family: 'JetBrains Mono', monospace; }

.card-title { font-size: 1.1rem; font-weight: 800; margin: 0 0 0.5rem 0; color: white; }
.card-desc { font-size: 0.85rem; color: #94a3b8; line-height: 1.5; margin: 0 0 1rem 0; }

.card-footer { display: flex; justify-content: space-between; align-items: center; }
.action-hint { font-size: 0.75rem; font-weight: 700; color: #475569; display: flex; align-items: center; gap: 4px; opacity: 0; transition: 0.3s; }
.premium-order-card:hover .action-hint { opacity: 1; transform: translateX(5px); }

/* Workspace */
.workspace-area { flex: 1; background: #0a0f18; position: relative; display: flex; flex-direction: column; padding: 1.5rem; }
.workspace-container { display: flex; flex-direction: column; height: 100%; gap: 1.5rem; }

.workspace-toolbar {
  padding: 1rem 1.5rem;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-indicator { display: flex; align-items: center; gap: 12px; font-size: 0.9rem; color: #94a3b8; }
.order-indicator strong { color: white; }

.btn-group { display: flex; gap: 12px; }

.btn-primary-glow {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white; border: none; padding: 10px 24px; border-radius: 12px; font-weight: 800;
  display: flex; align-items: center; gap: 10px; cursor: pointer;
  box-shadow: 0 8px 20px -5px rgba(16, 185, 129, 0.5);
  transition: all 0.3s;
}

.btn-emerald { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 10px 20px; border-radius: 12px; font-weight: 700; text-decoration: none; display: flex; align-items: center; gap: 8px; }

.btn-secondary-dark { background: rgba(255, 255, 255, 0.05); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.1); padding: 10px 20px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; }

/* Editor & Splitter */
.editor-visual-split { display: grid; grid-template-columns: 320px 1fr; flex: 1; gap: 1.5rem; overflow: hidden; transition: all 0.5s ease; }
.editor-visual-split.with-reference { grid-template-columns: 320px 300px 1fr; }

.sidebar-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.btn-ref-toggle { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 4px 8px; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; gap: 6px; cursor: pointer; }

/* Market Reference Panel */
.market-reference-panel { border-radius: 24px; display: flex; flex-direction: column; overflow: hidden; }
.ref-header { padding: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
.ref-header h4 { margin: 0 0 10px 0; font-size: 0.9rem; color: #10b981; text-transform: uppercase; }
.ref-search { background: rgba(0,0,0,0.2); border-radius: 10px; padding: 0 10px; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.05); }
.ref-search input { background: none; border: none; padding: 8px 0; color: white; width: 100%; font-size: 0.85rem; }

.ref-list { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.ref-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; }
.ref-item:hover { background: rgba(16, 185, 129, 0.1); border-color: #10b981; transform: scale(1.02); }
.ref-info { display: flex; flex-direction: column; }
.ref-name { font-size: 0.85rem; font-weight: 800; color: white; }
.ref-cat { font-size: 0.7rem; color: #64748b; }
.ref-value { font-size: 0.85rem; font-weight: 900; color: #10b981; }
.ref-hint { font-size: 0.65rem; color: #475569; padding: 10px; margin: 0; font-style: italic; }

.scroll-thin::-webkit-scrollbar { width: 4px; }
.scroll-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

.editor-sidebar { border-radius: 24px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
.editor-title { font-size: 1.1rem; font-weight: 800; margin: 0; color: #10b981; }

.editor-field label { display: block; font-size: 0.8rem; font-weight: 700; color: #64748b; margin-bottom: 0.75rem; text-transform: uppercase; }

.input-glow-wrapper {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  gap: 12px;
  color: #64748b;
  transition: all 0.3s;
}

.input-glow-wrapper:focus-within { border-color: #10b981; box-shadow: 0 0 15px rgba(16, 185, 129, 0.1); color: #10b981; }

.input-glow-wrapper input, .input-glow-wrapper textarea {
  background: none; border: none; padding: 12px 0; color: white; width: 100%; font-family: inherit; font-size: 0.95rem;
}

.input-glow-wrapper.textarea { align-items: flex-start; }

.visual-preview { flex: 1; overflow-y: auto; padding-right: 10px; }
.preview-canvas { transform: scale(0.9); transform-origin: top center; }

/* Invoice Paper */
.premium-invoice-paper {
  background: #ffffff;
  width: 148mm; min-height: 210mm; /* A5 */
  margin: 0 auto;
  padding: 15mm;
  color: #1e293b;
  font-family: 'DM Sans', sans-serif;
  position: relative;
}

.inv-brand-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12mm; border-bottom: 2px solid #f1f5f9; padding-bottom: 5mm; }
.inv-logo { display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 1.2rem; color: #10b981; }
.inv-type { font-weight: 800; color: #cbd5e1; letter-spacing: 2px; font-size: 0.8rem; }

.inv-details { display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 10mm; gap: 5mm; }
.inv-details label { display: block; font-weight: 900; font-size: 0.65rem; color: #94a3b8; margin-bottom: 1mm; }
.client-name { font-weight: 700; font-size: 1rem; color: #0f172a; }

.meta-row { display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 2px; font-size: 0.85rem; }
.meta-row span { font-weight: 700; color: #475569; }

.inv-table-header { background: #f8fafc; padding: 2mm 4mm; border-radius: 4px; font-weight: 900; font-size: 0.7rem; color: #64748b; margin-bottom: 5mm; }

.inv-body-content { min-height: 80mm; }
.summary-text-area { white-space: pre-wrap; font-size: 0.95rem; line-height: 1.6; color: #334155; font-family: 'Inter', sans-serif; }

.inv-footer-premium { margin-top: 10mm; border-top: 1px dashed #e2e8f0; padding-top: 8mm; display: flex; align-items: center; gap: 15px; }
.footer-msg p { margin: 0; }
.main-msg { font-weight: 800; color: #0f172a; font-size: 0.9rem; }
.sub-msg { font-size: 0.75rem; color: #94a3b8; }

/* Structured Invoice Table Styles */
.inv-table-header { display: flex; gap: 4px; padding: 3mm 4mm; }
.inv-table-header span { font-size: 0.65rem; }
.col-desc { flex: 1; }
.col-qty { width: 10mm; text-align: center; }
.col-price { width: 25mm; text-align: right; }
.col-total { width: 25mm; text-align: right; }

.inv-item-row { display: flex; gap: 4px; padding: 3mm 4mm; border-bottom: 1px solid #f8fafc; font-size: 0.85rem; font-weight: 500; }
.inv-grand-total { margin-top: 8mm; padding: 4mm; background: #f8fafc; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
.total-label { font-size: 0.7rem; font-weight: 900; color: #94a3b8; }
.total-value { font-size: 1.1rem; font-weight: 900; color: #10b981; }

/* Editor & Manual Modal Items Styling */
.items-editor, .items-list-manual { display: flex; flex-direction: column; gap: 10px; }
.item-row-edit, .manual-item-row { display: grid; grid-template-columns: 1fr 60px 100px 30px; gap: 8px; align-items: center; }
.item-input { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 8px 12px; color: white; font-size: 0.9rem; }
.item-input:focus { border-color: #10b981; outline: none; }
.btn-remove-item, .btn-remove-lite { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); width: 30px; height: 30px; border-radius: 8px; cursor: pointer; }
.btn-add-item-sm, .btn-add-lite { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px dashed rgba(16, 185, 129, 0.4); padding: 8px; border-radius: 10px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 700; }


/* Empty States */
.empty-workspace-premium { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0.5; }
.icon-circle { width: 120px; height: 120px; background: rgba(30,39,59,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; border: 2px solid rgba(255,255,255,0.05); color: #475569; }

/* Modal & Transitions */
.glass-premium-dark { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 20px 50px rgba(0,0,0,0.4); }

.list-stagger-enter-active { animation: slide-in 0.4s ease forwards; }
@keyframes slide-in { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }

.fade-scale-enter-active { animation: fade-scale 0.3s ease; }
@keyframes fade-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

.access-pill { font-size: 0.65rem; padding: 4px 8px; border-radius: 6px; font-weight: 900; }
.access-pill.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.access-pill.ready { background: rgba(16, 185, 129, 0.1); color: #10b981; }

.notif-count { background: #ef4444; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; }

/* Modal Premium Overrides (From AdminView) */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-card-premium { width: 500px; border-radius: 28px; overflow: hidden; padding: 0; }
.modal-header-premium { padding: 2rem; display: flex; gap: 1.5rem; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); }
.header-icon-box { min-width: 56px; height: 56px; border-radius: 16px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; }
.header-icon-box.amber { color: #f59e0b; background: rgba(245,158,11,0.1); }
.header-text h3 { margin: 0; font-size: 1.25rem; font-weight: 800; }
.header-text p { margin: 4px 0 0 0; color: #94a3b8; font-size: 0.9rem; }
.modal-close-btn { background: none; border: none; color: #475569; cursor: pointer; font-size: 1.2rem; }
.modal-form-content { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
.input-field label { font-size: 0.85rem; font-weight: 700; color: #64748b; margin-bottom: 10px; display: block; }
.field-container { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; display: flex; align-items: center; padding: 0 1rem; color: #475569; }
.field-container input, .field-container textarea { background: none; border: none; padding: 14px 10px; color: white; width: 100%; font-family: inherit; }
.field-container.textarea { align-items: flex-start; }
.btn-confirm { background: linear-gradient(to right, #10b981, #059669); color: white; border: none; padding: 14px 28px; border-radius: 18px; font-weight: 700; cursor: pointer; }
.btn-cancel { background: none; border: none; color: #94a3b8; font-weight: 700; cursor: pointer; }
</style>
