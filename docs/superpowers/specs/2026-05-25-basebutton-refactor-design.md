# BaseButton Refactor Design

## Goal

Refactor BaseButton to unify global button styling. Filled buttons always use a dark solid background (never white). Outline buttons use transparent background with border + text color. Use attribute selectors in scoped style to lock core styles against external class overrides.

## API Changes

### Props

- **Remove** `danger: boolean`
- **Add** `variant: 'primary' | 'danger'` (default: `'primary'`)
- **Keep** `filled`, `size`, `icon`, `loading`, `disabled`, `as` — unchanged

### Migration mapping

| Before | After |
|---|---|
| `<BaseButton filled>` | `<BaseButton filled>` (variant defaults to primary) |
| `<BaseButton danger>` | `<BaseButton variant="danger">` |
| `<BaseButton filled danger>` | `<BaseButton filled variant="danger">` |
| `<BaseButton>` (no filled, no danger) | `<BaseButton>` (unchanged) |

## Style Strategy

### Attribute selectors for core styles

Move color/background/border styles from Tailwind dynamic `:class` bindings into `<style scoped>` using attribute selectors on `data-variant` and `data-filled`. Attribute selectors have higher specificity than single class selectors, so external Tailwind classes (e.g. `bg-red-500`) cannot override core button state styles.

### Template bindings

```html
<component
  :is="as || 'button'"
  :disabled="as ? undefined : (disabled || loading)"
  :data-variant="variant || 'primary'"
  :data-filled="filled || undefined"
  class="btn-base"
  :class="[size classes]"
>
```

### Scoped style structure

Four core combinations, each with light + dark variants:

1. **primary filled** — `bg-slate-900 text-white`, hover `bg-slate-800`, active `bg-slate-950`; dark: `bg-slate-100 text-slate-900`, hover `bg-slate-200`, active `bg-slate-300`
2. **primary outline** — `bg-transparent border-slate-300 text-slate-700`, hover `bg-slate-100`, active `bg-slate-200`; dark: `border-slate-700 text-slate-200`, hover `bg-slate-800`, active `bg-slate-700`
3. **danger filled** — `bg-red-500 text-white`, hover `bg-red-600`, active `bg-red-700`
4. **danger outline** — `bg-transparent border-red-500/30 text-red-500`, hover `bg-red-500/10`, active `bg-red-500/20`; dark: `border-red-400/30 text-red-400`, hover `bg-red-400/10`

Dark mode wrapped with `:is(.dark *)` selector.

### Tailwind retains layout only

Tailwind classes on the component handle: `inline-flex`, `items-center`, `justify-center`, `gap-1.5`, `font-semibold`, `rounded-md`, `transition`, `disabled:opacity-50`, `disabled:cursor-not-allowed`, and size variants (`px/py/text`).

### Key constraint

Filled buttons always have a dark solid background — never white. Outline buttons have transparent background; semantics expressed via border + text color.

## Call-site Migration

18 BaseButton instances across the codebase. Only one uses `danger`:

- `TicketDetailView.vue:232` — `<BaseButton size="sm" danger @click="rejectTicket">` → `<BaseButton size="sm" variant="danger" @click="rejectTicket">`

All other call sites use `filled` or no variant props — they remain unchanged since `variant` defaults to `primary`.

## Cleanup

- Remove `danger` prop from BaseButton
- Remove `app.css:5` `@source inline(...)` line — dark-mode classes no longer need forced generation since they are authored in scoped style instead of dynamic Tailwind bindings
