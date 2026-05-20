<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import ToastContainer from './ToastContainer.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <slot />
    </main>
    <ToastContainer />
  </div>
</template>
