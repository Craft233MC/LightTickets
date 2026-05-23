import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getSiteConfig } from '@/api/setup'

// Site config cache (persists per session)
function getCachedSiteConfig() {
  const isSetup = sessionStorage.getItem('lt-setup-checked')
  const requireLogin = sessionStorage.getItem('lt-require-login')
  return {
    isSetup: isSetup === 'true' ? true : isSetup === 'false' ? false : null,
    requireLogin: requireLogin === 'true' ? true : requireLogin === 'false' ? false : null,
  }
}

export let siteConfig = getCachedSiteConfig()

function updateSiteConfigCache(data: { isSetup: boolean; requireLogin: boolean }) {
  siteConfig = { isSetup: data.isSetup, requireLogin: data.requireLogin }
  sessionStorage.setItem('lt-setup-checked', String(data.isSetup))
  sessionStorage.setItem('lt-require-login', String(data.requireLogin))
}

export function setSiteConfigCache(data: { isSetup: boolean; requireLogin: boolean }) {
  updateSiteConfigCache(data)
}

export function setRequireLoginCache(value: boolean) {
  siteConfig.requireLogin = value
  sessionStorage.setItem('lt-require-login', String(value))
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/setup',
      name: 'setup',
      component: () => import('@/views/SetupView.vue'),
      meta: { setup: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guest: true },
    },
    {
      path: '/',
      name: 'tickets',
      component: () => import('@/views/TicketListView.vue'),
      meta: { public: true },
    },
    {
      path: '/tickets/new',
      name: 'ticket-create',
      component: () => import('@/views/TicketCreateView.vue'),
      meta: { auth: true },
    },
    {
      path: '/tickets/:id',
      name: 'ticket-detail',
      component: () => import('@/views/TicketDetailView.vue'),
      meta: { public: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { auth: true },
    },
    {
      path: '/admin',
      component: () => import('@/views/admin/AdminLayout.vue'),
      meta: { auth: true, admin: true },
      children: [
        { path: '', redirect: '/admin/labels' },
        { path: 'labels', name: 'admin-labels', component: () => import('@/views/admin/AdminLabelsView.vue') },
        { path: 'servers', name: 'admin-servers', component: () => import('@/views/admin/AdminServersView.vue') },
        { path: 'users', name: 'admin-users', component: () => import('@/views/admin/AdminUsersView.vue') },
        { path: 'settings', name: 'admin-settings', component: () => import('@/views/admin/AdminSettingsView.vue') },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // 1. Wait for auth restore
  if (auth.loading) {
    await auth.restore()
  }

  // 2. Fetch site config if not cached
  if (siteConfig.isSetup === null) {
    try {
      const config = await getSiteConfig()
      updateSiteConfigCache(config)
    } catch {
      siteConfig.isSetup = false
      siteConfig.requireLogin = false
      sessionStorage.setItem('lt-setup-checked', 'false')
      sessionStorage.setItem('lt-require-login', 'false')
    }
  }

  // 3. Setup page protection: if already setup, redirect away from /setup
  if (to.meta.setup && siteConfig.isSetup) {
    return { name: 'tickets' }
  }

  // 4. If not setup, only allow setup page
  if (!siteConfig.isSetup && to.name !== 'setup') {
    return { name: 'setup' }
  }

  // 5. requireLogin check
  const requireLogin = siteConfig.requireLogin === true

  if (!auth.isAuthenticated) {
    // requireLogin ON: all non-guest routes require auth
    if (requireLogin && !to.meta.guest && !to.meta.setup) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
    // requireLogin OFF: only meta.auth routes require auth
    if (!requireLogin && to.meta.auth) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
  }

  // 6. Already logged in visiting guest routes → go home
  if (auth.isAuthenticated && to.meta.guest) {
    return { name: 'tickets' }
  }

  // 7. Admin check
  if (to.meta.admin && !auth.isAdmin) {
    return { name: 'tickets' }
  }
})

export default router