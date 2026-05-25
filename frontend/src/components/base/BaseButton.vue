<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  variant?: 'primary' | 'danger'
  filled?: boolean
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  loading?: boolean
  disabled?: boolean
  as?: string | object
}>()
</script>

<template>
  <component
    :is="as || 'button'"
    :disabled="as ? undefined : (disabled || loading)"
    :data-variant="variant || 'primary'"
    :data-filled="filled || undefined"
    class="inline-flex items-center justify-center gap-1.5 font-semibold rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[
      {
        'px-2.5 py-1.5 text-xs': size === 'sm',
        'px-5 py-2.5 text-sm': size === 'md' || !size,
        'px-6 py-3 text-sm': size === 'lg',
      },
    ]"
  >
    <Icon v-if="loading" icon="lucide:loader-2" class="w-4 h-4 animate-spin" />
    <Icon v-else-if="icon" :icon="icon" class="w-4 h-4" />
    <slot />
  </component>
</template>

<style scoped>
/* Primary filled */
[data-variant="primary"][data-filled] {
  background-color: #0f172a;
  color: #fff;
  border: none;
}
[data-variant="primary"][data-filled]:hover {
  background-color: #1e293b;
}
[data-variant="primary"][data-filled]:active {
  background-color: #020617;
}
:is(.dark *) [data-variant="primary"][data-filled] {
  background-color: #f1f5f9;
  color: #0f172a;
}
:is(.dark *) [data-variant="primary"][data-filled]:hover {
  background-color: #e2e8f0;
}
:is(.dark *) [data-variant="primary"][data-filled]:active {
  background-color: #cbd5e1;
}

/* Primary outline */
[data-variant="primary"]:not([data-filled]) {
  background-color: transparent;
  border: 1px solid #cbd5e1;
  color: #334155;
}
[data-variant="primary"]:not([data-filled]):hover {
  background-color: #f1f5f9;
}
[data-variant="primary"]:not([data-filled]):active {
  background-color: #e2e8f0;
}
:is(.dark *) [data-variant="primary"]:not([data-filled]) {
  border-color: #334155;
  color: #e2e8f0;
}
:is(.dark *) [data-variant="primary"]:not([data-filled]):hover {
  background-color: #1e293b;
}
:is(.dark *) [data-variant="primary"]:not([data-filled]):active {
  background-color: #334155;
}

/* Danger filled */
[data-variant="danger"][data-filled] {
  background-color: #ef4444;
  color: #fff;
  border: none;
}
[data-variant="danger"][data-filled]:hover {
  background-color: #dc2626;
}
[data-variant="danger"][data-filled]:active {
  background-color: #b91c1c;
}

/* Danger outline */
[data-variant="danger"]:not([data-filled]) {
  background-color: transparent;
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}
[data-variant="danger"]:not([data-filled]):hover {
  background-color: rgba(239, 68, 68, 0.1);
}
[data-variant="danger"]:not([data-filled]):active {
  background-color: rgba(239, 68, 68, 0.2);
}
:is(.dark *) [data-variant="danger"]:not([data-filled]) {
  border-color: rgba(248, 113, 113, 0.3);
  color: #f87171;
}
:is(.dark *) [data-variant="danger"]:not([data-filled]):hover {
  background-color: rgba(248, 113, 113, 0.1);
}
</style>
