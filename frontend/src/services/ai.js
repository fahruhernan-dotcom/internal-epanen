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

    /**
     * Shared helper to call AI API with basic retry logic for network stability
     */
    async callAiApi(payload, retries = 3, delay = 1000) {
        let lastError = null;
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(this.baseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                        'HTTP-Referer': window.location.origin,
                        'X-Title': 'SmartFarm Internal System'
                    },
                    body: JSON.stringify({
                        model: this.model,
                        ...payload
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error?.message || `API HTTP Error ${response.status}`);
                }

                return await response.json();
            } catch (err) {
                lastError = err;
                console.warn(`AI API Attempt ${i + 1} failed:`, err.message);

                // Don't retry if it's a 4xx error (except 429) as those are usually client errors
                if (err.message.includes('HTTP Error 4') && !err.message.includes('429')) break;

                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i))); // Exponential backoff
                }
            }
        }
        throw lastError;
    }

    async summarizeFinancialPeriod(reports, periodName = 'Bulan Ini', periodMetadata = {}, forceRefresh = false) {
        if (!this.apiKey) {
            return this.getPlaceholderInsight(reports, periodName)
        }

        // 1. Check if summary already exists in DB (skip if forceRefresh)
        if (!forceRefresh) {
            const existingSummary = await this.fetchSavedSummary(periodMetadata)
            if (existingSummary) {
                console.log('Using cached AI summary from DB')
                return existingSummary
            }
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
      Berikut adalah data laporan keuangan yang sudah divalidasi untuk periode ${periodName}:
      
      TOTAL KEUANGAN VALID (Gunakan angka ini sebagai sumber utama):
      - Total Revenue: Rp ${periodMetadata.totalRevenue?.toLocaleString('id-ID')}
      - Total Expenses: Rp ${periodMetadata.totalExpenses?.toLocaleString('id-ID')}
      - Net Profit Estimasi: Rp ${(periodMetadata.totalRevenue - periodMetadata.totalExpenses)?.toLocaleString('id-ID')}
      - Jumlah Laporan: ${periodMetadata.reportCount}

      DATA DETAIL PER DOKUMEN:
      ${JSON.stringify(contextData)}
      
      Tugas Anda:
      1. ANALISA CFO PROFESIONAL: Berikan "Executive Brief" rangkuman performa satu paragraf. 
         - PENTING: Gunakan satuan yang benar (JT untuk Juta, M untuk Miliar).
         - VALIDASI OMZET: Pastikan Omzet yang disebutkan adalah Total Revenue, bukan Laba Kotor.
      2. Berikan 3 poin analisis utama (Key Highlights). Sebutkan jika ada kenaikan/penurunan signifikan.
      3. Bahas LABA BERSIH: Sebutkan jika angka laba yang tertera sudah merupakan hasil akhir (Bottom-Line) setelah pajak.
      4. Berikan Rekomendasi taktis untuk periode berikutnya.

      ATURAN KETAT:
      - Selalu utamakan angka dari "TOTAL KEUANGAN VALID" untuk narasi utama.
      - Jika di dokumen tertulis "Laba sebelum pajak", ingatkan user bahwa nominal tersebut belum dipotong pajak penghasilan.
      - Gunakan bahasa Indonesia profesional. Format Markdown.
    `

        try {
            const result = await this.callAiApi({
                messages: [
                    { role: 'system', content: 'Anda adalah pakar keuangan agribisnis senior.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: this.maxTokens,
                temperature: this.temperature
            })
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

            const { data, error } = await query
                .order('created_at', { ascending: false })
                .limit(1)

            if (error) throw error
            return data && data.length > 0 ? data[0].summary_text : null
        } catch (err) {
            console.warn('Failed to fetch cached summary:', err.message || err)
            return null
        }
    }

    // Helper: Save summary to DB (Upsert)
    async saveSummary(text, label, metadata) {
        if (!metadata.startDate || !metadata.endDate) return

        try {
            const { supabase, TABLES } = await import('./supabase')

            // First, check if record exists for this EXACT company/period/type
            let query = supabase
                .from(TABLES.PERIOD_SUMMARIES)
                .select('id')
                .eq('start_date', metadata.startDate)
                .eq('end_date', metadata.endDate)
                .eq('period_type', metadata.periodType || 'custom')

            if (metadata.companyId) {
                query = query.eq('company_id', metadata.companyId)
            } else {
                query = query.is('company_id', null)
            }

            const { data: existing } = await query.limit(1).maybeSingle()

            const payload = {
                start_date: metadata.startDate,
                end_date: metadata.endDate,
                period_type: metadata.periodType || 'custom',
                company_id: metadata.companyId || null,
                period_label: label,
                summary_text: text,
                metadata: {
                    totalRevenue: metadata.totalRevenue,
                    totalExpenses: metadata.totalExpenses,
                    reportCount: metadata.reportCount,
                    updated_at: new Date().toISOString()
                }
            }

            let error
            if (existing) {
                // Update existing record
                const result = await supabase
                    .from(TABLES.PERIOD_SUMMARIES)
                    .update(payload)
                    .eq('id', existing.id)
                error = result.error
            } else {
                // Insert new record
                const result = await supabase
                    .from(TABLES.PERIOD_SUMMARIES)
                    .insert(payload)
                error = result.error
            }

            if (error) throw error
            console.log('AI Summary saved to DB')
        } catch (err) {
            console.error('Failed to save summary to DB:', err.message || err)
        }
    }

    // Updated to support caching
    async summarizeCompanyProfile(docs, companyId, companyName, forceRefresh = false) {
        if (!this.apiKey) return "⚠️ API Key missing."

        // 1. Check Cache (skip if forceRefresh is true)
        if (companyId && !forceRefresh) {
            const cached = await this.fetchSavedCompanySummary(companyId)
            if (cached) {
                console.log('Using cached Company Profile Summary')
                return cached
            }
        }

        if (!docs || docs.length === 0) {
            return "⚠️ AI tidak dapat menganalisis (Data visual/dokumen kosong)."
        }

        // Format docs for context
        const contextData = docs.map(d => ({
            content: d.content,
            metadata: d.metadata,
            created: d.created_at
        })).slice(0, 60) // Increased limit for more context

        const prompt = `
      Anda adalah Konsultan Bisnis & Operasional Senior untuk ${companyName}.
      Berikut adalah dokumen internal (SOP, Profil, Legalitas, Laporan) perusahaan:
      
      ${JSON.stringify(contextData)}
      
      Tugas Anda adalah membuat ringkasan profil perusahaan yang Komprehensif (360 derajat):
      1. **Profil & Struktur Organisasi**: Jelaskan struktur tim, peran kunci, dan siapa saja personel yang terlibat (jika ada di dokumen).
      2. **Operasional Utama**: Apa yang mereka kerjakan detailnya? Bagaimana SOP utamanya?
      3. **Aset & Kekuatan**: Apa saja aset fisik, legalitas, atau keunggulan kompetitif mereka?
      4. **Operational Health Check**: Nilai kondisi operasional mereka berdasarkan kelengkapan SOP.
      
      Gunakan bahasa Indonesia profesional. Format Markdown yang rapi dengan Bullet points.
      JANGAN mengarang nama/jabatan jika tidak ada di dokumen.
    `

        try {
            const result = await this.callAiApi({
                messages: [
                    { role: 'system', content: 'Anda adalah pakar analisis bisnis korporasi.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: this.maxTokens,
                temperature: 0.5
            })
            const text = result.choices[0].message.content

            // 2. Save/Update Cache
            if (companyId && text) {
                // Determine if we insert or update. The saveCompanySummary handles upsert logic usually,
                // but let's make sure it handles overwrites.
                await this.saveCompanySummary(companyId, text)
            }

            return text
        } catch (err) {
            console.error('AI Profile Summary Error:', err)
            return "⚠️ Gagal menganalisis profil perusahaan."
        }
    }

    async fetchSavedCompanySummary(companyId) {
        try {
            const { supabase, TABLES } = await import('./supabase')
            const { data, error } = await supabase
                .from(TABLES.COMPANY_SUMMARIES) // company_profile_summaries
                .select('summary_text')
                .eq('company_id', companyId)
                .maybeSingle()

            if (error) return null
            return data?.summary_text
        } catch (err) {
            return null
        }
    }

    async saveCompanySummary(companyId, text) {
        try {
            const { supabase, TABLES } = await import('./supabase')

            const { error } = await supabase
                .from(TABLES.COMPANY_SUMMARIES)
                .upsert({
                    company_id: companyId,
                    summary_text: text,
                    last_updated: new Date().toISOString()
                }, { onConflict: 'company_id' })

            if (error) throw error
            console.log('Company Profile Summary saved/updated')
        } catch (err) {
            console.error('Failed to save summary:', err)
        }
    }

    /**
     * AI-based Financial Normalization with DB Caching
     * Extracts precise figures and saves them to standardized_financials.
     */
    async extractFinancialDataWithAI(reports, forceRefresh = false) {
        if (!this.apiKey || !reports.length) return null

        try {
            const { supabase, TABLES } = await import('./supabase')
            const reportIds = reports.map(r => String(r.id))

            // 1. Check DB Cache
            const { data: cachedData, error: fetchErr } = await supabase
                .from(TABLES.STANDARDIZED_FINANCIALS)
                .select('*')
                .in('source_id', reportIds)

            if (fetchErr) console.warn('Cache fetch error:', fetchErr)

            const cachedMap = {}
            if (cachedData) {
                cachedData.forEach(c => { cachedMap[c.source_id] = c })
            }

            // 2. Identify missing reports (Bypass if forced)
            const missingReports = forceRefresh ? reports : reports.filter(r => !cachedMap[String(r.id)])

            let finalResults = forceRefresh ? [] : Object.values(cachedMap).map(c => ({
                id: c.source_id,
                revenue: parseFloat(c.revenue),
                expenses: parseFloat(c.expenses),
                netProfit: parseFloat(c.net_profit),
                reasoning: c.ai_reasoning
            }))

            if (missingReports.length === 0) {
                console.log(`[AI Cache] All ${reports.length} reports loaded from DB. 0 API calls needed.`)
                return finalResults
            }

            console.log(`[AI Cache] Need to analyze ${missingReports.length} new reports via AI API.`)

            const dataToAnalyze = missingReports.map(r => ({
                id: r.id,
                content: r.content.substring(0, 15000), // Increased limit significantly
                company: r._company,
                date: r.metadata?.date || r.created_at
            }))

            const prompt = `
          Tugas: Ekstraksi Data Keuangan Presisi Tinggi.
          
          INSTRUKSI MANDATORY:
          1. OMZET (REVENUE): 
             - Cari "Total Pendapatan", "Hasil Penjualan", atau "Omzet".
             - JANGAN ambil "Laba Kotor" (Gross Profit). Laba kotor biasanya muncul SETELAH Pendapatan minus HPP.
             - Jika ada "Omzet" Rp 135jt dan "Laba Kotor" Rp 76jt, maka REVENUE = 135.000.000.
          2. BEBAN (EXPENSES): 
             - Jumlahkan semua biaya/pengeluaran (Biaya Produksi, Beban Gaji, Operasional, dll).
          3. LABA BERSIH (NET PROFIT): 
             - Cari baris PALING BAWAH. Abaikan "Laba Sebelum Pajak" jika di bawahnya ada "Laba Bersih" atau "Laba Setelah Pajak".
             - Jika tertulis "LABA BERSIH27.975.000", ekstrak: 27975000.
          
          AUDIT SELF-CONSISTENCY:
          Angka yang Anda berikan harus logis: Revenue - Expenses ≈ Net Profit. 
          Jika selisihnya jauh, periksa apakah ada "Pajak" atau "Biaya Non-Operasional" yang belum terhitung.
          
          FORMAT OUTPUT:
          Kembalikan ONLY JSON ARRAY [ { "id", "revenue", "expenses", "netProfit", "reasoning" } ].
          "reasoning" harus berupa OBJECT dengan schema: 
          { 
            "revenue": "...", 
            "expenses": "...", 
            "netProfit": "...", 
            "audit": "...",
            "score": 0-100,
            "status": "SEHAT" | "WASPADA" | "KRITIS"
          }.
          
          RULES:
          - Jika "Net Profit" tidak tertulis eksplisit, Anda WAJIB menghitungnya: Revenue - Expenses.
          - Jangan biarkan "Net Profit" bernilai 0 jika Revenue > 0 dan Expenses < Revenue.
          Jangan kembalikan teks lain selain JSON.
          
          DATA:
          ${JSON.stringify(dataToAnalyze)}
        `

            const result = await this.callAiApi({
                messages: [
                    { role: 'system', content: 'Anda adalah Financial Data Normalizer. Kembalikan valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 1500, // more space for reasoning
                temperature: 0.1
            })
            const JSON_TEXT = result.choices[0].message.content.replace(/```json|```/g, '').trim()
            const newExtractions = JSON.parse(JSON_TEXT)

            // 3. Save new extractions to DB
            if (Array.isArray(newExtractions)) {
                const upsertData = newExtractions.map(ex => {
                    const original = missingReports.find(r => r.id === ex.id)
                    return {
                        source_id: String(ex.id),
                        company_name: original?._company || 'Unknown',
                        revenue: ex.revenue,
                        expenses: ex.expenses,
                        net_profit: ex.netProfit,
                        ai_reasoning: ex.reasoning,
                        report_date: original?.metadata?.date || original?.created_at
                    }
                })

                const { error: saveErr } = await supabase
                    .from(TABLES.STANDARDIZED_FINANCIALS)
                    .upsert(upsertData, { onConflict: 'source_id' })

                if (saveErr) console.error('Failed to cache AI results:', saveErr)

                finalResults = [...finalResults, ...newExtractions]
            }

            return finalResults
        } catch (err) {
            console.error('AI Normalization Flow Error:', err)
            return null
        }
    }

    getPlaceholderInsight(reports, period) {
        const totalRev = reports.reduce((acc, r) => acc + (r.metadata?.revenue || 0), 0)
        return `### 🤖 AI Insight (Demo Mode)
Terdapat **${reports.length} laporan** tercatat di periode **${period}**.
Total Revenue terdeteksi sekitar **Rp ${totalRev.toLocaleString('id-ID')}**.

*Analisis detail akan muncul di sini setelah API Key LLM dikonfigurasi di file .env.*`
    }

    /**
     * Assists farmers in writing daily reports based on minimal input
     */
    async assistFarmerReport(context) {
        if (!this.apiKey) {
            return "Fitur AI belum dikonfigurasi. Harap hubungi administrator."
        }

        const prompt = `
      Anda adalah asisten virtual cerdas untuk petani/pekerja di ${context.company || 'SmartFarm'}.
      Tugas Anda adalah MEMPERLUAS ringkasan singkat menjadi laporan harian profesional yang detail dan rapi.
      
      DATA SAAT INI:
      - Cuaca: ${context.weather}
      - Ringkasan Kegiatan: ${context.summary}
      - Poin Tambahan: ${context.notes || '-'}
      - Masalah/Kendala: ${JSON.stringify(context.issues || [])}
      
      INSTRUKSI:
      1. Tulis paragraph narasi detail ("Detail Kegiatan") yang menjelaskan kegiatan tersebut secara profesional.
      2. Gunakan bahasa Indonesia yang baik, formal namun tetap natural untuk laporan lapangan.
      3. Asumsikan durasi kerja standar dan prosedur standar pertanian/perikanan jika detail kurang (misal: pemberian pakan, pengecekan kualitas air, dll jika relevan dengan ${context.company}).
      4. Jangan terlalu panjang, cukup 2-3 paragraf padat.
      
      OUTPUT:
      Langsung berikan teks laporannya saja tanpa pembuka/penutup basa-basi.
    `

        try {
            const result = await this.callAiApi({
                messages: [
                    { role: 'system', content: 'Anda adalah asisten penulisan laporan pertanian profesional.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
            return result.choices[0].message.content.trim()
        } catch (err) {
            console.error('AI Farmer Assist Error:', err)
            return "Maaf, sistem sedang sibuk. Silakan tulis manual."
        }
    }
}

export const aiService = new AIService()
