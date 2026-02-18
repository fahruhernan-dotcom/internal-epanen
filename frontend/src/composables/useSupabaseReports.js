import { ref } from 'vue'
import { supabase, COMPANY_TABLES } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'

/**
 * Composable for handling daily reports submission to Supabase
 */
export function useSupabaseReports() {
  const isSaving = ref(false)
  const saveError = ref(null)
  const saveSuccess = ref(false)

  /**
   * Validate extracted data before saving
   */
  function validateReportData(data) {
    const errors = []

    // Support both string (legacy) and object (structured) activities
    const activities = data.activities
    const hasActivities = activities && (
      (typeof activities === 'string' && activities.trim().length > 0) ||
      (typeof activities === 'object' && activities.summary && activities.summary.trim().length > 0)
    )

    if (!hasActivities) {
      errors.push('Kegiatan tidak boleh kosong')
    }

    // Validate issues array if present - MORE LENIENT
    if (data.issues && Array.isArray(data.issues) && data.issues.length > 0) {
      data.issues.forEach((issue, index) => {
        const issueText = issue.notes || issue.description || ''
        if (issueText && issueText.trim().length > 0) {
          // Only validate severity/status if the issue has text
          if (issue.severity && !['low', 'medium', 'high', 'Low', 'Medium', 'High', 'LOW', 'MEDIUM', 'HIGH'].includes(issue.severity)) {
            console.warn(`Issue #${index + 1} severity invalid, defaulting to 'low'`)
            issue.severity = 'low'
          }
          if (issue.status && !['ongoing', 'resolved', 'Ongoing', 'Resolved', 'ONGOING', 'RESOLVED'].includes(issue.status)) {
            console.warn(`Issue #${index + 1} status invalid, defaulting to 'ongoing'`)
            issue.status = 'ongoing'
          }
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get the appropriate table name for the user's company
   */
  function getDailyReportsTable() {
    const authStore = useAuthStore()
    const companyName = authStore.user?.companies?.name

    if (!companyName) {
      throw new Error('User tidak memiliki perusahaan')
    }

    const tableInfo = COMPANY_TABLES[companyName]
    if (!tableInfo?.dailyReports) {
      throw new Error(`Tabel laporan tidak ditemukan untuk perusahaan ${companyName}`)
    }

    return tableInfo.dailyReports
  }

  /**
   * Transform extracted data to match database schema
   */
  function transformReportData(extractedData) {
    const authStore = useAuthStore()

    // Transform activities: support legacy string or new structured object
    let activities = null
    if (extractedData.activities) {
      if (typeof extractedData.activities === 'string') {
        activities = {
          summary: extractedData.activities.substring(0, 100),
          details: extractedData.activities
        }
      } else {
        // Already an object, use it directly (includes summary, details, and company-specific fields)
        activities = extractedData.activities
      }
    }

    // Transform issues - normalize severity and status to lowercase
    let issues = null
    if (extractedData.issues && Array.isArray(extractedData.issues) && extractedData.issues.length > 0) {
      issues = extractedData.issues
        .filter(issue => issue.notes || issue.description) // Skip empty issues
        .map(issue => ({
          severity: (issue.severity || 'low').toString().toLowerCase(),
          notes: issue.notes || issue.description || '',
          status: (issue.status || 'ongoing').toString().toLowerCase()
        }))
    }

    return {
      // FIX: Use Auth UUID (auth_id) for RLS check on daily_reports_* tables
      user_id: authStore.user?.auth_id || authStore.user?.id,
      company_id: authStore.user?.company_id,
      report_date: new Date().toLocaleDateString('en-CA'), // Get local YYYY-MM-DD
      activities,
      issues,
      weather: extractedData.weather || null,
      notes: extractedData.notes || null
    }
  }

  /**
   * Submit daily report to database
   */
  async function submitDailyReport(extractedData) {
    isSaving.value = true
    saveError.value = null
    saveSuccess.value = false

    try {
      // Validate input
      const validation = validateReportData(extractedData)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      // Get table name
      const tableName = getDailyReportsTable()

      // Transform data
      const reportData = transformReportData(extractedData)

      if (!reportData.user_id || !reportData.company_id) {
        throw new Error('Identitas user atau perusahaan tidak valid untuk submission.')
      }

      // Insert to database       
      const { data, error } = await supabase
        .from(tableName)
        .insert(reportData)
        .select()
        .single()

      if (error) throw error

      saveSuccess.value = true
      return {
        success: true,
        data: data
      }
    } catch (error) {
      console.error('Failed to submit report:', error)
      saveError.value = error.message || 'Gagal menyimpan laporan'
      return {
        success: false,
        error: saveError.value
      }
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Check if user already submitted today
   */
  async function checkTodaySubmission() {
    try {
      const authStore = useAuthStore()
      const tableName = getDailyReportsTable()
      const today = new Date().toLocaleDateString('en-CA')
      const userId = authStore.user?.auth_id || authStore.user?.id

      const { data, error } = await supabase
        .from(tableName)
        .select('id, report_date')
        .eq('user_id', userId)
        .eq('report_date', today)
        .limit(1)

      if (error) throw error

      return {
        hasSubmitted: data && data.length > 0,
        existingReport: data && data.length > 0 ? data[0] : null
      }
    } catch (error) {
      console.error('Failed to check today submission:', error)
      return {
        hasSubmitted: false,
        existingReport: null
      }
    }
  }

  /**
   * Get today's report if exists
   */
  async function getTodayReport() {
    try {
      const authStore = useAuthStore()
      const tableName = getDailyReportsTable()
      const today = new Date().toLocaleDateString('en-CA')
      const userId = authStore.user?.auth_id || authStore.user?.id

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('report_date', today)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        throw error
      }

      // Return first item or null if no data
      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.error('Failed to get today report:', error)
      return null
    }
  }


  /**
   * Get report history for current user
   */
  async function getReportHistory(limit = 10) {
    try {
      const authStore = useAuthStore()
      const tableName = getDailyReportsTable()
      const userId = authStore.user?.auth_id || authStore.user?.id

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to get report history:', error)
      return []
    }
  }

  /**
   * Delete a daily report
   */
  async function deleteDailyReport(reportId, companyName) {
    isSaving.value = true
    saveError.value = null
    saveSuccess.value = false

    try {
      if (!reportId) throw new Error('ID Laporan tidak valid')

      let tableName = ''
      if (companyName && COMPANY_TABLES[companyName]) {
        tableName = COMPANY_TABLES[companyName].dailyReports
      } else {
        tableName = getDailyReportsTable()
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', reportId)

      if (error) throw error

      saveSuccess.value = true
      return { success: true }
    } catch (error) {
      console.error('Failed to delete report:', error)
      saveError.value = error.message || 'Gagal menghapus laporan'
      return { success: false, error: saveError.value }
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Reset state
   */
  function reset() {
    isSaving.value = false
    saveError.value = null
    saveSuccess.value = false
  }

  return {
    // State
    isSaving,
    saveError,
    saveSuccess,

    // Methods
    submitDailyReport,
    checkTodaySubmission,
    getTodayReport,
    getReportHistory,
    deleteDailyReport,
    validateReportData,
    reset
  }
}
