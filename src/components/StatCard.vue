<script setup>
const toneClassMap = {
  slate: 'text-slate-600',
  sky: 'text-sky-600',
  amber: 'text-amber-600',
  orange: 'text-orange-600',
  rose: 'text-rose-600',
  emerald: 'text-emerald-600',
  violet: 'text-violet-600',
  indigo: 'text-indigo-600',
}

defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, default: '' },
  tone: { type: String, default: 'slate' },
})
</script>

<template>
  <div class="craft-card-solid rounded-[1.5rem] p-4 sm:p-5">
    <div class="text-sm font-medium text-slate-500">{{ label }}</div>
    <div class="mt-3 flex items-end gap-2">
      <div class="text-3xl font-semibold" :class="toneClassMap[tone] || toneClassMap.slate">{{ value }}</div>
      <div v-if="hint" class="pb-1 text-sm text-slate-400">{{ hint }}</div>
    </div>
  </div>
</template>
