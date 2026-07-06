<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SectionBlock from '../components/SectionBlock.vue'
import StatCard from '../components/StatCard.vue'
import { getExamRecordDetail } from '../api/exam'
import { ApiError } from '../api/errors'
import { clearPracticeSession, setPendingPracticeRequest, studyStore } from '../stores/study'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const record = ref({
  recordId: '',
  score: 0,
  totalCount: 0,
  answeredCount: 0,
  correctCount: 0,
  wrongCount: 0,
  durationSeconds: 0,
  submittedAt: '',
  wrongQuestionIds: [],
  wrongQuestions: [],
})

const wrongCount = computed(() => record.value.wrongCount || 0)
const hasWrongQuestions = computed(() => (record.value.wrongQuestionIds || []).length > 0)

function formatDuration(totalSeconds) {
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

async function loadRecord() {
  loading.value = true
  error.value = ''
  try {
    record.value = await getExamRecordDetail(route.params.id)
  } catch (loadError) {
    error.value = loadError instanceof ApiError ? loadError.message : '考试记录加载失败'
  } finally {
    loading.value = false
  }
}

function retryWrongQuestions() {
  const wrongIds = record.value.wrongQuestionIds || []
  if (!wrongIds.length) {
    return
  }

  const firstWrong = record.value.wrongQuestions?.[0]
  setPendingPracticeRequest({
    mode: 'sequence',
    subjectCode: firstWrong?.subjectCode || studyStore.selectedSubjectCode,
    questionIds: wrongIds,
    limit: wrongIds.length,
    source: 'exam-wrong-retry',
    title: '重做本次考试错题',
  })
  clearPracticeSession()
  studyStore.practiceMode = 'sequence'
  router.push('/practice')
}

onMounted(loadRecord)
</script>

<template>
  <div class="space-y-8">
    <section class="craft-card-solid rounded-[2rem] p-6 sm:p-8">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="section-title">考试结果</div>
          <div class="section-subtitle mt-1">记录编号：{{ record.recordId || route.params.id }}</div>
        </div>
        <div class="flex flex-wrap gap-3">
          <button class="craft-btn craft-btn-soft" @click="router.push('/exam')">返回模拟考试</button>
          <button v-if="hasWrongQuestions" class="craft-btn craft-btn-primary" @click="retryWrongQuestions">重做本次错题</button>
          <button class="craft-btn craft-btn-soft" @click="router.push('/mistakes')">查看错题本</button>
        </div>
      </div>

      <div v-if="loading" class="mt-6 rounded-[1.5rem] bg-slate-50 p-5 text-sm text-slate-500">正在加载考试记录...</div>
      <div v-else-if="error" class="mt-6 rounded-[1.5rem] bg-rose-50 p-5 text-sm text-rose-600">{{ error }}</div>
      <div v-else>
        <div class="mt-6 grid gap-4 md:grid-cols-4">
          <StatCard label="成绩" :value="`${record.score} 分`" tone="orange" />
          <StatCard label="考试用时" :value="formatDuration(record.durationSeconds)" tone="slate" />
          <StatCard label="答题数量" :value="`${record.answeredCount}/${record.totalCount}`" tone="sky" />
          <StatCard label="错题数量" :value="wrongCount" tone="rose" />
        </div>

        <div class="mt-6 rounded-[1.5rem] bg-slate-50 p-5 text-sm leading-7 text-slate-600">
          <div>交卷时间：{{ record.submittedAt }}</div>
          <div>正确题数：{{ record.correctCount }}</div>
          <div>错题已自动加入错题本，也可以直接重做本次考试错题。</div>
        </div>
      </div>
    </section>

    <SectionBlock title="错题回顾">
      <div v-if="!loading && !error && record.wrongQuestions.length" class="grid gap-4">
        <article
          v-for="question in record.wrongQuestions"
          :key="`${record.recordId}-${question.questionId}`"
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
      <div v-else-if="!loading && !error" class="rounded-[1.5rem] bg-emerald-50 p-5 text-sm text-emerald-700">
        本次考试没有错题，继续保持。
      </div>
    </SectionBlock>
  </div>
</template>
