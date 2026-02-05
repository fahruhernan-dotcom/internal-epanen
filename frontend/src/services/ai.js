import { COMPANY_TABLES } from './supabase'

/**
 * AI Service to handle financial summaries and insights
 */
export class AIService {
    constructor() {
        this.apiKey = import.meta.env.VITE_AI_API_KEY
        this.baseUrl = import.meta.env.VITE_AI_API_URL ? `${import.meta.env.VITE_AI_API_URL}/chat/completions` : 'https://openrouter.ai/api/v1/chat/completions'
        this.model = import.meta.env.VITE_AI_MODEL || 'x-ai/grok-4.1-fast'
        this.maxTokens = parseInt(import.meta.env.VITE_AI_MAX_TOKENS) || 2000
        this.temperature = parseFloat(import.meta.env.VITE_AI_TEMPERATURE) || 0.7
    }

    async summarizeFinancialPeriod(reports, periodName = 'Bulan Ini') {
        if (!this.apiKey) {
            return this.getPlaceholderInsight(reports, periodName)
        }

        // Format data for AI context
        const contextData = reports.map(r => ({
            date: r.metadata?.date || r.created_at,
            company: r._company,
            title: r.metadata?.title,
            summary: r.content,
            revenue: r.metadata?.revenue || 0,
            expenses: r.metadata?.expenses || 0
        }))

        const prompt = `
      Anda adalah Chief Financial Officer (CFO) virtual untuk holding SmartFarm.
      Berikut adalah data laporan keuangan mentah untuk periode ${periodName}:
      
      ${JSON.stringify(contextData)}
      
      Tugas Anda:
      1. Berikan ringkasan eksekutif yang sangat singkat (maks 3-4 kalimat).
      2. Berikan 3 poin analisis utama (bisa tentang profit, efisiensi, atau anomali).
      3. Berikan 1 rekomendasi strategis untuk bulan depan.
      
      Gunakan bahasa Indonesia yang profesional namun mudah dimengerti. 
      Gunakan format Markdown (heading, bold, list).
    `

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': window.location.origin, // Dynamic origin
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: 'Anda adalah pakar keuangan agribisnis.' },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: this.maxTokens,
                    temperature: this.temperature
                })
            })

            const result = await response.json()
            return result.choices[0].message.content
        } catch (err) {
            console.error('AI Service Error:', err)
            return "⚠️ Gagal mendapatkan analisis AI. Pastikan API Key valid."
        }
    }

    getPlaceholderInsight(reports, period) {
        const totalRev = reports.reduce((acc, r) => acc + (r.metadata?.revenue || 0), 0)
        return `### 🤖 AI Insight (Demo Mode)
Terdapat **${reports.length} laporan** tercatat di periode **${period}**.
Total Revenue terdeteksi sekitar **Rp ${totalRev.toLocaleString('id-ID')}**.

*Analisis detail akan muncul di sini setelah API Key LLM dikonfigurasi di file .env.*`
    }
}

export const aiService = new AIService()
