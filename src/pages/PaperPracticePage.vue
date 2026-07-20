<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getPracticeScopes } from '../api/practice'
import {
  clearPracticeSession,
  setPendingPracticeRequest,
  studyStore,
} from '../stores/study'

const router = useRouter()
const papers = ref([])
const loading = ref(true)
const error = ref('')

const totalQuestions = computed(() => papers.value.reduce((sum, paper) => sum + Number(paper.totalCount || 0), 0))
const completedPapers = computed(() => papers.value.filter((paper) => paper.totalCount > 0 && paper.doneCount >= paper.totalCount).length)

function progressPercent(paper) {
  if (!paper.totalCount) {
    return 0
  }
  return Math.min(100, Math.round((Number(paper.doneCount || 0) / paper.totalCount) * 100))
}

async function loadPapers() {
  loading.value = true
  error.value = ''
  try {
    papers.value = (await getPracticeScopes('paper')) || []
  } catch (loadError) {
    error.value = loadError?.message || '真题套卷加载失败'
  } finally {
    loading.value = false
  }
}

function startPaper(paper, practiceMode = 'sequence') {
  clearPracticeSession()
  studyStore.practiceMode = practiceMode
  setPendingPracticeRequest({
    mode: 'sequence',
    subjectCode: '',
    questionIds: [],
    limit: paper.totalCount,
    source: 'paper-practice',
    title: paper.scopeName,
    scopeType: 'paper',
    scopeKey: paper.scopeKey,
  })
  router.push('/practice')
}

onMounted(loadPapers)
</script>

<template>
  <div class="space-y-5">
    <section class="border-b border-slate-200 pb-5">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-sm font-semibold text-teal-700">历年真题</p>
          <h1 class="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">408 真题套卷</h1>
          <p class="mt-2 text-sm text-slate-500">按年份完整练习，答题记录继续计入错题本和学习统计。</p>
        </div>
        <div class="flex gap-6 text-sm">
          <div>
            <div class="text-slate-500">套卷</div>
            <div class="mt-1 text-xl font-bold text-slate-950">{{ papers.length }}</div>
          </div>
          <div>
            <div class="text-slate-500">题目</div>
            <div class="mt-1 text-xl font-bold text-slate-950">{{ totalQuestions }}</div>
          </div>
          <div>
            <div class="text-slate-500">已完成</div>
            <div class="mt-1 text-xl font-bold text-slate-950">{{ completedPapers }}</div>
          </div>
        </div>
      </div>
    </section>

    <div v-if="loading" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="index in 6" :key="index" class="h-48 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
    </div>

    <section v-else-if="error" class="border border-rose-200 bg-rose-50 p-5">
      <h2 class="font-bold text-rose-700">加载失败</h2>
      <p class="mt-2 text-sm text-rose-600">{{ error }}</p>
      <button class="craft-btn craft-btn-soft mt-4 px-4 py-2" @click="loadPapers">重新加载</button>
    </section>

    <section v-else-if="!papers.length" class="border border-slate-200 bg-white p-6">
      <h2 class="text-lg font-bold text-slate-950">暂无可用套卷</h2>
      <p class="mt-2 text-sm text-slate-500">导入带有年份信息的真题后，套卷会自动出现在这里。</p>
    </section>

    <section v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="paper in papers"
        :key="paper.scopeKey"
        class="flex min-h-[208px] flex-col rounded-lg border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-md"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="text-3xl font-bold text-slate-950">{{ paper.scopeKey }}</div>
            <div class="mt-1 text-sm font-semibold text-slate-600">{{ paper.scopeName }}</div>
          </div>
          <span class="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {{ paper.totalCount }} 题
          </span>
        </div>

        <div class="mt-5">
          <div class="flex justify-between text-xs text-slate-500">
            <span>完成 {{ paper.doneCount }} / {{ paper.totalCount }}</span>
            <span>{{ progressPercent(paper) }}%</span>
          </div>
          <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div class="h-full rounded-full bg-teal-600" :style="{ width: `${progressPercent(paper)}%` }" />
          </div>
          <div class="mt-2 text-xs text-slate-500">当前错题 {{ paper.wrongCount || 0 }} 道</div>
        </div>

        <div class="mt-auto grid grid-cols-2 gap-2 pt-5">
          <button class="craft-btn craft-btn-primary justify-center px-3 py-2" @click="startPaper(paper, 'sequence')">
            开始刷题
          </button>
          <button class="craft-btn craft-btn-soft justify-center px-3 py-2" @click="startPaper(paper, 'memorize')">
            背题
          </button>
        </div>
      </article>
    </section>
  </div>
</template>
