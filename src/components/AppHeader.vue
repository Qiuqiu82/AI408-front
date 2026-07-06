<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { authStore, logout } from '../stores/auth'

const route = useRoute()

const navItems = [
  { name: 'home', label: '首页', path: '/' },
  { name: 'practice', label: '刷题', path: '/practice' },
  { name: 'exam', label: '考试', path: '/exam' },
  { name: 'review', label: '复盘', path: '/review' },
  { name: 'mistakes', label: '错题本', path: '/mistakes' },
  { name: 'favorites', label: '收藏', path: '/favorites' },
]

const displayName = computed(() => authStore.user?.nickname || authStore.user?.mobile || '未登录')
const isAdmin = computed(() => authStore.user?.role === 'admin')

function isNavActive(item) {
  if (item.name === 'exam') {
    return route.path.startsWith('/exam')
  }
  return route.name === item.name
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-white/60 bg-white/78 backdrop-blur-xl">
    <div class="site-shell flex items-center gap-4 py-4">
      <RouterLink to="/" class="flex items-center gap-3">
        <div class="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-lg shadow-slate-900/15">
          408
        </div>
        <div class="hidden sm:block">
          <div class="text-sm font-semibold tracking-tight text-slate-900">AI408 刷题系统</div>
          <div class="text-xs text-slate-500">真实 API MVP</div>
        </div>
      </RouterLink>

      <nav class="hidden flex-1 items-center justify-center gap-2 lg:flex">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.path"
          class="rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          :class="isNavActive(item) ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : ''"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="ml-auto flex items-center gap-2">
        <RouterLink v-if="isAdmin" to="/admin/import" class="craft-btn craft-btn-soft hidden sm:inline-flex">
          题库导入
        </RouterLink>
        <RouterLink v-if="!authStore.accessToken" to="/login" class="craft-btn craft-btn-primary">
          登录
        </RouterLink>
        <template v-else>
          <div class="hidden items-center gap-3 rounded-full bg-slate-50 px-3 py-2 sm:flex">
            <div class="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">
              {{ displayName ? displayName.slice(0, 1) : 'A' }}
            </div>
            <div class="leading-tight">
              <div class="text-sm font-semibold text-slate-900">{{ displayName }}</div>
              <div class="text-xs text-slate-500">{{ isAdmin ? '管理员' : '学员' }}</div>
            </div>
          </div>
          <button class="craft-btn craft-btn-soft" @click="logout()">退出</button>
        </template>
      </div>
    </div>

    <div class="site-shell pb-4 lg:hidden">
      <div class="segmented w-full overflow-x-auto whitespace-nowrap">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.path"
          :class="isNavActive(item) ? 'active' : 'text-slate-500'"
          class="mx-0.5 inline-flex"
        >
          {{ item.label }}
        </RouterLink>
      </div>
    </div>
  </header>
</template>
