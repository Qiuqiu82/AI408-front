import { reactive, watch } from 'vue'

const STORAGE_KEY = 'ai408-study-ui-v1'
const DEFAULT_SUBJECT_CODE = 'CN'

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

function normalizePendingPracticeRequest(value) {
  if (!value || typeof value !== 'object') {
    return null
  }

  const mode = value.mode || 'sequence'
  const scopeType = value.scopeType || ''
  const scopeKey = value.scopeKey || ''
  const questionIds = Array.isArray(value.questionIds)
    ? value.questionIds.filter((item) => typeof item === 'string' && item)
    : []

  const supportsScopeRequest = ['paper', 'knowledgePoint'].includes(scopeType) && scopeKey
  if (!questionIds.length && !['wrongBook', 'favorites'].includes(mode) && !supportsScopeRequest) {
    return null
  }

  return {
    mode,
    subjectCode: value.subjectCode || '',
    questionIds,
    limit: value.limit || (questionIds.length || 20),
    source: value.source || 'review-wrong-retry',
    title: value.title || '',
    scopeType,
    scopeKey,
  }
}

const storedState = loadStoredState()

export const studyStore = reactive({
  selectedSubjectCode: storedState.selectedSubjectCode || DEFAULT_SUBJECT_CODE,
  currentSessionId: storedState.currentSessionId || '',
  currentQuestionId: storedState.currentQuestionId || '',
  practiceMode: storedState.practiceMode || 'sequence',
  pendingPracticeRequest: normalizePendingPracticeRequest(storedState.pendingPracticeRequest),
})

watch(
  studyStore,
  () => {
    persistState({
      selectedSubjectCode: studyStore.selectedSubjectCode,
      currentSessionId: studyStore.currentSessionId,
      currentQuestionId: studyStore.currentQuestionId,
      practiceMode: studyStore.practiceMode,
      pendingPracticeRequest: studyStore.pendingPracticeRequest,
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

export function setPendingPracticeRequest(request) {
  studyStore.pendingPracticeRequest = normalizePendingPracticeRequest(request)
}

export function clearPendingPracticeRequest() {
  studyStore.pendingPracticeRequest = null
}

export function resetStudyUiState(subjectCode = DEFAULT_SUBJECT_CODE) {
  studyStore.selectedSubjectCode = subjectCode
  studyStore.currentSessionId = ''
  studyStore.currentQuestionId = ''
  studyStore.practiceMode = 'sequence'
  studyStore.pendingPracticeRequest = null
}
