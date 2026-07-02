import { reactive, watch } from 'vue'

const STORAGE_KEY = 'ai408-study-ui-v1'

function loadStoredState() {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function persistState(state) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const storedState = loadStoredState()

export const studyStore = reactive({
  selectedSubjectCode: storedState.selectedSubjectCode || 'DS',
  currentSessionId: storedState.currentSessionId || '',
  currentQuestionId: storedState.currentQuestionId || '',
  practiceMode: storedState.practiceMode || 'sequence',
})

watch(
  studyStore,
  () => {
    persistState({
      selectedSubjectCode: studyStore.selectedSubjectCode,
      currentSessionId: studyStore.currentSessionId,
      currentQuestionId: studyStore.currentQuestionId,
      practiceMode: studyStore.practiceMode,
    })
  },
  { deep: true }
)

export function setSelectedSubjectCode(subjectCode) {
  studyStore.selectedSubjectCode = subjectCode
}

export function setPracticeSession(sessionId, questionId = '') {
  studyStore.currentSessionId = sessionId || ''
  studyStore.currentQuestionId = questionId || ''
}

export function setCurrentQuestionId(questionId) {
  studyStore.currentQuestionId = questionId || ''
}

export function clearPracticeSession() {
  setPracticeSession('')
}
