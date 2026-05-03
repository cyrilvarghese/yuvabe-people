---
name: yuvabe-vd-checker
description: Use to AUDIT a finished screen, page, or component against the Yuvabe ATS visual design system — contrast/AA compliance, palette adherence, typography, spacing scale, shadow discipline, terracotta budget, editorial peak. Triggers on phrases like "VD check", "audit this screen", "design audit", "is this on-brand?", "check accessibility", "review this page", or proactively right after a non-trivial UI change to a `.tsx` page or component. Companion to the generative `yuvabe-design-system` skill — that one informs WHAT to build; this one verifies what was built.
---

# Yuvabe VD Checker

A post-creation audit tool. Reads target file(s), cross-references the `yuvabe-design-system` skill and `app/globals.css`, emits findings, **does not auto-edit unless the user explicitly says so.**

## When to invoke

- User asks: "VD check", "audit this screen", "design audit", "review this page", "is this on-brand?", "check the design", "check accessibility"
- Proactively *after* writing a new page or making a non-trivial UI edit (>20 className changes, layout restructure, palette work)
- Before declaring a screen done

**Do not invoke** for backend code, API routes, schema changes, or trivial copy edits. This skill is about visual surface area.

## Inputs

1. Specific file(s): `app/jobs/page.tsx`, or a directory of pages
2. A route path: `/jobs/new` → resolves to `app/jobs/new/page.tsx`
3. If unspecified, default to the most recently modified `.tsx` page under `app/`

## Method

Read the target file(s) plus the dependencies they pull in (NavTab, layout primitives, etc.). Read `.claude/skills/yuvabe-design-system/SKILL.md` for the rules and `app/globals.css` for current token values. Run each audit category in order. Produce findings.

**The output is a report, not edits.** Auto-edit only when the user says explicitly: "fix the FAILs", "auto-fix", or "apply the suggestions".

## Audit categories

### A. Palette adherence

- All colors must come from `globals.css` tokens (`--background`, `--foreground`, `--muted-foreground`, `--primary`, `--accent`, `--border`, `--card`, etc.) or their corresponding Tailwind utilities (`bg-background`, `text-foreground`, etc.).
- **FAIL**: literal hex/rgb/hsl/oklch in className (e.g. `bg-[#fff]`, `text-[rgb(255,0,0)]`).
- **FAIL**: Tailwind default neutral palettes — `bg-zinc-*`, `bg-slate-*`, `bg-stone-*`, `bg-gray-*`, `bg-neutral-*`, and their text/border variants. The Yuvabe palette explicitly replaces these.
- **FAIL**: pure `bg-white` (use `bg-card` or `bg-background`) or `text-black` (use `text-foreground`).
- **WARN**: `bg-red-*`, `text-blue-*`, etc. — non-neutral Tailwind palettes have no place in this system.

### B. Contrast (the most common failure)

For every text element, parse its color (className tokens, including opacity modifiers) and bg (climb the parent chain to find the nearest non-transparent bg).

Use these approximations on `#FAF8F4` background:

| className | Ratio | Verdict |
|---|---|---|
| `text-foreground` | ~14.8:1 | PASS |
| `text-foreground/85` | ~10:1 | PASS |
| `text-foreground/70` | ~6:1 | PASS |
| `text-foreground/55` | ~5:1 | PASS |
| `text-foreground/40` | ~3:1 | borderline; FAIL for body text, OK for ≥18pt |
| `text-foreground/35` and below | <3:1 | FAIL except for genuinely decorative editorial fades |
| `text-muted-foreground` | ~4.6:1 | PASS (just) |
| `text-muted-foreground/80` | ~3.7:1 | FAIL for normal text |
| `text-muted-foreground/70` | ~3.2:1 | FAIL — except decorative glyphs (·, /, leading dots) |
| `text-muted-foreground/<70` | <3:1 | FAIL — even decorative glyphs become invisible |

Special rules:
- **FAIL**: any `text-muted-foreground/X` with X<80 used on **informational** text (caption labels, metadata, status text). Suggested fix: use `text-muted-foreground` (full strength) or `text-foreground/70`.
- **WARN**: any `text-foreground/X` with X<35 used on text without `font-serif italic` (editorial fade reserved for the italic Newsreader watermark moments).
- **FAIL**: state communicated by dim alone (e.g. disabled link via `text-muted-foreground/40` only). Must pair with `italic`, `aria-disabled`, `line-through`, or a tooltip.

When in doubt, suggest `text-foreground/70` for "softer than primary, harder than tertiary". It's the safest dim.

### C. Typography

- **FAIL**: `font-serif` on body paragraphs (>30 words). Newsreader is for moments, not bodies.
- **FAIL**: `uppercase` without `tracking-[0.14em]` to `tracking-[0.18em]`. Caps without tracking look cramped.
- **WARN**: caption-style text (`text-[10px] uppercase`) using `font-sans` instead of `font-mono`. The system caption is mono.
- **WARN**: any visible number (count, score, file size, timestamp) without `tabular-nums` or the `.tabular` utility. Numbers jitter as they update without it.
- **WARN**: type sizes outside the locked scale: `text-[3.5rem]` (display-xl), `text-[2.5rem]` (display-lg), `text-[1.75rem]`/`text-[28px]` (h1), `text-xl` (h2), `text-base` (h3), `text-[15px]` (body), `text-[13px]` (body-sm), `text-[10px]` (caption). Custom values like `text-[14px]` that don't match should be flagged.
- **WARN**: italic Newsreader at sizes ≤14px — italic small text is hard to read. Newsreader italic is for display moments only.

### D. Spatial

- **WARN**: spacing values outside `{1, 2, 3, 4, 6, 8, 12, 16, 24}` Tailwind steps (which map to 4/8/12/16/24/32/48/64/96 px). Specifically flag `p-5`, `p-7`, `p-9`, `m-5`, `m-7`, `mt-9`, `gap-5`, `gap-7` — these don't fit the 4px base unit cleanly.
- **FAIL**: `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full` (except on circular things like avatars — but we don't have those in this app yet). Allowed: `rounded-sm` (4px) for inputs/buttons/badges, `rounded` (8px) for cards. Anything larger violates the brief.
- **WARN**: borders with `border-2` or thicker on dividers. Dividers are 1px hairlines; `border-2` is reserved for the active nav tab underline.
- **FAIL**: dividers using `bg-foreground/10` or similar. Dividers should be `border-border` or `bg-border` to use the palette token, not arbitrary opacities.

### E. Shadow discipline

- **FAIL**: any Tailwind `shadow-*` utility (`shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`, `shadow-inner`).
- **PERMITTED ONLY**: the single Design Brief shadow, used on bulk action bars and modal dialogs. Currently not yet implemented anywhere; flag any introduction for review.
- The system uses **borders**, not elevation. Cards get `border border-border`, not `shadow-sm`.

### F. Component discipline

- **FAIL**: a file under `components/` that wraps a shadcn primitive just to add styles. Those styles should live in `className` at the call site.
- **FAIL**: a custom UI primitive that re-exports a shadcn component with a renamed name (e.g. `Pill` re-exporting `Badge` with default styles). Use shadcn primitives directly with `className`.
- **OK**: tiny *typographic atoms* defined inline at the top of a page file (`Eyebrow`, `ColumnMarker`, `HairRule`) — these are 3-line helpers that don't grow a variants API. They become a problem only when they accept props beyond `children`.
- **OK**: route-private subcomponents under `app/.../_components/` (Next.js convention for client/server boundaries, not "primitives").

### G. Editorial peak

- **WARN**: a major page (h1, page-level title) with **zero** italic Newsreader (`font-serif italic`) usage. Every editorial spread should have one moment.
- **WARN**: an empty state without a *thesis* — a stock "no data" message instead of a quote that explains what the screen embodies. Examples to *aim for*: *"No applications yet for this role."*, *"A score without reasoning is not a score."* Examples to *avoid*: *"Nothing here yet."*, *"No items found."*

### I. Responsiveness

Target: usable down to 360px viewport. Mobile = "doesn't break", not "is feature-optimized."

- **FAIL**: outer page container uses `h-screen overflow-hidden` without an `md:` guard. Pattern: `min-h-screen md:h-screen md:overflow-hidden` instead. Without the guard, the viewport is locked on mobile and content gets clipped.
- **FAIL**: a `grid grid-cols-2` or `grid grid-cols-[Xpx_1fr]` without `grid-cols-1 md:grid-cols-...` prefix. Two columns shouldn't survive into mobile.
- **FAIL**: page padding written as just `px-10` / `px-12` (with no responsive prefix). Use `px-4 sm:px-6 md:px-10` or similar.
- **FAIL**: a sticky aside (`md:grid-cols-[340px_1fr]`) where the aside doesn't have `border-b md:border-r md:border-b-0` — without this, the visual divider between aside and main is wrong on mobile.
- **WARN**: display-size text (`text-3xl`, `text-4xl`, `text-5xl`, `text-[2.75rem]`, etc.) without a smaller responsive variant (`text-xl md:text-3xl`). Big italic Newsreader at 2.75rem on a 375px viewport eats most of the column.
- **WARN**: a `nav` row with multiple items lacking `overflow-x-auto`. On narrow screens the tabs would wrap or compress.
- **WARN**: secondary metadata in row layouts (timestamps, secondary counts) not hidden on small screens with `hidden sm:inline` / `hidden md:inline`. On mobile the row gets visually cluttered.
- **WARN**: gap values that don't scale (`gap-6`, `gap-8`) without `gap-3 md:gap-6`. Tight rows on mobile, loose on desktop.
- **FYI**: pages where ColumnMarker (i. ii.) doesn't apply `text-3xl md:text-5xl`. The numeral at full size on mobile dominates the screen.

### H. Terracotta budget

Count uses of `text-primary`, `bg-primary`, `border-primary`, `ring-primary`, `from-primary`, `via-primary`, `to-primary`.

- **PASS**: 3–6 uses per screen.
- **WARN**: >8 uses on a single screen — terracotta is precious; budget overshoot dilutes the accent.
- **WARN**: 0 uses on a screen with primary CTAs — the brand accent is missing where it would read as the action.

### I. Behavior — affordances, microinteractions, motion

The DS Behavior layer rules cover *how* interactive elements behave. Audit each interactive element (`<button>`, `<a>`, `<input>`, `<select>`, `<textarea>`, shadcn `Button`/`Input`/`Switch`/`Dialog`/`Sheet`/`DropdownMenu`/`AlertDialog`, plus any element with `onClick` / `role="button"`).

**States** — every interactive element should define them. Look for:

- **FAIL**: an interactive element with no `hover:` style and no `disabled:` style — usually means states were never thought through.
- **FAIL**: `focus-visible:outline-none` (or `focus:outline-none`) without a replacement ring (`focus-visible:ring-*`). The terracotta ring is mandatory.
- **FAIL**: disabled state shown by opacity alone — must combine `disabled:opacity-50` **with** `disabled:pointer-events-none` **with** `disabled:cursor-not-allowed` **and** a non-color cue (italic, label change, icon, `aria-disabled`).
- **WARN**: state distinguishable by color shift only — pair with text, icon, border weight, or italic.

**Affordances** — look for:

- **FAIL**: `cursor-pointer` on an element that is also `disabled` or has `pointer-events-none`.
- **WARN**: `cursor-pointer` on a non-interactive `<div>` / `<span>` that has no `onClick`, `role`, or keyboard handler (looks clickable, isn't).
- **WARN**: a clickable `<div>` (with `onClick`) that is missing `cursor-pointer`, `role="button"`, `tabIndex={0}`, or keyboard handlers — pick a real `<button>` instead.
- **WARN**: button styled to look like a link (no border, no bg) without `<Button variant="link">`, or a link styled to look like a filled button without the right variant.

**Motion — violations** (the existing rules; flag the wrong motion). Look for:

- **FAIL**: `animate-bounce`, `animate-spin` outside an explicit loading spinner (`Loader2`), `animate-ping`, or any `animation-*` referencing shimmer / parallax / scroll-driven choreography.
- **FAIL**: spring / bounce easing or any custom cubic-bezier overshooting 1.0 (`ease-[cubic-bezier(...)]` with values >1 or <0).
- **FAIL**: translates outside the subtlety budget — `translate-x-2` and larger, `translate-y-2` and larger. Allowed: `translate-x-px`, `-translate-x-px`, `translate-y-px`, `-translate-y-px` (1–2px).
- **FAIL**: scales outside `0.98`–`1.02`. Specifically flag `scale-95`, `scale-90`, `scale-105`, `scale-110`, `hover:scale-105`+. Press scale `active:scale-[0.99]` is permitted on buttons.
- **FAIL**: any `rotate-*` on `hover:` or `data-[state=*]` (loading spinner is the only allowed rotate).
- **FAIL**: `duration-*` outside the canonical `duration-100` / `duration-150` / `duration-200` / `duration-300` / `duration-400` / `duration-[800ms]` set. Specifically flag `duration-500`, `duration-700`, `duration-1000`. The `800ms` slot is reserved for the in-page confirmation flash (`.highlight-confirm`). The `5s` of `.highlight-new` is the *one* legitimate exception — it fires on page-load arrival, not in-page; flag any *new* 5s duration that isn't `.highlight-new`.
- **FAIL** *(new)*: `hover:shadow-sm` / `hover:shadow-md` / `hover:shadow-lg` / `hover:shadow-xl` / `hover:shadow-2xl` or any Tailwind `shadow-*` utility on a hover state — the system has exactly two shadows (`--shadow-hover` for hover-lift on rows/cards, the heavy modal shadow for modals + bulk-action bar). Tailwind's defaults are too heavy for the editorial palette.
- **FAIL** *(new)*: `hover:-translate-y-*` or `hover:shadow-[...]` on a `<Button>` element — the lift is a *destination* affordance (cards / rows / row-as-link only). Buttons stay color-only on hover.
- **FAIL** *(new)*: A component references `var(--shadow-hover)` but `app/globals.css` does not define the `--shadow-hover` token — token referenced but not defined.
- **FAIL** *(new)*: A component references `animation: button-shake` (or applies a `button-shake` class) but `app/globals.css` does not define `@keyframes button-shake` — keyframe referenced but not defined.
- **FAIL** *(new)*: Animating `width`, `height`, `top`, `left`, `border-color`, or `background-color` for any transition with `duration > 100ms`. Only `transform` and `opacity` are permitted on every-frame paths. Color hover/focus is the one exception, capped at `100–150ms`.
- **WARN**: shadcn `DialogContent` / `SheetContent` / `DropdownMenuContent` / `PopoverContent` / `SelectContent` with default `data-[state=open]:zoom-in-95` left in (5% scale exceeds the 2% budget). Default to fade-only; a ≤2px translate is acceptable as a directional cue.
- **WARN**: shadcn primitive with `slide-in-from-{side}-2` or larger (8px+ slide distance) — cap at `slide-in-from-{side}-px` (1–2px).
- **WARN**: a skeleton loader using a shimmer/gradient `bg-gradient-to-r` with `animate-*` instead of plain `animate-pulse` on a hairline-bordered surface.
- **WARN**: a "Loading…" string with no specific subject (should be "Saving candidate…", "Reading the description…", etc.).
- **WARN** *(new)*: more than one motion verb composed on a single element per state — e.g., `hover:-translate-y-px hover:scale-[1.01] hover:shadow-[...]` is three motions; pick one (the `--shadow-hover` lift token already pairs translate + shadow as one).
- **WARN** *(new)*: looped `button-shake` (or any `animate-iteration-count: infinite` on a shake/error animation) — error feedback is one oscillation, never looped.

**Motion — completeness** *(new subsection — flag *absences* where motion is needed):

- **WARN**: a `<button>` whose `onClick` triggers `fetch(...)`, `startTransition(...)`, or any async handler — but the button has no `<Loader2>`, no text-swap (e.g., `"Save"` ⇄ `"Saving…"`), and no `aria-busy={...}`. Invisible pending state. (See DS §Motion VERB 2: ACKNOWLEDGE.)
- **WARN**: component uses `useTransition()` / `isPending` and the *only* visible pending change is `disabled={isPending}` — same problem; needs spinner or optimistic + flash.
- **WARN**: optimistic-UI handler (`useOptimistic` / `setOptimisticStatus`) on a button that *also* sets `disabled={isPending}` — the action already happened in the user's mental model; disabling reads as "broken."
- **WARN**: list-row / `<a>` row / card with `hover:bg-*` only and no `hover:-translate-y-px` + `hover:shadow-[var(--shadow-hover)]` — row-as-link hover affordance incomplete. (See DS §Motion VERB 1: RESPOND.)
- **WARN**: row-as-link surface missing `focus-within:ring-2 focus-within:ring-ring` — keyboard users get no "you are here" signal.
- **WARN**: page-level `<Suspense>` whose `fallback` is unstyled HTML, raw text, or a non-shape-matching skeleton — skeleton must mirror the final layout (same hairlines, same row heights, same column counts) or the swap shifts layout.
- **WARN**: long-running async (LLM call, multi-second fetch) that uses a *skeleton* instead of a labeled spinner — skeletons require predictable output shape; LLM responses don't have one. (See DS §Motion VERB 3: REVEAL decision tree.)
- **WARN**: async error path that surfaces only as a toast, with no inline error caption next to the failed control — toast can be missed; the button or form section must own the error.

**Route-level pending feedback and transitions** *(new subsection — the most common cause of "the screen sat there, then suddenly swapped"):

- **FAIL** *(new)*: a route segment whose `page.tsx` `await`s a database/network read (Supabase, fetch, LLM, etc.) but has no sibling `loading.tsx`. Without it, the user clicks a `<Link>` and stares at the previous page until data resolves. Fix: add `app/<segment>/loading.tsx` whose skeleton mirrors the destination layout (same outer shell, same header/footer, same hairlines, same row heights, same column counts). Reference `app/jobs/new/page.tsx:537-609` for the canonical skeleton pattern.
- **WARN** *(new)*: `app/layout.tsx` doesn't wrap `{children}` in either (a) a route-fade wrapper (CSS opacity transition keyed on `pathname`) **or** (b) a React `<ViewTransition>` after enabling `experimental.viewTransition: true` in `next.config`. Either is fine; the current default — a hard cut between routes — is a clarity failure for an editorial brand. The fade wrapper is the simpler, lower-risk option for v0.1.
- **WARN** *(new)*: a route-fade wrapper exists but is missing `data-fade` (or `.fade-preserve`) — the reduced-motion CSS block in `globals.css` flattens *all* transitions to 1ms, which turns the route fade into a hard cut precisely for users who already chose to reduce motion. The opacity fade should be the *one* motion they keep.
- **FYI** *(new)*: route uses `<Link prefetch={false}>` without a `useLinkStatus`-driven inline hint — the user gets no acknowledgement until the destination renders. Either restore prefetch or wire the hint per https://nextjs.org/docs/app/api-reference/functions/use-link-status. Note that with `loading.tsx` in place at the destination, this rarely matters.

**Reduced motion** — look for:

- **FYI**: `app/globals.css` lacks a `@media (prefers-reduced-motion: reduce)` block reducing `animation-duration` / `transition-duration` to 1ms. Should exist once, project-wide.
- **FYI** *(new)*: reduced-motion block exists but doesn't preserve opacity-fade transitions (a `data-fade` / `.fade-preserve` opt-out, or equivalent) — flat 1ms turns content swaps into hard cuts, which is jarring even for motion-sensitive users.
- **FYI** *(new)*: reduced-motion block doesn't reset `*:hover { transform: none !important; }` — hover-lift should degrade to hover-color-only for motion-sensitive users.

## Output format

Emit findings grouped by severity. Cite `file:line` for each.

```
=== VD CHECK — <file or screen> ===

❌ FAIL  <category> — <one-line summary>
   file:line   current code or pattern
                  ↳ proposed fix
   why: <one-sentence rationale>

⚠️  WARN  <category> — <one-line summary>
   file:line   ...

ℹ️  FYI   <category> — <one-line note>
   file:line   ...

—————————————————————
SUMMARY: PASS  |  NEEDS-WORK  |  FAIL
   X fails, Y warns, Z fyis
   Top suggestion: <one specific change with biggest impact>
```

The single "Top suggestion" line at the bottom is the highest-leverage fix — useful when there are many findings and the user wants to know where to start.

## Auto-fix mode (opt-in only)

If the user says "fix the FAILs", "auto-fix the contrast issues", "apply suggestions", or similar, then *and only then*:

1. Apply all FAIL fixes in one pass via Edit tool calls.
2. Re-run the audit on the same file.
3. Report the new state.

**Never auto-fix WARNs or FYIs** — those are interpretive. Always require explicit user approval, even when "fix the FAILs" is invoked.

## What to NOT check

This skill is about *visual* design. Do not flag:
- Performance (bundle size, render perf)
- Accessibility beyond contrast + state-via-color (no aria audits, no keyboard navigation)
- React patterns (hooks, server vs. client components)
- TypeScript type safety
- Routing / data flow correctness
- **Flow-level interaction concerns** — row-as-link patterns, primary-action discipline, kebab thresholds, empty-state CTA count, drill-down navigation, card-vs-table-vs-list choice. Those live in [`yuvabe-interaction-design`](../yuvabe-interaction-design/SKILL.md) and have their own audit checklist there. Mention to run that skill if you spot a violation while doing a VD pass, but don't flag it here.

Those are out of scope. The user knows where to find a separate code-review skill if they want those.

## Reference files

- `.claude/skills/yuvabe-design-system/SKILL.md` — the source of truth this skill audits against
- `app/globals.css` — the actual palette token values
- `app/jobs/new/page.tsx`, `app/jobs/page.tsx` — canonical examples of "this is what passes"

## Worked example

```
=== VD CHECK — app/jobs/page.tsx ===

❌ FAIL  Contrast — inactive nav tab below AA
   app/jobs/_components/nav-tab.tsx:26   text-muted-foreground/60 (~2.9:1)
                                          ↳ text-foreground/55 (~5:1)
   why: muted-foreground at 60% opacity fails AA for normal text.

⚠️  WARN  Terracotta budget — 0 uses on a list page with a primary CTA
   app/jobs/page.tsx                     no text-primary / bg-primary found
                                          ↳ make "+ New job" button bg-primary text-primary-foreground
   why: the primary action should carry the accent; gray buttons read as secondary.

ℹ️  FYI   Editorial peak — italic Newsreader appears once
   app/jobs/page.tsx:78                  i. Jobs (text-5xl italic)
   why: the brief encourages at least one peak per page; this satisfies it.

—————————————————————
SUMMARY: NEEDS-WORK
   1 fail, 1 warn, 1 fyi
   Top suggestion: bump nav-tab inactive to text-foreground/55 — fixes the most visible AA gap.
```
