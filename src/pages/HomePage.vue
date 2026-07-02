<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SectionBlock from '../components/SectionBlock.vue'
import StatCard from '../components/StatCard.vue'
import { featureCards, sprintShortcuts } from '../data/ai408'
import { getSubjects } from '../api/questions'
import { getStudySummary } from '../api/users'
import { authStore } from '../stores/auth'
import { setSelectedSubjectCode, studyStore } from '../stores/study'

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
  router.push('/practice')
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-8">
    <section class="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div class="craft-card overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div class="flex flex-col gap-6">
          <div class="flex flex-wrap items-center gap-3">
            <div class="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">真实 API</div>
            <div class="text-sm text-slate-500">欢迎，{{ authStore.user?.nickname || authStore.user?.mobile || '同学' }}</div>
          </div>

          <div class="grid gap-4">
            <div class="flex items-center gap-3">
              <div class="hidden rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white sm:block">
                {{ activeSubject?.subjectName || '加载中' }}
              </div>
            </div>
            <h1 class="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">开始刷题，AI 负责讲解</h1>
            <p class="max-w-2xl text-base leading-8 text-slate-600">
              登录后进入随机练习、错题本和收藏页，题库数据来自后端 MySQL，讲解走 Qwen 流式输出。
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <button class="craft-btn craft-btn-primary" @click="startPractice">立即开始练习</button>
            <button class="craft-btn craft-btn-soft" @click="router.push('/review')">查看本次复盘</button>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-[1.5rem] bg-slate-50 p-5">
              <div class="text-sm text-slate-500">本次进度</div>
              <div class="mt-2 text-3xl font-semibold text-slate-900">{{ summary.progressRate }}%</div>
              <div class="mt-2 text-sm text-slate-500">已答 {{ summary.answeredCount }} 题</div>
            </div>
            <div class="rounded-[1.5rem] bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
              <div class="text-sm text-white/70">当前科目</div>
              <div class="mt-2 text-3xl font-semibold">{{ activeSubject?.subjectName || '待加载' }}</div>
              <div class="mt-2 text-sm text-white/75">总题数 {{ activeSubject?.totalCount || 0 }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="craft-card-solid rounded-[2rem] p-6 sm:p-8">
        <div class="flex items-center justify-between">
          <div>
            <div class="section-title">科目入口</div>
            <div class="section-subtitle mt-1">切换题库科目后，练习页会沿用当前选择。</div>
          </div>
        </div>

        <div class="mt-5 space-y-4">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="subject in subjects"
              :key="subject.subjectCode"
              class="rounded-full border px-4 py-2 text-sm font-medium transition"
              :class="studyStore.selectedSubjectCode === subject.subjectCode ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'"
              @click="setSelectedSubjectCode(subject.subjectCode)"
            >
              {{ subject.shortName || subject.subjectName }}
            </button>
          </div>

          <div class="grid gap-4">
            <StatCard label="总题数" :value="activeSubject?.totalCount || 0" tone="sky" />
            <StatCard label="已答题" :value="summary.answeredCount" tone="emerald" />
            <StatCard label="错题数" :value="summary.wrongCount" tone="rose" />
          </div>
        </div>
      </div>
    </section>

    <SectionBlock title="快速入口">
      <div class="grid gap-4 xl:grid-cols-[1fr_380px_1fr]">
        <div class="grid place-items-center gap-5 rounded-[2rem] p-6 craft-card-solid">
          <button class="grid h-40 w-40 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 text-center text-white shadow-[0_24px_50px_rgba(14,165,233,0.25)] transition hover:scale-[1.02]" @click="router.push('/practice')">
            <div class="text-base font-medium">顺序练习</div>
            <div class="mt-2 text-3xl font-semibold">{{ summary.answeredCount }}</div>
          </button>
          <button class="grid h-40 w-40 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-center text-white shadow-[0_24px_50px_rgba(20,184,166,0.2)] transition hover:scale-[1.02]" @click="router.push('/admin/import')">
            <div class="text-base font-medium">题库导入</div>
            <div class="mt-2 text-xl font-semibold">管理员</div>
          </button>
        </div>

        <div class="soft-grid grid-cols-2 md:grid-cols-3 xl:grid-cols-1">
          <button
            v-for="item in featureCards.slice(0, 3)"
            :key="item.title"
            class="group craft-card-solid rounded-[1.5rem] p-4 text-left transition hover:-translate-y-1 hover:shadow-xl"
            @click="router.push(item.href)"
          >
            <div class="flex items-center gap-3">
              <div :class="`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${item.accent} text-lg font-bold text-white`">
                {{ item.emoji }}
              </div>
              <div>
                <div class="font-semibold text-slate-900">{{ item.title }}</div>
                <div class="text-sm text-slate-500">{{ item.note }}</div>
              </div>
            </div>
          </button>
        </div>

        <div class="soft-grid grid-cols-2 md:grid-cols-3 xl:grid-cols-1">
          <button
            v-for="item in featureCards.slice(3)"
            :key="item.title"
            class="group craft-card-solid rounded-[1.5rem] p-4 text-left transition hover:-translate-y-1 hover:shadow-xl"
            @click="router.push(item.href)"
          >
            <div class="flex items-center gap-3">
              <div :class="`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${item.accent} text-lg font-bold text-white`">
                {{ item.emoji }}
              </div>
              <div>
                <div class="font-semibold text-slate-900">{{ item.title }}</div>
                <div class="text-sm text-slate-500">{{ item.note }}</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </SectionBlock>

    <SectionBlock v-if="error" title="加载提示">
      <div class="rounded-[1.5rem] bg-rose-50 p-4 text-sm text-rose-600">{{ error }}</div>
    </SectionBlock>

    <SectionBlock title="快捷操作">
      <div class="grid gap-4 md:grid-cols-3">
        <button
          v-for="item in sprintShortcuts"
          :key="item.title"
          class="craft-card-solid rounded-[1.5rem] p-5 text-left transition hover:-translate-y-1"
          @click="router.push(item.href)"
        >
          <div class="text-lg font-semibold text-slate-900">{{ item.title }}</div>
          <p class="mt-2 text-sm leading-6 text-slate-500">{{ item.note }}</p>
        </button>
      </div>
    </SectionBlock>
  </div>
</template>
