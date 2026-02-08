/**
 * ePanen SmartFarm - Navigation Configuration
 * Pusat kendali menu dan ikon 3D Sidebar.
 */

export const navigationConfig = [
    {
        label: 'Dashboard',
        to: '/',
        icon: 'layout-dashboard',
        customIcon: '/images/3d-icons/dashboard.png',
        roles: ['admin', 'owner', 'ceo', 'farmer']
    },
    {
        label: 'Monitoring Harian',
        to: '/reports',
        icon: 'clipboard-list',
        customIcon: '/images/3d-icons/reports.png',
        roles: ['owner', 'admin', 'ceo']
    },
    {
        label: 'Monitoring Keuangan',
        to: '/financial-reports',
        icon: 'dollar-sign',
        customIcon: '/images/3d-icons/finance.png',
        roles: ['owner', 'admin', 'ceo']
    },

    {
        label: 'Intelligence',
        isSection: true,
        roles: ['admin', 'owner']
    },
    {
        label: 'Orchestrator Map',
        to: '/ai-intelligence',
        icon: 'brain',
        roles: ['admin', 'owner']
    },
    {
        label: 'RAG Intelligence',
        to: '/query',
        icon: 'search',
        roles: ['admin', 'owner']
    },
    {
        label: 'Trend Analytics',
        to: '/analytics',
        icon: 'trending-up',
        roles: ['admin', 'owner']
    },

    {
        label: 'Support',
        isSection: true
    },
    {
        label: 'Buku Saku SOP',
        to: '/sop-reference',
        icon: 'book-open'
    },

    {
        label: 'System Admin',
        isSection: true,
        roles: ['admin']
    },
    {
        label: 'Kelola User',
        to: '/admin',
        icon: 'users',
        customIcon: '/images/3d-icons/users-final.png',
        roles: ['admin']
    },
    {
        label: 'Audit Logs',
        to: '/logs',
        icon: 'eye',
        roles: ['admin']
    }
];
