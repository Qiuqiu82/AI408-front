<script setup>
import { computed, onMounted, ref } from 'vue'
import SectionBlock from '../components/SectionBlock.vue'
import StatCard from '../components/StatCard.vue'
import { formatSessionTime, reviewCourses } from '../data/ai408'
import { getStudySummary } from '../api/users'
import { getPracticeReview } from '../api/practice'
import { authStore } from '../stores/auth'
import { studyStore } from '../stores/study'

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
  weakPoints: [],
  subjectStats: [],
})
const loading = ref(true)

const accuracy = computed(() => review.value.accuracy || 0)
const wrongCount = computed(() => review.value.wrongCount || summary.value.wrongCount || 0)
const answeredCount = computed(() => review.value.answeredCount || summary.value.answeredCount || 0)
const progress = computed(() => summary.value.progressRate || 0)

async function loadData() {
  loading.value = true
  try {
    summary.value = await getStudySummary()
    if (studyStore.currentSessionId) {
      review.value = await getPracticeReview(studyStore.currentSessionId)
    }
  } finally {
    loading.value = false
  }
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
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard label="本次正确率" :value="`${accuracy}%`" tone="orange" />
        <StatCard label="练习时长" :value="formatSessionTime(review.durationSeconds || summary.sessionSeconds)" tone="slate" />
        <StatCard label="我的错题" :value="wrongCount" tone="rose" />
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
          <div class="mt-3 text-sm text-slate-500">错题数量、收藏数量都来自后端 MySQL。</div>
        </div>
        <div class="rounded-[1.5rem] bg-slate-50 p-5">
          <div class="text-sm font-medium text-slate-500">当前会话</div>
          <div class="mt-2 text-lg font-semibold text-slate-900">{{ studyStore.currentSessionId || '暂无' }}</div>
          <div class="mt-2 text-sm text-slate-500">如果还没开始练习，这里会显示空。</div>
        </div>
      </div>
    </section>

    <SectionBlock title="专项课程">
      <div class="grid gap-4 md:grid-cols-3">
        <div
          v-for="course in reviewCourses"
          :key="course.title"
          class="craft-card-solid rounded-[1.5rem] bg-gradient-to-br p-5"
          :class="course.accent"
        >
          <div class="text-lg font-semibold text-slate-900">{{ course.title }}</div>
          <div class="mt-2 text-sm leading-6 text-slate-600">{{ course.subtitle }}</div>
          <div class="mt-4 text-sm font-semibold text-slate-900">{{ course.subject }}</div>
        </div>
      </div>
    </SectionBlock>

    <SectionBlock title="错题与薄弱点">
      <div v-if="review.wrongQuestionIds.length" class="grid gap-3">
        <div v-for="questionId in review.wrongQuestionIds" :key="questionId" class="craft-card-solid rounded-[1.25rem] p-4">
          <div class="text-sm font-semibold text-slate-900">{{ questionId }}</div>
          <div class="mt-1 text-sm text-slate-500">AI 讲解可以直接在练习页里继续看。</div>
        </div>
      </div>
      <div v-else class="rounded-[1.25rem] bg-slate-50 p-4 text-sm text-slate-500">暂无错题记录。</div>
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
  </div>
</template>
