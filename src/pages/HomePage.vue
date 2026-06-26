<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import SectionBlock from '../components/SectionBlock.vue'
import {
  featureCards,
  formatCountdownDays,
  getSubjectByLabel,
  practiceSubjectSequence,
  sprintShortcuts,
  studyStore,
  subjectTabs,
  setSubject,
} from '../data/ai408'

const countdownDays = computed(() => formatCountdownDays())
const activeSubject = computed(() => getSubjectByLabel(studyStore.selectedSubject))

const switchSubject = (subject) => {
  setSubject(subject)
}
</script>

<template>
  <div class="space-y-8">
    <section class="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div class="craft-card overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div class="flex flex-col gap-6">
          <div class="flex flex-wrap items-center gap-3">
          </div>

          <div class="grid gap-4">
            <div class="flex items-center gap-3">
             
              <div class="hidden rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white sm:block">
                {{ activeSubject.label }}
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <RouterLink to="/practice" class="craft-btn craft-btn-primary">立即开始顺序练习</RouterLink>
            <RouterLink to="/review" class="craft-btn craft-btn-soft">查看本次复盘</RouterLink>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-[1.5rem] bg-slate-50 p-5">
              <div class="text-sm text-slate-500">考研倒计时</div>
              <div class="mt-2 text-3xl font-semibold text-slate-900">{{ countdownDays }} 天</div>
            </div>
            <div class="rounded-[1.5rem] bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
              <div class="text-sm text-white/70">当前单科进度</div>
              <div class="mt-2 text-3xl font-semibold">{{ activeSubject.done }}/{{ activeSubject.total }}</div>
              <div class="mt-2 text-sm text-white/75">{{ activeSubject.label }} · 已做题进度</div>
            </div>
          </div>
        </div>
      </div>

      <div class="craft-card-solid rounded-[2rem] p-6 sm:p-8">
        <div class="flex items-center justify-between">
          <div>
          </div>
        </div>

        <div class="mt-5 space-y-4">
          <input v-model="studyStore.searchText" class="craft-input" placeholder="搜索知识点 / 题型 / 章节" />
          <div class="flex flex-wrap gap-2">
            <button
              v-for="subject in subjectTabs"
              :key="subject.label"
              class="rounded-full border px-4 py-2 text-sm font-medium transition"
              :class="studyStore.selectedSubject === subject.label ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'"
              @click="switchSubject(subject.label)"
            >
              {{ subject.shortLabel }}
            </button>
          </div>

          
        </div>
      </div>
    </section>

    <SectionBlock >
      <div class="grid gap-6 xl:grid-cols-[1fr_380px_1fr]">
        <div class="grid place-items-center gap-5 rounded-[2rem] p-6 craft-card-solid">
          <button
            class="grid h-40 w-40 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 text-center text-white shadow-[0_24px_50px_rgba(14,165,233,0.25)] transition hover:scale-[1.02]"
            @click="$router.push('/practice')"
          >
            <div class="text-base font-medium">顺序练习</div>
            <div class="mt-2 text-3xl font-semibold">6/2433</div>
          </button>
          <button
            class="grid h-40 w-40 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-center text-white shadow-[0_24px_50px_rgba(20,184,166,0.2)] transition hover:scale-[1.02]"
            @click="$router.push('/practice')"
          >
            <div class="text-base font-medium">模拟考试</div>
            <div class="mt-2 text-xl font-semibold">仿真冲刺</div>
          </button>
        </div>

        <div class="soft-grid grid-cols-2 md:grid-cols-3 xl:grid-cols-1">
          <RouterLink
            v-for="item in featureCards.slice(0, 3)"
            :key="item.title"
            :to="item.href"
            class="group craft-card-solid rounded-[1.5rem] p-4 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div class="flex items-center gap-3">
              <div :class="`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${item.accent} text-lg font-bold text-white`">
                {{ item.emoji }}
              </div>
              <div>
                <div class="font-semibold text-slate-900">{{ item.title }}</div>
                <div class="text-sm text-slate-500">{{ item.note }}</div>
              </div>
            </div>
          </RouterLink>
        </div>

        <div class="soft-grid grid-cols-2 md:grid-cols-3 xl:grid-cols-1">
          <RouterLink
            v-for="item in featureCards.slice(3)"
            :key="item.title"
            :to="item.href"
            class="group craft-card-solid rounded-[1.5rem] p-4 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div class="flex items-center gap-3">
              <div :class="`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${item.accent} text-lg font-bold text-white`">
                {{ item.emoji }}
              </div>
              <div>
                <div class="font-semibold text-slate-900">{{ item.title }}</div>
                <div class="text-sm text-slate-500">{{ item.note }}</div>
              </div>
            </div>
          </RouterLink>
        </div>
      </div>
    </SectionBlock>

    <SectionBlock>
      <div class="grid gap-4 md:grid-cols-3">
        <RouterLink
          v-for="item in sprintShortcuts"
          :key="item.title"
          :to="item.href"
          class="craft-card-solid rounded-[1.5rem] p-5 transition hover:-translate-y-1"
        >
          <div class="text-lg font-semibold text-slate-900">{{ item.title }}</div>
          <p class="mt-2 text-sm leading-6 text-slate-500">{{ item.note }}</p>
        </RouterLink>
      </div>
    </SectionBlock>
  </div>
</template>
