<script setup>
import { computed, onMounted, ref } from 'vue'
import { getSubjects, getQuestionDetail } from '../api/questions'
import { createPracticeSession, finishPracticeSession, getPracticeSession, submitPracticeAnswer, updateEssaySteps } from '../api/practice'
import { streamExplanation } from '../api/ai'
import { ApiError } from '../api/errors'
import { authStore } from '../stores/auth'
import { clearPracticeSession, setPracticeSession, setSelectedSubjectCode, studyStore } from '../stores/study'

const subjects = ref([])
const session = ref(null)
const currentQuestionDetail = ref(null)
const loading = ref(true)
const error = ref('')
const aiText = ref('')
const aiLoading = ref(false)
const aiError = ref('')
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
const currentBrief = computed(() => currentQuestionBriefList.value.find((item) => item.questionId === currentQuestionId.value) || null)
const currentIndex = computed(() => currentQuestionBriefList.value.findIndex((item) => item.questionId === currentQuestionId.value))
const selectedAnswers = computed(() => answerCache.value[currentQuestionId.value] || [])
const currentResult = computed(() => resultCache.value[currentQuestionId.value] || null)
const currentEssaySteps = computed(() => essayStepCache.value[currentQuestionId.value] || [])
const reviewAnswer = computed(() => currentQuestion.value?.answer || currentResult.value?.correctAnswer || [])
const reviewAnalysis = computed(() => currentQuestion.value?.analysis || currentResult.value?.analysis || '')
const isMemorizeMode = computed(() => practiceMode.value === 'memorize')
const isCurrentAnswered = computed(() => currentBrief.value?.questionStatus && currentBrief.value.questionStatus !== 'new')
const shouldShowReview = computed(() => isMemorizeMode.value || isCurrentAnswered.value || Boolean(currentResult.value))
const previousQuestionId = computed(() => currentIndex.value > 0 ? currentQuestionBriefList.value[currentIndex.value - 1]?.questionId || '' : '')
const nextQuestionId = computed(() =>
  currentIndex.value >= 0 && currentIndex.value < currentQuestionBriefList.value.length - 1
    ? currentQuestionBriefList.value[currentIndex.value + 1]?.questionId || ''
    : ''
)

function resetExplain() {
  aiText.value = ''
  aiError.value = ''
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

  if (brief.questionStatus && brief.questionStatus !== 'new') {
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
  const view = isMemorizeMode.value || (brief?.questionStatus && brief.questionStatus !== 'new') ? 'review' : 'practice'
  const detail = await getQuestionDetail(questionId, view)
  currentQuestionDetail.value = detail
  syncQuestionCaches(questionId, detail, brief)
}

async function loadOrCreateSession() {
  loading.value = true
  error.value = ''

  try {
    await loadSubjects()
    practiceMode.value = studyStore.practiceMode === 'memorize' ? 'memorize' : 'sequence'

    if (studyStore.currentSessionId) {
      session.value = await getPracticeSession(studyStore.currentSessionId)
    } else {
      session.value = await createPracticeSession({
        mode: 'sequence',
        subjectCode: studyStore.selectedSubjectCode,
        limit: 20,
        source: practiceMode.value,
      })
    }

    const initialQuestionId =
      (studyStore.currentQuestionId && currentQuestionBriefList.value.some((item) => item.questionId === studyStore.currentQuestionId)
        ? studyStore.currentQuestionId
        : session.value.currentQuestionId) ||
      currentQuestionBriefList.value[0]?.questionId ||
      ''

    setPracticeSession(session.value.sessionId, initialQuestionId)
    await loadQuestion(initialQuestionId)
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '练习会话加载失败'
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
  if (!session.value) {
    return
  }

  const questionId = currentQuestionId.value
  updateAnswerCache(questionId, answer)

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
}

async function chooseSingle(optionKey) {
  if (!currentQuestion.value) {
    return
  }

  if (isMemorizeMode.value) {
    updateAnswerCache(currentQuestionId.value, [optionKey])
    return
  }

  if (isCurrentAnswered.value) {
    return
  }

  await submitCurrentAnswer([optionKey])
}

function chooseMultiple(optionKey) {
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
  } catch (e) {
    aiError.value = e instanceof ApiError ? e.message : 'AI 讲解失败'
  } finally {
    aiLoading.value = false
  }
}

async function finishSession() {
  if (!session.value) {
    return
  }

  const result = await finishPracticeSession(session.value.sessionId)
  setPracticeSession(session.value.sessionId, currentQuestionId.value)
  aiText.value = `本次练习已结束，正确率 ${result.accuracy}%`
}

onMounted(loadOrCreateSession)
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
    <section class="space-y-6">
      <div class="craft-card-solid rounded-[2rem] p-5 sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="segmented">
            <button :class="practiceMode === 'sequence' ? 'active' : 'text-slate-500'" @click="switchMode('sequence')">刷题</button>
            <button :class="practiceMode === 'memorize' ? 'active' : 'text-slate-500'" @click="switchMode('memorize')">背题</button>
          </div>
          <div class="flex items-center gap-3 text-sm text-slate-500">
            <button class="craft-btn craft-btn-soft px-4 py-2" @click="generateAiExplanation">AI 讲解</button>
            <button class="craft-btn craft-btn-soft px-4 py-2" @click="finishSession">结束练习</button>
          </div>
        </div>

        <div class="mt-5 flex flex-wrap gap-2">
          <button
            v-for="subject in subjects"
            :key="subject.subjectCode"
            class="rounded-full border px-4 py-2 text-sm font-medium transition"
            :class="studyStore.selectedSubjectCode === subject.subjectCode ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'"
            @click="switchSubject(subject.subjectCode)"
          >
            {{ subject.shortName || subject.subjectName }}
          </button>
        </div>

        <div v-if="loading" class="mt-6 rounded-[1.5rem] bg-slate-50 p-5 text-sm text-slate-500">正在加载题目...</div>
        <div v-else-if="error" class="mt-6 rounded-[1.5rem] bg-rose-50 p-5 text-sm text-rose-600">{{ error }}</div>
        <div v-else-if="currentQuestion" class="mt-6 rounded-[1.5rem] bg-gradient-to-br from-slate-50 to-white p-5">
          <div class="flex flex-wrap items-center gap-3">
            <span class="craft-pill bg-sky-50 text-sky-700">{{ currentQuestion.questionType }}</span>
            <span v-if="currentQuestion.newType" class="craft-pill bg-rose-50 text-rose-600">新题型</span>
            <span class="text-sm text-slate-500">{{ currentQuestion.subjectName }}</span>
          </div>

          <h1 class="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{{ currentQuestion.title }}</h1>
          <p class="mt-3 text-sm leading-7 text-slate-500">{{ currentQuestion.stem }}</p>

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
              @click="!shouldShowReview && chooseMultiple(option.key)"
            >
              <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-sm font-semibold shadow-sm">
                {{ option.key }}
              </div>
              <div class="text-base">{{ option.text }}</div>
            </button>
            <button v-if="!shouldShowReview" class="craft-btn craft-btn-primary mt-2" @click="submitMultiple">提交答案</button>
          </div>

          <div v-else class="mt-6 space-y-4">
            <div
              v-for="(step, index) in currentQuestion.steps"
              :key="step"
              class="rounded-[1.25rem] border border-slate-200 bg-white p-4"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <div class="text-sm font-semibold text-slate-900">步骤 {{ index + 1 }}</div>
                  <p class="mt-2 text-sm leading-6 text-slate-600">{{ step }}</p>
                </div>
                <button
                  v-if="!isMemorizeMode"
                  class="craft-btn craft-btn-soft px-4 py-2 text-sm"
                  @click="toggleEssayStep(index)"
                >
                  {{ currentEssaySteps[index] ? '已完成' : '标记完成' }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="shouldShowReview" class="mt-6 rounded-[1.5rem] bg-slate-50 p-5 text-sm leading-7 text-slate-700">
            <div class="flex flex-wrap items-center gap-3">
              <div class="font-semibold text-slate-900">{{ isMemorizeMode ? '背题模式' : currentResult?.isCorrect ? '回答正确' : '回答错误' }}</div>
              <span
                v-if="!isMemorizeMode && currentResult"
                class="rounded-full px-3 py-1 text-xs font-semibold"
                :class="currentResult.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'"
              >
                {{ currentResult.isCorrect ? '答对了' : '答错了' }}
              </span>
            </div>
            <div v-if="!isMemorizeMode" class="mt-3">你的答案：{{ answerText(selectedAnswers) }}</div>
            <div class="mt-2">正确答案：{{ answerText(reviewAnswer) }}</div>
            <div class="mt-3 whitespace-pre-wrap">答案解析：{{ reviewAnalysis || '暂无解析' }}</div>
          </div>

          <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button class="craft-btn craft-btn-soft px-4 py-2" :disabled="!previousQuestionId" @click="goToQuestion(previousQuestionId)">
              上一题
            </button>
            <div class="text-sm text-slate-500">
              第 {{ currentIndex + 1 }} / {{ currentQuestionBriefList.length || 0 }} 题
            </div>
            <button class="craft-btn craft-btn-primary px-4 py-2" :disabled="!nextQuestionId" @click="goToQuestion(nextQuestionId)">
              下一题
            </button>
          </div>
        </div>

        <div v-if="aiLoading || aiText || aiError" class="mt-6 rounded-[1.5rem] bg-slate-50 p-5 text-sm leading-7 text-slate-700">
          <div class="mb-2 font-semibold text-slate-900">AI 讲解</div>
          <div v-if="aiLoading && !aiText">正在生成...</div>
          <div v-if="aiText" class="whitespace-pre-wrap">{{ aiText }}</div>
          <div v-if="aiError" class="mt-2 text-rose-600">{{ aiError }}</div>
        </div>
      </div>
    </section>

    <aside class="space-y-6">
      <div class="craft-card-solid rounded-[2rem] p-5 sm:p-6 xl:sticky xl:top-28">
        <div class="flex items-center justify-between">
          <div class="section-title">题号进度</div>
          <div class="text-sm text-slate-500">{{ currentQuestionBriefList.length }} 题</div>
        </div>
        <div class="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-8 xl:grid-cols-5">
          <button
            v-for="(question, index) in currentQuestionBriefList"
            :key="question.questionId"
            class="relative grid aspect-square place-items-center rounded-full border text-sm font-medium transition"
            :class="
              currentQuestionId === question.questionId
                ? 'border-slate-900 bg-slate-900 text-white'
                : question.questionStatus === 'correct'
                  ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                  : question.questionStatus === 'wrong'
                    ? 'border-rose-200 bg-rose-100 text-rose-600'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
            "
            @click="goToQuestion(question.questionId)"
          >
            {{ index + 1 }}
          </button>
        </div>
      </div>

      <div class="craft-card-solid rounded-[2rem] p-5 sm:p-6">
        <div class="section-title">当前状态</div>
        <div class="mt-3 space-y-2 text-sm text-slate-600">
          <div>会话：{{ session?.sessionId || '未创建' }}</div>
          <div>模式：{{ isMemorizeMode ? '背题' : '刷题' }}</div>
          <div>状态：{{ session?.status || 'loading' }}</div>
          <div>当前题目：{{ currentIndex >= 0 ? currentIndex + 1 : 0 }}</div>
          <div>用户：{{ authStore.user?.nickname || authStore.user?.mobile || '未登录' }}</div>
        </div>
      </div>
    </aside>
  </div>
</template>
