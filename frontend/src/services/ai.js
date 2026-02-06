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

    async summarizeFinancialPeriod(reports, periodName = 'Bulan Ini', periodMetadata = {}) {
        if (!this.apiKey) {
            return this.getPlaceholderInsight(reports, periodName)
        }

        // 1. Check if summary already exists in DB
        const existingSummary = await this.fetchSavedSummary(periodMetadata)
        if (existingSummary) {
            console.log('Using cached AI summary from DB')
            return existingSummary
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
      1. Berikan "Executive Brief" rangkuman performa satu paragraf.
      2. Berikan 3 poin analisis utama (Key Highlights) tentang anomali atau pencapaian.
      3. Berikan Rekomendasi taktis untuk periode berikutnya.
      
      Gunakan bahasa Indonesia profesional. Format Markdown.
    `

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': window.location.origin,
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: 'Anda adalah pakar keuangan agribisnis senior.' },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: this.maxTokens,
                    temperature: this.temperature
                })
            })

            const result = await response.json()
            const generatedText = result.choices[0].message.content

            // 2. Save new summary to DB
            await this.saveSummary(generatedText, periodName, periodMetadata)

            return generatedText
        } catch (err) {
            console.error('AI Service Error:', err)
            return "⚠️ Gagal mendapatkan analisis AI. Periksa koneksi atau API Key Anda."
        }
    }

    // Helper: Check DB for existing summary
    async fetchSavedSummary(metadata) {
        if (!metadata.startDate || !metadata.endDate) return null

        try {
            const { supabase, TABLES } = await import('./supabase')
            let query = supabase
                .from(TABLES.PERIOD_SUMMARIES)
                .select('summary_text')
                .eq('start_date', metadata.startDate)
                .eq('end_date', metadata.endDate)
                .eq('period_type', metadata.periodType)

            if (metadata.companyId) {
                query = query.eq('company_id', metadata.companyId)
            } else {
                query = query.is('company_id', null)
            }

            const { data, error } = await query.maybeSingle()
            if (error) throw error
            return data?.summary_text
        } catch (err) {
            console.warn('Failed to fetch cached summary:', err)
            return null
        }
    }

    // Helper: Save summary to DB
    async saveSummary(text, label, metadata) {
        if (!metadata.startDate || !metadata.endDate) return

        try {
            const { supabase, TABLES } = await import('./supabase')
            const payload = {
                start_date: metadata.startDate,
                end_date: metadata.endDate,
                period_type: metadata.periodType || 'custom',
                company_id: metadata.companyId || null, // null means "All Companies"
                period_label: label,
                summary_text: text,
                metadata: {
                    totalRevenue: metadata.totalRevenue,
                    totalExpenses: metadata.totalExpenses,
                    reportCount: metadata.reportCount
                }
            }

            const { error } = await supabase
                .from(TABLES.PERIOD_SUMMARIES)
                .insert(payload)

            if (error) throw error
            console.log('AI Summary saved to DB')
        } catch (err) {
            console.error('Failed to save summary to DB:', err)
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
