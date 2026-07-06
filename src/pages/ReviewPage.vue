<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SectionBlock from '../components/SectionBlock.vue'
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
  <div class="space-y-8">
    <section class="craft-card-solid rounded-[2rem] p-6 sm:p-8">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="section-title">本次练习情况</div>
          <div class="section-subtitle mt-1">当前账号：{{ authStore.user?.nickname || authStore.user?.mobile || '未登录' }}</div>
        </div>
        <div class="flex flex-wrap gap-3">
          <button class="craft-btn craft-btn-soft" @click="router.push('/practice')">返回练习</button>
          <button v-if="hasWrongQuestions" class="craft-btn craft-btn-primary" @click="retryWrongQuestions">重做本次错题</button>
          <button
            v-if="hasWrongQuestions"
            class="craft-btn craft-btn-soft"
            @click="showWrongDetails = !showWrongDetails"
          >
            {{ showWrongDetails ? '收起错题详情' : '查看本次错题' }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="mt-6 rounded-[1.5rem] bg-slate-50 p-5 text-sm text-slate-500">正在加载复盘数据...</div>
      <div v-else-if="error" class="mt-6 rounded-[1.5rem] bg-rose-50 p-5 text-sm text-rose-600">{{ error }}</div>
      <div v-else>
        <div class="mt-6 grid gap-4 md:grid-cols-4">
          <StatCard label="本次正确率" :value="`${accuracy}%`" tone="orange" />
          <StatCard label="练习时长" :value="formatSessionTime(review.durationSeconds || summary.sessionSeconds)" tone="slate" />
          <StatCard label="本次错题" :value="wrongCount" tone="rose" />
          <StatCard label="本次答题数" :value="answeredCount" tone="sky" />
        </div>

        <div class="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div class="rounded-[1.5rem] bg-slate-50 p-5">
            <div class="flex items-center justify-between text-sm text-slate-500">
              <span>全局进度</span>
              <span>{{ progress }}%</span>
            </div>
            <div class="mt-4 h-3 overflow-hidden rounded-full bg-white">
              <div class="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400" :style="{ width: `${progress}%` }" />
            </div>
            <div class="mt-3 text-sm text-slate-500">练习数据已经落库，可以继续复盘、重做错题或进入错题本。</div>
          </div>
          <div class="rounded-[1.5rem] bg-slate-50 p-5">
            <div class="text-sm font-medium text-slate-500">当前练习会话</div>
            <div class="mt-2 text-lg font-semibold text-slate-900">{{ studyStore.currentSessionId || '暂无' }}</div>
            <div class="mt-2 text-sm text-slate-500">
              {{ hasWrongQuestions ? `本次共有 ${wrongCount} 道错题，可直接重做或查看解析。` : '本次没有错题，保持这个状态很可以。' }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <SectionBlock title="薄弱点">
      <div v-if="review.weakPoints.length" class="flex flex-wrap gap-3">
        <span
          v-for="point in review.weakPoints"
          :key="point"
          class="rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700"
        >
          {{ point }}
        </span>
      </div>
      <div v-else class="rounded-[1.25rem] bg-slate-50 p-4 text-sm text-slate-500">本次暂无明显薄弱点标签。</div>
    </SectionBlock>

    <SectionBlock title="科目统计">
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div v-for="item in review.subjectStats" :key="item.subjectCode" class="craft-card-solid rounded-[1.25rem] p-4">
          <div class="text-sm text-slate-500">{{ item.subjectName }}</div>
          <div class="mt-3 flex items-end justify-between">
            <div class="text-2xl font-semibold text-slate-900">{{ item.correctCount }}</div>
            <div class="text-sm text-slate-400">正确 / {{ item.wrongCount }} 错误</div>
          </div>
        </div>
      </div>
    </SectionBlock>

    <SectionBlock title="本次错题回顾">
      <div v-if="!hasWrongQuestions" class="rounded-[1.5rem] bg-emerald-50 p-5 text-sm text-emerald-700">
        本次练习没有错题，可以直接开始新一轮刷题。
      </div>

      <div v-else-if="!showWrongDetails" class="rounded-[1.5rem] bg-slate-50 p-5 text-sm text-slate-600">
        已记录 {{ review.wrongQuestionIds.length }} 道错题。你可以选择“重做本次错题”，或者点“查看本次错题”进入逐题回顾。
      </div>

      <div v-else class="grid gap-4">
        <article
          v-for="question in review.wrongQuestions"
          :key="`${studyStore.currentSessionId}-${question.questionId}`"
          class="craft-card-solid rounded-[1.5rem] p-5"
        >
          <div class="flex flex-wrap items-center gap-3">
            <span class="craft-pill bg-rose-50 text-rose-600">错题 {{ question.orderNo }}</span>
            <span class="craft-pill bg-sky-50 text-sky-700">{{ question.questionType }}</span>
            <span class="text-sm text-slate-500">{{ question.subjectName }}</span>
          </div>
          <h2 class="mt-4 text-xl font-semibold text-slate-900">{{ question.title }}</h2>
          <p class="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-500">{{ question.stem }}</p>

          <a
            v-if="question.stemImageUrl"
            :href="question.stemImageUrl"
            target="_blank"
            rel="noreferrer"
            class="mt-5 block overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-3"
          >
            <img :src="question.stemImageUrl" alt="题目配图" class="max-h-[420px] w-full rounded-[1rem] object-contain" />
          </a>

          <div v-if="question.questionType !== 'essay'" class="mt-6 space-y-3">
            <div
              v-for="option in question.options"
              :key="option.key"
              class="flex items-center gap-4 rounded-[1.25rem] border px-4 py-4 text-left"
              :class="optionClass(question, option.key)"
            >
              <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-sm font-semibold shadow-sm">
                {{ option.key }}
              </div>
              <div class="text-base">{{ option.text }}</div>
            </div>
          </div>

          <div v-else class="mt-6 space-y-3">
            <div
              v-for="(step, index) in question.steps"
              :key="`${question.questionId}-${index}`"
              class="rounded-[1.25rem] border border-slate-200 bg-white p-4"
            >
              <div class="text-sm font-semibold text-slate-900">步骤 {{ index + 1 }}</div>
              <p class="mt-2 text-sm leading-6 text-slate-600">{{ step }}</p>
              <div class="mt-2 text-xs text-slate-400">你的完成情况：{{ question.stepStatus[index] ? '已完成' : '未完成' }}</div>
            </div>
          </div>

          <div class="mt-6 rounded-[1.5rem] bg-slate-50 p-5 text-sm leading-7 text-slate-700">
            <div>你的答案：{{ answerText(question.userAnswer) }}</div>
            <div class="mt-2">正确答案：{{ answerText(question.correctAnswer) }}</div>
            <div class="mt-3 whitespace-pre-wrap">答案解析：{{ question.analysis || '暂无解析' }}</div>
          </div>
        </article>
      </div>
    </SectionBlock>
  </div>
</template>
