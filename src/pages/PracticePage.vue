<script setup>
import { computed } from 'vue'
import SectionBlock from '../components/SectionBlock.vue'
import {
  getCurrentQuestion,
  getQuestionState,
  getQuestionsBySubject,
  practiceQuestions,
  studyStore,
  answerMultiple,
  answerSingle,
  setCurrentQuestion,
  toggleEssayStep,
  toggleFavorite,
} from '../data/ai408'

const optionKeys = ['A', 'B', 'C', 'D', 'E', 'F']

const currentQuestion = computed(() => getCurrentQuestion())
const questionState = computed(() => getQuestionState(currentQuestion.value.id))
const currentQuestions = computed(() => getQuestionsBySubject(studyStore.selectedSubject))
const answeredMap = computed(() =>
  Object.fromEntries(
    practiceQuestions.map((question) => [question.id, getQuestionState(question.id)])
  )
)

const chooseSingle = (option) => {
  answerSingle(currentQuestion.value.id, option)
}

const chooseMultiple = (option) => {
  const current = new Set(questionState.value.selected)
  if (current.has(option)) {
    current.delete(option)
  } else {
    current.add(option)
  }
  answerMultiple(currentQuestion.value.id, [...current])
}

const toggleStep = (index) => {
  toggleEssayStep(currentQuestion.value.id, index)
}
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
    <section class="space-y-6">
      <div class="craft-card-solid rounded-[2rem] p-5 sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="segmented">
            <button
              :class="studyStore.practiceMode === '答题' ? 'active' : 'text-slate-500'"
              @click="studyStore.practiceMode = '答题'"
            >
              答题
            </button>
            <button
              :class="studyStore.practiceMode === '背题' ? 'active' : 'text-slate-500'"
              @click="studyStore.practiceMode = '背题'"
            >
              背题
            </button>
          </div>
          <div class="flex items-center gap-3 text-sm text-slate-500">
            <button class="craft-btn craft-btn-soft px-4 py-2" @click="toggleFavorite(currentQuestion.id)">
              收藏题目
            </button>
            <span>当前第 {{ currentQuestions.findIndex((q) => q.id === currentQuestion.id) + 1 }} 题</span>
          </div>
        </div>

        <div class="mt-6 rounded-[1.5rem] bg-gradient-to-br from-slate-50 to-white p-5">
          <div class="flex flex-wrap items-center gap-3">
            <span class="craft-pill bg-sky-50 text-sky-700">{{ currentQuestion.tag }}</span>
            <span v-if="currentQuestion.newType" class="craft-pill bg-rose-50 text-rose-600">新题型</span>
            <span class="text-sm text-slate-500">{{ currentQuestion.subject }}</span>
          </div>
          <h1 class="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {{ currentQuestion.title }}
          </h1>
          <p class="mt-3 text-sm leading-7 text-slate-500">{{ currentQuestion.stem }}</p>

          <div v-if="currentQuestion.type === 'single'" class="mt-6 space-y-3">
            <button
              v-for="(option, index) in currentQuestion.options"
              :key="option"
              class="flex w-full items-center gap-4 rounded-[1.25rem] border px-4 py-4 text-left transition"
              :class="
                questionState.selected === optionKeys[index]
                  ? questionState.status === 'correct'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
              "
              @click="chooseSingle(optionKeys[index])"
            >
              <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-sm font-semibold shadow-sm">
                {{ optionKeys[index] }}
              </div>
              <div class="text-base">{{ option }}</div>
            </button>
          </div>

          <div v-else-if="currentQuestion.type === 'multiple'" class="mt-6 space-y-3">
            <button
              v-for="(option, index) in currentQuestion.options"
              :key="option"
              class="flex w-full items-center gap-4 rounded-[1.25rem] border px-4 py-4 text-left transition"
              :class="
                questionState.selected.includes(optionKeys[index])
                  ? 'border-sky-200 bg-sky-50 text-sky-700'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
              "
              @click="chooseMultiple(optionKeys[index])"
            >
              <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-sm font-semibold shadow-sm">
                {{ optionKeys[index] }}
              </div>
              <div class="text-base">{{ option }}</div>
            </button>
            <div v-if="studyStore.practiceMode === '背题'" class="rounded-[1.25rem] bg-slate-900 p-4 text-white">
              正确答案：{{ currentQuestion.answer.join(' / ') }}
            </div>
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
                <button class="craft-btn craft-btn-soft px-4 py-2 text-sm" @click="toggleStep(index)">
                  {{ questionState.stepStatus[index] ? '已批改' : '分步批改' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="craft-card-solid rounded-[2rem] p-5 sm:p-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="section-title">题目解析</div>
            <div class="section-subtitle mt-1">答题 / 背题模式联动</div>
          </div>
          <div class="text-sm text-slate-500">
            状态：
            <span :class="questionState.status === 'correct' ? 'text-emerald-600' : questionState.status === 'wrong' ? 'text-rose-600' : 'text-slate-500'">
              {{ questionState.status === 'correct' ? '已答对' : questionState.status === 'wrong' ? '答错' : '未作答' }}
            </span>
          </div>
        </div>
        <div class="mt-4 rounded-[1.5rem] bg-slate-50 p-5 text-sm leading-7 text-slate-600">
          {{ currentQuestion.analysis }}
        </div>
      </div>
    </section>

    <aside class="space-y-6">
      <div class="craft-card-solid rounded-[2rem] p-5 sm:p-6 xl:sticky xl:top-28">
        <div class="flex items-center justify-between">
          <div>
            <div class="section-title">题号进度</div>
          </div>
          <div class="text-sm text-slate-500">{{ currentQuestions.length }} 题</div>
        </div>
        <div class="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-8 xl:grid-cols-5">
          <button
            v-for="(question, index) in currentQuestions"
            :key="question.id"
            class="relative grid aspect-square place-items-center rounded-full border text-sm font-medium transition"
            :class="
              currentQuestion.id === question.id
                ? 'border-slate-900 bg-slate-900 text-white'
                : answeredMap[question.id]?.status === 'correct'
                  ? 'border-sky-200 bg-sky-100 text-sky-700'
                  : answeredMap[question.id]?.status === 'wrong'
                    ? 'border-rose-200 bg-rose-100 text-rose-600'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
            "
            @click="setCurrentQuestion(question.id)"
          >
            {{ index + 1 }}
            <span
              v-if="question.newType"
              class="absolute -bottom-1 -right-1 rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-semibold text-white"
            >
              新
            </span>
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>
