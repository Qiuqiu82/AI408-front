<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import SectionBlock from '../components/SectionBlock.vue'
import StatCard from '../components/StatCard.vue'
import {
  getDailyNewWrongCount,
  getSubjectDistribution,
  getWrongCount,
  getWrongQuestions,
  mistakeCourses,
  studyStore,
  clearWrongBook,
} from '../data/ai408'

const wrongCount = computed(() => getWrongCount())
const todayWrongCount = computed(() => getDailyNewWrongCount())
const wrongDistribution = computed(() => getSubjectDistribution('wrong'))
const wrongQuestions = computed(() => getWrongQuestions())
</script>

<template>
  <div class="space-y-8">
    <section class="craft-card-solid rounded-[2rem] p-6 sm:p-8">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="segmented">
            <RouterLink to="/mistakes" class="text-slate-500" active-class="active">错题本</RouterLink>
            <RouterLink to="/favorites" class="text-slate-500" active-class="active">收藏题目</RouterLink>
          </div>
          <div class="mt-4">
          </div>
        </div>
        <div class="flex flex-wrap gap-3">
          <button class="craft-btn craft-btn-soft" @click="studyStore.autoRemoveWrong = !studyStore.autoRemoveWrong">
            {{ studyStore.autoRemoveWrong ? '自动移除已开启' : '自动移除已关闭' }}
          </button>
          <button class="craft-btn craft-btn-primary" @click="clearWrongBook">清空错题</button>
        </div>
      </div>

      <div class="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div class="rounded-[1.5rem] bg-slate-50 p-5">
          <div class="text-sm font-medium text-slate-500">错题清理配置</div>
          <div class="mt-4 flex flex-wrap gap-3">
            <button
              class="craft-btn px-4 py-2"
              :class="studyStore.autoRemoveThreshold === 1 ? 'craft-btn-primary' : 'craft-btn-soft'"
              @click="studyStore.autoRemoveThreshold = 1"
            >
              答对 1 次就移除
            </button>
            <button
              class="craft-btn px-4 py-2"
              :class="studyStore.autoRemoveThreshold === 3 ? 'craft-btn-primary' : 'craft-btn-soft'"
              @click="studyStore.autoRemoveThreshold = 3"
            >
              答对 3 次才移除
            </button>
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <StatCard label="错题总数" :value="wrongCount" tone="rose" />
          <StatCard label="今日新增错题" :value="todayWrongCount" tone="orange" />
        </div>
      </div>
    </section>

    <SectionBlock title="专项课程" >
      <div class="grid gap-4 md:grid-cols-3">
        <div
          v-for="course in mistakeCourses"
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

    <SectionBlock title="错题分布" >
      <div class="grid gap-3">
        <div
          v-for="item in wrongDistribution"
          :key="item.subject"
          class="craft-card-solid flex items-center justify-between rounded-[1.25rem] p-4"
        >
          <div>
            <div class="text-sm font-semibold text-slate-900">{{ item.subject }}</div>
            <div class="mt-1 text-sm text-slate-500">当前错题 {{ item.count }} 题</div>
          </div>
          <div class="text-sm text-slate-400">{{ item.total }} 题库</div>
        </div>
      </div>
    </SectionBlock>

    <SectionBlock title="弱项考点巩固" >
      <div class="grid gap-3">
        <div
          v-for="question in wrongQuestions"
          :key="question.id"
          class="craft-card-solid rounded-[1.25rem] p-4"
        >
          <div class="text-sm font-semibold text-slate-900">{{ question.title }}</div>
          <div class="mt-1 text-sm text-slate-500">{{ question.subject }} · {{ question.tag }}</div>
        </div>
      </div>
    </SectionBlock>
  </div>
</template>
