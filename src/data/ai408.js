export const featureCards = [
  {
    title: '随机练习',
    note: '按科目快速开局',
    emoji: '练',
    href: '/practice',
    accent: 'from-sky-500 to-cyan-400',
  },
  {
    title: '错题本',
    note: '自动沉淀薄弱点',
    emoji: '错',
    href: '/mistakes',
    accent: 'from-rose-500 to-orange-400',
  },
  {
    title: '复盘统计',
    note: '一眼看见进步',
    emoji: '盘',
    href: '/review',
    accent: 'from-amber-500 to-orange-400',
  },
  {
    title: '收藏题目',
    note: '高优先级复习',
    emoji: '藏',
    href: '/favorites',
    accent: 'from-emerald-500 to-teal-400',
  },
  {
    title: 'AI 讲解',
    note: 'Qwen 流式输出',
    emoji: 'AI',
    href: '/practice',
    accent: 'from-indigo-500 to-sky-400',
  },
  {
    title: '题库导入',
    note: '管理员批量导题',
    emoji: '导',
    href: '/admin/import',
    accent: 'from-slate-900 to-slate-600',
  },
]

export const sprintShortcuts = [
  { title: '开始刷题', note: '进入随机练习', href: '/practice' },
  { title: '查看复盘', note: '查看本次结果', href: '/review' },
  { title: '错题本', note: '回看易错题', href: '/mistakes' },
]

export const reviewCourses = [
  {
    title: '高频考点',
    subtitle: '聚焦最常考的知识块',
    subject: '数据结构',
    accent: 'from-amber-100 to-orange-100',
  },
  {
    title: '薄弱项巩固',
    subtitle: '把错题变成稳定得分',
    subject: '操作系统',
    accent: 'from-sky-100 to-cyan-100',
  },
  {
    title: '大题模板',
    subtitle: '步骤化拆解综合题',
    subject: '计算机组成原理',
    accent: 'from-violet-100 to-indigo-100',
  },
]

export const mistakeCourses = [
  {
    title: '错题归纳',
    subtitle: '按知识点快速聚类',
    subject: '计算机网络',
    accent: 'from-sky-100 to-cyan-100',
  },
  {
    title: '常见陷阱',
    subtitle: '高频误区集中讲解',
    subject: '操作系统',
    accent: 'from-blue-100 to-indigo-100',
  },
  {
    title: '分步纠偏',
    subtitle: '大题按步骤拆开练',
    subject: '数据结构',
    accent: 'from-amber-100 to-yellow-100',
  },
]

export const favoriteCourses = [
  {
    title: '重点收藏',
    subtitle: '高优先级题目集中复习',
    subject: '计算机组成原理',
    accent: 'from-amber-100 to-orange-100',
  },
  {
    title: '直播讲解',
    subtitle: '收藏后继续跟进讲解',
    subject: '计算机网络',
    accent: 'from-sky-100 to-cyan-100',
  },
  {
    title: '高分题单',
    subtitle: '星标题直接串起来练',
    subject: '整套模拟',
    accent: 'from-slate-100 to-slate-200',
  },
]

export function formatSessionTime(seconds) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
  const minutes = Math.floor(safeSeconds / 60)
  const remain = String(safeSeconds % 60).padStart(2, '0')
  return `${minutes}:${remain}`
}
