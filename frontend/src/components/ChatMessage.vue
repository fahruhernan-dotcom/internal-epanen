<template>
  <div :class="['message-bubble', `message-${message.role}`]">
    <!-- Standard Message Bubble -->
    <div class="message-content">
      <div v-if="message.role === 'assistant'" class="avatar-assistant-premium">
        <span class="inner-orb"></span>
      </div>
      
      <div class="bubble-wrapper">
        <div class="message-text-premium shadow-sm">
          <div v-if="isTyping && message.role === 'assistant'" class="modern-typing">
            <span></span><span></span><span></span>
          </div>
          <div v-else v-html="sanitizeHTML(formatMessage(message.content))"></div>
        </div>
        <div class="message-meta">
          <span class="time">{{ formatTime(message.timestamp) }}</span>
          <span v-if="message.role === 'user'" class="read-receipt">
            <AppIcon name="check-circle-2" :size="12" />
            <AppIcon name="check-circle-2" :size="12" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { sanitizeHTML } from '@/utils/security'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  isTyping: {
    type: Boolean,
    default: false
  }
})

defineEmits(['confirm', 'revise'])

const reportData = computed(() => {
  try {
    return typeof props.message.content === 'string' 
      ? JSON.parse(props.message.content) 
      : props.message.content
  } catch {
    return {}
  }
})

const hasTechnicalData = computed(() => {
  const act = reportData.value.activities
  return !!(act?.ppm || act?.ph || act?.temp)
})

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatMessage(content) {
  if (!content) return ''
  // Basic markdown-like formatting
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/• /g, '&bull; ')
}
</script>

<style scoped>
.message-bubble {
  margin-bottom: var(--space-lg);
  display: flex;
  flex-direction: column;
}

.animate-slide-up {
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Premium Header */
.confirmation-premium {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 450px;
  margin: var(--space-md) 0;
}

.confirm-card-header {
  padding: var(--space-lg);
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  display: flex;
  align-items: center;
  gap: var(--space-md);
  color: white;
}

.icon-circle {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.header-text h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
}

.header-text p {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.9;
  font-weight: 600;
}

/* Report Summary Box */
.report-summary-box {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.summary-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--text-tertiary);
  letter-spacing: 0.05em;
}

.value {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.value.highlight {
  color: var(--primary-600);
}

.details-text {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  padding: var(--space-md);
  border-radius: var(--radius-card);
  margin: 0;
}

.summary-section.technical {
  background: var(--bg-tertiary);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-card);
  border: 1px dashed var(--border-color);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

/* Issue Pill */
.issue-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff5f5;
  border: 1px solid #fee2e2;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
  color: #c53030;
}

.dark-mode .issue-pill {
  background: rgba(245, 101, 101, 0.1);
  border-color: rgba(245, 101, 101, 0.2);
}

.severity-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.severity-indicator.high { background: var(--error); }
.severity-indicator.medium { background: var(--warning); }
.severity-indicator.low { background: var(--success); }

/* Confirmation Footer */
.confirmation-footer {
  padding: var(--space-lg);
  background: var(--bg-tertiary);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.btn-confirm-main {
  width: 100%;
  padding: var(--space-lg);
  background: var(--primary-600);
  color: white;
  border: none;
  border-radius: var(--radius-xl);
  font-weight: 800;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.2);
}

.btn-confirm-main:hover {
  transform: translateY(-2px) scale(1.02);
  background: var(--primary-700);
  box-shadow: 0 12px 24px rgba(34, 197, 94, 0.3);
}

.btn-revise-sub {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  font-size: 0.85rem;
  font-weight: 700;
  padding: var(--space-sm);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.btn-revise-sub:hover {
  color: var(--error);
}

/* Assistant Bubble */
.avatar-assistant-premium {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
  box-shadow: 0 4px 10px rgba(34, 197, 94, 0.2);
  flex-shrink: 0;
}

.inner-orb {
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(0.9); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.5; }
  100% { transform: scale(0.9); opacity: 1; }
}

.message-content {
  display: flex;
  gap: var(--space-sm);
  max-width: 90%;
}

.message-user {
  align-items: flex-end;
}

.message-user .message-content {
  flex-direction: row-reverse;
  margin-left: auto;
}

.bubble-wrapper {
  display: flex;
  flex-direction: column;
}

.message-text-premium {
  padding: 10px 16px;
  border-radius: 18px;
  font-size: 0.95rem;
  line-height: 1.5;
}

.message-assistant .message-text-premium {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-bottom-left-radius: 4px;
  border: 1px solid var(--border-color);
}

.message-user .message-text-premium {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  border-bottom-right-radius: 4px;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  padding: 0 4px;
}

.time {
  font-size: 0.65rem;
  color: var(--text-tertiary);
  font-weight: 600;
}

.read-receipt {
  font-size: 0.65rem;
  color: var(--primary-500);
}

/* Modern Typing Indicator */
.modern-typing {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.modern-typing span {
  width: 6px;
  height: 6px;
  background: var(--primary-400);
  border-radius: 50%;
  animation: typing-jump 1.4s infinite ease-in-out;
}

.modern-typing span:nth-child(2) { animation-delay: 0.2s; }
.modern-typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-jump {
  0%, 100% { transform: translateY(0); opacity: 0.4; }
  50% { transform: translateY(-4px); opacity: 1; }
}

.mb-xs { margin-bottom: 4px; }
.block { display: block; }
</style>
