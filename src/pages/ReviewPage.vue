<script setup>
import { computed } from 'vue'
import SectionBlock from '../components/SectionBlock.vue'
import StatCard from '../components/StatCard.vue'
import {
  TOTAL_QUESTION_BANK,
  formatSessionTime,
  getAnsweredCount,
  getSubjectDistribution,
  getWrongCount,
  getWrongQuestions,
  reviewCourses,
  studyStore,
} from '../data/ai408'

const answeredCount = computed(() => getAnsweredCount())
const wrongCount = computed(() => getWrongCount())
const accuracy = computed(() =>
  answeredCount.value ? Math.max(1, Math.round(((answeredCount.value - wrongCount.value) / answeredCount.value) * 100)) : 0
)
const progress = computed(() => Math.round((answeredCount.value / TOTAL_QUESTION_BANK) * 100))
const wrongDistribution = computed(() => getSubjectDistribution('wrong'))
const wrongQuestions = computed(() => getWrongQuestions())
</script>

<template>
  <div class="space-y-8">
    <section class="craft-card-solid rounded-[2rem] p-6 sm:p-8">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="section-title">本次练题情况</div>
        </div>
        <div class="segmented">
          <button class="active">本次复盘</button>
          <button class="text-slate-500">同步数据</button>
        </div>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard label="本次正确率" :value="`${accuracy}%`" tone="orange" />
        <StatCard label="练习时长" :value="formatSessionTime(studyStore.sessionSeconds)" tone="slate" />
        <StatCard label="我的错题" :value="wrongCount" tone="rose" />
        <StatCard label="本次答题数" :value="answeredCount" tone="sky" />
      </div>

      <div class="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div class="rounded-[1.5rem] bg-slate-50 p-5">
          <div class="flex items-center justify-between text-sm text-slate-500">
            <span>全局刷题进度</span>
            <span>{{ answeredCount }}/{{ TOTAL_QUESTION_BANK }}</span>
          </div>
          <div class="mt-4 h-3 overflow-hidden rounded-full bg-white">
            <div class="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400" :style="{ width: `${progress}%` }" />
          </div>
          <div class="mt-3 text-sm text-slate-500">已答题 / 408 总题库总量</div>
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

    <SectionBlock title="错题分布">
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="item in wrongDistribution"
          :key="item.subject"
          class="craft-card-solid rounded-[1.5rem] p-4"
        >
          <div class="text-sm text-slate-500">{{ item.subject }}</div>
          <div class="mt-3 flex items-end justify-between">
            <div class="text-2xl font-semibold text-slate-900">{{ item.count }}</div>
            <div class="text-sm text-slate-400">{{ item.total }} 题</div>
          </div>
        </div>
      </div>
    </SectionBlock>

    <SectionBlock title="弱项列表">
      <div class="grid gap-3">
        <div
          v-for="question in wrongQuestions"
          :key="question.id"
          class="craft-card-solid flex items-center justify-between gap-4 rounded-[1.25rem] p-4"
        >
          <div>
            <div class="text-sm font-semibold text-slate-900">{{ question.title }}</div>
            <div class="mt-1 text-sm text-slate-500">{{ question.subject }} · {{ question.tag }}</div>
          </div>
          <div class="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">错题</div>
        </div>
      </div>
    </SectionBlock>
  </div>
</template>
