<template>
  <div class="report-form-container">
    <form @submit.prevent="handleSubmit" class="submit-form animate-slide-up">
      <!-- Weather Section -->
      <div class="section-container card-premium">
        <span class="section-label">Cuaca Hari Ini</span>
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

      <!-- Activities Section -->
      <div class="section-container card-premium">
        <span class="section-label">Detail Kegiatan</span>
        <div class="form-group">
          <label class="form-label-premium">Apa ringkasan kegiatan Anda?</label>
          <input 
            type="text" 
            v-model="formData.activities.summary" 
            class="form-input-premium" 
            placeholder="Contoh: Pemupukan Tanaman"
            required
          />
        </div>

        <!-- Company Specific Secondary Card -->
        <div v-if="isLyori || isMoafarm || isKaja" class="specific-data-card animate-fade-in">
          <span class="section-label-small">Data Teknis</span>
          
          <!-- Lyori -->
          <div v-if="isLyori" class="technical-grid">
            <div class="input-modern">
              <label>PPM Nutrisi</label>
              <input type="number" v-model="formData.activities.ppm" placeholder="0" />
            </div>
            <div class="input-modern">
              <label>pH Air</label>
              <input type="number" step="0.1" v-model="formData.activities.ph" placeholder="0.0" />
            </div>
            <div class="input-modern">
              <label>Suhu Air (°C)</label>
              <input type="number" v-model="formData.activities.temp" placeholder="0" />
            </div>
          </div>

          <!-- Moafarm -->
          <div v-if="isMoafarm" class="technical-grid">
            <div class="input-modern">
              <label>Hama Temuan</label>
              <input type="text" v-model="formData.activities.pests" placeholder="Jenis hama..." />
            </div>
            <div class="input-modern">
              <label>Pupuk</label>
              <input type="text" v-model="formData.activities.fertilizer" placeholder="Merk/Jenis..." />
            </div>
          </div>

          <!-- Kaja -->
          <div v-if="isKaja" class="technical-grid">
            <div class="input-modern">
              <label>Jumlah Pekerja</label>
              <input type="number" v-model="formData.activities.worker_count" placeholder="0" />
            </div>
            <div class="input-modern">
              <label>Jam Operasional</label>
              <input type="text" v-model="formData.activities.op_hours" placeholder="07:00 - 16:00" />
            </div>
          </div>
        </div>

        <div class="form-group mt-md">
          <div class="flex-between mb-sm">
            <label class="form-label-premium mb-0">Bisa jelaskan detailnya?</label>
            <button 
              type="button" 
              class="btn-ai-assist" 
              @click="generateAIReport" 
              :disabled="isGeneratingAI || !formData.activities.summary"
              title="Buat detail otomatis dengan AI"
            >
              <span v-if="isGeneratingAI" class="spinner-sm"></span>
              <span v-else>✨ Tuliskan untuk Saya</span>
            </button>
          </div>
          <textarea 
            v-model="formData.activities.details" 
            class="form-input-premium" 
            rows="4" 
            placeholder="Jelaskan secara detail apa yang dikerjakan hari ini..."
            required
          ></textarea>
        </div>
      </div>

      <!-- Issues Section -->
      <div class="section-container">
        <div class="flex-between mb-sm">
          <span class="section-label">Kendala (Jika ada)</span>
          <button type="button" class="btn-text-premium" @click="addIssue">
            + Tambah
          </button>
        </div>
        
        <transition-group name="list">
          <div v-for="(issue, index) in formData.issues" :key="index" class="issue-card-premium card">
            <div class="issue-header">
              <div class="severity-picker">
                <span :class="['severity-dot', issue.severity]"></span>
                <select v-model="issue.severity" class="severity-select">
                  <option value="low">Rendah</option>
                  <option value="medium">Sedang</option>
                  <option value="high">Tinggi</option>
                </select>
              </div>
              <button type="button" class="btn-remove" @click="removeIssue(index)">✕</button>
            </div>
            <textarea 
              v-model="issue.notes" 
              class="issue-textarea" 
              placeholder="Masalah yang dihadapi..."
            ></textarea>
          </div>
        </transition-group>
      </div>

      <!-- Notes Section -->
      <div class="section-container card-premium">
        <span class="section-label">Pesan Tambahan</span>
        <textarea 
          v-model="formData.notes" 
          class="form-input-premium" 
          rows="2" 
          placeholder="Ada catatan lain untuk hari ini?"
        ></textarea>
      </div>

      <!-- Action Footer -->
      <div class="form-footer">
        <div v-if="statusMessage" :class="['status-toast animate-slide-up', statusType]">
          <span class="status-icon">{{ statusType === 'success' ? '✅' : 'ℹ️' }}</span>
          {{ statusMessage }}
        </div>

        <div v-if="draftSavedAt" class="draft-badge">
          <span class="pulsing-dot"></span>
          Draft tersimpan {{ draftSavedAt }}
        </div>

        <button type="submit" class="btn-premium-submit" :disabled="submitting">
          <span v-if="submitting" class="spinner-white"></span>
          <span v-else>Kirim Laporan Harian</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/services/supabase' 
import { aiService } from '@/services/ai'
import { useSupabaseReports } from '@/composables/useSupabaseReports'

const authStore = useAuthStore()
const { submitDailyReport, isSaving: submitting } = useSupabaseReports()

const statusMessage = ref('')
const statusType = ref('')
const draftSavedAt = ref(null)
const isGeneratingAI = ref(false)

// Company Checks
const isLyori = computed(() => authStore.user?.company_id === '53af2fd7-685d-41b5-8daa-265fe3db9b46')
const isMoafarm = computed(() => authStore.user?.company_id === '5236043f-a9ce-498c-84c4-c5de16893ccd')
const isKaja = computed(() => authStore.user?.company_id === '8523f28b-7f12-4455-a8a8-015d2a826d5c')

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
    details: '',
    ppm: null,
    ph: null,
    temp: null,
    pests: '',
    fertilizer: '',
    worker_count: null,
    op_hours: ''
  },
  issues: [],
  notes: ''
})

const DRAFT_KEY = 'sf_farmer_draft'
let saveTimeout = null

// --- Draft Logic ---
async function saveDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(formData.value))
  draftSavedAt.value = new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})

  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(async () => {
    if (!authStore.user?.id || !authStore.user?.company_id) return
    try {
      // Delete existing draft first, then insert new one (safer than upsert with unguaranteed constraint)
      await supabase.from('draft_daily_reports').delete().eq('user_id', authStore.user.id)
      await supabase.from('draft_daily_reports').insert({
          user_id: authStore.user.id,
          company_id: authStore.user.company_id,
          report_data: formData.value,
          last_saved: new Date().toISOString()
        })
    } catch (err) { console.warn('Draft sync failed', err) }
  }, 2000)
}

async function loadDraft() {
  const saved = localStorage.getItem(DRAFT_KEY)
  if (saved) {
    formData.value = JSON.parse(saved)
    statusMessage.value = '💡 Draft lokal dimuat.'
    statusType.value = 'info'
    return
  }
  if (authStore.user?.id) {
    try {
      const { data } = await supabase.from('draft_daily_reports')
        .select('report_data').eq('user_id', authStore.user.id).limit(1).single()
      if (data?.report_data) {
        formData.value = data.report_data
        statusMessage.value = '☁️ Draft cloud dimuat.'
        statusType.value = 'info'
      }
    } catch {}
  }
}

async function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
  formData.value = { 
    weather: 'cerah', 
    activities: { summary: '', details: '', ppm: null, ph: null, temp: null, pests: '', fertilizer: '', worker_count: null, op_hours: '' }, 
    issues: [], 
    notes: '' 
  }
  draftSavedAt.value = null
  if (authStore.user?.id) await supabase.from('draft_daily_reports').delete().eq('user_id', authStore.user.id)
}

watch(formData, () => saveDraft(), { deep: true })

// --- Form Handlers ---
function addIssue() { formData.value.issues.push({ severity: 'low', notes: '', status: 'ongoing' }) }
function removeIssue(index) { formData.value.issues.splice(index, 1) }

// AI Helper
async function generateAIReport() {
  if (!formData.value.activities.summary) return
  
  isGeneratingAI.value = true
  try {
    const context = {
      weather: formData.value.weather,
      summary: formData.value.activities.summary,
      notes: formData.value.notes,
      issues: formData.value.issues,
      company: authStore.user?.companies?.name || 'ePanen'
    }
    
    const result = await aiService.assistFarmerReport(context)
    if (result && !result.includes('Maaf') && !result.includes('Fitur AI')) {
      // Append or Replace? Let's use typewriter effect simulation or just set it
      formData.value.activities.details = result
    } else {
      statusMessage.value = result // Show error inline
      statusType.value = 'error'
      setTimeout(() => statusMessage.value = '', 3000)
    }
  } catch (err) {
    console.error(err)
  } finally {
    isGeneratingAI.value = false
  }
}

async function handleSubmit() {
    statusMessage.value = ''
    
    // Construct payload for RAG flexibility
    // Putting extra fields inside activities object
    const payload = {
        activities: formData.value.activities,
        weather: formData.value.weather,
        notes: formData.value.notes,
        issues: formData.value.issues.map(i => ({
            description: i.notes,
            severity: i.severity,
            status: 'ongoing'
        }))
    }

    const result = await submitDailyReport(payload)

    if (result.success) {
        statusMessage.value = '✅ Laporan berhasil dikirim!'
        statusType.value = 'success'
        clearDraft()
    } else {
        statusMessage.value = '❌ ' + result.error
        statusType.value = 'error'
    }
}

onMounted(() => loadDraft())
</script>

<style scoped>
.report-form-container {
  padding-bottom: 40px;
}

.submit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.section-container {
  display: flex;
  flex-direction: column;
}

.card-premium {
  background: rgba(var(--bg-card-rgb), 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
}

.section-label {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--primary-600);
  margin-bottom: var(--space-md);
  display: block;
}

.section-label-small {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-tertiary);
  display: block;
  margin-bottom: var(--space-sm);
}

/* Weather Selector */
.weather-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-sm);
}

.weather-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-md) var(--space-xs);
  background: var(--bg-tertiary);
  border: 2px solid transparent;
  border-radius: var(--radius-card);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.weather-btn.active {
  background: var(--primary-50);
  border-color: var(--primary-500);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
}

.dark-mode .weather-btn.active {
  background: rgba(34, 197, 94, 0.1);
}

.weather-icon {
  font-size: 1.75rem;
  margin-bottom: 4px;
}

.weather-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.weather-btn.active .weather-label {
  color: var(--primary-700);
}

/* Form Styling */
.form-label-premium {
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.form-input-premium {
  width: 100%;
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border: 1px solid transparent;
  border-radius: var(--radius-card);
  color: var(--text-primary);
  font-size: 1rem;
  transition: all 0.2s;
}

.form-input-premium:focus {
  outline: none;
  background: var(--bg-secondary);
  border-color: var(--primary-400);
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
}

/* Technical Data Card */
.specific-data-card {
  margin-top: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-card);
  border: 1px dashed var(--border-color);
}

.technical-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: var(--space-md);
}

.input-modern {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-modern label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-tertiary);
}

.input-modern input {
  padding: 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-weight: 600;
  color: var(--text-primary);
}

/* Issues Redesign */
.issue-card-premium {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-left: 4px solid var(--primary-500);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  box-shadow: var(--shadow-sm);
}

.issue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.severity-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-tertiary);
  padding: 4px 10px;
  border-radius: var(--radius-full);
}

.severity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.severity-dot.low { background: var(--success); }
.severity-dot.medium { background: var(--warning); }
.severity-dot.high { background: var(--error); }

.severity-select {
  background: none;
  border: none;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  cursor: pointer;
}

.btn-remove {
  background: var(--gray-100);
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: var(--error);
  color: white;
}

.issue-textarea {
  width: 100%;
  padding: 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  resize: none;
}

.issue-textarea:focus {
  outline: none;
  border-color: var(--border-color);
  background: var(--bg-tertiary);
}

/* Footer & Actions */
.form-footer {
  margin-top: var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.btn-premium-submit {
  width: 100%;
  padding: var(--space-lg);
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  border: none;
  border-radius: var(--radius-xl);
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);
  transition: all 0.3s;
}

.btn-premium-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(34, 197, 94, 0.4);
}

.btn-premium-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--gray-400);
  box-shadow: none;
}

.flex-between { display: flex; justify-content: space-between; align-items: center; }
.btn-text-premium {
  background: var(--primary-100);
  color: var(--primary-700);
  border: none;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

.status-toast {
  padding: var(--space-md);
  border-radius: var(--radius-card);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-weight: 600;
  font-size: 0.95rem;
}

.status-toast.success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
.status-toast.error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

.draft-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-weight: 600;
}

.pulsing-dot {
  width: 6px;
  height: 6px;
  background: var(--primary-500);
  border-radius: 50%;
  animation: pulse-ring 1.5s infinite;
}

.spinner-white {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: block;
  margin: 0 auto;
}

.spinner-sm {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(16, 185, 129, 0.3);
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.btn-ai-assist {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-ai-assist:hover:not(:disabled) {
  background: rgba(16, 185, 129, 0.2);
  transform: translateY(-1px);
}

.btn-ai-assist:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Animations */
.list-enter-active, .list-leave-active { transition: all 0.3s ease; }
.list-enter-from { opacity: 0; transform: translateY(-10px); }
.list-leave-to { opacity: 0; transform: scale(0.9); }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
