<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getSubjects, getQuestionDetail } from '../api/questions'
import { createPracticeSession, finishPracticeSession, getPracticeSession, submitPracticeAnswer, updateEssaySteps } from '../api/practice'
import { streamExplanation } from '../api/ai'
import { ApiError } from '../api/errors'
import { authStore } from '../stores/auth'
import {
  clearPendingPracticeRequest,
  clearPracticeSession,
  setPendingPracticeRequest,
  setPracticeSession,
  setSelectedSubjectCode,
  studyStore,
} from '../stores/study'

const router = useRouter()

const subjects = ref([])
const session = ref(null)
const currentQuestionDetail = ref(null)
const loading = ref(true)
const error = ref('')
const aiText = ref('')
const aiLoading = ref(false)
const aiError = ref('')
const answerSubmitting = ref(false)
const answerError = ref('')
const practiceMode = ref(studyStore.practiceMode === 'memorize' ? 'memorize' : 'sequence')
const answerCache = ref({})
const resultCache = ref({})
const essayStepCache = ref({})

const currentQuestionBriefList = computed(() => session.value?.questionBriefList || [])
const currentQuestionId = computed(() => {
  if (studyStore.currentQuestionId) {
    return studyStore.currentQuestionId
  }
  return session.value?.currentQuestionId || ''
})
const currentQuestion = computed(() => currentQuestionDetail.value || null)
const currentQuestionImageUrl = computed(() => currentQuestion.value?.stemImageUrl || '')
const currentBrief = computed(() => currentQuestionBriefList.value.find((item) => item.questionId === currentQuestionId.value) || null)
const currentIndex = computed(() => currentQuestionBriefList.value.findIndex((item) => item.questionId === currentQuestionId.value))
const selectedAnswers = computed(() => answerCache.value[currentQuestionId.value] || [])
const currentResult = computed(() => resultCache.value[currentQuestionId.value] || null)
const currentEssaySteps = computed(() => essayStepCache.value[currentQuestionId.value] || [])
const reviewAnswer = computed(() => currentQuestion.value?.answer || currentResult.value?.correctAnswer || [])
const reviewAnalysis = computed(() => currentQuestion.value?.analysis || currentResult.value?.analysis || '')
const isMemorizeMode = computed(() => practiceMode.value === 'memorize')
const isCurrentAnswered = computed(() =>
  currentBrief.value?.questionStatus === 'correct'
  || currentBrief.value?.questionStatus === 'wrong'
  || Boolean(currentResult.value)
)
const shouldShowReview = computed(() => isMemorizeMode.value || isCurrentAnswered.value || Boolean(currentResult.value))
const previousQuestionId = computed(() => (currentIndex.value > 0 ? currentQuestionBriefList.value[currentIndex.value - 1]?.questionId || '' : ''))
const nextQuestionId = computed(() =>
  currentIndex.value >= 0 && currentIndex.value < currentQuestionBriefList.value.length - 1
    ? currentQuestionBriefList.value[currentIndex.value + 1]?.questionId || ''
    : ''
)
const currentUserAnswerText = computed(() => {
  if (!currentQuestion.value) {
    return '暂无'
  }
  if (currentQuestion.value.questionType === 'essay') {
    const steps = currentEssaySteps.value
    if (!steps.length) {
      return '暂无'
    }
    return `已完成 ${steps.filter(Boolean).length}/${steps.length} 步`
  }
  return answerText(selectedAnswers.value)
})
const answeredCount = computed(() =>
  currentQuestionBriefList.value.filter((item) => ['correct', 'wrong'].includes(item.questionStatus)).length
)
const correctCount = computed(() => currentQuestionBriefList.value.filter((item) => item.questionStatus === 'correct').length)
const wrongCount = computed(() => currentQuestionBriefList.value.filter((item) => item.questionStatus === 'wrong').length)
const progressPercent = computed(() => {
  const total = currentQuestionBriefList.value.length
  return total ? Math.round((answeredCount.value / total) * 100) : 0
})
const modeLabel = computed(() => (isMemorizeMode.value ? '背题模式' : '刷题模式'))
const currentQuestionTypeLabel = computed(() => {
  const typeMap = {
    single: '单选',
    multiple: '多选',
    essay: '综合题',
  }
  return typeMap[currentQuestion.value?.questionType] || currentQuestion.value?.questionType || '题目'
})

function resetExplain() {
  aiText.value = ''
  aiError.value = ''
  answerError.value = ''
}

function updateAnswerCache(questionId, answer) {
  answerCache.value = {
    ...answerCache.value,
    [questionId]: [...answer],
  }
}

function updateEssayCache(questionId, steps) {
  essayStepCache.value = {
    ...essayStepCache.value,
    [questionId]: [...steps],
  }
}

function syncQuestionCaches(questionId, detail, brief) {
  if (!questionId || !detail || !brief) {
    return
  }

  if (!answerCache.value[questionId]) {
    updateAnswerCache(questionId, [])
  }

  if (detail.questionType === 'essay' && !essayStepCache.value[questionId]) {
    updateEssayCache(questionId, (detail.steps || []).map(() => false))
  }

  if (['correct', 'wrong'].includes(brief.questionStatus)) {
    resultCache.value = {
      ...resultCache.value,
      [questionId]: {
        questionStatus: brief.questionStatus,
        isCorrect: brief.questionStatus === 'correct',
        correctAnswer: detail.answer || [],
        analysis: detail.analysis || '',
      },
    }
  }
}

async function loadSubjects() {
  subjects.value = (await getSubjects()) || []
  if (subjects.value.length && !subjects.value.some((item) => item.subjectCode === studyStore.selectedSubjectCode)) {
    setSelectedSubjectCode(subjects.value[0].subjectCode)
  }
}

async function loadQuestion(questionId) {
  if (!questionId) {
    currentQuestionDetail.value = null
    return
  }

  const brief = currentQuestionBriefList.value.find((item) => item.questionId === questionId)
  const view = isMemorizeMode.value || ['correct', 'wrong'].includes(brief?.questionStatus) ? 'review' : 'practice'
  const detail = await getQuestionDetail(questionId, view, session.value?.sessionId || '')
  currentQuestionDetail.value = detail
  syncQuestionCaches(questionId, detail, brief)
}

function buildDefaultSessionPayload() {
  return {
    mode: 'sequence',
    subjectCode: studyStore.selectedSubjectCode,
    limit: 20,
    source: 'practice-sequence',
    scopeType: 'subject',
    scopeKey: studyStore.selectedSubjectCode,
  }
}

async function resolveSession() {
  const pendingRequest = studyStore.pendingPracticeRequest
  if (pendingRequest) {
    const created = await createPracticeSession({
      mode: pendingRequest.mode || 'sequence',
      subjectCode: pendingRequest.subjectCode || studyStore.selectedSubjectCode,
      questionIds: pendingRequest.questionIds || [],
      limit: pendingRequest.limit || pendingRequest.questionIds?.length || 20,
      source: pendingRequest.source || 'review-wrong-retry',
      scopeType: pendingRequest.scopeType || (pendingRequest.questionIds?.length ? 'custom' : ''),
      scopeKey: pendingRequest.scopeKey || '',
    })
    clearPendingPracticeRequest()
    return created
  }

  if (studyStore.currentSessionId) {
    return getPracticeSession(studyStore.currentSessionId)
  }

  return createPracticeSession(buildDefaultSessionPayload())
}

async function loadOrCreateSession() {
  loading.value = true
  error.value = ''

  try {
    await loadSubjects()
    practiceMode.value = studyStore.practiceMode === 'memorize' ? 'memorize' : 'sequence'
    session.value = await resolveSession()

    const initialQuestionId =
      (studyStore.currentQuestionId && currentQuestionBriefList.value.some((item) => item.questionId === studyStore.currentQuestionId)
        ? studyStore.currentQuestionId
        : session.value.currentQuestionId) ||
      currentQuestionBriefList.value[0]?.questionId ||
      ''

    setPracticeSession(session.value.sessionId, initialQuestionId)
    await loadQuestion(initialQuestionId)
  } catch (loadError) {
    error.value = loadError instanceof ApiError ? loadError.message : '练习会话加载失败'
  } finally {
    loading.value = false
  }
}

async function reloadSession(preferredQuestionId = currentQuestionId.value) {
  if (!studyStore.currentSessionId) {
    return
  }

  session.value = await getPracticeSession(studyStore.currentSessionId)
  const fallbackQuestionId =
    (preferredQuestionId && currentQuestionBriefList.value.some((item) => item.questionId === preferredQuestionId)
      ? preferredQuestionId
      : session.value.currentQuestionId) ||
    currentQuestionBriefList.value[0]?.questionId ||
    ''

  setPracticeSession(session.value.sessionId, fallbackQuestionId)
  await loadQuestion(fallbackQuestionId)
}

async function switchSubject(subjectCode) {
  setSelectedSubjectCode(subjectCode)
  clearPendingPracticeRequest()
  clearPracticeSession()
  answerCache.value = {}
  resultCache.value = {}
  essayStepCache.value = {}
  resetExplain()
  await loadOrCreateSession()
}

async function switchMode(mode) {
  if (practiceMode.value === mode) {
    return
  }

  practiceMode.value = mode
  studyStore.practiceMode = mode
  resetExplain()
  await loadQuestion(currentQuestionId.value)
}

async function goToQuestion(questionId) {
  if (!session.value || !questionId) {
    return
  }

  setPracticeSession(session.value.sessionId, questionId)
  resetExplain()
  await loadQuestion(questionId)
}

async function submitCurrentAnswer(answer) {
  if (!session.value || answerSubmitting.value) {
    return
  }

  const questionId = currentQuestionId.value
  updateAnswerCache(questionId, answer)
  answerSubmitting.value = true
  answerError.value = ''

  try {
    const result = await submitPracticeAnswer(session.value.sessionId, {
      questionId,
      answer,
    })

    resultCache.value = {
      ...resultCache.value,
      [questionId]: {
        questionStatus: result.questionStatus,
        isCorrect: result.isCorrect,
        correctAnswer: result.correctAnswer || [],
        analysis: result.analysis || '',
      },
    }

    await reloadSession(questionId)
    resetExplain()
  } catch (submitError) {
    answerError.value = submitError instanceof ApiError ? submitError.message : '提交答案失败，请重试'
  } finally {
    answerSubmitting.value = false
  }
}

async function chooseSingle(optionKey) {
  if (!currentQuestion.value || isMemorizeMode.value || isCurrentAnswered.value) {
    return
  }

  await submitCurrentAnswer([optionKey])
}

function chooseMultiple(optionKey) {
  if (shouldShowReview.value) {
    return
  }

  const selected = new Set(selectedAnswers.value)
  if (selected.has(optionKey)) {
    selected.delete(optionKey)
  } else {
    selected.add(optionKey)
  }
  updateAnswerCache(currentQuestionId.value, [...selected].sort())
}

async function submitMultiple() {
  if (!currentQuestion.value || isMemorizeMode.value || isCurrentAnswered.value || !selectedAnswers.value.length) {
    return
  }

  await submitCurrentAnswer(selectedAnswers.value)
}

async function toggleEssayStep(index) {
  if (!session.value || isMemorizeMode.value) {
    return
  }

  const nextSteps = [...currentEssaySteps.value]
  nextSteps[index] = !nextSteps[index]
  updateEssayCache(currentQuestionId.value, nextSteps)

  const result = await updateEssaySteps(session.value.sessionId, {
    questionId: currentQuestionId.value,
    steps: nextSteps,
  })

  if (result.questionStatus && result.questionStatus !== 'new') {
    await reloadSession(currentQuestionId.value)
  }
}

function isCorrectOption(optionKey) {
  return reviewAnswer.value.includes(optionKey)
}

function optionClass(optionKey) {
  const selected = selectedAnswers.value.includes(optionKey)
  const correct = isCorrectOption(optionKey)

  if (isMemorizeMode.value) {
    return correct
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-slate-200 bg-white text-slate-700'
  }

  if (shouldShowReview.value) {
    if (correct) {
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    }
    if (selected) {
      return 'border-rose-200 bg-rose-50 text-rose-600'
    }
    return 'border-slate-200 bg-white text-slate-700'
  }

  return selected
    ? 'border-sky-200 bg-sky-50 text-sky-700'
    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
}

function answerText(answerList) {
  return (answerList || []).join(' / ') || '暂无'
}

async function generateAiExplanation() {
  if (!session.value || !currentQuestion.value) {
    return
  }

  aiLoading.value = true
  aiError.value = ''
  aiText.value = ''

  try {
    await streamExplanation(
      {
        sessionId: session.value.sessionId,
        questionId: currentQuestionId.value,
        userAnswer: selectedAnswers.value,
      },
      {
        onDelta(delta) {
          aiText.value += delta
        },
        onError(message) {
          aiError.value = message
        },
      }
    )
  } catch (streamError) {
    aiError.value = streamError instanceof ApiError ? streamError.message : 'AI 讲解失败'
  } finally {
    aiLoading.value = false
  }
}

async function finishSession() {
  if (!session.value) {
    return
  }

  const confirmed = window.confirm('结束练习后将生成本次复盘，是否继续？')
  if (!confirmed) {
    return
  }

  try {
    const result = await finishPracticeSession(session.value.sessionId)
    setPracticeSession(result.sessionId, currentQuestionId.value)
    resetExplain()
    router.push('/review')
  } catch (finishError) {
    error.value = finishError instanceof ApiError ? finishError.message : '结束练习失败'
  }
}

async function retryWrongQuestionsFromCurrentSession() {
  if (!session.value) {
    return
  }

  const wrongIds = currentQuestionBriefList.value
    .filter((item) => item.questionStatus === 'wrong')
    .map((item) => item.questionId)

  if (!wrongIds.length) {
    return
  }

  setPendingPracticeRequest({
    mode: 'sequence',
    subjectCode: session.value.subjectCode || studyStore.selectedSubjectCode,
    questionIds: wrongIds,
    limit: wrongIds.length,
    source: 'practice-wrong-retry',
    title: '重做本次错题',
  })
  clearPracticeSession()
  practiceMode.value = 'sequence'
  studyStore.practiceMode = 'sequence'
  answerCache.value = {}
  resultCache.value = {}
  essayStepCache.value = {}
  resetExplain()
  await loadOrCreateSession()
}

onMounted(loadOrCreateSession)
</script>

<template>
  <div class="space-y-5">
    <section class="craft-panel p-4 sm:p-5">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <div class="segmented">
            <button :class="practiceMode === 'sequence' ? 'active' : 'text-slate-500'" @click="switchMode('sequence')">刷题</button>
            <button :class="practiceMode === 'memorize' ? 'active' : 'text-slate-500'" @click="switchMode('memorize')">背题</button>
          </div>
          <div class="hidden h-8 w-px bg-slate-200 sm:block" />
          <div class="flex flex-wrap gap-2">
            <button
              v-for="subject in subjects"
              :key="subject.subjectCode"
              class="rounded-lg border px-3 py-2 text-sm font-semibold transition"
              :class="studyStore.selectedSubjectCode === subject.subjectCode ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50'"
              @click="switchSubject(subject.subjectCode)"
            >
              {{ subject.shortName || subject.subjectName }}
            </button>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <button class="craft-btn craft-btn-soft px-4 py-2" :disabled="aiLoading || !currentQuestion" @click="generateAiExplanation">
            {{ aiLoading ? '生成中...' : 'AI 讲解' }}
          </button>
          <button class="craft-btn craft-btn-primary px-4 py-2" @click="finishSession">结束并复盘</button>
        </div>
      </div>
    </section>

    <div class="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
      <section class="craft-panel overflow-hidden">
        <div class="border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">{{ modeLabel }}</span>
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{{ currentQuestionTypeLabel }}</span>
                <span v-if="currentQuestion?.newType" class="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">新题型</span>
              </div>
              <div class="mt-2 text-sm text-slate-500">
                第 {{ currentIndex + 1 > 0 ? currentIndex + 1 : 0 }} / {{ currentQuestionBriefList.length || 0 }} 题
                <span v-if="currentQuestion?.subjectName"> · {{ currentQuestion.subjectName }}</span>
                <span v-if="session?.scopeName"> · {{ session.scopeName }}</span>
              </div>
            </div>
            <div class="min-w-[180px] text-sm text-slate-500">
              <div class="flex justify-between">
                <span>完成度</span>
                <span>{{ progressPercent }}%</span>
              </div>
              <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-teal-600" :style="{ width: `${progressPercent}%` }" />
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading" class="p-6 text-sm text-slate-500">正在加载题目...</div>
        <div v-else-if="error" class="m-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-600">{{ error }}</div>
        <div v-else-if="currentQuestion" class="p-5 sm:p-6">
          <h1 class="text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">{{ currentQuestion.title }}</h1>
          <p class="mt-4 whitespace-pre-wrap text-base leading-8 text-slate-700">{{ currentQuestion.stem }}</p>

          <a
            v-if="currentQuestionImageUrl"
            :href="currentQuestionImageUrl"
            target="_blank"
            rel="noreferrer"
            class="mt-5 block overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <img :src="currentQuestionImageUrl" alt="题目配图" class="max-h-[420px] w-full rounded-lg object-contain" />
          </a>

          <div v-if="currentQuestion.questionType === 'single'" class="mt-6 space-y-3">
            <button
              v-for="option in currentQuestion.options"
              :key="option.key"
              class="flex w-full items-start gap-4 rounded-xl border px-4 py-4 text-left transition"
              :class="optionClass(option.key)"
              :disabled="answerSubmitting || shouldShowReview"
              @click="chooseSingle(option.key)"
            >
              <div class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-sm font-bold shadow-sm">
                {{ option.key }}
              </div>
              <div class="flex min-w-0 flex-1 items-start justify-between gap-3">
                <div class="text-base leading-7">{{ option.text }}</div>
                <span
                  v-if="isMemorizeMode && isCorrectOption(option.key)"
                  class="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                >
                  正确答案
                </span>
              </div>
            </button>
          </div>

          <div v-else-if="currentQuestion.questionType === 'multiple'" class="mt-6 space-y-3">
            <button
              v-for="option in currentQuestion.options"
              :key="option.key"
              class="flex w-full items-start gap-4 rounded-xl border px-4 py-4 text-left transition"
              :class="optionClass(option.key)"
              :disabled="answerSubmitting || shouldShowReview"
              @click="chooseMultiple(option.key)"
            >
              <div class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-sm font-bold shadow-sm">
                {{ option.key }}
              </div>
              <div class="flex min-w-0 flex-1 items-start justify-between gap-3">
                <div class="text-base leading-7">{{ option.text }}</div>
                <span
                  v-if="isMemorizeMode && isCorrectOption(option.key)"
                  class="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                >
                  正确答案
                </span>
              </div>
            </button>
            <button v-if="!shouldShowReview" class="craft-btn craft-btn-primary mt-2" :disabled="answerSubmitting || !selectedAnswers.length" @click="submitMultiple">
              提交答案
            </button>
          </div>

          <div v-else class="mt-6 space-y-3">
            <div
              v-for="(step, index) in currentQuestion.steps"
              :key="`${currentQuestion.id}-${index}`"
              class="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <div class="text-sm font-bold text-slate-950">步骤 {{ index + 1 }}</div>
                  <p class="mt-2 text-sm leading-7 text-slate-600">{{ step }}</p>
                </div>
                <button
                  v-if="!isMemorizeMode"
                  class="craft-btn craft-btn-soft shrink-0 px-4 py-2 text-sm"
                  @click="toggleEssayStep(index)"
                >
                  {{ currentEssaySteps[index] ? '已完成' : '标记完成' }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="answerError" class="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-600">
            {{ answerError }}
          </div>

          <div v-if="shouldShowReview" class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
            <div class="flex flex-wrap items-center gap-3">
              <div class="text-base font-bold text-slate-950">
                {{ isMemorizeMode ? '背题模式：直接看答案' : currentResult?.isCorrect ? '回答正确' : '回答错误' }}
              </div>
              <span
                v-if="!isMemorizeMode && currentResult"
                class="rounded-full px-3 py-1 text-xs font-semibold"
                :class="currentResult.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'"
              >
                {{ currentResult.isCorrect ? '答对了' : '答错了' }}
              </span>
            </div>
            <div v-if="!isMemorizeMode" class="mt-3">你的答案：{{ currentUserAnswerText }}</div>
            <div class="mt-2">正确答案：{{ answerText(reviewAnswer) }}</div>
            <div class="mt-3 whitespace-pre-wrap">答案解析：{{ reviewAnalysis || '暂无解析' }}</div>
          </div>

          <div v-if="aiLoading || aiText || aiError" class="mt-5 rounded-xl border border-teal-100 bg-teal-50/70 p-5 text-sm leading-7 text-slate-700">
            <div class="mb-2 font-bold text-slate-950">AI 讲解</div>
            <div v-if="aiLoading && !aiText">正在生成...</div>
            <div v-if="aiText" class="whitespace-pre-wrap">{{ aiText }}</div>
            <div v-if="aiError" class="mt-2 text-rose-600">{{ aiError }}</div>
          </div>
        </div>
        <div v-else class="p-5 sm:p-6">
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div class="text-lg font-bold text-slate-950">当前没有可练习的题目</div>
            <p class="mt-2 text-sm leading-7 text-slate-500">
              可能是题库科目还没有题目，或者后端接口暂时不可用。你可以切换科目、返回首页，或让管理员先导入题库。
            </p>
            <div class="mt-4 flex flex-wrap gap-3">
              <button class="craft-btn craft-btn-primary px-4 py-2" @click="router.push('/')">返回工作台</button>
              <button class="craft-btn craft-btn-soft px-4 py-2" @click="router.push('/admin/import')">题库导入</button>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <button class="craft-btn craft-btn-soft px-4 py-2" :disabled="!previousQuestionId" @click="goToQuestion(previousQuestionId)">
            上一题
          </button>
          <div class="text-sm text-slate-500">{{ answeredCount }} 已答 · {{ correctCount }} 正确 · {{ wrongCount }} 错题</div>
          <button class="craft-btn craft-btn-primary px-4 py-2" :disabled="!nextQuestionId" @click="goToQuestion(nextQuestionId)">
            下一题
          </button>
        </div>
      </section>

      <aside class="space-y-5">
        <div class="craft-panel p-5 xl:sticky xl:top-28">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold text-slate-950">题号导航</h2>
              <p class="mt-1 text-sm text-slate-500">点击快速跳题</p>
            </div>
            <div class="text-sm font-semibold text-slate-600">{{ currentQuestionBriefList.length }} 题</div>
          </div>
          <div class="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-10 xl:grid-cols-5">
            <button
              v-for="(question, index) in currentQuestionBriefList"
              :key="question.questionId"
              class="relative grid aspect-square place-items-center rounded-lg border text-sm font-bold transition"
              :class="
                currentQuestionId === question.questionId
                  ? 'border-slate-950 bg-slate-950 text-white'
                  : question.questionStatus === 'correct'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : question.questionStatus === 'wrong'
                      ? 'border-rose-200 bg-rose-50 text-rose-600'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-teal-200 hover:bg-teal-50'
              "
              @click="goToQuestion(question.questionId)"
            >
              {{ index + 1 }}
            </button>
          </div>
        </div>

        <div class="craft-panel p-5">
          <h2 class="text-lg font-bold text-slate-950">练习状态</h2>
          <div class="mt-4 grid gap-3 text-sm">
            <div class="flex justify-between gap-4">
              <span class="text-slate-500">模式</span>
              <span class="font-semibold text-slate-900">{{ modeLabel }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-slate-500">状态</span>
              <span class="font-semibold text-slate-900">{{ session?.status || 'loading' }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-slate-500">用户</span>
              <span class="truncate font-semibold text-slate-900">{{ authStore.user?.nickname || authStore.user?.email || authStore.user?.mobile || '未登录' }}</span>
            </div>
            <div class="rounded-lg bg-slate-50 p-3 text-xs leading-6 text-slate-500">
              会话：{{ session?.sessionId || '未创建' }}
            </div>
          </div>
          <button
            v-if="wrongCount"
            class="craft-btn craft-btn-soft mt-4 w-full"
            @click="retryWrongQuestionsFromCurrentSession"
          >
            重做当前错题
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>
