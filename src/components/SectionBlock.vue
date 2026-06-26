<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-end justify-between gap-3">
      <div>
        <h2 class="section-title">{{ title }}</h2>
        <p v-if="subtitle" class="section-subtitle mt-1">{{ subtitle }}</p>
      </div>
      <slot name="action" />
    </div>
    <slot />
  </section>
</template>
