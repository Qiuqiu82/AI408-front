<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import SectionBlock from '../components/SectionBlock.vue'
import StatCard from '../components/StatCard.vue'
import {
  clearFavorites,
  favoriteCourses,
  getDailyNewFavoriteCount,
  getFavoriteCount,
  getFavoriteQuestions,
  getImportantFavoriteCount,
  getSubjectDistribution,
  getVeryImportantFavoriteCount,
  studyStore,
  syncStudyData,
} from '../data/ai408'

const favoriteCount = computed(() => getFavoriteCount())
const todayFavoriteCount = computed(() => getDailyNewFavoriteCount())
const importantCount = computed(() => getImportantFavoriteCount())
const veryImportantCount = computed(() => getVeryImportantFavoriteCount())
const favoriteDistribution = computed(() => getSubjectDistribution('favorites'))
const favoriteQuestions = computed(() => getFavoriteQuestions())
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
          <button class="craft-btn craft-btn-soft" @click="syncStudyData">同步数据</button>
          <button class="craft-btn craft-btn-primary" @click="clearFavorites">清空收藏</button>
        </div>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard label="收藏总数" :value="favoriteCount" tone="sky" />
        <StatCard label="今日收藏" :value="todayFavoriteCount" tone="orange" />
        <StatCard label="重要" :value="importantCount" tone="amber" />
        <StatCard label="非常重要" :value="veryImportantCount" tone="rose" />
      </div>

      <div class="mt-6 grid gap-4 lg:grid-cols-3">
        <div
          v-for="course in favoriteCourses"
          :key="course.title"
          class="craft-card-solid rounded-[1.5rem] bg-gradient-to-br p-5"
          :class="course.accent"
        >
          <div class="text-lg font-semibold text-slate-900">{{ course.title }}</div>
          <div class="mt-2 text-sm leading-6 text-slate-600">{{ course.subtitle }}</div>
          <div class="mt-4 text-sm font-semibold text-slate-900">{{ course.subject }}</div>
        </div>
      </div>
    </section>

    <SectionBlock title="收藏分布">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="segmented">
          <button :class="studyStore.favoriteFilter === '按科目' ? 'active' : 'text-slate-500'" @click="studyStore.favoriteFilter = '按科目'">
            按科目
          </button>
          <button :class="studyStore.favoriteFilter === '按考点' ? 'active' : 'text-slate-500'" @click="studyStore.favoriteFilter = '按考点'">
            按考点
          </button>
        </div>
        <div class="text-sm text-slate-500">同步时间：{{ studyStore.syncAt }}</div>
      </div>

      <div class="grid gap-3">
        <div
          v-for="item in favoriteDistribution"
          :key="item.subject"
          class="craft-card-solid flex items-center justify-between rounded-[1.25rem] p-4"
        >
          <div>
            <div class="text-sm font-semibold text-slate-900">{{ item.subject }}</div>
            <div class="mt-1 text-sm text-slate-500">收藏 {{ item.count }} 题</div>
          </div>
          <div class="text-sm text-slate-400">{{ item.total }} 题库</div>
        </div>
      </div>
    </SectionBlock>

    <SectionBlock title="收藏题单" >
      <div class="grid gap-3">
        <div
          v-for="question in favoriteQuestions"
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
