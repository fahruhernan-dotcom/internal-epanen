import { ref } from 'vue'

export function useRag() {
    const loading = ref(false)
    const error = ref(null)
    const history = ref(JSON.parse(localStorage.getItem('rag_history') || '[]'))

    async function askQuestion(query, company = 'all') {
        loading.value = true
        error.value = null

        try {
            // Get n8n webhook URL from environment variable
            const webhookUrl = import.meta.env.VITE_N8N_RAG_WEBHOOK_URL || 'https://n8n.perusahaan.com/webhook/rag-query'

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    company_filter: company,
                    timestamp: new Date().toISOString()
                })
            })

            if (!response.ok) throw new Error('Gagal menghubungi AI Orchestrator')

            const data = await response.json()

            // Add to history
            const newEntry = {
                id: Date.now(),
                query,
                response: data.output || data.message || 'Maaf, AI tidak memberikan jawaban yang jelas.',
                company,
                timestamp: new Date().toISOString()
            }

            history.value.unshift(newEntry)
            if (history.value.length > 10) history.value.pop()
            localStorage.setItem('rag_history', JSON.stringify(history.value))

            return newEntry
        } catch (err) {
            error.value = err.message
            // Fallback for demo if webhook fails
            if (import.meta.env.DEV) {
                console.warn('RAG Webhook failed, using simulated response for demo.')
                const simulated = {
                    id: Date.now(),
                    query,
                    response: `[DEMO RESPONSE] Berdasarkan dokumen di ${company}, ${query} dapat diringkas sebagai berikut: Performa stabil dengan kenaikan profit 15% pada kuartal terakhir.`,
                    company,
                    timestamp: new Date().toISOString()
                }
                history.value.unshift(simulated)
                localStorage.setItem('rag_history', JSON.stringify(history.value))
                return simulated
            }
            return null
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        error,
        history,
        askQuestion
    }
}
