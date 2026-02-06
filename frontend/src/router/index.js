import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/LoginView.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/',
        component: () => import('@/layouts/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Dashboard',
                component: () => import('@/views/DashboardView.vue')
            },
            {
                path: 'reports',
                name: 'Reports',
                component: () => import('@/views/ReportsView.vue')
            },
            {
                path: 'companies/:id',
                name: 'CompanyDetail',
                component: () => import('@/views/CompanyDetailView.vue')
            },
            {
                path: 'admin',
                name: 'Admin',
                component: () => import('@/views/AdminView.vue'),
                meta: { roles: ['admin'] }
            },
            {
                path: 'submit-daily',
                name: 'FarmerSubmit',
                component: () => import('@/views/FarmerDashboardView.vue'),
                meta: { roles: ['farmer', 'owner', 'admin'] }
            },
            {
                path: 'farmer-chat',
                name: 'FarmerChat',
                component: () => import('@/views/FarmerChatView.vue'),
                meta: { roles: ['farmer', 'owner', 'admin'] }
            },
            {
                path: 'submit-report',
                name: 'CEOSubmit',
                component: () => import('@/views/CEOSubmitView.vue'),
                meta: { roles: ['ceo', 'owner', 'admin'] }
            },
            {
                path: 'financial-reports',
                name: 'FinancialReports',
                component: () => import('@/views/FinancialReportsView.vue'),
                meta: { roles: ['owner', 'admin', 'ceo'] }
            },
            {
                path: 'ai-intelligence',
                name: 'AIIntelligence',
                component: () => import('@/views/AIIntelligenceView.vue'),
                meta: { roles: ['owner', 'admin'] }
            },
            {
                path: 'query',
                name: 'RAGQuery',
                component: () => import('@/views/QueryView.vue'),
                meta: { roles: ['owner', 'admin', 'ceo'] }
            },
            {
                path: 'sop-reference',
                name: 'SOPReference',
                component: () => import('@/views/SOPReferenceView.vue'),
                meta: { roles: ['farmer', 'owner', 'admin'] }
            },
            {
                path: 'logs',
                name: 'AuditLogs',
                component: () => import('@/views/AuditLogsView.vue'),
                meta: { roles: ['owner', 'admin'] }
            },
            {
                path: 'analytics',
                name: 'Analytics',
                component: () => import('@/views/AnalyticsView.vue'),
                meta: { roles: ['owner', 'admin', 'ceo'] }
            },
            {
                path: 'profile',
                name: 'Profile',
                component: () => import('@/views/ProfileView.vue')
            }
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/login')
    } else if (to.path === '/login' && authStore.isAuthenticated) {
        next('/')
    } else if (to.meta.roles && !to.meta.roles.includes(authStore.user?.role)) {
        // Role not authorized, redirect to home
        next('/')
    } else {
        next()
    }
})

export default router
