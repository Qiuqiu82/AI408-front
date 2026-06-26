import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
import PracticePage from './pages/PracticePage.vue'
import ReviewPage from './pages/ReviewPage.vue'
import MistakesPage from './pages/MistakesPage.vue'
import FavoritesPage from './pages/FavoritesPage.vue'

const routes = [
  { path: '/', name: 'home', component: HomePage, meta: { title: '刷题首页' } },
  { path: '/practice', name: 'practice', component: PracticePage, meta: { title: '答题页' } },
  { path: '/review', name: 'review', component: ReviewPage, meta: { title: '复盘页' } },
  { path: '/mistakes', name: 'mistakes', component: MistakesPage, meta: { title: '错题本' } },
  { path: '/favorites', name: 'favorites', component: FavoritesPage, meta: { title: '收藏题目' } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  document.title = `${to.meta.title || 'AI408 刷题站'} - AI408 刷题站`
})

export default router
