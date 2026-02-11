import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import { supabase, COMPANY_TABLES, getUnifiedReports, VIEWS } from '@/services/supabase'

export const useReportsStore = defineStore('reports', () => {
    const authStore = useAuthStore()
    // State
    const dailyReports = ref([])
    const consolidatedPeriods = ref([])
    const reportHistory = ref([])
    const loading = ref(false)
    const error = ref(null)
    const selectedCompany = ref('all')

    /**
     * Fetch daily reports using unified view
     */
    async function fetchAllDailyReports(filters = {}) {
        loading.value = true
        error.value = null

        try {
            const queryFilters = { ...filters }

            // Filter by company if user is CEO/Farmer or specific company selected
            if (authStore.user?.role === 'ceo' || authStore.user?.role === 'farmer') {
                queryFilters.company_id = authStore.user?.company_id
            } else if (selectedCompany.value !== 'all') {
                const config = COMPANY_TABLES[selectedCompany.value]
                if (config) queryFilters.company_id = config.id
            }

            const data = await getUnifiedReports(queryFilters)

            // Map data to match expected frontend structure (adding _company prefix if needed)
            dailyReports.value = data.map(report => ({
                ...report,
                _company: report.company_name, // company_name from unified view
                _companyId: report.company_id
            }))

            return dailyReports.value
        } catch (err) {
            error.value = err.message
            return []
        } finally {
            loading.value = false
        }
    }

    /**
     * Fetch Finance RAG Docs
     */
    async function fetchFinanceDocs(filters = {}) {
        loading.value = true
        try {
            const queryFilters = { ...filters }
            if (authStore.user?.role === 'ceo' || authStore.user?.role === 'farmer') {
                queryFilters.company_id = authStore.user?.company_id
                selectedCompany.value = Object.keys(COMPANY_TABLES).find(
                    k => COMPANY_TABLES[k].id === authStore.user?.company_id
                ) || 'all'
            } else if (selectedCompany.value !== 'all') {
                const config = COMPANY_TABLES[selectedCompany.value]
                if (config) queryFilters.company_id = config.id
            }

            const data = await getUnifiedReports(queryFilters).catch(() => []) // Fallback calls original if needed, but we want new one

            // Actually call the new service
            const { getFinanceDocs } = await import('@/services/supabase')
            const financeData = await getFinanceDocs(queryFilters)

            // Map
            dailyReports.value = financeData.map(doc => ({
                ...doc,
                _company: doc.company_name,
                report_date: doc.created_at, // Map for UI compatibility
                activities: doc.content // Map content to activities for display? Or handle in UI
            }))

            return dailyReports.value
        } catch (e) {
            console.error(e)
            return []
        } finally {
            loading.value = false
        }
    }

    /**
     * Get report statistics (Simplified using unified view)
     */
    async function getReportStats() {
        const stats = {
            totalReports: 0,
            todayReports: 0,
            weekReports: 0,
            byCompany: {}
        }

        try {
            // Get current date in Indonesian timezone
            const now = new Date()
            const indonesiaOffset = 7 * 60
            const localOffset = now.getTimezoneOffset()
            const indonesiaDate = new Date(now.getTime() + (indonesiaOffset + localOffset) * 60 * 1000)

            const today = indonesiaDate.toISOString().split('T')[0]
            const weekAgo = new Date(indonesiaDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

            let query = supabase.from(VIEWS.ALL_DAILY_REPORTS).select('*')

            // Role filtering
            if (authStore.user?.role === 'ceo' || authStore.user?.role === 'farmer') {
                query = query.eq('company_id', authStore.user?.company_id)
            }

            const { data, error: queryError } = await query
            if (queryError) throw queryError

            if (data) {
                stats.totalReports = data.length

                // Calculate today and week stats
                data.forEach(report => {
                    const rDate = report.report_date

                    if (rDate === today) stats.todayReports++
                    if (rDate >= weekAgo) stats.weekReports++

                    // Per-company breakdown
                    const cName = report.company_name
                    if (!stats.byCompany[cName]) {
                        stats.byCompany[cName] = { total: 0, today: 0, week: 0 }
                    }

                    stats.byCompany[cName].total++
                    if (rDate === today) stats.byCompany[cName].today++
                    if (rDate >= weekAgo) stats.byCompany[cName].week++
                })
            }
        } catch (err) {
            console.error('Failed to calculate stats:', err)
        }

        return stats
    }

    function setSelectedCompany(company) {
        selectedCompany.value = company
    }

    /**
     * Consolidate raw finance docs into periods (Moved from FinancialReportsView.vue)
     */
    async function consolidateFinanceData(rawData, forceRefresh = false, periodType = 'monthly') {
        // Only return cached if no new data provided and not forced
        if ((!rawData || rawData.length === 0) && consolidatedPeriods.value.length > 0 && !forceRefresh) {
            return consolidatedPeriods.value
        }

        loading.value = true
        try {
            const { groupChunksToDocuments, parseRefNumber } = await import('@/utils/financialUtils')
            const { aiService } = await import('@/services/ai')

            const buckets = []
            const companyGroups = {}

            rawData.forEach(r => {
                const cName = r.company_name || 'Unknown'
                if (!companyGroups[cName]) companyGroups[cName] = []
                companyGroups[cName].push(r)
            })

            const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

            for (const company of Object.keys(companyGroups)) {
                const companyData = companyGroups[company]
                const monthlyBuckets = {}

                companyData.forEach(r => {
                    const date = new Date(r.metadata?.date || r.created_at)
                    const year = date.getFullYear()
                    const month = date.getMonth()
                    const key = `${year}-${String(month + 1).padStart(2, '0')}`

                    if (!monthlyBuckets[key]) {
                        monthlyBuckets[key] = { year, month, reports: [] }
                    }
                    monthlyBuckets[key].reports.push(r)
                })

                for (const [key, meta] of Object.entries(monthlyBuckets)) {
                    const uniqueDocs = groupChunksToDocuments(meta.reports)
                    const revenue = uniqueDocs.reduce((acc, r) => acc + parseRefNumber(r.metadata?.revenue), 0)
                    const expenses = uniqueDocs.reduce((acc, r) => acc + parseRefNumber(r.metadata?.expenses), 0)
                    const explicitNet = uniqueDocs.reduce((acc, r) => acc + parseRefNumber(r.metadata?.netProfit), 0)

                    const firstDay = new Date(meta.year, meta.month, 1)
                    const lastDay = new Date(meta.year, meta.month + 1, 0)
                    const daysInMonth = lastDay.getDate()

                    const trend = new Array(daysInMonth).fill(0)
                    meta.reports.forEach(r => {
                        const rDate = new Date(r.metadata?.date || r.created_at)
                        if (rDate.getFullYear() === meta.year && rDate.getMonth() === meta.month) {
                            const dayIdx = rDate.getDate() - 1
                            if (dayIdx >= 0 && dayIdx < daysInMonth) {
                                const net = parseRefNumber(r.metadata?.netProfit) || (parseRefNumber(r.metadata?.revenue) - parseRefNumber(r.metadata?.expenses))
                                trend[dayIdx] += net
                            }
                        }
                    })

                    buckets.push({
                        id: `${company}_${key}`,
                        company,
                        startDate: firstDay.toISOString().split('T')[0],
                        endDate: lastDay.toISOString().split('T')[0],
                        label: `${monthNames[meta.month]} ${meta.year}`,
                        reports: uniqueDocs,
                        chunkCount: meta.reports.length,
                        revenue,
                        expenses,
                        netProfit: explicitNet || (revenue - expenses),
                        dailyTrend: trend,
                        aiSummary: null,
                        isNormalizing: false,
                        isNormalized: uniqueDocs.every(d => d.metadata.is_ai_normalized)
                    })
                }
            }

            buckets.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))

            // --- NEW: Load saved AI Summaries and Standardized Data in parallel ---
            const { supabase, TABLES } = await import('@/services/supabase')

            // 1. Get all report IDs for bulk financial data pre-loading
            const allReportIds = buckets.flatMap(b => b.reports.map(r => String(r.id)))
            let standardizedMap = {}

            if (allReportIds.length > 0) {
                const { data: stdData } = await supabase
                    .from(TABLES.STANDARDIZED_FINANCIALS)
                    .select('*')
                    .in('source_id', allReportIds)

                if (stdData) {
                    stdData.forEach(s => { standardizedMap[s.source_id] = s })
                }
            }

            // 2. Load summaries and merge standardized data
            const summaryPromises = buckets.map(async (bucket) => {
                // Determine company UUID
                const config = COMPANY_TABLES[bucket.company]
                const companyId = config?.id || null

                // Fetch Summary with strict company filtering
                let query = supabase
                    .from('financial_period_summaries')
                    .select('summary_text')
                    .eq('start_date', bucket.startDate)
                    .eq('end_date', bucket.endDate)
                    .eq('period_type', 'monthly') // Always 'monthly' for month cards

                if (companyId) {
                    query = query.eq('company_id', companyId)
                } else {
                    query = query.is('company_id', null)
                }

                const { data: summaryData } = await query.maybeSingle()
                if (summaryData) bucket.aiSummary = summaryData.summary_text

                // Merge pre-loaded standardized data into bucket reports
                let totalRev = 0
                let totalExp = 0
                let totalNet = 0
                let normalizedCount = 0

                bucket.reports.forEach(report => {
                    const cached = standardizedMap[String(report.id)]
                    if (cached) {
                        report.metadata.revenue = parseFloat(cached.revenue)
                        report.metadata.expenses = parseFloat(cached.expenses)
                        report.metadata.netProfit = parseFloat(cached.net_profit)
                        report.metadata.aiReasoning = cached.ai_reasoning
                        report.metadata.is_ai_normalized = true
                        normalizedCount++
                    } else {
                        // Fallback to raw metadata if not normalized yet
                        report.metadata.is_ai_normalized = false
                    }

                    // Always add to totals, using standardized if available, raw if not
                    totalRev += parseRefNumber(report.metadata.revenue)
                    totalExp += parseRefNumber(report.metadata.expenses)
                    totalNet += parseRefNumber(report.metadata.netProfit) || (parseRefNumber(report.metadata.revenue) - parseRefNumber(report.metadata.expenses))
                })

                // Update bucket totals with the results (Standardized + Raw fallback)
                bucket.revenue = totalRev
                bucket.expenses = totalExp
                bucket.netProfit = totalNet
                bucket.isNormalized = normalizedCount === bucket.reports.length
            })

            await Promise.allSettled(summaryPromises)

            consolidatedPeriods.value = buckets
            return buckets
        } catch (err) {
            console.error('Consolidation failed:', err)
            return []
        } finally {
            loading.value = false
        }
    }

    /**
     * Fetch report history for a specific user (Farmer perspective)
     */
    async function fetchReportHistory(limit = 20) {
        if (reportHistory.value.length > 0) return reportHistory.value

        loading.value = true
        try {
            const { useSupabaseReports } = await import('@/composables/useSupabaseReports')
            const { getReportHistory } = useSupabaseReports()
            const data = await getReportHistory(limit)
            if (data) reportHistory.value = data
            return reportHistory.value
        } catch (err) {
            console.error('Failed to fetch history:', err)
            return []
        } finally {
            loading.value = false
        }
    }

    /**
     * Delete a report and update local state
     */
    async function deleteReport(reportId, companyName) {
        loading.value = true
        try {
            const { useSupabaseReports } = await import('@/composables/useSupabaseReports')
            const { deleteDailyReport } = useSupabaseReports()

            const result = await deleteDailyReport(reportId, companyName)

            if (result.success) {
                // Remove from dailyReports
                dailyReports.value = dailyReports.value.filter(r => r.id !== reportId)
                // Remove from history
                reportHistory.value = reportHistory.value.filter(r => r.id !== reportId)
                return true
            }
            return false
        } catch (err) {
            console.error('Store: Failed to delete report:', err)
            error.value = err.message
            return false
        } finally {
            loading.value = false
        }
    }

    return {
        dailyReports,
        consolidatedPeriods,
        reportHistory,
        loading,
        error,
        selectedCompany,
        fetchAllDailyReports,
        fetchFinanceDocs,
        fetchReportHistory,
        consolidateFinanceData,
        getReportStats,
        setSelectedCompany,
        deleteReport
    }
})
