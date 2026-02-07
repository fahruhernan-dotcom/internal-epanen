import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useChatStore = defineStore('chat', () => {
    // Persistent State
    const messages = ref([])
    const conversationPhase = ref('greeting')
    const extractedData = ref(null)
    const activities = ref([])
    const issues = ref([])
    const weather = ref(null)
    const notes = ref(null)
    const sopContent = ref('')
    const isFirstLoad = ref(true)

    function resetStore() {
        messages.value = []
        conversationPhase.value = 'greeting'
        extractedData.value = null
        activities.value = []
        issues.value = []
        weather.value = null
        notes.value = null
        sopContent.value = ''
        isFirstLoad.value = true
    }

    return {
        messages,
        conversationPhase,
        extractedData,
        activities,
        issues,
        weather,
        notes,
        sopContent,
        isFirstLoad,
        resetStore
    }
})
