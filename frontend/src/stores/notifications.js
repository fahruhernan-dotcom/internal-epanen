import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, TABLES } from '@/services/supabase'
import { useAuthStore } from './auth'

export const useNotificationStore = defineStore('notifications', () => {
    const authStore = useAuthStore()
    const notifications = ref([])
    const unreadCount = ref(0)
    const loading = ref(false)

    async function fetchNotifications() {
        if (!authStore.user?.id) return

        loading.value = true
        try {
            const { data, error } = await supabase
                .from(TABLES.NOTIFICATIONS)
                .select('*')
                .eq('user_id', authStore.user.id)
                .order('created_at', { ascending: false })
                .limit(20)

            if (error) throw error

            notifications.value = data || []
            unreadCount.value = notifications.value.filter(n => !n.is_read).length
        } catch (err) {
            console.error('Failed to fetch notifications:', err)
        } finally {
            loading.value = false
        }
    }

    async function markAsRead(notificationId) {
        try {
            const { error } = await supabase
                .from(TABLES.NOTIFICATIONS)
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('id', notificationId)

            if (error) throw error

            // Update local state
            const index = notifications.value.findIndex(n => n.id === notificationId)
            if (index !== -1) {
                notifications.value[index].is_read = true
                unreadCount.value = notifications.value.filter(n => !n.is_read).length
            }
        } catch (err) {
            console.error('Failed to mark notification as read:', err)
        }
    }

    async function markAllAsRead() {
        if (!authStore.user?.id) return

        try {
            const { error } = await supabase
                .from(TABLES.NOTIFICATIONS)
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('user_id', authStore.user.id)
                .eq('is_read', false)

            if (error) throw error

            notifications.value.forEach(n => n.is_read = true)
            unreadCount.value = 0
        } catch (err) {
            console.error('Failed to mark all as read:', err)
        }
    }

    return {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead
    }
})
