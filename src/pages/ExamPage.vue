<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { createExamPaper, getExamRecords, submitExamRecord } from '../api/exam'
import { patchQuestionState } from '../api/state'
import { ApiError } from '../api/errors'

const router = useRouter()

const records = ref([])
const loadingHistory = ref(true)
const loadingPaper = ref(false)
const submitting = ref(false)
const activePaper = ref(null)
const currentQuestionId = ref('')
const answerCache = ref({})
const stepCache = ref({})
const remainingSeconds = ref(0)
const message = ref('')
const error = ref('')
let timerId = null

const currentQuestionList = computed(() => activePaper.value?.questions || [])
const currentQuestion = computed(() => currentQuestionList.value.find((item) => item.questionId === currentQuestionId.value) || null)
const currentIndex = computed(() => currentQuestionList.value.findIndex((item) => item.questionId === currentQuestionId.value))
const previousQuestionId = computed(() => currentIndex.value > 0 ? currentQuestionList.value[currentIndex.value - 1]?.questionId || '' : '')
const nextQuestionId = computed(() =>
  currentIndex.value >= 0 && currentIndex.value < currentQuestionList.value.length - 1
    ? currentQuestionList.value[currentIndex.value + 1]?.questionId || ''
    : ''
)
const selectedAnswers = computed(() => answerCache.value[currentQuestionId.value] || [])
const currentSteps = computed(() => stepCache.value[currentQuestionId.value] || [])
const answeredCount = computed(() => currentQuestionList.value.filter((item) => isAnswered(item.questionId, item.questionType)).length)
const hasDraft = computed(() => Boolean(activePaper.value))
const elapsedSeconds = computed(() => activePaper.value ? Math.max(0, activePaper.value.durationSeconds - remainingSeconds.value) : 0)

function formatCountdown(totalSeconds) {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0
  const hours = String(Math.floor(safe / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((safe % 3600) / 60)).padStart(2, '0')
  const seconds = String(safe % 60).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function optionClass(optionKey) {
  return selectedAnswers.value.includes(optionKey)
    ? 'border-sky-200 bg-sky-50 text-sky-700'
    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
}

function questionBadgeClass(questionId) {
  if (questionId === currentQuestionId.value) {
    return 'border-slate-900 bg-slate-900 text-white'
  }
  const question = currentQuestionList.value.find((item) => item.questionId === questionId)
  return isAnswered(questionId, question?.questionType)
    ? 'border-sky-200 bg-sky-50 text-sky-700'
    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
}

function isAnswered(questionId, questionType) {
  if (questionType === 'essay') {
    return (stepCache.value[questionId] || []).some(Boolean)
  }
  return (answerCache.value[questionId] || []).length > 0
}

function resetDraft() {
  activePaper.value = null
  currentQuestionId.value = ''
  answerCache.value = {}
  stepCache.value = {}
  remainingSeconds.value = 0
  stopTimer()
}

function stopTimer() {
  if (timerId) {
    window.clearInterval(timerId)
    timerId = null
  }
}

function startTimer() {
  stopTimer()
  timerId = window.setInterval(() => {
    if (remainingSeconds.value <= 1) {
      remainingSeconds.value = 0
      stopTimer()
      submitExam(true).catch((submitError) => {
        error.value = submitError instanceof ApiError ? submitError.message : '自动交卷失败'
      })
      return
    }
    remainingSeconds.value -= 1
  }, 1000)
}

async function loadRecords() {
  loadingHistory.value = true
  try {
    records.value = await getExamRecords()
  } catch (loadError) {
    error.value = loadError instanceof ApiError ? loadError.message : '考试记录加载失败'
  } finally {
    loadingHistory.value = false
  }
}

async function startExam() {
  loadingPaper.value = true
  error.value = ''
  message.value = ''
  try {
    const paper = await createExamPaper({ limit: 25 })
    activePaper.value = paper
    currentQuestionId.value = paper.currentQuestionId || paper.questions?.[0]?.questionId || ''
    answerCache.value = {}
    stepCache.value = Object.fromEntries(
      (paper.questions || [])
        .filter((item) => item.questionType === 'essay')
        .map((item) => [item.questionId, (item.steps || []).map(() => false)])
    )
    remainingSeconds.value = paper.durationSeconds || 0
    startTimer()
  } catch (startError) {
    error.value = startError instanceof ApiError ? startError.message : '开始考试失败'
  } finally {
    loadingPaper.value = false
  }
}

function chooseSingle(optionKey) {
  answerCache.value = {
    ...answerCache.value,
    [currentQuestionId.value]: [optionKey],
  }
}

function chooseMultiple(optionKey) {
  const selected = new Set(selectedAnswers.value)
  if (selected.has(optionKey)) {
    selected.delete(optionKey)
  } else {
    selected.add(optionKey)
  }
  answerCache.value = {
    ...answerCache.value,
    [currentQuestionId.value]: [...selected].sort(),
  }
}

function toggleEssayStep(index) {
  const next = [...currentSteps.value]
  next[index] = !next[index]
  stepCache.value = {
    ...stepCache.value,
    [currentQuestionId.value]: next,
  }
}

async function toggleFavorite() {
  if (!currentQuestion.value) {
    return
  }
  const nextValue = currentQuestion.value.favoriteImportance > 0 ? 0 : 1
  await patchQuestionState(currentQuestion.value.questionId, { favoriteImportance: nextValue })
  currentQuestion.value.favoriteImportance = nextValue
  message.value = nextValue > 0 ? '已收藏当前题目' : '已取消收藏'
}

function buildSubmitPayload() {
  return {
    questionIds: currentQuestionList.value.map((item) => item.questionId),
    durationSeconds: elapsedSeconds.value,
    answers: currentQuestionList.value.map((item) => ({
      questionId: item.questionId,
      answer: answerCache.value[item.questionId] || [],
      stepStatus: stepCache.value[item.questionId] || [],
    })),
  }
}

async function submitExam(autoSubmit = false) {
  if (!activePaper.value || submitting.value) {
    return
  }
  if (!autoSubmit && !window.confirm('确认交卷后将统一计分并生成考试记录，是否继续？')) {
    return
  }

  submitting.value = true
  error.value = ''
  message.value = ''
  try {
    const record = await submitExamRecord(buildSubmitPayload())
    resetDraft()
    await loadRecords()
    router.push(`/exam/records/${record.recordId}`)
  } catch (submitError) {
    error.value = submitError instanceof ApiError ? submitError.message : '交卷失败'
  } finally {
    submitting.value = false
  }
}

function handleBeforeUnload(event) {
  if (!hasDraft.value || submitting.value) {
    return
  }
  event.preventDefault()
  event.returnValue = ''
}

function goToQuestion(questionId) {
  if (!questionId) {
    return
  }
  currentQuestionId.value = questionId
}

function leaveExam() {
  resetDraft()
}

onBeforeRouteLeave(() => {
  if (!hasDraft.value || submitting.value) {
    return true
  }
  const confirmed = window.confirm('离开考试页将视为弃考，本次作答不会保存。确定离开吗？')
  if (confirmed) {
    leaveExam()
  }
  return confirmed
})

onMounted(() => {
  loadRecords()
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  stopTimer()
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<template>
  <div class="space-y-8">
    <section v-if="!hasDraft" class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div class="craft-card-solid rounded-[2rem] p-6 sm:p-8">
        <div class="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">180 分钟倒计时</div>
        <h1 class="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">模拟考试</h1>
        <p class="mt-4 max-w-2xl text-base leading-8 text-slate-600">
          点击开始后进入 180 分钟考试。你可以在考试中收藏题目，交卷后统一计分，错题会自动加入错题本。中途离开页面视为弃考，本次作答不会保存。
        </p>
        <div class="mt-6 grid gap-4 sm:grid-cols-3">
          <div class="rounded-[1.5rem] bg-slate-50 p-5">
            <div class="text-sm text-slate-500">考试时长</div>
            <div class="mt-2 text-3xl font-semibold text-slate-900">180 min</div>
          </div>
          <div class="rounded-[1.5rem] bg-slate-50 p-5">
            <div class="text-sm text-slate-500">评分方式</div>
            <div class="mt-2 text-3xl font-semibold text-slate-900">统一交卷</div>
          </div>
          <div class="rounded-[1.5rem] bg-slate-50 p-5">
            <div class="text-sm text-slate-500">离开规则</div>
            <div class="mt-2 text-3xl font-semibold text-slate-900">弃考</div>
          </div>
        </div>
        <div class="mt-6 flex flex-wrap gap-3">
          <button class="craft-btn craft-btn-primary px-6 py-3" :disabled="loadingPaper" @click="startExam">
            {{ loadingPaper ? '正在生成试卷...' : '开始考试' }}
          </button>
        </div>
        <div v-if="error" class="mt-4 rounded-[1.25rem] bg-rose-50 p-4 text-sm text-rose-600">{{ error }}</div>
        <div v-if="message" class="mt-4 rounded-[1.25rem] bg-emerald-50 p-4 text-sm text-emerald-700">{{ message }}</div>
      </div>

      <div class="craft-card-solid rounded-[2rem] p-6 sm:p-8">
        <div class="section-title">考试记录</div>
        <div class="section-subtitle mt-1">交卷后会在这里保留成绩和错题回顾入口。</div>
        <div v-if="loadingHistory" class="mt-5 rounded-[1.5rem] bg-slate-50 p-5 text-sm text-slate-500">正在加载记录...</div>
        <div v-else-if="records.length" class="mt-5 space-y-3">
          <button
            v-for="item in records"
            :key="item.recordId"
            class="w-full rounded-[1.5rem] border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
            @click="router.push(`/exam/records/${item.recordId}`)"
          >
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="text-sm font-semibold text-slate-900">考试记录 {{ item.recordId }}</div>
                <div class="mt-1 text-sm text-slate-500">{{ item.submittedAt }}</div>
              </div>
              <div class="text-right">
                <div class="text-2xl font-semibold text-slate-900">{{ item.score }}</div>
                <div class="text-xs text-slate-500">总分 / 百分制</div>
              </div>
            </div>
            <div class="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
              <span>答题 {{ item.answeredCount }}/{{ item.totalCount }}</span>
              <span>正确 {{ item.correctCount }}</span>
              <span>错题 {{ item.wrongCount }}</span>
            </div>
          </button>
        </div>
        <div v-else class="mt-5 rounded-[1.5rem] bg-slate-50 p-5 text-sm text-slate-500">还没有考试记录，开始一次模拟考试吧。</div>
      </div>
    </section>

    <section v-else class="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
      <div class="space-y-6">
        <div class="craft-card-solid rounded-[2rem] p-5 sm:p-6">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div class="text-sm font-medium text-slate-500">模拟考试进行中</div>
              <div class="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{{ formatCountdown(remainingSeconds) }}</div>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <button class="craft-btn craft-btn-soft px-4 py-2" @click="toggleFavorite">
                {{ currentQuestion?.favoriteImportance > 0 ? '取消收藏' : '收藏题目' }}
              </button>
              <button class="craft-btn craft-btn-primary px-4 py-2" :disabled="submitting" @click="submitExam(false)">
                {{ submitting ? '正在交卷...' : '交卷' }}
              </button>
            </div>
          </div>

          <div v-if="currentQuestion" class="mt-6 rounded-[1.5rem] bg-gradient-to-br from-slate-50 to-white p-5">
            <div class="flex flex-wrap items-center gap-3">
              <span class="craft-pill bg-sky-50 text-sky-700">{{ currentQuestion.questionType }}</span>
              <span v-if="currentQuestion.newType" class="craft-pill bg-rose-50 text-rose-600">新题型</span>
              <span class="text-sm text-slate-500">{{ currentQuestion.subjectName }}</span>
            </div>

            <h1 class="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{{ currentQuestion.title }}</h1>
            <p class="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-500">{{ currentQuestion.stem }}</p>

            <a
              v-if="currentQuestion.stemImageUrl"
              :href="currentQuestion.stemImageUrl"
              target="_blank"
              rel="noreferrer"
              class="mt-5 block overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-3"
            >
              <img :src="currentQuestion.stemImageUrl" alt="题目配图" class="max-h-[420px] w-full rounded-[1rem] object-contain" />
            </a>

            <div v-if="currentQuestion.questionType === 'single'" class="mt-6 space-y-3">
              <button
                v-for="option in currentQuestion.options"
                :key="option.key"
                class="flex w-full items-center gap-4 rounded-[1.25rem] border px-4 py-4 text-left transition"
                :class="optionClass(option.key)"
                @click="chooseSingle(option.key)"
              >
                <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-sm font-semibold shadow-sm">
                  {{ option.key }}
                </div>
                <div class="text-base">{{ option.text }}</div>
              </button>
            </div>

            <div v-else-if="currentQuestion.questionType === 'multiple'" class="mt-6 space-y-3">
              <button
                v-for="option in currentQuestion.options"
                :key="option.key"
                class="flex w-full items-center gap-4 rounded-[1.25rem] border px-4 py-4 text-left transition"
                :class="optionClass(option.key)"
                @click="chooseMultiple(option.key)"
              >
                <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-sm font-semibold shadow-sm">
                  {{ option.key }}
                </div>
                <div class="text-base">{{ option.text }}</div>
              </button>
            </div>

            <div v-else class="mt-6 space-y-4">
              <div
                v-for="(step, index) in currentQuestion.steps"
                :key="`${currentQuestion.questionId}-${index}`"
                class="rounded-[1.25rem] border border-slate-200 bg-white p-4"
              >
                <label class="flex items-start gap-4">
                  <input
                    type="checkbox"
                    class="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    :checked="currentSteps[index] || false"
                    @change="toggleEssayStep(index)"
                  />
                  <div>
                    <div class="text-sm font-semibold text-slate-900">步骤 {{ index + 1 }}</div>
                    <p class="mt-2 text-sm leading-6 text-slate-600">{{ step }}</p>
                  </div>
                </label>
              </div>
            </div>

            <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button class="craft-btn craft-btn-soft px-4 py-2" :disabled="!previousQuestionId" @click="goToQuestion(previousQuestionId)">
                上一题
              </button>
              <div class="text-sm text-slate-500">
                第 {{ currentIndex + 1 }} / {{ currentQuestionList.length || 0 }} 题
              </div>
              <button class="craft-btn craft-btn-primary px-4 py-2" :disabled="!nextQuestionId" @click="goToQuestion(nextQuestionId)">
                下一题
              </button>
            </div>
          </div>

          <div v-if="error" class="mt-4 rounded-[1.25rem] bg-rose-50 p-4 text-sm text-rose-600">{{ error }}</div>
          <div v-if="message" class="mt-4 rounded-[1.25rem] bg-emerald-50 p-4 text-sm text-emerald-700">{{ message }}</div>
        </div>
      </div>

      <aside class="space-y-6">
        <div class="craft-card-solid rounded-[2rem] p-5 sm:p-6 xl:sticky xl:top-28">
          <div class="flex items-center justify-between">
            <div class="section-title">答题进度</div>
            <div class="text-sm text-slate-500">{{ answeredCount }} / {{ currentQuestionList.length }}</div>
          </div>
          <div class="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-8 xl:grid-cols-5">
            <button
              v-for="question in currentQuestionList"
              :key="question.questionId"
              class="relative grid aspect-square place-items-center rounded-full border text-sm font-medium transition"
              :class="questionBadgeClass(question.questionId)"
              @click="goToQuestion(question.questionId)"
            >
              {{ question.orderNo }}
            </button>
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>
