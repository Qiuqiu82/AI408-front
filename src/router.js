import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
import PracticePage from './pages/PracticePage.vue'
import PaperPracticePage from './pages/PaperPracticePage.vue'
import ReviewPage from './pages/ReviewPage.vue'
import MistakesPage from './pages/MistakesPage.vue'
import FavoritesPage from './pages/FavoritesPage.vue'
import LoginPage from './pages/LoginPage.vue'
import AccountPasswordPage from './pages/AccountPasswordPage.vue'
import AdminImportPage from './pages/AdminImportPage.vue'
import ExamPage from './pages/ExamPage.vue'
import ExamRecordPage from './pages/ExamRecordPage.vue'
import { authStore } from './stores/auth'

const routes = [
  { path: '/', name: 'home', component: HomePage, meta: { title: 'AI408 首页', requiresAuth: true } },
  { path: '/practice', name: 'practice', component: PracticePage, meta: { title: '刷题练习', requiresAuth: true } },
  { path: '/practice/papers', name: 'papers', component: PaperPracticePage, meta: { title: '408 真题套卷', requiresAuth: true } },
  { path: '/exam', name: 'exam', component: ExamPage, meta: { title: '模拟考试', requiresAuth: true } },
  { path: '/exam/records/:id', name: 'exam-record', component: ExamRecordPage, meta: { title: '考试回顾', requiresAuth: true } },
  { path: '/review', name: 'review', component: ReviewPage, meta: { title: '练习复盘', requiresAuth: true } },
  { path: '/mistakes', name: 'mistakes', component: MistakesPage, meta: { title: '错题本', requiresAuth: true } },
  { path: '/favorites', name: 'favorites', component: FavoritesPage, meta: { title: '收藏题目', requiresAuth: true } },
  { path: '/login', name: 'login', component: LoginPage, meta: { title: '登录', public: true } },
  { path: '/account/password', name: 'account-password', component: AccountPasswordPage, meta: { title: '设置密码', requiresAuth: true, allowWithoutPassword: true } },
  { path: '/admin/import', name: 'admin-import', component: AdminImportPage, meta: { title: '题库导入', requiresAuth: true, requiresAdmin: true } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  if (!authStore.ready) {
    authStore.ready = true
  }

  if (to.meta.requiresAuth && !authStore.accessToken) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (authStore.accessToken && authStore.user?.hasPassword === false && to.meta.requiresAuth && !to.meta.allowWithoutPassword) {
    return { path: '/account/password', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAdmin && authStore.user?.role !== 'admin') {
    return { path: '/' }
  }

  if (to.path === '/login' && authStore.accessToken) {
    return { path: '/' }
  }

  return true
})

router.afterEach((to) => {
  document.title = `${to.meta.title || 'AI408'} - AI408 刷题系统`
})

export default router
