import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'

export const useAuthStore = defineStore('auth', () => {
    // State
    const user = ref(null)
    const loading = ref(false)
    const error = ref(null)
    const initialized = ref(false)
    let _initPromise = null

    // Getters
    // Getters — Strict check to prevent "User / USER" ghost sessions
    const isAuthenticated = computed(() => {
        return !!(user.value && user.value.role && user.value.full_name && user.value.full_name !== 'User')
    })

    const isOwner = computed(() => user.value?.role === 'owner')
    const isAdmin = computed(() => user.value?.role === 'admin')
    const isManager = computed(() => user.value?.role === 'manager')
    const isCashier = computed(() => user.value?.role === 'cashier')
    const userName = computed(() => user.value?.full_name || '')

    /**
     * Convert phone number to a deterministic email for Supabase Auth.
     * This avoids needing the Phone Provider (which requires Twilio).
     * Example: 628987654321 -> 628987654321@epanen.local
     */
    function phoneToEmail(phone) {
        return `${phone}@epanen.local`
    }

    /**
     * Normalize the phone number:
     * - Strip non-digits
     * - Convert leading '0' to '62'
     * - Add '62' prefix if missing
     */
    function normalizePhone(phoneNumber) {
        let normalized = phoneNumber.replace(/\D/g, '')
        if (normalized.startsWith('0')) {
            normalized = '62' + normalized.slice(1)
        } else if (!normalized.startsWith('62')) {
            normalized = '62' + normalized
        }
        return normalized
    }

    // Actions
    async function login(phoneNumber, password) {
        loading.value = true
        error.value = null

        try {
            // Input validation — prevent payload injection
            if (!phoneNumber || phoneNumber.length > 20) throw new Error('Nomor tidak valid.')
            if (!password || password.length > 100) throw new Error('Password tidak valid.')

            const normalizedPhone = normalizePhone(phoneNumber)
            const fakeEmail = phoneToEmail(normalizedPhone)

            console.log('Attempting login for:', normalizedPhone, '→', fakeEmail)

            // ──────────────────────────────────────────────
            // 1. TRY SUPABASE AUTH (Email-based, derived from phone)
            // ──────────────────────────────────────────────
            let authUser = null
            try {
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email: fakeEmail,
                    password: password
                })

                if (authError) throw authError
                console.log('✅ Supabase Auth OK. User ID:', authData.user.id)
                authUser = authData.user
            } catch (authErr) {
                console.warn('⚠️ Supabase Auth failed, using legacy fallback:', authErr.message)
            }

            // ──────────────────────────────────────────────
            // 2. FETCH USER PROFILE from public.users
            // ──────────────────────────────────────────────
            const { data: userProfile, error: profileError } = await supabase
                .from('users')
                .select(`
                    id, full_name, phone_number, role, company_id, is_active, created_at,
                    companies (id, name, code)
                `)
                .eq('phone_number', normalizedPhone)
                .single()

            if (profileError || !userProfile) {
                console.error('Profile fetch error:', profileError)
                throw new Error('Profil pengguna tidak ditemukan.')
            }

            if (!userProfile.is_active) {
                throw new Error('Akun dinonaktifkan. Hubungi admin.')
            }

            // ──────────────────────────────────────────────
            // 3. LEGACY PASSWORD CHECK (only if Supabase Auth failed)
            // ──────────────────────────────────────────────
            if (!authUser) {
                // Legacy fallback disabled for security
                // All users must authenticate via Supabase Auth
                throw new Error('Autentikasi gagal. Hubungi admin untuk reset password.')
            }

            // ──────────────────────────────────────────────
            // 4. SET USER SESSION (with expiry timestamp)
            // ──────────────────────────────────────────────
            const sessionData = {
                ...userProfile,
                auth_id: authUser?.id || null,
                _session_created: Date.now()
            }
            user.value = sessionData
            localStorage.setItem('epanen_user_profile', JSON.stringify(sessionData))

            return true
        } catch (err) {
            error.value = err.message
            // Clear any partial session on failure
            user.value = null
            localStorage.removeItem('epanen_user_profile')
            return false
        } finally {
            loading.value = false
        }
    }

    async function logout() {
        try { await supabase.auth.signOut() } catch (_) { /* ignore */ }
        user.value = null
        initialized.value = true // Keep initialized true after logout
        // Aggressive cleanup: remove ALL Supabase-related keys
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && (key.startsWith('sb-') || key.includes('supabase') || key === 'epanen_user_profile')) {
                keysToRemove.push(key)
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
    }

    // Session expiry: 24 hours
    const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000

    function isSessionExpired(profile) {
        if (!profile?._session_created) return true // No timestamp = legacy session, force re-login
        return (Date.now() - profile._session_created) > SESSION_MAX_AGE_MS
    }

    async function _doInitAuth() {
        try {
            // 1. Try Supabase Session
            try {
                const { data } = await supabase.auth.getSession()
                if (data.session?.user) {
                    const stored = localStorage.getItem('epanen_user_profile')
                    if (stored) {
                        const profile = JSON.parse(stored)
                        if (profile && profile.role && profile.full_name && profile.full_name !== 'User' && !isSessionExpired(profile)) {
                            user.value = profile
                            return
                        }
                    }
                    // Session exists but no valid profile — clear everything
                    console.warn('⚠️ Ghost session detected. Forcing re-login.')
                    await logout()
                    return
                }
            } catch (_) { /* ignore */ }

            // 2. Fallback: Restore from localStorage
            const stored = localStorage.getItem('epanen_user_profile')
            if (stored) {
                try {
                    const profile = JSON.parse(stored)
                    if (profile && profile.role && profile.full_name && profile.full_name !== 'User' && !isSessionExpired(profile)) {
                        user.value = profile
                    } else {
                        console.warn('🧹 Clearing invalid ghost session')
                        await logout()
                    }
                } catch (_) {
                    await logout()
                }
            }
        } finally {
            initialized.value = true
        }
    }

    // Singleton: ensures initAuth only runs once & is awaitable
    function initAuth() {
        if (!_initPromise) {
            _initPromise = _doInitAuth()
        }
        return _initPromise
    }

    return {
        user,
        loading,
        error,
        initialized,
        isAuthenticated,
        isOwner,
        isAdmin,
        isManager,
        isCashier,
        userName,
        login,
        logout,
        initAuth
    }
})
