<template>
  <div class="ai-intelligence">
    <div class="header-section">
      <div class="header-content">
        <h1>AI Orchestrator Intelligence</h1>
        <p class="subtitle">Visualisasi arsitektur agen dan alur kerja inteligensi terpusat</p>
      </div>
      <div class="system-status">
        <div class="status-indicator online"></div>
        <span>System Online</span>
      </div>
    </div>

    <!-- Architecture Map -->
    <div class="architecture-container card">
      <div class="section-header">
        <h3>System Architecture Map</h3>
        <div class="legend">
          <div class="legend-item"><span class="dot orchestrator"></span> Orchestrator</div>
          <div class="legend-item"><span class="dot agent"></span> Sub-Agent</div>
          <div class="legend-item"><span class="dot tool"></span> Tool/RAG</div>
        </div>
      </div>
      
      <div class="map-visualization">
        <div class="nodes-container">
          <!-- Orchestrator -->
          <div class="node orchestrator-node" title="Grok 4.1 Fast Orchestrator">
            <div class="node-icon">
              <AppIcon name="brain" :size="32" />
            </div>
            <div class="node-label">AI OWNER</div>
            <div class="node-sub">Gatekeeper & Router</div>
          </div>

          <!-- Connecting Lines (SVG) -->
          <svg class="connections-svg">
            <line x1="50%" y1="120" x2="20%" y2="250" class="conn-line" />
            <line x1="50%" y1="120" x2="40%" y2="250" class="conn-line" />
            <line x1="50%" y1="120" x2="60%" y2="250" class="conn-line" />
            <line x1="50%" y1="120" x2="80%" y2="250" class="conn-line" />
          </svg>

          <!-- Sub Agents -->
          <div class="sub-agents-row">
            <div class="node agent-node active-pulse" @click="selectedAgent = 'Lyori'">
              <div class="node-icon">
                <AppIcon name="leaf" :size="24" />
              </div>
              <div class="node-label">Lyori AI</div>
              <div class="node-status active">Active</div>
            </div>
            <div class="node agent-node active-pulse" style="animation-delay: 0.5s" @click="selectedAgent = 'Moafarm'">
              <div class="node-icon">
                <AppIcon name="sprout" :size="24" />
              </div>
              <div class="node-label">Moafarm AI</div>
              <div class="node-status active">Active</div>
            </div>
            <div class="node agent-node active-pulse" style="animation-delay: 1s" @click="selectedAgent = 'Kaja'">
              <div class="node-icon">
                <AppIcon name="leaf" :size="24" />
              </div>
              <div class="node-label">Kaja AI</div>
              <div class="node-status active">Active</div>
            </div>
            <div class="node agent-node" @click="selectedAgent = 'Farmer'">
              <div class="node-icon">
                <AppIcon name="user" :size="24" />
              </div>
              <div class="node-label">Farmer AI</div>
              <div class="node-status active">Active</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="details-grid">
      <!-- Agent Details -->
      <div class="agent-details card">
        <div class="section-header">
          <h3>Agent Insight: {{ selectedAgent || 'Select an Agent' }}</h3>
        </div>
        
        <div v-if="selectedAgent" class="insight-content">
          <div class="insight-meta">
            <div class="meta-item">
              <span class="label">Primary Role:</span>
              <span class="value">{{ agentInsights[selectedAgent].role }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Model:</span>
              <span class="value">OpenRouter / Grok 4.1</span>
            </div>
          </div>

          <div class="tools-section">
            <h4>Connected Tools & RAG</h4>
            <div class="tools-list">
              <div v-for="tool in agentInsights[selectedAgent].tools" :key="tool.name" class="tool-item">
                <span class="tool-icon">
                  <AppIcon :name="tool.iconName" :size="20" />
                </span>
                <div class="tool-info">
                  <span class="tool-name">{{ tool.name }}</span>
                  <span class="tool-desc">{{ tool.desc }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>Klik salah satu agent di peta arsitektur untuk melihat detail tools dan konfigurasi RAG.</p>
        </div>
      </div>

      <!-- Live Decision Feed -->
      <div class="decision-feed card">
        <div class="section-header">
          <h3>Live Orchestrator Logs</h3>
          <span class="badge">Live</span>
        </div>
        <div class="logs-container">
          <div v-for="(log, index) in liveLogs" :key="index" class="log-entry">
            <span class="log-time">{{ log.time }}</span>
            <span class="log-tag" :class="log.type">{{ log.type }}</span>
            <p class="log-msg">{{ log.message }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

const selectedAgent = ref('Lyori')

const agentInsights = {
  'Lyori': {
    role: 'Financial & SOP Specialist for Lyori Ecosystem',
    tools: [
      { name: 'Finance Lyori RAG', iconName: 'folder', desc: 'Vector search for weekly financial PDFs' },
      { name: 'General Doc RAG', iconName: 'file-text', desc: 'SOP, RAB, and KPI documentation' },
      { name: 'Lyori CRUD Tool', iconName: 'settings', desc: 'Direct Supabase access for report management' }
    ]
  },
  'Moafarm': {
    role: 'Operations Expert for Moafarm ePanen',
    tools: [
      { name: 'Moafarm Daily RAG', iconName: 'bar-chart-3', desc: 'Audit daily operations data' },
      { name: 'Financial Ingest', iconName: 'download', desc: 'Automated extraction from finance forms' }
    ]
  },
  'Kaja': {
    role: 'Production & Logistics Advisor',
    tools: [
      { name: 'Kaja Vector Store', iconName: 'database', desc: 'High-density production records' }
    ]
  },
  'Farmer': {
    role: 'Operational Data Collector',
    tools: [
      { name: 'Daily Form Parser', iconName: 'file-text', desc: 'Translates informal WA to JSON' },
      { name: 'SOP Compliance Node', iconName: 'check-circle', desc: 'Real-time auditing against company standards' }
    ]
  }
}

const liveLogs = ref([
  { time: '14:20:05', type: 'routing', message: 'Request from Owner routed to [Lyori AI] - Intent: Financial Audit' },
  { time: '14:21:12', type: 'rag', message: 'Lyori AI querying [finance_lyori] table... Top 3 chunks retrieved.' },
  { time: '14:21:15', type: 'success', message: 'Response generated for Owner: "Profit Lyori Minggu 4 adalah Rp 12.5M"' },
  { time: '14:25:30', type: 'auth', message: 'Farmer #8212 verified. Routing to [Daily Report Ingest]' }
])
</script>

<style scoped>
.ai-intelligence {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  color: var(--text-primary);
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.subtitle {
  color: var(--text-tertiary);
  margin-top: var(--space-xs);
}

.system-status {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--bg-secondary);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid var(--border-color);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.online {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.9; border-color: var(--primary-400); }
  100% { transform: scale(1); opacity: 1; }
}

.node.active-pulse {
  animation: node-pulse 3s infinite ease-in-out;
}

@keyframes node-pulse {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

.card {
  background: var(--bg-secondary);
  border-radius: var(--radius-card);
  border: 1px solid var(--border-color);
  padding: var(--space-xl);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
}

/* Map Visualization */
.map-visualization {
  height: 400px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.nodes-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.node {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  padding: var(--space-md);
  text-align: center;
  transition: all var(--transition-normal);
  cursor: pointer;
  z-index: 10;
}

.node:hover {
  transform: translateY(-5px);
  border-color: var(--primary-500);
  box-shadow: 0 10px 25px -10px rgba(34, 197, 94, 0.3);
}

.orchestrator-node {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 220px;
  background: linear-gradient(135deg, var(--bg-tertiary), #1e293b);
  border: 1px solid var(--primary-500);
}

.node-icon {
  font-size: 2rem;
  margin-bottom: var(--space-sm);
}

.node-label {
  font-weight: 700;
  font-size: 1rem;
}

.node-sub {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.sub-agents-row {
  position: absolute;
  bottom: 0;
  width: 100%;
  display: flex;
  justify-content: space-around;
  gap: var(--space-md);
}

.agent-node {
  width: 140px;
}

.node-status {
  font-size: 0.7rem;
  margin-top: var(--space-xs);
  color: #22c55e;
  font-weight: 600;
}

.connections-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.conn-line {
  stroke: var(--border-color);
  stroke-width: 2;
  stroke-dasharray: 5, 5;
}

/* Details Grid */
.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
}

.tools-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-top: var(--space-md);
}

.tool-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.tool-icon {
  font-size: 1.25rem;
}

.tool-info {
  display: flex;
  flex-direction: column;
}

.tool-name {
  font-weight: 600;
  font-size: 0.875rem;
}

.tool-desc {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

/* Logs */
.logs-container {
  height: 300px;
  overflow-y: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.85rem;
  background: #0f172a;
  padding: var(--space-md);
  border-radius: var(--radius-md);
}

.log-entry {
  margin-bottom: var(--space-sm);
  border-bottom: 1px solid #1e293b;
  padding-bottom: var(--space-xs);
}

.log-time {
  color: var(--text-tertiary);
  margin-right: var(--space-sm);
}

.log-tag {
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: 700;
  margin-right: var(--space-sm);
  padding: 1px 4px;
  border-radius: 3px;
}

.log-tag.routing { color: #38bdf8; border: 1px solid #38bdf8; }
.log-tag.rag { color: #fbbf24; border: 1px solid #fbbf24; }
.log-tag.success { color: #22c55e; border: 1px solid #22c55e; }
.log-tag.auth { color: #a855f7; border: 1px solid #a855f7; }

.log-msg {
  display: inline;
  color: #e2e8f0;
}

.legend {
  display: flex;
  gap: var(--space-lg);
  font-size: 0.8rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot.orchestrator { background: var(--primary-500); }
.dot.agent { background: #38bdf8; }
.dot.tool { background: #fbbf24; }

.insight-meta {
  display: flex;
  gap: var(--space-xl);
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--border-color);
}

.meta-item .label {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  display: block;
}

.meta-item .value {
  font-weight: 600;
  font-size: 0.95rem;
}

.badge {
  background: var(--primary-100);
  color: var(--primary-700);
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: 700;
}

.empty-state {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-tertiary);
  font-style: italic;
}

@media (max-width: 1024px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    gap: var(--space-md);
  }

  .architecture-container {
    padding: var(--space-md);
  }

  .map-visualization {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    justify-content: flex-start;
    padding-bottom: var(--space-xl);
  }

  .nodes-container {
    min-width: 600px; /* Keep the map structure but allow scroll */
    height: 450px;
  }

  .orchestrator-node {
    width: 180px;
  }

  .agent-node {
    width: 120px;
  }

  .legend {
    flex-wrap: wrap;
    gap: var(--space-sm);
  }
}
</style>
