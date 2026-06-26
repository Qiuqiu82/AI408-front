import { reactive, watch } from 'vue'

export const TOTAL_QUESTION_BANK = 408
export const EXAM_DATE = new Date('2026-12-26T00:00:00+08:00')
const STORAGE_KEY = 'ai408-study-state-v1'

const todayKey = () => new Date().toISOString().slice(0, 10)

export const subjects = [
  {
    label: '数据结构',
    shortLabel: '数据结构',
    total: 642,
    done: 318,
    wrong: 24,
    accent: 'bg-sky-500',
    ring: 'ring-sky-100',
    soft: 'bg-sky-50',
  },
  {
    label: '计算机组成原理',
    shortLabel: '计算机组成原理',
    total: 512,
    done: 203,
    wrong: 18,
    accent: 'bg-amber-500',
    ring: 'ring-amber-100',
    soft: 'bg-amber-50',
  },
  {
    label: '操作系统',
    shortLabel: '操作系统',
    total: 534,
    done: 216,
    wrong: 20,
    accent: 'bg-emerald-500',
    ring: 'ring-emerald-100',
    soft: 'bg-emerald-50',
  },
  {
    label: '计算机网络',
    shortLabel: '计算机网络',
    total: 483,
    done: 231,
    wrong: 15,
    accent: 'bg-violet-500',
    ring: 'ring-violet-100',
    soft: 'bg-violet-50',
  },
  {
    label: '整套模考',
    shortLabel: '整套模考',
    total: 262,
    done: 118,
    wrong: 9,
    accent: 'bg-slate-900',
    ring: 'ring-slate-200',
    soft: 'bg-slate-50',
  },
]

export const subjectTabs = subjects.map((subject) => ({
  ...subject,
}))

export const featureCards = [
  {
    title: '高频精简 600 题',
    note: '抓住必考点',
    emoji: '600',
    href: '/practice',
    accent: 'from-sky-500 to-cyan-400',
  },
  {
    title: '错题收藏',
    note: '查漏补缺',
    emoji: '错',
    href: '/mistakes',
    accent: 'from-rose-500 to-orange-400',
  },
  {
    title: '院校真题集',
    note: '按院校收录',
    emoji: '真',
    href: '/review',
    accent: 'from-amber-500 to-orange-400',
  },
  {
    title: '直播带学',
    note: '实时讲解',
    emoji: '播',
    href: '/practice',
    accent: 'from-emerald-500 to-teal-400',
  },
  {
    title: '大题专项训练',
    note: '步骤批改',
    emoji: '题',
    href: '/practice',
    accent: 'from-indigo-500 to-sky-400',
  },
  {
    title: '历年真题模拟',
    note: '全真冲刺',
    emoji: '模',
    href: '/practice',
    accent: 'from-slate-900 to-slate-600',
  },
]

export const sprintShortcuts = [
  { title: '考前速记', note: '碎片时间快速过点', href: '/review' },
  { title: '押题秘卷', note: '聚焦最后冲刺', href: '/practice' },
  { title: '考点速刷', note: '针对薄弱点补齐', href: '/mistakes' },
]

export const reviewCourses = [
  {
    title: '精简 600 题',
    subtitle: '破题高频考点，省时省力',
    subject: '数据结构',
    accent: 'from-amber-100 to-orange-100',
  },
  {
    title: '弱项知识点巩固',
    subtitle: '把错题变成高频题库',
    subject: '操作系统',
    accent: 'from-sky-100 to-cyan-100',
  },
  {
    title: '大题解题模板',
    subtitle: '银行家算法、分页、路由题型模板化',
    subject: '计算机组成原理',
    accent: 'from-violet-100 to-indigo-100',
  },
]

export const mistakeCourses = [
  {
    title: '扣分罚款题',
    subtitle: '扣分情境、处罚规则、易混淆细节',
    subject: '计算机网络',
    accent: 'from-sky-100 to-cyan-100',
  },
  {
    title: '常见标志的辨别',
    subtitle: '直播讲解，快速理解',
    subject: '操作系统',
    accent: 'from-blue-100 to-indigo-100',
  },
  {
    title: '错题分步纠偏',
    subtitle: '大题按步骤拆解',
    subject: '数据结构',
    accent: 'from-amber-100 to-yellow-100',
  },
]

export const favoriteCourses = [
  {
    title: '收藏高频专题课',
    subtitle: '按收藏量最高的考点集中复习',
    subject: '计算机组成原理',
    accent: 'from-amber-100 to-orange-100',
  },
  {
    title: '实时直播讲解',
    subtitle: '收藏题实时追踪讲解',
    subject: '计算机网络',
    accent: 'from-sky-100 to-cyan-100',
  },
  {
    title: '高优先级题单',
    subtitle: '重点星标题直接拉通练习',
    subject: '整套模考',
    accent: 'from-slate-100 to-slate-200',
  },
]

export const practiceQuestions = [
  {
    id: 'ds-1',
    subject: '数据结构',
    type: 'single',
    tag: '单选',
    newType: false,
    title: '顺序表的主要优点是？',
    stem: '在 408 常考的数据结构里，顺序表最突出的特点是什么？',
    options: ['插入删除更快', '随机访问方便', '空间利用率极低', '无需预分配空间'],
    answer: ['B'],
    analysis: '顺序表支持按下标随机访问，时间复杂度为 O(1)。',
    note: '顺序存储的核心优势是随机访问。插删要移动元素。',
  },
  {
    id: 'ds-2',
    subject: '数据结构',
    type: 'multiple',
    tag: '多选',
    newType: false,
    title: '关于二叉树遍历，下列说法正确的是？',
    stem: '请判断下列遍历规律，哪些是正确的。',
    options: ['先序遍历的第一个结点一定是根结点', '中序遍历的第一个结点一定是根结点', '后序遍历的最后一个结点一定是根结点', '层序遍历必须借助栈'],
    answer: ['A', 'C'],
    analysis: '先序首结点是根，后序最后一个结点也是根。层序通常借助队列。',
    note: '遍历题先看“根结点位置”，再看辅助结构是栈还是队列。',
  },
  {
    id: 'co-1',
    subject: '计算机组成原理',
    type: 'single',
    tag: '单选',
    newType: false,
    title: 'Cache 命中率上升时，平均访问时间如何变化？',
    stem: 'Cache 命中率提高会对主存访问带来什么影响？',
    options: ['下降', '上升', '不变', '无法判断'],
    answer: ['A'],
    analysis: '命中率提高，访问慢速主存的概率下降，平均访问时间随之下降。',
    note: '命中率越高，越接近 Cache 的速度。',
  },
  {
    id: 'co-2',
    subject: '计算机组成原理',
    type: 'single',
    tag: '单选',
    newType: true,
    title: '写回策略的特点是？',
    stem: 'Cache 写策略中，写回法的核心特征是什么？',
    options: ['每次写都立刻写主存', '只对只读数据有效', '替换时才写回主存', '一定不需要 Cache'],
    answer: ['C'],
    analysis: '写回策略会先修改 Cache，等块被替换时再写回主存。',
    note: '和直写法对比记忆：直写每次写主存，写回替换再写。',
  },
  {
    id: 'os-1',
    subject: '操作系统',
    type: 'single',
    tag: '单选',
    newType: false,
    title: '时间片轮转更适合哪类系统？',
    stem: '哪种系统最适合采用时间片轮转调度？',
    options: ['批处理系统', '分时系统', '实时系统', '嵌入式系统'],
    answer: ['B'],
    analysis: '时间片轮转强调公平响应，典型用于分时系统。',
    note: '分时系统看“响应速度”和“公平性”。',
  },
  {
    id: 'os-2',
    subject: '操作系统',
    type: 'essay',
    tag: '综合大题',
    newType: true,
    title: '银行家算法安全性判断的标准步骤？',
    stem: '请按步骤完成安全性检查，适合大题分步批改。',
    steps: [
      '先计算每个进程的 Need 向量',
      '初始化 Work 和 Finish，寻找满足 Need <= Work 的进程',
      '假设该进程执行完成并释放资源，重复检查直到全部完成',
    ],
    answer: ['Need', 'Work', 'Finish'],
    analysis: '银行家算法判断安全序列的关键，是不断用 Work 去匹配 Need，并在释放后更新 Work。',
    note: '大题模板：写 Need、写 Work、找可执行进程、释放资源、循环验证。',
  },
  {
    id: 'net-1',
    subject: '计算机网络',
    type: 'single',
    tag: '单选',
    newType: false,
    title: 'TCP 的主要特点是？',
    stem: '下列哪项最符合 TCP 的特征？',
    options: ['可靠传输', '无连接', '不保证有序', '只用于广播'],
    answer: ['A'],
    analysis: 'TCP 面向连接，提供可靠、有序的字节流服务。',
    note: '网络题先区分 TCP / UDP 的连接方式和可靠性。',
  },
  {
    id: 'net-2',
    subject: '计算机网络',
    type: 'multiple',
    tag: '多选',
    newType: false,
    title: '下列属于应用层协议的是？',
    stem: '请选出应用层协议。',
    options: ['DNS', 'TCP', 'HTTP', 'IP'],
    answer: ['A', 'C'],
    analysis: 'DNS、HTTP 都属于应用层；TCP 在传输层，IP 在网络层。',
    note: '分层题最常考的就是协议归属。',
  },
  {
    id: 'mock-1',
    subject: '整套模考',
    type: 'single',
    tag: '单选',
    newType: true,
    title: '三次握手中第二次报文段的作用是？',
    stem: 'TCP 连接建立时，第二次握手主要在确认什么？',
    options: ['服务器关闭连接', '服务器收发能力正常', '客户端缓存已清空', '路由必然最短'],
    answer: ['B'],
    analysis: '第二次握手确认服务端可达且收发能力正常，同时返回 SYN+ACK。',
    note: '考场题型会把握手、挥手、窗口与确认机制混在一起考。',
  },
  {
    id: 'mock-2',
    subject: '整套模考',
    type: 'multiple',
    tag: '多选',
    newType: true,
    title: '408 中常见的题型有哪些？',
    stem: '从备考实践看，哪些题型是冲刺阶段一定要强化的？',
    options: ['选择题', '计算题', '综合大题', '证明题'],
    answer: ['A', 'B', 'C'],
    analysis: '408 的主体题型以选择题、计算题和综合大题为主。',
    note: '新题型不等于脱离基础，核心还是选择 + 计算 + 综合。',
  },
  {
    id: 'ds-3',
    subject: '数据结构',
    type: 'single',
    tag: '单选',
    newType: false,
    title: '队列的基本操作是？',
    stem: '队列（Queue）最本质的操作是什么？',
    options: ['插入和删除', '排序和查找', '合并和拆分', '压缩和展开'],
    answer: ['A'],
    analysis: '队列是一种先进先出的线性表，核心操作就是入队和出队。',
    note: '队列 = FIFO，栈 = LIFO。',
  },
  {
    id: 'net-3',
    subject: '计算机网络',
    type: 'single',
    tag: '单选',
    newType: true,
    title: 'DNS 主要完成什么功能？',
    stem: 'DNS 在互联网中最主要的作用是什么？',
    options: ['域名解析', '进程调度', '页面置换', '数据压缩'],
    answer: ['A'],
    analysis: 'DNS 负责把域名转换为 IP 地址，属于典型的应用层基础协议。',
    note: '域名题经常和 HTTP、URL、IP 一起出现。',
  },
]

export const practiceSubjectSequence = ['数据结构', '计算机组成原理', '操作系统', '计算机网络', '整套模考']

const createQuestionState = (question) => ({
  status: 'new',
  selected: question.type === 'multiple' ? [] : '',
  stepStatus: question.type === 'essay' ? question.steps.map(() => false) : [],
  correctCount: 0,
  wrongCount: 0,
  inWrongBook: false,
  favoriteImportance: 0,
  lastFavoriteAt: '',
  note: question.note || '',
  lastWrongAt: '',
  lastCorrectAt: '',
  essayDone: false,
  newTypeSeen: question.newType,
})

const createInitialQuestionStates = () =>
  Object.fromEntries(practiceQuestions.map((question) => [question.id, createQuestionState(question)]))

const seededStates = createInitialQuestionStates()

Object.assign(seededStates['ds-1'], {
  status: 'correct',
  selected: 'B',
  correctCount: 1,
  lastCorrectAt: todayKey(),
})
Object.assign(seededStates['ds-2'], {
  status: 'wrong',
  selected: ['A', 'D'],
  wrongCount: 1,
  inWrongBook: true,
  lastWrongAt: todayKey(),
})
Object.assign(seededStates['co-1'], {
  status: 'correct',
  selected: 'A',
  correctCount: 1,
  lastCorrectAt: todayKey(),
})
Object.assign(seededStates['co-2'], {
  status: 'wrong',
  selected: 'A',
  wrongCount: 1,
  inWrongBook: true,
  lastWrongAt: todayKey(),
})
Object.assign(seededStates['os-1'], {
  status: 'correct',
  selected: 'B',
  correctCount: 1,
  lastCorrectAt: todayKey(),
})
Object.assign(seededStates['os-2'], {
  status: 'wrong',
  stepStatus: [true, false, false],
  wrongCount: 1,
  inWrongBook: true,
  lastWrongAt: todayKey(),
})
Object.assign(seededStates['net-1'], {
  status: 'correct',
  selected: 'A',
  correctCount: 1,
  lastCorrectAt: todayKey(),
})
Object.assign(seededStates['net-2'], {
  status: 'wrong',
  selected: ['A', 'D'],
  wrongCount: 1,
  inWrongBook: true,
  lastWrongAt: todayKey(),
})
Object.assign(seededStates['ds-3'], {
  status: 'correct',
  selected: 'A',
  correctCount: 1,
  lastCorrectAt: todayKey(),
})
Object.assign(seededStates['mock-1'], {
  favoriteImportance: 1,
})
Object.assign(seededStates['mock-2'], {
  favoriteImportance: 2,
})

const createInitialState = () => ({
  selectedSubject: '数据结构',
  practiceMode: '答题',
  currentQuestionId: 'ds-1',
  searchText: '408 题库',
  autoRemoveWrong: true,
  autoRemoveThreshold: 1,
  syncAt: '已同步 2 分钟前',
  wrongFilter: '按科目',
  favoriteFilter: '按考点',
  sessionSeconds: 831,
  questionStates: seededStates,
})

export const studyStore = reactive(createInitialState())

function findQuestion(questionId) {
  return practiceQuestions.find((question) => question.id === questionId)
}

function ensureQuestionState(questionId) {
  if (!studyStore.questionStates[questionId]) {
    const question = findQuestion(questionId)
    if (question) {
      studyStore.questionStates[questionId] = createQuestionState(question)
    }
  }
  return studyStore.questionStates[questionId]
}

export function getQuestionsBySubject(subject) {
  if (subject === '整套模考') return practiceQuestions
  return practiceQuestions.filter((question) => question.subject === subject)
}

export function setSubject(subject) {
  studyStore.selectedSubject = subject
  const list = getQuestionsBySubject(subject)
  if (list.length) {
    studyStore.currentQuestionId = list[0].id
  }
}

export function setCurrentQuestion(questionId) {
  if (findQuestion(questionId)) {
    studyStore.currentQuestionId = questionId
  }
}

function sameSet(current, next) {
  if (current.length !== next.length) return false
  return current.every((item) => next.includes(item))
}

function afterCorrect(questionId) {
  const state = ensureQuestionState(questionId)
  state.correctCount += 1
  state.lastCorrectAt = todayKey()
  state.status = 'correct'
  if (state.inWrongBook && studyStore.autoRemoveWrong && state.correctCount >= studyStore.autoRemoveThreshold) {
    state.inWrongBook = false
  }
}

function afterWrong(questionId) {
  const state = ensureQuestionState(questionId)
  state.wrongCount += 1
  state.lastWrongAt = todayKey()
  state.status = 'wrong'
  state.inWrongBook = true
}

export function answerSingle(questionId, option) {
  const question = findQuestion(questionId)
  if (!question) return false
  const state = ensureQuestionState(questionId)
  state.selected = option
  const isCorrect = question.answer[0] === option
  if (isCorrect) {
    afterCorrect(questionId)
  } else {
    afterWrong(questionId)
  }
  return isCorrect
}

export function answerMultiple(questionId, options) {
  const question = findQuestion(questionId)
  if (!question) return false
  const state = ensureQuestionState(questionId)
  const normalized = [...new Set(options)].sort()
  state.selected = normalized
  const isCorrect = sameSet(normalized, [...question.answer].sort())
  if (isCorrect) {
    afterCorrect(questionId)
  } else {
    afterWrong(questionId)
  }
  return isCorrect
}

export function toggleEssayStep(questionId, index) {
  const question = findQuestion(questionId)
  if (!question || question.type !== 'essay') return false
  const state = ensureQuestionState(questionId)
  state.stepStatus[index] = !state.stepStatus[index]
  const allDone = state.stepStatus.every(Boolean)
  if (allDone && !state.essayDone) {
    state.essayDone = true
    afterCorrect(questionId)
  } else if (!allDone) {
    state.essayDone = false
    state.status = 'new'
  }
  return state.stepStatus[index]
}

export function toggleFavorite(questionId) {
  const state = ensureQuestionState(questionId)
  state.favoriteImportance = (state.favoriteImportance + 1) % 3
  state.lastFavoriteAt = state.favoriteImportance ? todayKey() : ''
}

export function setFavoriteImportance(questionId, importance) {
  const state = ensureQuestionState(questionId)
  state.favoriteImportance = importance
  state.lastFavoriteAt = importance ? todayKey() : ''
}

export function clearFavorites() {
  practiceQuestions.forEach((question) => {
    const state = ensureQuestionState(question.id)
    state.favoriteImportance = 0
    state.lastFavoriteAt = ''
  })
}

export function clearWrongBook() {
  practiceQuestions.forEach((question) => {
    const state = ensureQuestionState(question.id)
    state.inWrongBook = false
    if (state.status === 'wrong') {
      state.status = state.correctCount > 0 ? 'correct' : 'new'
    }
  })
}

export function syncStudyData() {
  studyStore.syncAt = `已同步 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
}

export function formatCountdownDays() {
  const diff = EXAM_DATE.getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function formatSessionTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remain = String(seconds % 60).padStart(2, '0')
  return `${minutes}:${remain}`
}

export function getQuestionState(questionId) {
  return ensureQuestionState(questionId)
}

export function getCurrentQuestion() {
  return findQuestion(studyStore.currentQuestionId) || practiceQuestions[0]
}

export function getSubjectByLabel(label) {
  return subjects.find((subject) => subject.label === label) || subjects[0]
}

export function getAnsweredCount() {
  return practiceQuestions.filter((question) => {
    const state = studyStore.questionStates[question.id]
    return state?.status === 'correct' || state?.status === 'wrong' || state?.essayDone
  }).length
}

export function getWrongQuestions() {
  return practiceQuestions.filter((question) => studyStore.questionStates[question.id]?.inWrongBook)
}

export function getFavoriteQuestions() {
  return practiceQuestions.filter((question) => (studyStore.questionStates[question.id]?.favoriteImportance || 0) > 0)
}

export function getWrongCount() {
  return getWrongQuestions().length
}

export function getFavoriteCount() {
  return getFavoriteQuestions().length
}

export function getImportantFavoriteCount() {
  return practiceQuestions.filter((question) => studyStore.questionStates[question.id]?.favoriteImportance === 1).length
}

export function getVeryImportantFavoriteCount() {
  return practiceQuestions.filter((question) => studyStore.questionStates[question.id]?.favoriteImportance === 2).length
}

export function groupQuestionsBy(key) {
  return practiceQuestions.reduce((acc, question) => {
    const state = studyStore.questionStates[question.id]
    const groupKey = key === 'type' ? question.tag : question.subject
    if (!acc[groupKey]) {
      acc[groupKey] = []
    }
    acc[groupKey].push({ question, state })
    return acc
  }, {})
}

export function getSubjectDistribution(source = 'wrong') {
  return subjects.map((subject) => {
    const questions = practiceQuestions.filter((question) => question.subject === subject.label)
    const count =
      source === 'favorites'
        ? questions.filter((question) => (studyStore.questionStates[question.id]?.favoriteImportance || 0) > 0).length
        : questions.filter((question) => studyStore.questionStates[question.id]?.inWrongBook).length
    return {
      subject: subject.label,
      count,
      total: questions.length,
    }
  })
}

export function getDailyNewWrongCount() {
  return practiceQuestions.filter((question) => studyStore.questionStates[question.id]?.lastWrongAt === todayKey()).length
}

export function getDailyNewFavoriteCount() {
  return practiceQuestions.filter((question) => {
    const state = studyStore.questionStates[question.id]
    return state?.favoriteImportance > 0 && state?.lastFavoriteAt === todayKey()
  }).length
}

export function getWrongRatio() {
  const answered = getAnsweredCount()
  const wrong = getWrongCount()
  return answered ? Math.round((wrong / answered) * 100) : 0
}

watch(
  studyStore,
  () => {
    if (typeof window === 'undefined') return
    const payload = JSON.stringify(studyStore)
    window.localStorage.setItem(STORAGE_KEY, payload)
  },
  { deep: true }
)

if (typeof window !== 'undefined') {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw) {
    const saved = JSON.parse(raw)
    Object.assign(studyStore, saved)
    studyStore.questionStates = {
      ...createInitialQuestionStates(),
      ...(saved.questionStates || {}),
    }
    const subjectQuestions = getQuestionsBySubject(studyStore.selectedSubject)
    const currentValid = subjectQuestions.some((question) => question.id === studyStore.currentQuestionId)
    if (!currentValid) {
      studyStore.currentQuestionId = getQuestionsBySubject(studyStore.selectedSubject)[0]?.id || practiceQuestions[0].id
    }
  }
} catch {
    // Ignore bad local storage state and keep defaults.
  }
}
