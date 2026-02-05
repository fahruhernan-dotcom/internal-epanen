<template>
  <div class="submit-page animate-fade-in">
    <div class="card">
      <div class="card-header">
        <h2>Kirim Laporan Harian</h2>
        <p class="subtitle">Silakan isi laporan kegiatan harian untuk <strong>{{ authStore.user?.companies?.name }}</strong></p>
      </div>

      <form @submit.prevent="handleSubmit" class="submit-form">
        <!-- Weather -->
        <div class="form-group">
          <label class="form-label">Cuaca Hari Ini</label>
          <div class="weather-selector">
            <button 
              type="button" 
              v-for="w in weatherOptions" 
              :key="w.value"
              :class="['weather-btn', { active: formData.weather === w.value }]"
              @click="formData.weather = w.value"
            >
              <span class="weather-icon">{{ w.icon }}</span>
              <span class="weather-label">{{ w.label }}</span>
            </button>
          </div>
        </div>

        <!-- Activities -->
        <div class="form-group">
          <label class="form-label">Ringkasan Kegiatan</label>
          <input 
            type="text" 
            v-model="formData.activities.summary" 
            class="form-input" 
            placeholder="Contoh: Pemupukan Tanaman"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Detail Kegiatan</label>
          <textarea 
            v-model="formData.activities.details" 
            class="form-input" 
            rows="4" 
            placeholder="Jelaskan secara detail apa yang dikerjakan hari ini..."
            required
          ></textarea>
        </div>

        <!-- Issues -->
        <div class="form-group">
          <div class="flex-between">
            <label class="form-label">Masalah / Kendala (Opsional)</label>
            <button type="button" class="btn-text" @click="addIssue">+ Tambah Kendala</button>
          </div>
          
          <div v-for="(issue, index) in formData.issues" :key="index" class="issue-item card">
            <div class="issue-header">
              <select v-model="issue.severity" class="form-input mini">
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
              </select>
              <button type="button" class="btn-icon" @click="removeIssue(index)">✕</button>
            </div>
            <textarea 
              v-model="issue.notes" 
              class="form-input" 
              placeholder="Jelaskan masalah yang dihadapi..."
            ></textarea>
          </div>
        </div>

        <!-- Notes -->
        <div class="form-group">
          <label class="form-label">Catatan Tambahan</label>
          <textarea 
            v-model="formData.notes" 
            class="form-input" 
            rows="2" 
            placeholder="Ada pesan lain untuk pimpinan?"
          ></textarea>
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
            <span v-else>Kirim Laporan</span>
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

const weatherOptions = [
  { label: 'Cerah', value: 'cerah', icon: '☀️' },
  { label: 'Berawan', value: 'berawan', icon: '☁️' },
  { label: 'Hujan', value: 'hujan', icon: '🌧️' },
  { label: 'Badai', value: 'badai', icon: '⚡' }
]

const formData = ref({
  weather: 'cerah',
  activities: {
    summary: '',
    details: ''
  },
  issues: [],
  notes: ''
})

const DRAFT_KEY = 'sf_farmer_draft'
let saveTimeout = null

async function saveDraft() {
  // Always save to localStorage first for instant feedback
  localStorage.setItem(DRAFT_KEY, JSON.stringify(formData.value))
  draftSavedAt.value = new Date().toLocaleTimeString('id-ID')

  // Debounce saving to Supabase
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(async () => {
    if (!authStore.user?.id || !authStore.user?.company_id) return
    
    try {
      const { error } = await supabase
        .from('draft_daily_reports')
        .upsert({
          user_id: authStore.user.id,
          company_id: authStore.user.company_id,
          report_data: formData.value,
          last_saved: new Date().toISOString()
        }, { onConflict: 'user_id, company_id' })
      
      if (error) console.error('Failed to sync draft to cloud:', error)
    } catch (err) {
      console.warn('Draft sync failed:', err)
    }
  }, 2000)
}

async function loadDraft() {
  // 1. Check local storage first
  const saved = localStorage.getItem(DRAFT_KEY)
  if (saved) {
    formData.value = JSON.parse(saved)
    statusMessage.value = '💡 Draft lokal dimuat.'
    statusType.value = 'info'
    return
  }

  // 2. Fallback to Supabase if local is empty
  if (authStore.user?.id) {
    try {
      const { data, error } = await supabase
        .from('draft_daily_reports')
        .select('report_data')
        .eq('user_id', authStore.user.id)
        .order('last_saved', { ascending: false })
        .limit(1)
        .single()
      
      if (data && data.report_data) {
        formData.value = data.report_data
        statusMessage.value = '☁️ Draft dari cloud telah dimuat.'
        statusType.value = 'info'
      }
    } catch (err) {
      console.log('No cloud draft found.')
    }
  }
}

async function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
  formData.value = {
    weather: 'cerah',
    activities: { summary: '', details: '' },
    issues: [],
    notes: ''
  }
  draftSavedAt.value = null

  // Remove from Supabase too
  if (authStore.user?.id) {
    await supabase.from('draft_daily_reports').delete().eq('user_id', authStore.user.id)
  }
}

// Auto-save on change
watch(formData, () => {
  saveDraft()
}, { deep: true })

function addIssue() {
  formData.value.issues.push({ severity: 'low', notes: '' })
}

function removeIssue(index) {
  formData.value.issues.splice(index, 1)
}

async function handleSubmit() {
  if (!authStore.user?.company_id) {
    statusMessage.value = 'Perusahaan tidak ditemukan untuk user ini.'
    statusType.value = 'error'
    return
  }

  const companyName = authStore.user.companies?.name
  const tableInfo = COMPANY_TABLES[companyName]
  
  if (!tableInfo?.dailyReports) {
    statusMessage.value = `Gagal menentukan tabel laporan untuk perusahaan ${companyName}`
    statusType.value = 'error'
    return
  }

  submitting.value = true
  statusMessage.value = ''

  try {
    const reportData = {
      user_id: authStore.user.full_name,
      company_id: authStore.user.company_id,
      report_date: new Date().toISOString().split('T')[0],
      activities: formData.value.activities,
      issues: formData.value.issues.length > 0 ? formData.value.issues : null,
      weather: formData.value.weather,
      notes: formData.value.notes
    }

    const { error } = await supabase
      .from(tableInfo.dailyReports)
      .insert(reportData)

    if (error) throw error

    statusMessage.value = '✅ Laporan berhasil dikirim!'
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
  max-width: 800px;
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

.weather-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-sm);
}

.weather-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.weather-btn:hover {
  background: var(--primary-100);
}

.weather-btn.active {
  border-color: var(--primary-500);
  background: var(--primary-50);
}

.weather-icon {
  font-size: 1.5rem;
}

.weather-label {
  font-size: 0.75rem;
  font-weight: 600;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-text {
  background: none;
  border: none;
  color: var(--primary-600);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
}

.issue-item {
  margin-top: var(--space-sm);
  padding: var(--space-md);
  background: var(--bg-tertiary);
}

.issue-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.mini {
  width: auto;
  padding: 0.25rem 0.5rem;
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
