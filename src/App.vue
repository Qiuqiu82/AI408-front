<script setup>
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />
    <main class="site-shell py-6 sm:py-8 lg:py-10">
      <RouterView />
    </main>
  </div>
</template>
