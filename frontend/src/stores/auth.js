import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'

export const useAuthStore = defineStore('auth', () => {
    // State
    const user = ref(null)
    const loading = ref(false)
    const error = ref(null)

    // Getters
    const isAuthenticated = computed(() => !!user.value)
    const isOwner = computed(() => user.value?.role === 'owner')
    const isAdmin = computed(() => user.value?.role === 'admin')
    const isManager = computed(() => user.value?.role === 'manager')
    const userName = computed(() => user.value?.full_name || 'User')

    // Actions
    async function login(phoneNumber, password) {
        loading.value = true
        error.value = null

        try {
            // Normalize phone number (remove leading 0, add 62)
            let normalizedPhone = phoneNumber.replace(/\D/g, '')
            if (normalizedPhone.startsWith('0')) {
                normalizedPhone = '62' + normalizedPhone.slice(1)
            } else if (!normalizedPhone.startsWith('62')) {
                normalizedPhone = '62' + normalizedPhone
            }

            console.log('Attempting login for:', normalizedPhone)

            // Query user from database
            const { data: users, error: queryError } = await supabase
                .from('users')
                .select(`
          *,
          companies (
            id,
            name,
            code
          )
        `)
                .eq('phone_number', normalizedPhone)
                .eq('is_active', true)
                .single()

            if (queryError || !users) {
                console.error('User search error:', queryError)
                throw new Error('Nomor telepon tidak ditemukan')
            }

            console.log('User found in DB:', users.full_name, 'Role:', users.role)

            // Check role - all roles in system allowed to login
            const allowedRoles = ['owner', 'admin', 'ceo', 'farmer', 'manager']
            if (!allowedRoles.includes(users.role)) {
                console.warn('Unauthorized role:', users.role)
                throw new Error('Akses ditolak. Role tidak dikenali.')
            }

            // Enhanced password check: check DB password if available, otherwise fallback to default
            const dbPassword = users.password
            const expectedPassword = dbPassword || 'smartfarm2026'

            if (password !== expectedPassword) {
                console.warn('Invalid password attempt for:', normalizedPhone)
                throw new Error('Password salah')
            }

            // Set user data
            user.value = users

            // Store in localStorage for persistence
            localStorage.setItem('smartfarm_user', JSON.stringify(users))

            return true
        } catch (err) {
            error.value = err.message
            return false
        } finally {
            loading.value = false
        }
    }

    function logout() {
        user.value = null
        localStorage.removeItem('smartfarm_user')
    }

    function initAuth() {
        const stored = localStorage.getItem('smartfarm_user')
        if (stored) {
            try {
                user.value = JSON.parse(stored)
            } catch (e) {
                localStorage.removeItem('smartfarm_user')
            }
        }
    }

    return {
        user,
        loading,
        error,
        isAuthenticated,
        isOwner,
        isAdmin,
        isManager,
        userName,
        login,
        logout,
        initAuth
    }
})
