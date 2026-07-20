<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getSubjects } from '../api/questions'
import { getStudySummary } from '../api/users'
import { authStore } from '../stores/auth'
import { clearPracticeSession, setSelectedSubjectCode, studyStore } from '../stores/study'

const router = useRouter()
const subjects = ref([])
const summary = ref({
  answeredCount: 0,
  correctCount: 0,
  wrongCount: 0,
  favoriteCount: 0,
  todayWrongCount: 0,
  todayFavoriteCount: 0,
  progressRate: 0,
  sessionSeconds: 0,
})
const loading = ref(true)
const error = ref('')

const activeSubject = computed(() => subjects.value.find((item) => item.subjectCode === studyStore.selectedSubjectCode) || subjects.value[0] || null)
const displayName = computed(() => authStore.user?.nickname || authStore.user?.email || authStore.user?.mobile || '同学')
const isAdmin = computed(() => authStore.user?.role === 'admin')
const accuracy = computed(() => {
  const answered = Number(summary.value.answeredCount || 0)
  if (!answered) {
    return 0
  }
  return Math.round((Number(summary.value.correctCount || 0) / answered) * 100)
})
const sessionMinutes = computed(() => Math.max(0, Math.round((summary.value.sessionSeconds || 0) / 60)))

const nextActions = computed(() => [
  {
    title: studyStore.currentSessionId ? '继续上次练习' : '开始一组练习',
    note: activeSubject.value ? `${activeSubject.value.subjectName} · 保持当前科目` : '先加载题库科目',
    action: () => router.push('/practice'),
    primary: true,
  },
  {
    title: '复盘最近一次练习',
    note: summary.value.wrongCount ? `${summary.value.wrongCount} 道错题需要处理` : '查看正确率和薄弱点',
    action: () => router.push('/review'),
  },
  {
    title: '进入错题本再练',
    note: summary.value.todayWrongCount ? `今日新增 ${summary.value.todayWrongCount} 道` : '按错题本沉淀复习',
    action: () => router.push('/mistakes'),
  },
])

const featureEntries = computed(() => [
  { title: '刷题 / 背题', note: '同一批题目，两种训练方式', path: '/practice', mark: '练' },
  { title: '真题套卷', note: '按年份完成历年 408 真题', path: '/practice/papers', mark: '卷' },
  { title: '复盘', note: '结束练习后看结果与弱项', path: '/review', mark: '盘' },
  { title: '错题本', note: '进入错题练习，逐步消题', path: '/mistakes', mark: '错' },
  { title: '收藏', note: '高优先级题目集中复习', path: '/favorites', mark: '藏' },
  { title: '模拟考试', note: '独立计时与交卷记录', path: '/exam', mark: '考' },
  ...(isAdmin.value ? [{ title: '题库导入', note: '管理员批量导入题目', path: '/admin/import', mark: '导' }] : []),
])

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [subjectList, studySummary] = await Promise.all([getSubjects(), getStudySummary()])
    subjects.value = subjectList || []
    summary.value = studySummary || summary.value
    if (!subjects.value.some((item) => item.subjectCode === studyStore.selectedSubjectCode) && subjects.value[0]) {
      setSelectedSubjectCode(subjects.value[0].subjectCode)
    }
  } catch (e) {
    error.value = e?.message || '首页数据加载失败'
  } finally {
    loading.value = false
  }
}

function startPractice() {
  clearPracticeSession()
  router.push('/practice')
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-6">
    <section class="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <div class="craft-panel p-5 sm:p-6 lg:p-7">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div class="text-sm font-semibold text-teal-700">学习工作台</div>
            <h1 class="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">今天先把该做的题做完</h1>
            <p class="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              {{ displayName }}，当前科目是 {{ activeSubject?.subjectName || '加载中' }}。这里优先放继续练习、复盘和错题再练，减少装饰入口对学习路径的干扰。
            </p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            <div class="font-semibold text-slate-900">{{ activeSubject?.subjectName || '待加载' }}</div>
            <div class="mt-1">题库 {{ activeSubject?.totalCount || 0 }} 题</div>
          </div>
        </div>

        <div class="mt-6 grid gap-3 sm:grid-cols-3">
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div class="text-xs font-medium text-slate-500">全局进度</div>
            <div class="mt-2 text-3xl font-bold text-slate-950">{{ summary.progressRate }}%</div>
            <div class="mt-3 h-2 rounded-full bg-white">
              <div class="h-full rounded-full bg-teal-600" :style="{ width: `${Math.min(summary.progressRate || 0, 100)}%` }" />
            </div>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-4">
            <div class="text-xs font-medium text-slate-500">已答 / 正确率</div>
            <div class="mt-2 text-3xl font-bold text-slate-950">{{ summary.answeredCount }}</div>
            <div class="mt-2 text-sm text-slate-500">正确率 {{ accuracy }}%</div>
          </div>
          <div class="rounded-xl border border-rose-100 bg-rose-50 p-4">
            <div class="text-xs font-medium text-rose-500">错题待处理</div>
            <div class="mt-2 text-3xl font-bold text-rose-600">{{ summary.wrongCount }}</div>
            <div class="mt-2 text-sm text-rose-500">今日新增 {{ summary.todayWrongCount || 0 }} 道</div>
          </div>
        </div>

        <div class="mt-6 flex flex-wrap gap-3">
          <button class="craft-btn craft-btn-primary" @click="router.push('/practice')">
            {{ studyStore.currentSessionId ? '继续练习' : '开始练习' }}
          </button>
          <button class="craft-btn craft-btn-soft" @click="startPractice">新开一组题</button>
          <button class="craft-btn craft-btn-soft" @click="router.push('/review')">看复盘</button>
        </div>
      </div>

      <div class="craft-panel p-5 sm:p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-bold text-slate-950">下一步</h2>
            <p class="mt-1 text-sm text-slate-500">按学习闭环排序</p>
          </div>
          <div class="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">{{ sessionMinutes }} 分钟</div>
        </div>

        <div class="mt-5 grid gap-3">
          <button
            v-for="item in nextActions"
            :key="item.title"
            class="group flex items-center justify-between gap-4 rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
            :class="item.primary ? 'border-teal-200 bg-teal-50/70' : 'border-slate-200 bg-white'"
            @click="item.action"
          >
            <span>
              <span class="block font-semibold text-slate-950">{{ item.title }}</span>
              <span class="mt-1 block text-sm text-slate-500">{{ item.note }}</span>
            </span>
            <span class="text-lg text-slate-400 transition group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>
    </section>

    <section class="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <div class="craft-panel p-5 sm:p-6">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-slate-950">科目上下文</h2>
            <p class="mt-1 text-sm text-slate-500">切换后练习页会沿用当前选择</p>
          </div>
          <div v-if="loading" class="text-sm text-slate-400">加载中...</div>
        </div>
        <div class="mt-5 flex flex-wrap gap-2">
          <button
            v-for="subject in subjects"
            :key="subject.subjectCode"
            class="rounded-lg border px-4 py-2 text-sm font-semibold transition"
            :class="studyStore.selectedSubjectCode === subject.subjectCode ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50'"
            @click="setSelectedSubjectCode(subject.subjectCode)"
          >
            {{ subject.shortName || subject.subjectName }}
          </button>
        </div>

        <div v-if="error" class="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-600">{{ error }}</div>
      </div>

      <div class="craft-panel p-5 sm:p-6">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-slate-950">功能入口</h2>
            <p class="mt-1 text-sm text-slate-500">保留全部核心功能，但用统一入口承载</p>
          </div>
        </div>
        <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <button
            v-for="item in featureEntries"
            :key="item.title"
            class="flex min-h-[96px] items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg"
            @click="router.push(item.path)"
          >
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-900 text-sm font-bold text-white">{{ item.mark }}</span>
            <span>
              <span class="block font-semibold text-slate-950">{{ item.title }}</span>
              <span class="mt-1 block text-sm leading-6 text-slate-500">{{ item.note }}</span>
            </span>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
