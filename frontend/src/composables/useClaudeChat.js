import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chat'
import { supabase, COMPANY_TABLES } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'

/**
 * Farmer Chat Assistant - Composable for Claude API Integration
 * Handles conversation flow, data extraction, and multilingual support
 */
export function useClaudeChat() {
  const chatStore = useChatStore()
  const {
    messages,
    conversationPhase,
    extractedData,
    activities,
    issues,
    weather,
    notes,
    sopContent,
    isFirstLoad
  } = storeToRefs(chatStore)

  const isLoading = ref(false)
  const isTyping = ref(false)

  const configuration = {
    url: import.meta.env.VITE_AI_API_URL || 'https://openrouter.ai/api/v1',
    key: import.meta.env.VITE_AI_API_KEY || '',
    model: import.meta.env.VITE_AI_MODEL || 'x-ai/grok-4.1-fast',
    maxTokens: parseInt(import.meta.env.VITE_AI_MAX_TOKENS) || 1024,
    temperature: parseFloat(import.meta.env.VITE_AI_TEMPERATURE) || 0.7
  }

  // System prompt for the farming assistant - Focused on high-quality technical synthesis
  const getSystemPrompt = () => `You are "Mandor Teman", an expert and friendly farming supervisor. Your goal is to help farmers report their daily work through natural chat while subtly ensuring they follow Standard Operating Procedures (SOPs).

CORE STRATEGY:
1. INVISIBLE DATA COLLECTION: Collect data (Activities, Issues, Weather, Location) without the farmer feeling like they are filling a form.
2. SOP GUIDANCE: Subtly check if their work matches the SOPs provided below. 
   - If their activity matches an SOP, verify they followed the technical details (dosages, timing, etc.).
   - Example: "Sip Pak! Dosis mupuknya sudah sesuai standar SOP kan ya? Jaraknya aman dari batang?"
3. ONE-BY-ONE RULE: NEVER ask more than one question at a time. This is critical for natural conversation.
   - Wrong: "Cuacanya gimana Pak? Ada kendala gak? Terus tadi mupuknya berapa gram?"
   - Right: "Cuacanya gimana Pak di sana sekarang?" (Wait for answer before asking about SOP or issues).
4. PROACTIVE FIELD PROBING: If CUACA or LOKASI are missing, ask for them naturally, one by one.
5. PROBLEM DETECTION: Always probe for issues (Hama/Kendala) if not mentioned, one by one.

${sopContent.value ? `### SOP REFERENCES FOR THIS COMPANY ###\n${sopContent.value}\n` : ''}

REPORTING RULES:
- KEGIATAN: Focus on WHAT, HOW MUCH, WHERE. Use technical precision.
- MASALAH: Summarize as: [Problem], [Severity], [Action/Status].
- CUACA: Use lowercase: cerah, hujan, mendung, berawan.

FINALIZING:
When all info is collected, end with: "Sip Pak, sudah saya catat semua. Saya simpan laporannya sekarang ya?"

OUTPUT FORMAT:
Always append the structured data at the end:
###CONFIRMATION###
\`\`\`json
{
  "activities": { "summary": "...", "details": "..." },
  "issues": [{ "notes": "...", "severity": "...", "status": "..." }],
  "weather": "cerah|hujan|mendung|berawan",
  "notes": "..."
}
\`\`\`

LANGUAGE: Professional but warm Bahasa Indonesia (Pak/Bu). Expert but humble teammate.`;

  /**
   * Initialize chat with greeting message
   */
  function initChat() {
    if (!isFirstLoad.value) return // Don't reset if already loaded in this session

    chatStore.resetStore()
    isFirstLoad.value = false

    fetchSOPs()

    // Get time-appropriate greeting
    const hour = new Date().getHours()
    let greeting = 'Selamat pagi'
    if (hour >= 11 && hour < 15) greeting = 'Selamat siang'
    else if (hour >= 15 && hour < 18) greeting = 'Selamat sore'
    else if (hour >= 18) greeting = 'Selamat malam'

    const greetingMsg = `${greeting} Pak! Gimana kabar ladang hari ini? Apa aja yang sudah dikerjakan?`
    addMessage('assistant', greetingMsg)
  }

  /**
   * Add message to history
   */
  function addMessage(role, content) {
    messages.value.push({
      id: Date.now() + Math.random(),
      role,
      content,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Parse confirmation data from AI response
   */
  function parseConfirmationData(response) {
    if (!response.includes('###CONFIRMATION###')) return null
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
    if (!jsonMatch) return null
    try {
      return JSON.parse(jsonMatch[1])
    } catch (e) {
      console.error('Failed to parse confirmation JSON:', e)
      return null
    }
  }

  /**
   * Send message to Claude API or Demo
   */
  async function sendMessage(userMessage) {
    if (!userMessage.trim()) return

    addMessage('user', userMessage)
    isLoading.value = true
    isTyping.value = true

    try {
      if (!configuration.key) {
        await handleDemoResponse(userMessage)
        return
      }

      const apiMessages = [
        { role: 'system', content: getSystemPrompt() },
        ...messages.value
          .map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
      ]

      const response = await callAI(apiMessages)
      const confirmationData = parseConfirmationData(response)

      // Always update extractedData if present
      if (confirmationData) {
        extractedData.value = confirmationData
        conversationPhase.value = 'confirmation' // Set to confirmation phase so UI can catch 'ya/ok'
      }

      // Remove the confirmation block and JSON from the display response
      const displayResponse = response.replace(/###CONFIRMATION###\s*/, '').replace(/```json[\s\S]*?```/, '').trim()

      // The AI's response will now contain proactive questions or the trigger for confirmation
      // We don't explicitly set conversationPhase to 'confirmation' here.
      // The AI's response will implicitly guide the user to confirmation.
      addMessage('assistant', displayResponse || 'Baik Pak, saya catat.')

    } catch (error) {
      console.error('Claude API Error:', error)
      addMessage('assistant', 'Maaf Pak, ada gangguan koneksi. Coba ulang ya.')
    } finally {
      isLoading.value = false
      isTyping.value = false
    }
  }

  /**
   * Call OpenRouter/OpenAI API
   */
  async function callAI(messages) {
    const endpoint = `${configuration.url.replace(/\/$/, '')}/chat/completions`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${configuration.key}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'ePanen Internal System'
      },
      body: JSON.stringify({
        model: configuration.model,
        messages: messages,
        max_tokens: configuration.maxTokens,
        temperature: configuration.temperature
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'AI request failed')
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  /**
   * Demo mode handler (Smarter synthesis for testing)
   */
  async function handleDemoResponse(userMessage) {
    const msg = userMessage.toLowerCase()
    await new Promise(resolve => setTimeout(resolve, 800))

    // Step 1: Proactive Extraction
    if (msg.includes('hujan')) weather.value = 'hujan'
    if (msg.includes('cerah')) weather.value = 'cerah'
    if (msg.includes('mendung') || msg.includes('menduk')) weather.value = 'mendung'
    if (msg.includes('berawan')) weather.value = 'berawan'

    const blockMatch = msg.match(/blok\s*([a-z0-9]+)/i)
    if (blockMatch) notes.value = `Blok ${blockMatch[1].toUpperCase()}`

    if (msg.includes('kuning') || msg.includes('layu') || msg.includes('ulat')) {
      const issueDesc = msg.includes('kuning') ? 'Daun Kuning' :
        msg.includes('ulat') ? 'Serangan Ulat' : 'Tanaman Layu'
      issues.value.push({
        notes: `${issueDesc}${notes.value ? ' di ' + notes.value : ''}`,
        severity: 'medium',
        status: 'ongoing'
      })
    }

    if (msg.includes('nyiram') || msg.includes('siram') || msg.includes('nyirah') || msg.includes('mupuk') || msg.includes('pupuk') || msg.includes('potong') || msg.includes('pangkas')) {
      activities.value.push(userMessage)
    }

    // Step 2: Synthesis Response
    const reportProgress = []
    if (weather.value) reportProgress.push(`Cuaca: ${weather.value}`)
    if (notes.value) reportProgress.push(`Lokasi: ${notes.value}`)
    if (issues.value.length) reportProgress.push(`Kendala: ${issues.value[issues.value.length - 1].notes}`)

    const hasProgress = reportProgress.length > 0 || activities.value.length > 0

    if (hasProgress) {
      const ack = reportProgress.length > 0
        ? `Siap Pak! Saya bantu catat: ${reportProgress.join(', ')}. `
        : `Sip Pak, kegiatannya sudah saya pantau. `

      // 1. Weather Check (Priority)
      if (!weather.value) {
        addMessage('assistant', ack + "Oh iya Pak, cuaca di sana gimana sekarang? Aman buat lanjut?")
        return
      }

      // 2. SOP Check (Mission Critical)
      const fertilizationMentioned = activities.value.some(a => a.toLowerCase().includes('pupuk') || a.toLowerCase().includes('mupuk'))
      const hasConfirmedValue = msg.includes('50g') || msg.includes('gram') || msg.includes('iyo') || msg.includes(' ya') || msg === 'ya' || msg.includes('sudah')

      if (fertilizationMentioned && !hasConfirmedValue) {
        addMessage('assistant', ack + "Mantap Pak! Dosis pupuknya sudah sesuai standar SOP 50g per pohon kan ya?")
        return
      }

      // 3. Problem Probe
      const isNegativeConfirmation = msg.includes('aman') || msg.includes('tidak') || msg.includes('gaada') || msg.includes('ngga') || msg.includes('gak ada') || msg.includes('iyo')

      if (issues.value.length === 0 && !isNegativeConfirmation) {
        addMessage('assistant', ack + "Ada ketemu ulat atau daun kuning nggak pas lagi keliling tadi Pak?")
        return
      }

      // Auto-confirm if we have a lot of info (Synthesis)
      if (activities.value.length > 0 && weather.value) {
        // In natural flow, we stay in 'activities' or 'greeting' phase until actual confirmation text
        const detailedActivity = activities.value.map(a => {
          if (a.toLowerCase().includes('pupuk')) return "Pupuk NPK 50g/pohon (sesuai SOP), cek kondisi akar aman"
          if (a.toLowerCase().includes('siram')) return "Siram rutin 1-2L (sesuai SOP)"
          return a
        }).join('. ')

        const demoData = {
          weather: weather.value || '-',
          activities: {
            summary: "Pemeliharaan Rutin Sesuai SOP",
            details: detailedActivity + (notes.value ? ` di ${notes.value}` : '')
          },
          issues: issues.value.length > 0 ? issues.value.map(i => ({
            notes: i.notes + ", rendah, sudah ditangani",
            severity: "low",
            status: "resolved"
          })) : [],
          notes: notes.value || '-'
        }
        extractedData.value = demoData

        // Use conversational trigger
        addMessage('assistant', ack + "Sip Pak, sudah saya catat semua laporannya. Saya simpan sekarang ya?")
        conversationPhase.value = 'confirmation'
      } else {
        addMessage('assistant', ack + "Ada kendala lain atau cuacanya aman Pak?")
      }
    } else {
      addMessage('assistant', "Siap Pak, ada kendala apa atau kegiatan apa di lapangan hari ini?")
    }
  }

  /**
   * Confirm and finalize report
   */
  async function confirmReport() {
    if (!extractedData.value) {
      return { success: false, error: 'No data to confirm' }
    }

    conversationPhase.value = 'complete'

    const thankYouMsg = `Terima kasih Pak! Laporan sudah siap disimpan. Besok kita chat lagi ya! 👍`
    addMessage('assistant', thankYouMsg)

    return {
      success: true,
      data: extractedData.value
    }
  }

  /**
   * Reject confirmation and continue chat
   */
  function reviseConfirmation() {
    conversationPhase.value = 'activities'
    extractedData.value = null
    addMessage('assistant', 'Siap Pak! Bagian mana yang mau diperbaiki? Ceritakan saja.')
  }

  /**
   * Reset conversation for new report
   */
  function resetChat() {
    initChat()
  }

  // Computed properties
  const canSendMessage = computed(() => {
    return !isLoading.value && conversationPhase.value !== 'complete'
  })

  const hasConfirmation = computed(() => {
    return conversationPhase.value === 'confirmation' && extractedData.value
  })

  const isComplete = computed(() => {
    return conversationPhase.value === 'complete'
  })

  /**
   * Fetch company specific SOPs
   */
  async function fetchSOPs() {
    try {
      const authStore = useAuthStore()
      const companyName = authStore.user?.companies?.name
      if (!companyName) return

      const tableInfo = COMPANY_TABLES[companyName]
      if (!tableInfo?.sopTable) return

      const { data, error } = await supabase
        .from(tableInfo.sopTable)
        .select('content, metadata')
        .limit(5)

      if (error) throw error
      if (data && data.length > 0) {
        sopContent.value = data.map(sop => `- [${sop.metadata?.title || 'SOP'}] ${sop.content}`).join('\n')
      }
    } catch (e) {
      console.error('Failed to fetch SOPs:', e)
    }
  }

  return {
    // State
    messages,
    isLoading,
    isTyping,
    conversationPhase,
    extractedData,

    // Computed
    canSendMessage,
    hasConfirmation,
    isComplete,

    // Methods
    initChat,
    sendMessage,
    confirmReport,
    reviseConfirmation,
    resetChat
  }
}
