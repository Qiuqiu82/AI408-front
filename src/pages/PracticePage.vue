<script setup>
import { computed, onMounted, ref } from 'vue'
import SectionBlock from '../components/SectionBlock.vue'
import { getSubjects, getQuestionDetail } from '../api/questions'
import { createPracticeSession, finishPracticeSession, getPracticeSession, submitPracticeAnswer, updateEssaySteps } from '../api/practice'
import { streamExplanation } from '../api/ai'
import { ApiError } from '../api/errors'
import { setPracticeSession, studyStore, setSelectedSubjectCode } from '../stores/study'
import { authStore } from '../stores/auth'

const optionKeys = ['A', 'B', 'C', 'D', 'E', 'F']

const subjects = ref([])
const session = ref(null)
const currentQuestionDetail = ref(null)
const currentQuestionState = ref(null)
const loading = ref(true)
const error = ref('')
const aiText = ref('')
const aiLoading = ref(false)
const aiError = ref('')
const chosenAnswer = ref([])
const essaySteps = ref([])
const practiceMode = ref('sequence')

const currentQuestion = computed(() => currentQuestionDetail.value || null)
const currentQuestionId = computed(() => studyStore.currentQuestionId || session.value?.currentQuestionId || '')
const currentQuestionBriefList = computed(() => session.value?.questionBriefList || [])
const currentIndex = computed(() => currentQuestionBriefList.value.findIndex((item) => item.questionId === currentQuestionId.value))

async function loadSubjects() {
  subjects.value = (await getSubjects()) || []
  if (subjects.value.length && !subjects.value.some((item) => item.subjectCode === studyStore.selectedSubjectCode)) {
    setSelectedSubjectCode(subjects.value[0].subjectCode)
  }
}

async function loadCurrentQuestionDetail() {
  if (!session.value?.currentQuestionId) {
    currentQuestionDetail.value = null
    return
  }
  const currentBrief = currentQuestionBriefList.value.find((item) => item.questionId === currentQuestionId.value)
  const view = currentBrief?.questionStatus && currentBrief.questionStatus !== 'new' ? 'review' : 'practice'
  currentQuestionDetail.value = await getQuestionDetail(currentQuestionId.value, view)
}

async function hydrateQuestionStateFromServer() {
  if (!session.value) {
    currentQuestionState.value = null
    return
  }
  const currentBrief = currentQuestionBriefList.value.find((item) => item.questionId === currentQuestionId.value)
  if (!currentBrief) {
    currentQuestionState.value = null
    return
  }
  const detail = await getQuestionDetail(currentBrief.questionId, currentBrief.questionStatus && currentBrief.questionStatus !== 'new' ? 'review' : 'practice')
  currentQuestionState.value = {
    questionId: currentBrief.questionId,
    orderNo: currentBrief.orderNo,
    questionStatus: currentBrief.questionStatus || 'new',
    newType: currentBrief.newType,
    selected: [],
    stepStatus: detail.steps ? detail.steps.map(() => false) : [],
    status: currentBrief.questionStatus || 'new',
    favoriteImportance: 0,
    inWrongBook: false,
    question: detail,
  }
  chosenAnswer.value = []
  essaySteps.value = detail.steps ? detail.steps.map(() => false) : []
}

async function loadOrCreateSession() {
  loading.value = true
  error.value = ''
  try {
    await loadSubjects()
    const mode = studyStore.practiceMode || practiceMode.value
    practiceMode.value = mode

    if (studyStore.currentSessionId) {
      session.value = await getPracticeSession(studyStore.currentSessionId)
    } else {
      const created = await createPracticeSession({
        mode: practiceMode.value,
        subjectCode: studyStore.selectedSubjectCode,
        limit: 20,
        source: 'frontend',
      })
      session.value = created
    }

    setPracticeSession(session.value.sessionId, session.value.currentQuestionId || session.value.currentQuestionId || '')
    await loadCurrentQuestionDetail()
    await hydrateQuestionStateFromServer()
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '练习会话加载失败'
  } finally {
    loading.value = false
  }
}

async function switchSubject(subjectCode) {
  setSelectedSubjectCode(subjectCode)
  setPracticeSession('')
  await loadOrCreateSession()
}

async function reloadSession() {
  if (!studyStore.currentSessionId) {
    return
  }
  session.value = await getPracticeSession(studyStore.currentSessionId)
  setPracticeSession(session.value.sessionId, session.value.currentQuestionId || '')
  await loadCurrentQuestionDetail()
  await hydrateQuestionStateFromServer()
}

async function goToQuestion(questionId) {
  if (!session.value) {
    return
  }
  setPracticeSession(session.value.sessionId, questionId)
  await loadCurrentQuestionDetail()
  await hydrateQuestionStateFromServer()
}

async function chooseSingle(option) {
  if (!session.value) return
  chosenAnswer.value = [option]
  const result = await submitPracticeAnswer(session.value.sessionId, {
    questionId: currentQuestionId.value,
    answer: [option],
  })
  currentQuestionState.value = {
    ...currentQuestionState.value,
    questionStatus: result.questionStatus,
    status: result.questionStatus,
    selected: [option],
    inWrongBook: result.inWrongBook,
  }
  await reloadSession()
}

async function chooseMultiple(option) {
  const set = new Set(chosenAnswer.value)
  if (set.has(option)) {
    set.delete(option)
  } else {
    set.add(option)
  }
  chosenAnswer.value = [...set]
}

async function submitMultiple() {
  if (!session.value) return
  const result = await submitPracticeAnswer(session.value.sessionId, {
    questionId: currentQuestionId.value,
    answer: chosenAnswer.value,
  })
  currentQuestionState.value = {
    ...currentQuestionState.value,
    questionStatus: result.questionStatus,
    status: result.questionStatus,
    selected: [...chosenAnswer.value],
    inWrongBook: result.inWrongBook,
  }
  await reloadSession()
}

async function toggleEssayStep(index) {
  if (!session.value) return
  essaySteps.value[index] = !essaySteps.value[index]
  const result = await updateEssaySteps(session.value.sessionId, {
    questionId: currentQuestionId.value,
    steps: essaySteps.value,
  })
  currentQuestionState.value = {
    ...currentQuestionState.value,
    stepStatus: [...essaySteps.value],
    questionStatus: result.questionStatus,
    status: result.questionStatus,
  }
  await reloadSession()
}

async function generateAiExplanation() {
  if (!session.value || !currentQuestionDetail.value) {
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
        userAnswer: chosenAnswer.value.length ? chosenAnswer.value : [],
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
  if (!session.value) return
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
            <button :class="practiceMode === 'sequence' ? 'active' : 'text-slate-500'" @click="practiceMode = 'sequence'">顺序</button>
            <button :class="practiceMode === 'mock' ? 'active' : 'text-slate-500'" @click="practiceMode = 'mock'">模拟</button>
            <button :class="practiceMode === 'wrongBook' ? 'active' : 'text-slate-500'" @click="practiceMode = 'wrongBook'">错题</button>
            <button :class="practiceMode === 'favorites' ? 'active' : 'text-slate-500'" @click="practiceMode = 'favorites'">收藏</button>
          </div>
          <div class="flex items-center gap-3 text-sm text-slate-500">
            <button class="craft-btn craft-btn-soft px-4 py-2" @click="generateAiExplanation">AI 讲解</button>
            <button class="craft-btn craft-btn-soft px-4 py-2" @click="finishSession">结束练习</button>
          </div>
        </div>

        <div v-if="currentQuestion" class="mt-6 rounded-[1.5rem] bg-gradient-to-br from-slate-50 to-white p-5">
          <div class="flex flex-wrap items-center gap-3">
            <span class="craft-pill bg-sky-50 text-sky-700">{{ currentQuestion.tag || currentQuestion.questionType }}</span>
            <span v-if="currentQuestion.newType" class="craft-pill bg-rose-50 text-rose-600">新题型</span>
            <span class="text-sm text-slate-500">{{ currentQuestion.subjectName }}</span>
          </div>
          <h1 class="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{{ currentQuestion.title }}</h1>
          <p class="mt-3 text-sm leading-7 text-slate-500">{{ currentQuestion.stem }}</p>

          <div v-if="currentQuestion.questionType === 'single'" class="mt-6 space-y-3">
            <button
              v-for="(option, index) in currentQuestion.options"
              :key="option.key"
              class="flex w-full items-center gap-4 rounded-[1.25rem] border px-4 py-4 text-left transition"
              :class="chosenAnswer[0] === option.key ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'"
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
              v-for="(option, index) in currentQuestion.options"
              :key="option.key"
              class="flex w-full items-center gap-4 rounded-[1.25rem] border px-4 py-4 text-left transition"
              :class="chosenAnswer.includes(option.key) ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'"
              @click="chooseMultiple(option.key)"
            >
              <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-sm font-semibold shadow-sm">
                {{ option.key }}
              </div>
              <div class="text-base">{{ option.text }}</div>
            </button>
            <button class="craft-btn craft-btn-primary mt-2" @click="submitMultiple">提交多选答案</button>
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
                <button class="craft-btn craft-btn-soft px-4 py-2 text-sm" @click="toggleEssayStep(index)">
                  {{ essaySteps[index] ? '已勾选' : '分步勾选' }}
                </button>
              </div>
            </div>
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
          <div>
            <div class="section-title">题号进度</div>
          </div>
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
                  ? 'border-sky-200 bg-sky-100 text-sky-700'
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
          <div>模式：{{ session?.mode || practiceMode }}</div>
          <div>状态：{{ session?.status || 'loading' }}</div>
          <div>当前题目：{{ currentIndex + 1 }}</div>
          <div>已登录：{{ authStore.user?.nickname || authStore.user?.mobile || '否' }}</div>
        </div>
      </div>
    </aside>
  </div>
</template>
