import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import { supabase, COMPANY_TABLES, getUnifiedReports, VIEWS } from '@/services/supabase'

export const useReportsStore = defineStore('reports', () => {
    const authStore = useAuthStore()
    // State
    const dailyReports = ref([])
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

    return {
        dailyReports,
        loading,
        error,
        selectedCompany,
        fetchAllDailyReports,
        getReportStats,
        setSelectedCompany
    }
})
