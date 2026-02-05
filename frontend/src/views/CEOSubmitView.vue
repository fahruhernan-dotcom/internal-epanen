<template>
  <div class="submit-page animate-fade-in">
    <div class="card">
      <div class="card-header">
        <h2>Submit Laporan CEO</h2>
        <p class="subtitle">Unggah data keuangan atau operasional penting untuk <strong>{{ authStore.user?.companies?.name }}</strong></p>
      </div>

      <form @submit.prevent="handleSubmit" class="submit-form">
        <!-- Document Type -->
        <div class="form-group">
          <label class="form-label">Tipe Laporan</label>
          <select v-model="formData.type" class="form-input" required>
            <option value="financial">Laporan Keuangan</option>
            <option value="operational">Laporan Operasional</option>
            <option value="strategic">Rencana Strategis</option>
            <option value="other">Lainnya</option>
          </select>
        </div>

        <!-- Content/Summary -->
        <div class="form-group">
          <label class="form-label">Ringkasan Laporan</label>
          <input 
            type="text" 
            v-model="formData.title" 
            class="form-input" 
            placeholder="Contoh: Laporan Keuangan Minggu ke-1 Februari"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Isi Laporan / Detail</label>
          <textarea 
            v-model="formData.content" 
            class="form-input" 
            rows="8" 
            placeholder="Ketik isi laporan di sini..."
            required
          ></textarea>
        </div>

        <!-- Data Points (Optional) -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Total Revenue (Opsional)</label>
            <input type="number" v-model="formData.revenue" class="form-input" placeholder="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Total Pengeluaran (Opsional)</label>
            <input type="number" v-model="formData.expenses" class="form-input" placeholder="0" />
          </div>
        </div>

        <div v-if="statusMessage" :class="['message', statusType]">
          {{ statusMessage }}
        </div>

        <div class="form-actions">
          <div v-if="draftSavedAt" class="draft-status mb-sm">
            <span>Draft tersimpan otomatis: {{ draftSavedAt }}</span>
            <button type="button" class="btn-text" @click="clearDraft">Hapus Draft</button>
          </div>
          <button type="submit" class="btn btn-primary btn-block" :disabled="submitting">
            <span v-if="submitting" class="spinner"></span>
            <span v-else>Submit Laporan</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase, COMPANY_TABLES } from '@/services/supabase'

const authStore = useAuthStore()
const submitting = ref(false)
const statusMessage = ref('')
const statusType = ref('')
const draftSavedAt = ref(null)

const formData = ref({
  type: 'financial',
  title: '',
  content: '',
  revenue: null,
  expenses: null
})

const DRAFT_KEY = 'sf_ceo_draft'

function saveDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(formData.value))
  draftSavedAt.value = new Date().toLocaleTimeString('id-ID')
}

function loadDraft() {
  const saved = localStorage.getItem(DRAFT_KEY)
  if (saved) {
    formData.value = JSON.parse(saved)
    statusMessage.value = '💡 Draft laporan sebelumnya telah dimuat.'
    statusType.value = 'info'
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
  formData.value = {
    type: 'financial',
    title: '',
    content: '',
    revenue: null,
    expenses: null
  }
  draftSavedAt.value = null
}

// Auto-save on change
watch(formData, () => {
  saveDraft()
}, { deep: true })

async function handleSubmit() {
  if (!authStore.user?.company_id) {
    statusMessage.value = 'Perusahaan tidak ditemukan.'
    statusType.value = 'error'
    return
  }

  const companyName = authStore.user.companies?.name
  const tableInfo = COMPANY_TABLES[companyName]
  
  if (!tableInfo?.finance) {
    statusMessage.value = `Tabel finansial tidak ditemukan untuk ${companyName}`
    statusType.value = 'error'
    return
  }

  submitting.value = true
  statusMessage.value = ''

  try {
    const docData = {
      content: `${formData.value.title}\n\n${formData.value.content}`,
      metadata: {
        type: formData.value.type,
        title: formData.value.title,
        revenue: formData.value.revenue,
        expenses: formData.value.expenses,
        submitted_by: authStore.user.full_name,
        date: new Date().toISOString()
      }
    }

    const { error } = await supabase
      .from(tableInfo.finance)
      .insert(docData)

    if (error) throw error

    statusMessage.value = '✅ Laporan CEO berhasil dikirim!'
    statusType.value = 'success'
    
    clearDraft()
  } catch (err) {
    statusMessage.value = '❌ Gagal mengirim laporan: ' + err.message
    statusType.value = 'error'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadDraft()
})
</script>

<style scoped>
.submit-page {
  max-width: 900px;
  margin: 0 auto;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.submit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  margin-top: var(--space-lg);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.message {
  padding: var(--space-md);
  border-radius: var(--radius-md);
  font-weight: 500;
}

.message.success {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
}

.message.info {
  background: rgba(59, 130, 246, 0.1);
  color: var(--info);
}

.draft-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  padding: 0 4px;
}

.btn-block {
  width: 100%;
  padding: var(--space-lg);
}
</style>
