<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import StatCard from '../components/StatCard.vue'
import { getPracticeReview } from '../api/practice'
import { getStudySummary } from '../api/users'
import { ApiError } from '../api/errors'
import { authStore } from '../stores/auth'
import { clearPracticeSession, setPendingPracticeRequest, studyStore } from '../stores/study'

const router = useRouter()

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
const review = ref({
  accuracy: 0,
  durationSeconds: 0,
  answeredCount: 0,
  wrongCount: 0,
  wrongQuestionIds: [],
  wrongQuestions: [],
  weakPoints: [],
  subjectStats: [],
})
const loading = ref(true)
const error = ref('')
const showWrongDetails = ref(false)

const accuracy = computed(() => review.value.accuracy || 0)
const wrongCount = computed(() => review.value.wrongCount || summary.value.wrongCount || 0)
const answeredCount = computed(() => review.value.answeredCount || summary.value.answeredCount || 0)
const progress = computed(() => summary.value.progressRate || 0)
const hasWrongQuestions = computed(() => (review.value.wrongQuestionIds || []).length > 0)
const outcomeText = computed(() => {
  if (loading.value) {
    return '正在读取本次练习结果'
  }
  if (!answeredCount.value) {
    return '还没有可复盘的练习记录'
  }
  if (!hasWrongQuestions.value) {
    return '本次没有错题，可以继续扩大题量'
  }
  return `本次沉淀 ${wrongCount.value} 道错题，建议先重做再开新题`
})
const weakPointList = computed(() => review.value.weakPoints || [])

function formatSessionTime(totalSeconds) {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0
  const hours = Math.floor(safe / 3600)
  const minutes = String(Math.floor((safe % 3600) / 60)).padStart(2, '0')
  const seconds = String(safe % 60).padStart(2, '0')
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${Math.floor(safe / 60)}:${seconds}`
}

function answerText(answerList) {
  return (answerList || []).join(' / ') || '暂无'
}

function optionClass(question, optionKey) {
  const selected = (question.userAnswer || []).includes(optionKey)
  const correct = (question.correctAnswer || []).includes(optionKey)
  if (correct) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  if (selected) {
    return 'border-rose-200 bg-rose-50 text-rose-600'
  }
  return 'border-slate-200 bg-white text-slate-700'
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    summary.value = await getStudySummary()
    if (studyStore.currentSessionId) {
      review.value = await getPracticeReview(studyStore.currentSessionId)
    }
  } catch (loadError) {
    error.value = loadError instanceof ApiError ? loadError.message : '练习复盘加载失败'
  } finally {
    loading.value = false
  }
}

function retryWrongQuestions() {
  const wrongIds = review.value.wrongQuestionIds || []
  if (!wrongIds.length) {
    return
  }

  const firstWrong = review.value.wrongQuestions?.[0]
  setPendingPracticeRequest({
    mode: 'sequence',
    subjectCode: firstWrong?.subjectCode || studyStore.selectedSubjectCode,
    questionIds: wrongIds,
    limit: wrongIds.length,
    source: 'practice-review-wrong-retry',
    title: '重做本次错题',
  })
  clearPracticeSession()
  studyStore.practiceMode = 'sequence'
  router.push('/practice')
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-5">
    <section class="craft-panel p-5 sm:p-6 lg:p-7">
      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div class="text-sm font-semibold text-teal-700">练习复盘</div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">{{ outcomeText }}</h1>
          <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            当前账号：{{ authStore.user?.nickname || authStore.user?.email || authStore.user?.mobile || '未登录' }}。复盘页优先帮助你决定下一步，而不是只展示统计数字。
          </p>

          <div class="mt-6 flex flex-wrap gap-3">
            <button v-if="hasWrongQuestions" class="craft-btn craft-btn-primary" @click="retryWrongQuestions">重做本次错题</button>
            <button class="craft-btn craft-btn-soft" @click="router.push('/mistakes')">进入错题本</button>
            <button class="craft-btn craft-btn-soft" @click="router.push('/practice')">继续练习</button>
            <button
              v-if="hasWrongQuestions"
              class="craft-btn craft-btn-soft"
              @click="showWrongDetails = !showWrongDetails"
            >
              {{ showWrongDetails ? '收起错题详情' : '查看错题详情' }}
            </button>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div class="flex items-center justify-between text-sm text-slate-500">
            <span>全局进度</span>
            <span>{{ progress }}%</span>
          </div>
          <div class="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div class="h-full rounded-full bg-teal-600" :style="{ width: `${Math.min(progress, 100)}%` }" />
          </div>
          <div class="mt-4 rounded-lg bg-white p-3 text-xs leading-6 text-slate-500">
            会话：{{ studyStore.currentSessionId || '暂无' }}
          </div>
        </div>
      </div>

      <div v-if="loading" class="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">正在加载复盘数据...</div>
      <div v-else-if="error" class="mt-6 rounded-xl bg-rose-50 p-5 text-sm text-rose-600">{{ error }}</div>
      <div v-else class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="本次正确率" :value="`${accuracy}%`" tone="orange" />
        <StatCard label="练习时长" :value="formatSessionTime(review.durationSeconds || summary.sessionSeconds)" tone="slate" />
        <StatCard label="本次错题" :value="wrongCount" tone="rose" />
        <StatCard label="本次答题数" :value="answeredCount" tone="sky" />
      </div>
    </section>

    <section class="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <div class="craft-panel p-5 sm:p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-slate-950">薄弱点</h2>
            <p class="mt-1 text-sm text-slate-500">用于后续错题重做和专题训练</p>
          </div>
        </div>
        <div v-if="weakPointList.length" class="mt-5 flex flex-wrap gap-2">
          <span
            v-for="point in weakPointList"
            :key="point"
            class="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700"
          >
            {{ point }}
          </span>
        </div>
        <div v-else class="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">本次暂无明显薄弱点标签。</div>
      </div>

      <div class="craft-panel p-5 sm:p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-slate-950">科目统计</h2>
            <p class="mt-1 text-sm text-slate-500">看哪个科目拖慢了本次正确率</p>
          </div>
        </div>
        <div v-if="review.subjectStats.length" class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div v-for="item in review.subjectStats" :key="item.subjectCode" class="rounded-xl border border-slate-200 bg-white p-4">
            <div class="text-sm font-semibold text-slate-950">{{ item.subjectName }}</div>
            <div class="mt-3 flex items-end justify-between gap-3">
              <div class="text-2xl font-bold text-teal-700">{{ item.correctCount }}</div>
              <div class="text-sm text-slate-400">{{ item.wrongCount }} 错误</div>
            </div>
          </div>
        </div>
        <div v-else class="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">暂无科目统计。</div>
      </div>
    </section>

    <section class="craft-panel p-5 sm:p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-950">本次错题回顾</h2>
          <p class="mt-1 text-sm text-slate-500">错题详情默认收起，主动作始终保留在顶部</p>
        </div>
        <button v-if="hasWrongQuestions" class="craft-btn craft-btn-primary px-4 py-2" @click="retryWrongQuestions">重做本次错题</button>
      </div>

      <div v-if="!hasWrongQuestions" class="mt-5 rounded-xl bg-emerald-50 p-5 text-sm text-emerald-700">
        本次练习没有错题，可以直接开始新一轮刷题。
      </div>

      <div v-else-if="!showWrongDetails" class="mt-5 rounded-xl bg-slate-50 p-5 text-sm leading-7 text-slate-600">
        已记录 {{ review.wrongQuestionIds.length }} 道错题。建议先点击“重做本次错题”，如果需要确认原因，再展开错题详情逐题回看。
      </div>

      <div v-else class="mt-5 grid gap-4">
        <article
          v-for="question in review.wrongQuestions"
          :key="`${studyStore.currentSessionId}-${question.questionId}`"
          class="rounded-xl border border-slate-200 bg-white p-5"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">错题 {{ question.orderNo }}</span>
            <span class="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">{{ question.questionType }}</span>
            <span class="text-sm text-slate-500">{{ question.subjectName }}</span>
          </div>
          <h3 class="mt-4 text-xl font-bold text-slate-950">{{ question.title }}</h3>
          <p class="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{{ question.stem }}</p>

          <a
            v-if="question.stemImageUrl"
            :href="question.stemImageUrl"
            target="_blank"
            rel="noreferrer"
            class="mt-5 block overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <img :src="question.stemImageUrl" alt="题目配图" class="max-h-[420px] w-full rounded-lg object-contain" />
          </a>

          <div v-if="question.questionType !== 'essay'" class="mt-5 space-y-3">
            <div
              v-for="option in question.options"
              :key="option.key"
              class="flex items-start gap-4 rounded-xl border px-4 py-4 text-left"
              :class="optionClass(question, option.key)"
            >
              <div class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-sm font-bold shadow-sm">
                {{ option.key }}
              </div>
              <div class="text-base leading-7">{{ option.text }}</div>
            </div>
          </div>

          <div v-else class="mt-5 space-y-3">
            <div
              v-for="(step, index) in question.steps"
              :key="`${question.questionId}-${index}`"
              class="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div class="text-sm font-bold text-slate-950">步骤 {{ index + 1 }}</div>
              <p class="mt-2 text-sm leading-7 text-slate-600">{{ step }}</p>
              <div class="mt-2 text-xs text-slate-400">你的完成情况：{{ question.stepStatus[index] ? '已完成' : '未完成' }}</div>
            </div>
          </div>

          <div class="mt-5 rounded-xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
            <div>你的答案：{{ answerText(question.userAnswer) }}</div>
            <div class="mt-2">正确答案：{{ answerText(question.correctAnswer) }}</div>
            <div class="mt-3 whitespace-pre-wrap">答案解析：{{ question.analysis || '暂无解析' }}</div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
