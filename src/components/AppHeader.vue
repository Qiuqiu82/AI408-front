<script setup>
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { name: 'home', label: '首页', path: '/' },
  { name: 'practice', label: '做题', path: '/practice' },
  { name: 'review', label: '复盘', path: '/review' },
  { name: 'mistakes', label: '错题本', path: '/mistakes' },
  { name: 'favorites', label: '收藏', path: '/favorites' },
]
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
    <div class="site-shell flex items-center gap-4 py-4">
      <RouterLink to="/" class="flex items-center gap-3">
        <div
          class="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-lg shadow-slate-900/15"
        >
          408
        </div>
        <div class="hidden sm:block">
          <div class="text-sm font-semibold tracking-tight text-slate-900">AI408 刷</div>
        </div>
      </RouterLink>

      <nav class="hidden flex-1 items-center justify-center gap-2 lg:flex">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.path"
          class="rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          :class="route.name === item.name ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : ''"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="ml-auto flex items-center gap-2">
    
        <RouterLink to="/practice" class="craft-btn craft-btn-primary">
          开始刷题
        </RouterLink>
      </div>
    </div>

    <div class="site-shell pb-4 lg:hidden">
      <div class="segmented w-full overflow-x-auto whitespace-nowrap">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.path"
          :class="route.name === item.name ? 'active' : 'text-slate-500'"
          class="mx-0.5 inline-flex"
        >
          {{ item.label }}
        </RouterLink>
      </div>
    </div>
  </header>
</template>
