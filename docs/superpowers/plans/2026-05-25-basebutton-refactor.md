# BaseButton Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor BaseButton to use `variant` prop instead of `danger`, lock core styles with attribute selectors in scoped CSS, and migrate the one call site using `danger`.

**Architecture:** Replace the `danger` boolean prop with a `variant: 'primary' | 'danger'` prop. Move all color/background/border styles from Tailwind dynamic `:class` into `<style scoped>` using `data-variant` and `data-filled` attribute selectors for higher specificity. Clean up `app.css` dark-mode force-generation line.

**Tech Stack:** Vue 3.5, TailwindCSS 4, scoped CSS with attribute selectors

---

### Task 1: Refactor BaseButton component

**Files:**
- Modify: `frontend/src/components/base/BaseButton.vue`

- [ ] **Step 1: Replace the entire BaseButton.vue with refactored version**

```vue
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
```

- [ ] **Step 2: Verify the dev server compiles without errors**

Run: `cd frontend && npm run build 2>&1 | tail -5`
Expected: Build succeeds (may have the `danger` prop usage warning from TicketDetailView — that's fixed in Task 2)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/base/BaseButton.vue
git commit -m "refactor(ui): BaseButton use variant prop and scoped attribute selectors"
```

---

### Task 2: Migrate TicketDetailView danger usage

**Files:**
- Modify: `frontend/src/views/TicketDetailView.vue:232`

- [ ] **Step 1: Replace `danger` with `variant="danger"`**

Change line 232 from:
```html
<BaseButton size="sm" danger @click="rejectTicket">拒绝</BaseButton>
```
to:
```html
<BaseButton size="sm" variant="danger" @click="rejectTicket">拒绝</BaseButton>
```

- [ ] **Step 2: Verify build succeeds**

Run: `cd frontend && npm run build 2>&1 | tail -5`
Expected: Build succeeds with no warnings

- [ ] **Step 3: Commit**

```bash
git add frontend/src/views/TicketDetailView.vue
git commit -m "refactor(ui): migrate danger prop to variant in TicketDetailView"
```

---

### Task 3: Clean up app.css

**Files:**
- Modify: `frontend/src/app.css:4-5`

- [ ] **Step 1: Remove the `@source inline(...)` line**

Delete lines 4-5:
```css
/* Force Tailwind to generate dark-mode classes used in dynamic BaseButton bindings */
@source inline("dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:active:bg-slate-300 dark:border-slate-300 dark:border-red-400/30 dark:hover:bg-red-400/10 dark:hover:bg-slate-800 dark:active:bg-slate-700 dark:active:bg-slate-500 dark:bg-slate-300 dark:hover:bg-slate-400");
```

- [ ] **Step 2: Verify build succeeds**

Run: `cd frontend && npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app.css
git commit -m "refactor(ui): remove dark-mode force-generation line from app.css"
```
