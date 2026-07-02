<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import SectionBlock from '../components/SectionBlock.vue'
import StatCard from '../components/StatCard.vue'
import { clearWrongBook, getWrongBookPage } from '../api/state'
import { ApiError } from '../api/errors'

const page = ref({
  pageSize: 20,
  pageIndex: 1,
})
const result = ref({ records: [], recordCount: 0, pageCount: 0 })
const loading = ref(true)
const message = ref('')

const wrongCount = computed(() => result.value.recordCount || 0)
const todayWrongCount = computed(() =>
  result.value.records.filter((item) => String(item.wrongAt || '').startsWith(new Date().toISOString().slice(0, 10))).length
)

async function loadData() {
  loading.value = true
  message.value = ''
  try {
    result.value = await getWrongBookPage({
      page: page.value,
      params: {},
    })
  } catch (e) {
    message.value = e instanceof ApiError ? e.message : '错题加载失败'
  } finally {
    loading.value = false
  }
}

async function handleClear() {
  try {
    await clearWrongBook()
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
          <div class="mt-4 section-title">错题本</div>
        </div>
        <button class="craft-btn craft-btn-primary" @click="handleClear">清空错题</button>
      </div>

      <div class="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div class="rounded-[1.5rem] bg-slate-50 p-5">
          <div class="text-sm font-medium text-slate-500">错题状态</div>
          <div class="mt-4 grid gap-3">
            <div v-for="item in result.records" :key="item.questionId" class="rounded-[1.25rem] bg-white p-4">
              <div class="text-sm font-semibold text-slate-900">{{ item.title }}</div>
              <div class="mt-1 text-sm text-slate-500">{{ item.subjectName }} · {{ item.tag }}</div>
            </div>
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <StatCard label="错题总数" :value="wrongCount" tone="rose" />
          <StatCard label="今日新增错题" :value="todayWrongCount" tone="orange" />
        </div>
      </div>
      <div v-if="message" class="mt-4 rounded-[1.25rem] bg-rose-50 p-4 text-sm text-rose-600">{{ message }}</div>
    </section>

    <SectionBlock title="错题列表">
      <div class="grid gap-3">
        <div v-for="item in result.records" :key="item.questionId" class="craft-card-solid rounded-[1.25rem] p-4">
          <div class="text-sm font-semibold text-slate-900">{{ item.title }}</div>
          <div class="mt-1 text-sm text-slate-500">{{ item.subjectName }} · {{ item.tag }}</div>
          <div class="mt-2 text-xs text-slate-400">错题时间：{{ item.wrongAt }}</div>
        </div>
      </div>
    </SectionBlock>
  </div>
</template>
