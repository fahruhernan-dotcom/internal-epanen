<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content glass-premium animate-slide-up">
      <div class="modal-header">
        <div class="flex items-center gap-md">
          <span class="modal-icon">📄</span>
          <div>
            <h3>RAG Document Reconstructor</h3>
            <span class="text-tiny text-muted">Reassembling fragmented chunks: {{ docRef }}</span>
          </div>
        </div>
        <button class="btn-close" @click="close">✕</button>
      </div>

      <div class="modal-body">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <span>Reconstructing document from vector chunks...</span>
        </div>

        <div v-else-if="reconstructedContent.length === 0" class="empty-state">
          <p>Gagal merekonstruksi dokumen. Metadata tidak cukup.</p>
        </div>

        <div v-else class="document-scroller">
          <div v-for="(chunk, index) in reconstructedContent" :key="index" class="chunk-block">
            <div class="chunk-meta">Line {{ chunk.metadata?.loc?.lines?.from || '?' }} - {{ chunk.metadata?.loc?.lines?.to || '?' }}</div>
            <div class="chunk-text">{{ chunk.content }}</div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <span class="text-tiny">Total {{ reconstructedContent.length }} chunks found in Supabase</span>
        <button class="btn btn-primary btn-sm" @click="close">Tutup</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { supabase } from '@/services/supabase'

const props = defineProps({
  isOpen: Boolean,
  docRef: String, // metadata.week_month_year or similar identifier
  table: String
})

const emit = defineEmits(['close'])

const loading = ref(false)
const reconstructedContent = ref([])

async function reconstruct() {
  if (!props.docRef || !props.table) return
  
  loading.value = true
  reconstructedContent.value = []

  try {
    // Search for all chunks sharing the same doc reference (e.g. week_month_year)
    // Note: In a real scenario, we'd filter by specific metadata fields.
    // For this demo, we'll fetch all and filter in JS if needed.
    const { data, error } = await supabase
      .from(props.table)
      .select('*')
      .order('id', { ascending: true }) // Initial order

    if (error) throw error

    // Filter chunks that belong to the same logical document
    // and sort them based on the `loc.lines.from` metadata
    const filtered = (data || []).filter(item => {
      // Logic: share the same week/month/year as the clicked reference
      return item.metadata?.week === props.docRef.week && 
             item.metadata?.month === props.docRef.month &&
             item.metadata?.year === props.docRef.year
    }).sort((a, b) => {
      const lineA = a.metadata?.loc?.lines?.from || 0
      const lineB = b.metadata?.loc?.lines?.from || 0
      return lineA - lineB
    })

    reconstructedContent.value = filtered
  } catch (err) {
    console.error('Reconstruction failed:', err)
  } finally {
    loading.value = false
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) reconstruct()
})

function close() {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: var(--space-xl);
}

.modal-content {
  width: 100%;
  max-width: 900px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-xl);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.modal-header {
  padding: var(--space-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);
  background: rgba(0, 0, 0, 0.1);
}

.document-scroller {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-width: 800px;
  margin: 0 auto;
}

.chunk-block {
  background: var(--bg-secondary);
  padding: var(--space-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  position: relative;
}

.chunk-meta {
  font-size: 0.65rem;
  color: var(--primary-500);
  font-weight: 700;
  margin-bottom: var(--space-xs);
  opacity: 0.6;
}

.chunk-text {
  font-family: 'Inter', sans-serif;
  line-height: 1.7;
  color: var(--text-primary);
  white-space: pre-wrap;
}

.modal-footer {
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-close {
  background: var(--bg-tertiary);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: var(--space-md);
}

.text-tiny { font-size: 0.75rem; }
</style>
