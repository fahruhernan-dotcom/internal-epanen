<template>
  <div class="query-page animate-fade-in">
    <header class="dashboard-header mb-lg">
      <span class="section-label">AI Orchestrator</span>
      <h2 class="gradient-text">RAG Intelligence Query</h2>
      <p class="text-muted">Tanyakan apapun mengenai data finansial, operasional, atau SOP dari semua perusahaan.</p>
    </header>

    <div class="query-layout">
      <!-- Main Query Area -->
      <div class="query-main">
        <div class="card glass-premium query-input-card">
          <div class="flex gap-md items-center mb-md">
            <div class="filter-group">
              <select v-model="selectedCompany" class="form-input btn-sm">
                <option value="all">Semua Perusahaan</option>
                <option value="Lyori">Lyori</option>
                <option value="Moafarm">Moafarm</option>
                <option value="Kaja">Kaja</option>
                <option value="ePanen">ePanen</option>
              </select>
            </div>
          </div>

          <div class="input-container">
            <textarea 
              v-model="queryText" 
              placeholder="Contoh: Berapa total profit Lyori di bulan Januari?"
              class="form-input query-textarea"
              @keydown.enter.prevent="handleAsk"
            ></textarea>
            <button 
              class="btn btn-primary btn-ask" 
              :disabled="loading || !queryText.trim()"
              @click="handleAsk"
            >
              <span v-if="loading" class="spinner"></span>
              <span v-else>Tanya AI 🧠</span>
            </button>
          </div>
        </div>

        <!-- Result Area -->
        <div v-if="currentResult" class="card-nature result-card animate-slide-up">
          <div class="result-header">
            <span class="badge badge-info">{{ currentResult.company }}</span>
            <span class="text-tiny text-muted">{{ formatDate(currentResult.timestamp) }}</span>
          </div>
          <div class="result-content">
            <p class="query-echo">"{{ currentResult.query }}"</p>
            <div class="ai-response">
              <span class="ai-icon">🤖</span>
              <div class="response-text">{{ currentResult.response }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- History Sidebar -->
      <div class="query-history card glass-premium">
        <h3>Riwayat Pertanyaan</h3>
        <div v-if="history.length === 0" class="empty-history">
          <p>Belum ada riwayat pertanyaan.</p>
        </div>
        <div v-else class="history-list">
          <div 
            v-for="item in history" 
            :key="item.id" 
            class="history-item"
            @click="currentResult = item"
          >
            <p class="history-query">{{ truncate(item.query, 50) }}</p>
            <span class="history-meta">{{ item.company }} • {{ formatDate(item.timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRag } from '@/composables/useRag'

const { loading, history, askQuestion } = useRag()
const queryText = ref('')
const selectedCompany = ref('all')
const currentResult = ref(null)

async function handleAsk() {
  if (!queryText.value.trim() || loading.value) return
  
  const result = await askQuestion(queryText.value, selectedCompany.value)
  if (result) {
    currentResult.value = result
    queryText.value = ''
  }
}

function formatDate(date) {
  return new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '...' : str
}
</script>

<style scoped>
.query-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--space-xl);
}

.query-input-card {
  padding: var(--space-xl);
  margin-bottom: var(--space-xl);
}

.input-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.query-textarea {
  min-height: 100px;
  resize: none;
  font-size: 1.1rem;
  padding: var(--space-lg);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
}

.btn-ask {
  align-self: flex-end;
  padding: var(--space-md) var(--space-2xl);
  font-size: 1rem;
}

.result-card {
  padding: var(--space-xl);
  border-left: 4px solid var(--primary-500);
}

.query-echo {
  font-style: italic;
  color: var(--text-tertiary);
  margin-bottom: var(--space-lg);
  font-size: 0.9rem;
}

.ai-response {
  display: flex;
  gap: var(--space-md);
  align-items: flex-start;
}

.ai-icon { font-size: 1.5rem; }

.response-text {
  line-height: 1.6;
  color: var(--text-primary);
}

.query-history {
  height: calc(100vh - 250px);
  display: flex;
  flex-direction: column;
}

.history-list {
  margin-top: var(--space-lg);
  overflow-y: auto;
  flex: 1;
}

.history-item {
  padding: var(--space-md);
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.2s;
}

.history-item:hover {
  background: var(--bg-tertiary);
}

.history-query {
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 4px;
}

.history-meta {
  font-size: 0.7rem;
  color: var(--text-tertiary);
}

.empty-history {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary);
  font-style: italic;
}

@media (max-width: 768px) {
  .query-layout {
    grid-template-columns: 1fr;
  }
}
</style>
