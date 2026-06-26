# 组件文档

本文档整理了当前项目中复用率最高的 3 个基础组件，方便团队统一接入与维护。

## 1. `AppHeader`

### 组件介绍
全局顶部导航组件，包含品牌区、桌面端导航、移动端分段导航以及“开始刷题”入口。组件内部已接入 `vue-router`，用于当前路由高亮。

### Props说明
| 名称 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| 无 | - | - | 否 | 组件未暴露 props |

### Events说明
| 名称 | 参数 | 说明 |
| --- | --- | --- |
| 无 | - | 组件未对外抛出事件 |

### Slots说明
| 名称 | 说明 |
| --- | --- |
| 无 | 组件未提供插槽 |

### 示例代码
#### 基础用法
```vue
<script setup>
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <AppHeader />
</template>
```

#### 高级用法
`AppHeader` 适合作为全局布局壳统一挂载，通常与 `RouterView` 一起使用。

```vue
<script setup>
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <AppHeader />
  <main class="site-shell py-6">
    <RouterView />
  </main>
</template>
```

## 2. `SectionBlock`

### 组件介绍
通用内容分区组件，用于承载页面中的模块标题、描述和内容区域。支持右侧操作区，适合做列表区、统计区、课程区等布局。

### Props说明
| 名称 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| `title` | `String` | 无 | 是 | 分区标题 |
| `subtitle` | `String` | `''` | 否 | 分区副标题，可选 |

### Events说明
| 名称 | 参数 | 说明 |
| --- | --- | --- |
| 无 | - | 组件未对外抛出事件 |

### Slots说明
| 名称 | 说明 |
| --- | --- |
| `default` | 主内容区域 |
| `action` | 标题右侧操作区，常用于按钮或快捷入口 |

### 示例代码
#### 基础用法
```vue
<script setup>
import SectionBlock from '@/components/SectionBlock.vue'
</script>

<template>
  <SectionBlock title="核心入口" subtitle="双核心按钮 + 功能矩阵">
    <div class="grid gap-4 md:grid-cols-3">
      <div class="craft-card-solid rounded-[1.5rem] p-4">内容块 A</div>
      <div class="craft-card-solid rounded-[1.5rem] p-4">内容块 B</div>
      <div class="craft-card-solid rounded-[1.5rem] p-4">内容块 C</div>
    </div>
  </SectionBlock>
</template>
```

#### 高级用法
```vue
<script setup>
import SectionBlock from '@/components/SectionBlock.vue'
</script>

<template>
  <SectionBlock title="错题分布" subtitle="按科目查看本次复盘结果">
    <template #action>
      <button class="craft-btn craft-btn-soft px-4 py-2 text-sm">
        同步数据
      </button>
    </template>

    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div class="craft-card-solid rounded-[1.25rem] p-4">数据结构</div>
      <div class="craft-card-solid rounded-[1.25rem] p-4">组成原理</div>
      <div class="craft-card-solid rounded-[1.25rem] p-4">操作系统</div>
      <div class="craft-card-solid rounded-[1.25rem] p-4">计算机网络</div>
    </div>
  </SectionBlock>
</template>
```

## 3. `StatCard`

### 组件介绍
统计卡片组件，适合展示关键指标，如正确率、错题数、收藏数等。支持不同 `tone` 颜色语义，便于区分数据状态。

### Props说明
| 名称 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| `label` | `String` | 无 | 是 | 指标名称 |
| `value` | `String \| Number` | 无 | 是 | 指标值 |
| `hint` | `String` | `''` | 否 | 辅助说明，显示在数值右侧 |
| `tone` | `String` | `'slate'` | 否 | 数值强调色，可选值：`slate`、`sky`、`amber`、`orange`、`rose`、`emerald`、`violet`、`indigo` |

### Events说明
| 名称 | 参数 | 说明 |
| --- | --- | --- |
| 无 | - | 组件未对外抛出事件 |

### Slots说明
| 名称 | 说明 |
| --- | --- |
| 无 | 组件未提供插槽 |

### 示例代码
#### 基础用法
```vue
<script setup>
import StatCard from '@/components/StatCard.vue'
</script>

<template>
  <StatCard label="错题总数" :value="32" />
</template>
```

#### 高级用法
```vue
<script setup>
import { computed } from 'vue'
import StatCard from '@/components/StatCard.vue'

const accuracy = computed(() => 86)
</script>

<template>
  <StatCard
    label="本次正确率"
    :value="`${accuracy}%`"
    hint="较上次 +8%"
    tone="emerald"
  />
</template>
```

## 使用建议

- `AppHeader` 只建议在应用根布局中使用一次。
- `SectionBlock` 适合包裹页面中的独立模块，能统一标题区样式。
- `StatCard` 适合与统计面板、数据看板、复盘页组合使用。
