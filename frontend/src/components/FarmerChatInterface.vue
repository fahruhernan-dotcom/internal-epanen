<template>
  <div class="farmer-chat-interface">
    <!-- Messages Area with sophisticated spacing -->
    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="message-wrapper"
      >
        <ChatMessage
          :message="msg"
          :is-typing="isTyping && msg === lastAssistantMessage"
          @confirm="handleConfirm"
          @revise="handleRevise"
        />
      </div>

      <!-- Enhanced Empty State -->
      <div v-if="messages.length === 0" class="empty-state animate-fade-in">
        <div class="empty-icon-wrapper">
          <AppIcon name="sprout" :size="48" />
        </div>
        <h3>Halo! Saya Asisten Anda</h3>
        <p>Bisa bantu apa hari ini? Ceritakan saja kegiatan atau kendala di lapangan.</p>
        <div class="suggested-prompts">
          <button @click="quickSend('Hari ini saya sudah menyiram dan memberi pupuk')" class="prompt-chip">
            "Hari ini saya sudah nyiram..."
          </button>
          <button @click="quickSend('Ada tanaman yang layu di blok A')" class="prompt-chip">
            "Ada tanaman layu..."
          </button>
        </div>
      </div>

      <!-- Scroll Spacer -->
      <div class="scroll-spacer"></div>
    </div>

    <!-- Premium Floating Input Area -->
    <div class="chat-input-container" v-if="!isComplete">
      <!-- Quick Reply Pill -->
      <div v-if="hasConfirmation && !isLoading" class="quick-reply-area animate-fade-in">
        <button @click="handleConfirm" class="quick-pill confirm" aria-label="Confirm and send report">
          <AppIcon name="check-circle" :size="16" />
          <span class="ml-sm">Ya, Kirim Laporan</span>
        </button>
        <button @click="handleRevise" class="quick-pill revise" aria-label="Request revisions">
          Ada Perbaikan
        </button>
      </div>

      <div class="typing-pill" v-if="isLoading">
        <span class="pulsing-orb"></span>
        Asisten sedang menyusun laporan...
      </div>

      <form @submit.prevent="handleSubmit" class="input-form-premium glass-premium">
        <textarea
          ref="messageInput"
          v-model="userInput"
          @keydown.enter.prevent="handleEnterKey"
          :disabled="isLoading"
          :placeholder="inputPlaceholder"
          class="modern-textarea"
          rows="1"
          @input="autoResize"
        ></textarea>
        
        <button
          type="submit"
          :disabled="!canSubmit"
          class="modern-send-btn"
          :class="{ active: canSubmit && !isLoading }"
          aria-label="Send message"
        >
          <div v-if="isLoading" class="spinner-white-mini"></div>
          <AppIcon v-else name="rocket" :size="20" />
        </button>
      </form>
    </div>

    <!-- Premium Success Overaly -->
    <div v-else class="completion-overlay animate-fade-in">
      <div class="completion-card card shadow-xl">
        <div class="success-check animate-bounce">
          <AppIcon name="check-circle" :size="64" />
        </div>
        <h2>Laporan Selesai!</h2>
        <p>Data Anda sudah tercatat dengan aman di sistem.</p>
        <div class="completion-actions">
          <button @click="resetChat()" class="btn-premium-action primary">
             Buat Laporan Baru
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useClaudeChat } from '@/composables/useClaudeChat'
import ChatMessage from './ChatMessage.vue'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps({
  onSave: {
    type: Function,
    required: true
  }
})

// Destructure for better reactivity in template
const { 
  messages, 
  isLoading, 
  isTyping, 
  conversationPhase, 
  hasConfirmation, 
  isComplete,
  initChat,
  sendMessage,
  confirmReport,
  reviseConfirmation,
  resetChat 
} = useClaudeChat()

const userInput = ref('')
const messageInput = ref(null)
const messagesContainer = ref(null)

const lastAssistantMessage = computed(() => {
  const assistantMessages = messages.value.filter(m => m.role === 'assistant')
  return assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1] : null
})

const inputPlaceholder = computed(() => {
  if (hasConfirmation.value) return 'Ketik balasan atau klik Ya...'
  return 'Ceritakan kegiatan Anda...'
})

const canSubmit = computed(() => {
  return !isLoading.value && !isComplete.value && userInput.value.trim().length > 0
})

function autoResize() {
  const textarea = messageInput.value
  if (textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }
}

function handleEnterKey(event) {
  if (!event.shiftKey && window.innerWidth > 768) {
    event.preventDefault()
    handleSubmit()
  }
}

async function quickSend(text) {
  userInput.value = text
  await handleSubmit()
}

async function handleSubmit() {
  if (!canSubmit.value) return

  const message = userInput.value.trim()
  userInput.value = ''
  autoResize()

  // Check for quick confirm
  if (hasConfirmation.value) {
    const lowerMsg = message.toLowerCase()
    const confirmWords = ['ya', 'yes', 'benar', 'ok', 'siap', 'lanjut', 'woke', 'sip', 'mantap', 'gas']
    const rejectWords = ['tidak', 'no', 'salah', 'revisi', 'ubah']
    
    if (confirmWords.some(w => lowerMsg.includes(w))) {
      await handleConfirm()
      return
    }
    if (rejectWords.some(w => lowerMsg.includes(w))) {
      handleRevise()
      return
    }
  }

  await sendMessage(message)
  await scrollToBottom()
}

async function handleConfirm() {
  const result = await confirmReport()
  if (result.success) {
    await props.onSave(result.data)
    await scrollToBottom()
  }
}

function handleRevise() {
  reviseConfirmation()
  nextTick(() => {
    messageInput.value?.focus()
  })
}

async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Watch for new messages and auto-scroll
watch(() => messages.value.length, () => {
  scrollToBottom()
})

onMounted(() => {
  initChat()
  scrollToBottom()
  nextTick(() => {
    messageInput.value?.focus()
  })
})
</script>

<style scoped>
.farmer-chat-interface {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 180px);
  background: var(--bg-primary);
  position: relative;
}

/* Messages Area */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-md) var(--space-md) 160px; /* Increased padding */
  display: flex;
  flex-direction: column;
}

.message-wrapper {
  margin-bottom: var(--space-md);
}

/* Empty State */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-xl);
}

.empty-icon-wrapper {
  width: 80px;
  height: 80px;
  background: var(--primary-100);
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  margin-bottom: var(--space-lg);
  box-shadow: 0 8px 16px rgba(34, 197, 94, 0.1);
}

.empty-state h3 {
  font-size: 1.25rem;
  margin-bottom: var(--space-xs);
  color: var(--text-primary);
}

.empty-state p {
  color: var(--text-tertiary);
  font-size: 0.9rem;
  max-width: 250px;
  margin-bottom: var(--space-xl);
}

.suggested-prompts {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  width: 100%;
  max-width: 280px;
}

.prompt-chip {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-card);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.prompt-chip:hover {
  border-color: var(--primary-400);
  background: var(--primary-50);
  color: var(--primary-700);
  transform: translateX(4px);
}

/* Floating Input Area */
.chat-input-container {
  position: absolute;
  bottom: 0px; /* Move slightly up to avoid dock overlap if any */
  left: 0;
  width: 100%;
  padding: var(--space-md);
  z-index: 100;
  background: linear-gradient(to top, var(--bg-primary), transparent);
}

.quick-reply-area {
  display: flex;
  justify-content: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.quick-pill {
  padding: 8px 16px;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 700;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}

.quick-pill.confirm {
  background: var(--primary-50);
  border-color: var(--primary-200);
  color: var(--primary-700);
}

.quick-pill.confirm:hover {
  background: var(--primary-600);
  color: white;
  transform: translateY(-2px);
}

.quick-pill.revise:hover {
  background: #fff5f5;
  color: var(--error);
  border-color: #feb2b2;
  transform: translateY(-2px);
}

.typing-pill {
  width: fit-content;
  margin: 0 auto var(--space-sm);
  background: var(--bg-secondary);
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.pulsing-orb {
  width: 6px;
  height: 6px;
  background: var(--primary-500);
  border-radius: 50%;
  animation: pulse-ring 1.5s infinite;
}

.input-form-premium {
  display: flex;
  align-items: flex-end;
  gap: var(--space-sm);
  padding: 8px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.dark-mode .input-form-premium {
  background: rgba(26, 35, 50, 0.8);
  border-color: rgba(255, 255, 255, 0.05);
}

.modern-textarea {
  flex: 1;
  background: transparent;
  border: none;
  padding: 10px 16px;
  max-height: 120px;
  min-height: 44px;
  font-size: 1rem;
  color: var(--text-primary);
  resize: none;
}

.modern-textarea:focus {
  outline: none;
}

.modern-send-btn {
  width: 44px;
  height: 44px;
  border-radius: 22px;
  border: none;
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
  flex-shrink: 0;
}

.modern-send-btn.active {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  transform: scale(1);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.modern-send-btn.active:hover {
  transform: scale(1.1) rotate(-5deg);
}

/* Completion Overlay */
.completion-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
}

.dark-mode .completion-overlay {
  background: rgba(15, 20, 25, 0.8);
}

.completion-card {
  text-align: center;
  padding: var(--space-2xl);
  border-radius: var(--radius-2xl);
  max-width: 400px;
}

.success-check {
  font-size: 4rem;
  margin-bottom: var(--space-lg);
}

.completion-actions {
  margin-top: var(--space-xl);
}

.btn-premium-action {
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-xl);
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-premium-action.primary {
  background: var(--primary-600);
  color: white;
  box-shadow: 0 8px 16px rgba(34, 197, 94, 0.3);
}

.btn-premium-action.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(34, 197, 94, 0.4);
}

.spinner-white-mini {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .chat-messages {
    padding: var(--space-sm) var(--space-sm) 160px;
  }
}

.ml-sm { margin-left: var(--space-sm); }
</style>
