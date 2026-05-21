<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'

const props = defineProps<{ content: string }>()

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
})

const rendered = computed(() => md.render(props.content || ''))
</script>

<template>
  <div class="prose prose-sm dark:prose-invert max-w-none prose-slate prose-a:text-slate-900 dark:prose-a:text-slate-100 prose-code:text-sm prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded" v-html="rendered" />
</template>
