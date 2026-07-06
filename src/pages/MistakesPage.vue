<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import SectionBlock from '../components/SectionBlock.vue'
import StatCard from '../components/StatCard.vue'
import { clearWrongBook, getWrongBookPage, getWrongBookStats } from '../api/state'
import { getCurrentUser, updateCurrentUser } from '../api/users'
import { ApiError } from '../api/errors'
import { authStore, updateAuthUser } from '../stores/auth'
import { clearPracticeSession, setPendingPracticeRequest, studyStore } from '../stores/study'

const router = useRouter()

const page = ref({
  pageSize: 20,
  pageIndex: 1,
})
const result = ref({ records: [], recordCount: 0, pageCount: 0 })
const stats = ref({
  totalWrongCount: 0,
  todayWrongCount: 0,
  answeredCount: 0,
  wrongRate: 0,
  wrongQuestionIds: [],
  todayWrongQuestionIds: [],
})
const loading = ref(true)
const message = ref('')
const messageTone = ref('success')
const settingsSaving = ref(false)
const autoRemoveEnabled = ref(false)
const autoRemoveThreshold = ref(1)

const wrongCount = computed(() => stats.value.totalWrongCount || 0)
const todayWrongCount = computed(() => stats.value.todayWrongCount || 0)
const wrongRate = computed(() => stats.value.wrongRate || 0)

async function loadUserSettings() {
  const user = await getCurrentUser()
  updateAuthUser(user)
  autoRemoveEnabled.value = Boolean(user?.wrongBookAutoRemoveEnabled)
  autoRemoveThreshold.value = user?.wrongBookAutoRemoveThreshold === 3 ? 3 : 1
}

async function loadData() {
  loading.value = true
  message.value = ''
  messageTone.value = 'success'
  try {
    const [pageResult, statsResult] = await Promise.all([
      getWrongBookPage({
        page: page.value,
        params: {},
      }),
      getWrongBookStats(),
    ])
    result.value = pageResult
    stats.value = statsResult
    await loadUserSettings()
  } catch (error) {
    messageTone.value = 'error'
    message.value = error instanceof ApiError ? error.message : '错题本加载失败'
  } finally {
    loading.value = false
  }
}

async function saveWrongBookSettings(payload) {
  settingsSaving.value = true
  message.value = ''
  messageTone.value = 'success'
  try {
    const user = await updateCurrentUser(payload)
    updateAuthUser(user)
    autoRemoveEnabled.value = Boolean(user?.wrongBookAutoRemoveEnabled)
    autoRemoveThreshold.value = user?.wrongBookAutoRemoveThreshold === 3 ? 3 : 1
    message.value = '错题自动移除设置已更新'
  } catch (error) {
    messageTone.value = 'error'
    message.value = error instanceof ApiError ? error.message : '错题设置保存失败'
  } finally {
    settingsSaving.value = false
  }
}

async function toggleAutoRemove() {
  await saveWrongBookSettings({
    wrongBookAutoRemoveEnabled: !autoRemoveEnabled.value,
    wrongBookAutoRemoveThreshold: autoRemoveThreshold.value,
  })
}

async function updateThreshold(threshold) {
  if (autoRemoveThreshold.value === threshold && autoRemoveEnabled.value) {
    return
  }
  await saveWrongBookSettings({
    wrongBookAutoRemoveEnabled: true,
    wrongBookAutoRemoveThreshold: threshold,
  })
}

function openPracticeWithRequest(request) {
  setPendingPracticeRequest(request)
  clearPracticeSession()
  studyStore.practiceMode = 'sequence'
  router.push('/practice')
}

function practiceWrongBook() {
  if (!wrongCount.value) {
    return
  }
  openPracticeWithRequest({
    mode: 'wrongBook',
    subjectCode: '',
    source: 'mistakes-wrong-book',
    title: '错题刷题',
    limit: Math.max(wrongCount.value, 20),
  })
}

function practiceTodayWrongQuestions() {
  if (!todayWrongCount.value || !stats.value.todayWrongQuestionIds.length) {
    return
  }
  openPracticeWithRequest({
    mode: 'sequence',
    subjectCode: '',
    questionIds: stats.value.todayWrongQuestionIds,
    source: 'mistakes-today-wrong-book',
    title: '今日错题刷题',
    limit: stats.value.todayWrongQuestionIds.length,
  })
}

function practiceSingleWrong(questionId) {
  openPracticeWithRequest({
    mode: 'sequence',
    subjectCode: '',
    questionIds: [questionId],
    source: 'mistakes-single-question',
    title: '重做此题',
    limit: 1,
  })
}

async function handleClear() {
  const confirmed = window.confirm('清空错题本后，这些题目将从当前错题列表移除，是否继续？')
  if (!confirmed) {
    return
  }

  try {
    await clearWrongBook()
    await loadData()
    messageTone.value = 'success'
    message.value = '错题本已清空'
  } catch (error) {
    messageTone.value = 'error'
    message.value = error instanceof ApiError ? error.message : '清空失败'
  }
}

onMounted(loadData)
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
          <div class="mt-4 section-title">错题本</div>
          <div class="mt-1 text-sm text-slate-500">
            当前账号：{{ authStore.user?.nickname || authStore.user?.mobile || '未登录' }}
          </div>
        </div>
        <div class="flex flex-wrap gap-3">
          <button class="craft-btn craft-btn-soft" :disabled="!wrongCount" @click="practiceWrongBook">开始错题刷题</button>
          <button class="craft-btn craft-btn-primary" :disabled="!wrongCount" @click="handleClear">清空错题</button>
        </div>
      </div>

      <div v-if="loading" class="mt-6 rounded-[1.5rem] bg-slate-50 p-5 text-sm text-slate-500">正在加载错题本...</div>
      <div v-else>
        <div class="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div class="rounded-[1.5rem] bg-slate-50 p-5">
            <div class="text-sm font-medium text-slate-500">错题练习设置</div>
            <div class="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] bg-white p-4">
              <div>
                <div class="text-sm font-semibold text-slate-900">答对后自动移除错题</div>
                <div class="mt-1 text-sm text-slate-500">
                  关闭后题目会一直保留在错题本；开启后按你选择的次数自动移除。
                </div>
              </div>
              <button
                class="relative inline-flex h-8 w-14 items-center rounded-full transition"
                :class="autoRemoveEnabled ? 'bg-emerald-500' : 'bg-slate-300'"
                :disabled="settingsSaving"
                @click="toggleAutoRemove"
              >
                <span
                  class="inline-block h-6 w-6 rounded-full bg-white shadow transition"
                  :class="autoRemoveEnabled ? 'translate-x-7' : 'translate-x-1'"
                />
              </button>
            </div>
            <div class="mt-4 flex flex-wrap gap-3">
              <button
                class="rounded-full border px-4 py-2 text-sm font-medium transition"
                :class="autoRemoveEnabled && autoRemoveThreshold === 1 ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'"
                :disabled="settingsSaving"
                @click="updateThreshold(1)"
              >
                答对 1 次移除
              </button>
              <button
                class="rounded-full border px-4 py-2 text-sm font-medium transition"
                :class="autoRemoveEnabled && autoRemoveThreshold === 3 ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'"
                :disabled="settingsSaving"
                @click="updateThreshold(3)"
              >
                答对 3 次移除
              </button>
            </div>
            <div class="mt-3 text-xs text-slate-400">
              {{ autoRemoveEnabled ? `当前策略：答对 ${autoRemoveThreshold} 次后自动移出错题本。` : '当前策略：不自动移除，需要你手动清理。' }}
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <button
              class="text-left transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              :disabled="!wrongCount"
              @click="practiceWrongBook"
            >
              <StatCard label="错题总数" :value="wrongCount" tone="rose" />
            </button>
            <button
              class="text-left transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              :disabled="!todayWrongCount"
              @click="practiceTodayWrongQuestions"
            >
              <StatCard label="今日错题" :value="todayWrongCount" tone="orange" />
            </button>
            <StatCard
              label="错题占已做题比例"
              :value="`${wrongRate}%`"
              tone="sky"
            />
          </div>
        </div>

        <div class="mt-6 rounded-[1.5rem] bg-slate-50 p-5 text-sm text-slate-600">
          <div>已做题数：{{ stats.answeredCount }}</div>
          <div class="mt-1">点“错题总数”会进入整本错题刷题；点“今日错题”会只刷今天新增的错题。</div>
        </div>
      </div>

      <div
        v-if="message"
        class="mt-4 rounded-[1.25rem] p-4 text-sm"
        :class="messageTone === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'"
      >
        {{ message }}
      </div>
    </section>

    <SectionBlock title="错题列表">
      <div v-if="!loading && !result.records.length" class="rounded-[1.5rem] bg-slate-50 p-5 text-sm text-slate-500">
        当前还没有错题，可以继续去刷题。
      </div>
      <div v-else class="grid gap-3">
        <div v-for="item in result.records" :key="item.questionId" class="craft-card-solid rounded-[1.25rem] p-4">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div class="text-sm font-semibold text-slate-900">{{ item.title }}</div>
              <div class="mt-1 text-sm text-slate-500">{{ item.subjectName }} · {{ item.tag }}</div>
              <div class="mt-2 text-xs text-slate-400">错题时间：{{ item.wrongAt }}</div>
            </div>
            <button class="craft-btn craft-btn-soft px-4 py-2 text-sm" @click="practiceSingleWrong(item.questionId)">重做此题</button>
          </div>
        </div>
      </div>
    </SectionBlock>
  </div>
</template>
