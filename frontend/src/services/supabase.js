import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Unified Schema Constants
export const VIEWS = {
    USER_DETAILS: 'v_user_details',
    ALL_DAILY_REPORTS: 'v_all_daily_reports',
    FINANCIAL_REPORTS: 'v_financial_reports',
    SOP_VIOLATIONS: 'v_sop_violations',
    ALL_FINANCE_DOCS: 'v_all_finance_docs',
    ALL_GENERAL_DOCS: 'v_all_general_docs'
}

export const TABLES = {
    DAILY_REPORTS: 'daily_reports',
    USERS: 'epanen_users',
    COMPANIES: 'companies',
    CHAT_HISTORY: 'chat_history',
    PERIOD_SUMMARIES: 'financial_period_summaries',
    COMPANY_SUMMARIES: 'company_profile_summaries',
    AUDIT_LOGS: 'audit_logs',
    NOTIFICATIONS: 'notifications',
    ANALYTICS: 'analytics_snapshots',
    WEEKLY_FINANCE: 'weekly_financial_reports',
    WHATSAPP_LOGS: 'whatsapp_logs',
    DRAFT_REPORTS: 'draft_daily_reports',
    USER_PREFERENCES: 'user_preferences',
    STANDARDIZED_FINANCIALS: 'standardized_financials',
    INVOICES: 'invoices',
    MARKET_PRICES: 'product_market_prices'
}

// Company table mapping - For companies only (Admin is website super-user, not a company)
export const COMPANY_TABLES = {
    'Lyori': {
        id: '53af2fd7-685d-41b5-8daa-265fe3db9b46',
        code: 'Lyori',
        dailyReports: 'daily_reports_lyori',
        finance: 'finance_lyori',
        sopTable: 'sop_farmer_lyori',
        customLogo: '/images/branding/lyori-logo.png',
        customIcon: '/images/branding/lyori-icon.png'
    },
    'Moafarm': {
        id: '5236043f-a9ce-498c-84c4-c5de16893ccd',
        code: 'moafarm',
        dailyReports: 'daily_reports_moafarm',
        finance: 'finance_moafarm',
        sopTable: 'sop_farmer_moafarm',
        customLogo: '/images/branding/moafarm-logo.png',
        customIcon: '/images/branding/moafarm-icon.png'
    },
    'Kaja': {
        id: '8523f28b-7f12-4455-a8a8-015d2a826d5c',
        code: 'Kaja',
        dailyReports: 'daily_reports_kaja',
        finance: 'finance_kaja',
        sopTable: 'sop_farmer_kaja',
        customLogo: '/images/branding/kaja-logo.png',
        customIcon: '/images/branding/kaja-icon.png'
    },
    'ePanen': {
        id: '3d0e89d1-76f5-421b-ba7b-c2c0dea6ebf0',
        code: 'EP',
        dailyReports: 'daily_reports_epanen',
        finance: 'finance_epanen'
    },
    'Melon': {
        id: '9c839312-d9ff-40c0-9800-732877cd7287',
        code: 'ML',
        dailyReports: 'daily_reports_melon',
        finance: 'finance_melon'
    },
    // Note: 'Owner' is technically a Role/User context, but listed here for table mapping convenience.
    // UI components should filter this out when listing "Companies".
    'Owner': {
        id: 'fef23b03-fe98-4a56-9cbc-64e1d21845fb',
        code: 'OWNER',
        dailyReports: 'daily_reports_owner', // might be unused or aggregation
        finance: 'finance_epanen', // Fallback or specific?
        sopTable: 'sop_farmer_moafarm' // Default for Owner/General
    }
}

/**
 * Helper function to get companies
 */
export async function getCompanies() {
    const { data, error } = await supabase
        .from(TABLES.COMPANIES)
        .select('*')
        .eq('is_active', true)
        .order('name')

    if (error) throw error
    return data || []
}

/**
 * Helper function to fetch unified daily reports
 */
export async function getUnifiedReports(filters = {}) {
    let query = supabase
        .from(VIEWS.ALL_DAILY_REPORTS)
        .select('*')
        .order('report_date', { ascending: false })

    if (filters.company_id) {
        query = query.eq('company_id', filters.company_id)
    }
    if (filters.startDate) {
        query = query.gte('report_date', filters.startDate)
    }
    if (filters.endDate) {
        query = query.lte('report_date', filters.endDate)
    }
    if (filters.limit) {
        query = query.limit(filters.limit)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
}

/**
 * Helper to fetch unified finance RAG docs
 */
export async function getFinanceDocs(filters = {}) {
    let query = supabase
        .from(VIEWS.ALL_FINANCE_DOCS)
        .select('*')
        // Use created_at date for sorting/filtering since metadata.date might be irregular
        .order('created_at', { ascending: false })

    if (filters.company_id) {
        query = query.eq('company_id', filters.company_id)
    }
    // Filter by created_at range
    if (filters.startDate) {
        query = query.gte('created_at', filters.startDate)
    }
    if (filters.endDate) {
        query = query.lte('created_at', filters.endDate) // Should likely be end of day
    }

    // Also try to filter by metadata->date if possible? 
    // PostgreSQL JSONB filtering is tricky in simple generic queries, 
    // so we rely on created_at for the "Chunking Date" which usually matches upload.

    const { data, error } = await query
    if (error) throw error
    return data || []
}

/**
 * Helper to fetch notifications for a specific user
 */
export async function getNotifications(userId) {
    const { data, error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
}

/**
 * Helper to fetch system audit logs
 */
export async function getAuditLogs(limit = 50) {
    const { data, error } = await supabase
        .from(TABLES.AUDIT_LOGS)
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(limit)

    if (error) throw error
    return data || []
}


