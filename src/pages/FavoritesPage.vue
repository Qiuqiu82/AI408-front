<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import SectionBlock from '../components/SectionBlock.vue'
import StatCard from '../components/StatCard.vue'
import { clearFavorites, getFavoritesPage } from '../api/state'
import { ApiError } from '../api/errors'

const result = ref({ records: [], recordCount: 0, pageCount: 0 })
const message = ref('')
const loading = ref(true)

const favoriteCount = computed(() => result.value.recordCount || 0)
const importantCount = computed(() => result.value.records.filter((item) => (item.favoriteImportance || 0) === 1).length)
const veryImportantCount = computed(() => result.value.records.filter((item) => (item.favoriteImportance || 0) === 2).length)

async function loadData() {
  loading.value = true
  message.value = ''
  try {
    result.value = await getFavoritesPage({
      page: { pageSize: 20, pageIndex: 1 },
      params: {},
    })
  } catch (e) {
    message.value = e instanceof ApiError ? e.message : '收藏加载失败'
  } finally {
    loading.value = false
  }
}

async function handleSync() {
  await loadData()
}

async function handleClear() {
  try {
    await clearFavorites()
    await loadData()
  } catch (e) {
    message.value = e instanceof ApiError ? e.message : '清空失败'
  }
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-8">
    <section class="craft-card-solid rounded-[2rem] p-6 sm:p-8">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="segmented">
            <RouterLink to="/mistakes" class="text-slate-500" active-class="active">错题本</RouterLink>
            <RouterLink to="/favorites" class="text-slate-500" active-class="active">收藏题目</RouterLink>
          </div>
          <div class="mt-4 section-title">收藏题目</div>
        </div>
        <div class="flex flex-wrap gap-3">
          <button class="craft-btn craft-btn-soft" @click="handleSync">同步数据</button>
          <button class="craft-btn craft-btn-primary" @click="handleClear">清空收藏</button>
        </div>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard label="收藏总数" :value="favoriteCount" tone="sky" />
        <StatCard label="重要" :value="importantCount" tone="amber" />
        <StatCard label="非常重要" :value="veryImportantCount" tone="rose" />
        <StatCard label="当前页" :value="result.records.length" tone="slate" />
      </div>

      <div v-if="message" class="mt-4 rounded-[1.25rem] bg-rose-50 p-4 text-sm text-rose-600">{{ message }}</div>
    </section>

    <SectionBlock title="收藏列表">
      <div class="grid gap-3">
        <div v-for="item in result.records" :key="item.questionId" class="craft-card-solid rounded-[1.25rem] p-4">
          <div class="text-sm font-semibold text-slate-900">{{ item.title }}</div>
          <div class="mt-1 text-sm text-slate-500">{{ item.subjectName }} · 收藏等级 {{ item.favoriteImportance }}</div>
          <div class="mt-2 text-xs text-slate-400">收藏时间：{{ item.favoriteAt }}</div>
        </div>
      </div>
    </SectionBlock>
  </div>
</template>
