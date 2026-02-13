<template>
  <div class="logs-page animate-fade-in">
    <header class="dashboard-header mb-lg">
      <span class="section-label">System Security</span>
      <h2 class="gradient-text">Audit Trail & Activity Logs</h2>
      <p class="text-muted">Pemantauan aktivitas sistem untuk transparansi dan keamanan ePanen.</p>
    </header>

    <div class="tabs mb-lg">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'audit' }"
        @click="activeTab = 'audit'"
      >🕵️ Audit Activity</button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'wa' }"
        @click="activeTab = 'wa'"
      >📱 WhatsApp Logs</button>
    </div>

    <div class="card glass-premium">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <span>Sinkronisasi log...</span>
      </div>

      <div v-else-if="activeTab === 'audit'" class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in auditLogs" :key="log.id">
              <td><span class="text-tiny">{{ formatDate(log.changed_at) }}</span></td>
              <td><strong>{{ log.user_details?.full_name || 'System' }}</strong></td>
              <td>
                <span class="badge" :class="getActionBadgeClass(log.action)">
                  {{ log.action.toUpperCase() }}
                </span>
              </td>
              <td>{{ log.table_name }}</td>
              <td class="text-muted text-tiny">
                {{ log.action === 'delete' ? 'ID: ' + log.record_id : 'Modified record' }}
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="auditLogs.length === 0" class="empty-state">No audit logs found.</div>
      </div>

      <div v-else class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Type</th>
              <th>Recipient</th>
              <th>Status</th>
              <th>Message Content</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in waLogs" :key="log.id">
              <td><span class="text-tiny">{{ formatDate(log.created_at) }}</span></td>
              <td>{{ log.message_type || 'General' }}</td>
              <td>{{ log.phone_number }}</td>
              <td>
                <span class="badge" :class="log.status === 'sent' || log.status === 'delivered' ? 'badge-success' : 'badge-error'">
                  {{ log.status }}
                </span>
              </td>
              <td class="text-muted text-tiny">{{ log.message_content }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="waLogs.length === 0" class="empty-state">No WhatsApp logs found.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { supabase, TABLES } from '@/services/supabase'

const activeTab = ref('audit')
const loading = ref(true)
const auditLogs = ref([])
const waLogs = ref([])

async function fetchAuditLogs() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from(TABLES.AUDIT_LOGS)
      .select('*, user_details:users(full_name)')
      .order('changed_at', { ascending: false })
      .limit(50)
    
    if (error) throw error
    auditLogs.value = data || []
  } catch (err) {
    console.error('Failed to fetch audit logs:', err)
  } finally {
    loading.value = false
  }
}

async function fetchWaLogs() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from(TABLES.WHATSAPP_LOGS)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) throw error
    waLogs.value = data || []
  } catch (err) {
    console.error('Failed to fetch WA logs:', err)
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getActionBadgeClass(action) {
  const a = action.toLowerCase()
  if (a === 'delete') return 'badge-error'
  if (a === 'insert' || a === 'create') return 'badge-success'
  return 'badge-info'
}

watch(activeTab, (newTab) => {
  if (newTab === 'audit') fetchAuditLogs()
  else fetchWaLogs()
})

onMounted(() => {
  fetchAuditLogs()
})
</script>

<style scoped>
.tabs {
  display: flex;
  gap: var(--space-md);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: var(--space-sm);
}

.tab-btn {
  background: transparent;
  border: none;
  padding: var(--space-sm) var(--space-lg);
  color: var(--text-tertiary);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-fast);
  border-bottom: 2px solid transparent;
}

.tab-btn.active {
  color: var(--primary-600);
  border-bottom-color: var(--primary-600);
}

.text-tiny { font-size: 0.75rem; }

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  color: var(--text-tertiary);
}
</style>
