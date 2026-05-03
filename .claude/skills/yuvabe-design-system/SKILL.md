---
name: yuvabe-design-system
description: Use when designing or building any UI in the Yuvabe ATS — pages, screens, components, forms, empty states, loading states, error states. Applies the project's editorial design system (warm palette, Newsreader serif + Geist sans + Geist Mono, hairline rules instead of shadows, Roman-numeral section markers, mono-caps metadata) and enforces "shadcn primitives only — no custom UI primitives." Should activate proactively before writing any .tsx file under /app/ or /components/, before adding new shadcn components, and before changing globals.css design tokens.
---

# Yuvabe ATS — Editorial Design System

## The thesis

> *Considered Editorial × Operational Precision.*
> A magazine next to an instrument. The New Yorker meets Linear.

Everything here serves three principles, in priority order:

1. **Reasoning before numbers** — every number must show its work; trust comes from explanation, not precision.
2. **Density where it earns its keep** — workbench screens (queues, tables) are dense and keyboard-driven; editorial screens (detail pages, empty states) breathe. Don't apply uniform spacing across the app; match the page to the work being done on it.
3. **Status changes are the conversation** — UI state transitions carry meaning; respect their weight.

## Hard constraints

These are non-negotiable. If a request appears to violate one, surface it before proceeding.

- **shadcn/ui primitives only — no custom UI primitives.** Use `<Button>`, `<Badge>`, `<Card>`, `<Input>`, `<Textarea>`, `<Label>`. *Never* write a `ScoreChip.tsx` or `EditorialQuote.tsx` with its own variants API. Visual identity lives in `className` strings + `globals.css` tokens. The exception: tiny *typographic atoms* defined inline at the top of a page file (e.g. an `Eyebrow` or `ColumnMarker` helper) are fine when they exist only in one file and don't grow a variants API.
- **Borders, not shadows.** Use 1px hairline borders in `--border` (#E5E0D5). Two shadows exist in the system, and only two: the *heavy* shadow on modals + the bulk-action bar, and the *hairline* `--shadow-hover` (`0 1px 2px rgb(26 24 21 / 0.04)`) for hover-lift on row-as-link surfaces and clickable cards. Both belong to specific use-cases — never reach for a Tailwind shadow utility (`shadow-sm`, `shadow-md`, etc.). Everywhere else: borders.
- **Tailwind 4 + CSS-first theming.** Tokens live in `app/globals.css` (palette in `:root`, type scale in `@theme inline`, caps utilities via `@utility`). No `tailwind.config.js`. **Use the type tokens (`text-meta`, `text-h2`, etc.) and caps utilities (`eyebrow`, `caps-action`, `caps-meta`) — never `text-[Xpx]` or arbitrary `tracking-[...]` in components.** If a value isn't in the scale, push back, don't invent.
- **No gradients.** Single subtle one allowed on the login screen background only — nowhere else.
- **No dark mode for the prototype.** Commit to light, do it well.

## The palette — locked

Values in `app/globals.css :root`. **Do not redefine these per-component.**

| Token | Hex | Use |
|---|---|---|
| `--background` | `#FAF8F4` | Page bg — warm off-white. Never pure white. |
| `--card` | `#FFFFFF` | Cards, table rows, lifted surfaces |
| `--secondary`, `--muted` | `#F4F1EA` | Hover wells, soft surfaces |
| `--accent` | `#E8D5CC` | Terracotta-tinted soft surface (rare use) |
| `--foreground` | `#1A1815` | Primary ink — warm near-black. **Never `#000`.** |
| `--muted-foreground` | `#8A857B` | Secondary/metadata ink |
| `--border` | `#E5E0D5` | Hairline borders, dividers |
| `--primary` | `#B8553A` | **Terracotta accent.** The single accent. Used ONLY for: primary CTAs, "must" labels, error states, focus rings, the `i./ii.` numerals. |
| `--primary-foreground` | `#FAF8F4` | Text on terracotta surfaces |

Terracotta is a precious resource — it should appear in 3–6 places per screen, not more. If a screen looks too cool/gray, it doesn't need more terracotta — it needs more Newsreader italic.

## Contrast & readability

WCAG AA target: **4.5:1 for normal text** (<18pt), **3:1 for large text** (≥18pt or ≥14pt bold). The warm palette is forgiving for primary ink but fragile when dimmed — pure `--muted-foreground` (`#8A857B`) is only ~4.6:1 on `--background`, so any opacity modifier on it falls below AA.

**Rule of thumb: dim ink, don't dim muted.** Use `text-foreground/X` to soften text — that gives you primary ink at reduced opacity, which is darker than `--muted-foreground` and readable down to ~`/55`. Reserve `text-muted-foreground` (full strength) for tertiary metadata that must stay AA. Never use `text-muted-foreground/X` on informational text — only on decorative glyphs.

| Pattern | Approx ratio on `#FAF8F4` | When to use |
|---|---|---|
| `text-foreground` | ~14.8 : 1 | Primary text (titles, body) |
| `text-foreground/70` | ~6 : 1 | Secondary metadata, caption labels, section headings |
| `text-foreground/55` | ~5 : 1 | Tertiary, watermarky-but-readable (empty-state quotes) |
| `text-muted-foreground` | ~4.6 : 1 (just AA) | Tertiary informational metadata, file sizes, timestamps |
| `text-muted-foreground/80` | ~3.7 : 1 | **Below AA.** Decorative only — italic ethos line at footer center |
| `text-muted-foreground/65–75` | ~3.1–3.3 : 1 | **Below AA.** Decorative glyphs only (·, /, leading dots, corner ornaments) |
| `text-muted-foreground/<60` | <3 : 1 | Avoid. Even decorative glyphs become invisible. |

**Disabled states**: dim alone is not enough — pair the dim with a second visual cue (italic, strikethrough, `aria-disabled`, tooltip explaining why). E.g. the disabled "View →" link uses `text-muted-foreground/65 italic` plus `aria-disabled` and a tooltip. AA spec considers state communicated by color *alone* a failure even when contrast passes.

**Editorial fade exception**: an empty-state quote in italic Newsreader at `text-foreground/55` is fine — large display text, decorative tone, paired with a fully-readable mono caption beneath. Don't extend this exception to functional text (buttons, captions, labels).

**Verification**: run the [`yuvabe-vd-checker`](../yuvabe-vd-checker/SKILL.md) skill after building any new screen. It computes contrast for every text-color combination and flags AA failures.

**Companion skill — flow design**: this skill governs *how a single surface looks*. For *how surfaces compose into flows* — list rows with multiple actions, row-as-link patterns, kebab thresholds, empty states, skeleton loading, drill-down navigation, card-vs-table-vs-list — read [`yuvabe-interaction-design`](../yuvabe-interaction-design/SKILL.md). Activate it before writing any list, table, or card-grid surface.

### Status (when needed in later slices)

| State | Color | Token name |
|---|---|---|
| New / Scored | `#8A857B` | gray, neutral |
| Shortlisted | `#2F5E7A` | deep teal-blue (HR signal) |
| Approved | `#3F6B3F` | forest green (terminal positive) |
| Rejected | `#8A857B` + strikethrough | same as new + line-through |
| Needs review | `#B8893A` | warm amber |

### Score bands

| Band | Threshold | Color |
|---|---|---|
| High | `>= 75` | `#3F6B3F` forest green |
| Mid | `50–74` | `#B8893A` warm amber |
| Low | `< 50` | `#B8553A` terracotta |

## Typography — three faces, paired carefully

Wired in `app/layout.tsx` via `next/font/google`. Available as Tailwind classes once mapped in `globals.css @theme`:

```ts
font-serif → Newsreader (variable, axes: opsz, italic supported)
font-sans  → Geist
font-mono  → Geist Mono
```

### When to use which

| Face | Use for | Don't use for |
|---|---|---|
| **Newsreader** (display, italic encouraged) | Page titles on detail pages, candidate names, editorial quotes, empty-state messages, score numbers on application detail, the `i.` / `ii.` column markers | Buttons, table cells, form labels |
| **Geist** (UI/body) | Tables, forms, buttons, navigation, body copy | Display moments, editorial flourishes |
| **Geist Mono** | Scores in tables, timestamps, IDs, eyebrow captions, "MUST"/"NICE" labels, percentages, file sizes, page numbers | Body paragraphs, button labels |

### Type scale — use the tokens, not raw px

**Hard rule: never use `text-[Xpx]` or arbitrary `tracking-[...]` in components.** All sizes are tokens defined in `app/globals.css @theme`. All the recurring caps patterns are composite utilities (`eyebrow`, `caps-action`, `caps-meta`) that bake in font + size + tracking together. If a value isn't in the table below, it doesn't exist — push back, don't invent.

**Size tokens** (generate `text-NAME` utilities via Tailwind 4 `@theme inline`):

| Token | Px | Use |
|---|---|---|
| `text-eyebrow` | 11 | Decorative caps — footer, header tags, glanced labels (always paired with `eyebrow` utility for tracking) |
| `text-meta` | 12 | Informational caps — counts, status, timestamps (always paired with `caps-meta` utility) |
| `text-body-sm` | 13 | Table cells, sub-row metadata, evidence text |
| `text-body` | 14 | Default body — criterion labels, contact info, sub-row meta |
| `text-body-lg` | 16 | Primary body — modern minimum, empty-state copy, file labels |
| `text-h3` | 18 | Card titles, prominent labels, score chips on detail pages |
| `text-h2` | 22 | Section heads, list-row titles (mobile) |
| `text-h1` | 28 | Utility H1, list-row titles (desktop), column-marker titles (desktop) |
| `text-display` | 32 | Prominent display, column-marker numerals (mobile), candidate name (mobile) |
| `text-display-md` | 40 | Responsive bridge for editorial display, score number (mobile) |
| `text-display-lg` | 48 | Editorial H1, candidate name (desktop), score number (desktop) |
| `text-display-xl` | 64 | Hero column-marker numerals (desktop) |

**Composite caps utilities** (each baked in `globals.css @utility` as size + tracking + uppercase + font-mono):

| Utility | Equivalent | Use |
|---|---|---|
| `eyebrow` | `font-mono text-eyebrow uppercase tracking-[0.18em] leading-none` | Decorative section markers, footer ethos line, breadcrumbs, "Roman-numeral" auxiliary labels |
| `caps-action` | `font-mono text-eyebrow uppercase tracking-[0.16em] leading-none` | Button/link labels, tappable caps elements (back links, "Replace", "Reject") |
| `caps-meta` | `font-mono text-meta uppercase tracking-[0.08em] leading-tight` | Informational caps that the user *reads to extract data* — counts, status pills, timestamps, tab labels, filter chips, JOB-XXX codes |

**Color stays separate** — apply `text-muted-foreground`, `text-primary`, etc. alongside the utility:

```tsx
<span className="caps-meta text-muted-foreground tabular">
  07 APPLICANTS
</span>
```

**The size→tracking inverse rule** (already baked into the utilities above): bigger size → tighter tracking. 11px caps at 0.18em reads elegant; 12px caps at 0.18em reads as shouting. Don't override the tracking in the utility unless you have a *very* specific editorial reason.

### Common mappings — what to reach for

| Need | Use |
|---|---|
| Section eyebrow ("Source file", "Match summary") | `<span className="eyebrow text-muted-foreground">` (or the inline `<Eyebrow>` atom in each page file) |
| Status pill in a list ("SHORTLISTED", "REVIEWING") | `<span className="caps-meta text-[#2F5E7A]">` |
| Count label on a row ("07 APPLICANTS · 11 MUST") | `<span className="caps-meta text-muted-foreground tabular">` |
| Button label (uppercase mono caps) | `<button className="caps-action text-foreground hover:bg-secondary border ...">` |
| Tab label (top nav) | `caps-meta` — tabs are read for navigation, not glanced |
| Footer | `eyebrow text-muted-foreground` |
| List-row primary title (italic Newsreader) | `font-serif italic text-h2 md:text-h1` |
| Candidate name on detail page | `font-serif italic text-display md:text-display-lg` |
| Column marker numeral (`i.`/`ii.`) | `font-serif italic text-display md:text-display-xl text-primary` |
| Empty-state quote | `font-serif italic text-display md:text-display-md text-foreground/55` |
| Body paragraph (give it room) | `text-body-lg` (16px) — empty-state copy, primary file labels |
| Body, default (general use) | `text-body` (14px) — criterion labels, sub-rows, descriptions |
| Table cell / sub-row metadata | `text-body-sm` (13px) |

### Italic Newsreader is the signature move

Use `font-serif italic` for: candidate names, page H1 on editorial pages, empty-state copy, pull-quote moments, the `i. / ii.` column markers, "Reading the description…" in-progress copy. **Do not use roman (non-italic) Newsreader for body copy.** Newsreader is for moments, not paragraphs.

### Typographic rules

- Tabular numerals on every score, count, or aligned number: `font-variant-numeric: tabular-nums` (a `.tabular` utility is in `globals.css`).
- Caption-style labels use the `eyebrow` utility (`font-mono text-eyebrow uppercase tracking-[0.18em]`) — letter-spacing is what makes them feel editorial, not the font alone.
- **Never use color alone to convey state** — always pair with text. Status badges use background tint + text; score chips use border color + number.

## Responsiveness

**Target**: usable down to **360px** viewport width. Desktop (≥1024px) is primary — a recruiter's workbench at full screen. Mobile/tablet must degrade *gracefully*, not be feature-optimized.

**Principle: stack, don't squeeze.** When two columns don't fit, collapse to one full-width column. Never try to keep two columns by shrinking type or tightening padding past the locked spacing scale.

### Breakpoints (Tailwind defaults)

| Prefix | Min width | Layout phase |
|---|---|---|
| (none) | < 640px | Mobile — single column, stacked, smaller display |
| `sm:` | 640px | Phablet — secondary metadata starts re-appearing |
| `md:` | 768px | Tablet — multi-column layouts engage here |
| `lg:` | 1024px | Desktop — full editorial refinement |

### Required responsive patterns

Every new page must apply these where applicable:

**Page gutter**:
```tsx
className="px-4 md:px-10"            // single-col page
className="px-4 sm:px-6 md:px-12"    // two-col inner column
```

**Two-column spread → stack at <md**:
```tsx
// Was: <main className="grid grid-cols-2 overflow-hidden">
className="grid grid-cols-1 md:grid-cols-2 overflow-hidden"

// Sticky aside layout (e.g. /applications/[id]):
className="grid grid-cols-1 md:grid-cols-[340px_1fr] overflow-hidden"
```

**Sticky aside → top section on mobile**:
```tsx
<aside className="border-b border-border md:border-r md:border-b-0 ...">
```

**Display sizes**: every Newsreader display moment scales down on mobile. Use tokens.
```tsx
text-display     md:text-display-xl   // ColumnMarker numeral (i. ii.) — 32 → 64
text-h2          md:text-h1            // List-row title / column-marker title — 22 → 28
text-display     md:text-display-lg   // Candidate name on detail page — 32 → 48
text-display-md  md:text-display-lg   // Score number on detail page — 40 → 48
text-display     md:text-display-md   // Empty-state quote — 32 → 40
```

**Vertical padding tighter on mobile**:
```tsx
className="pt-6 pb-6 md:pt-10 md:pb-5"  // static-top section
className="py-8 md:py-10"               // scrolling content area
```

**Secondary metadata hides on small screens**:
```tsx
className="hidden sm:inline"   // received time on a row when name + status are enough
className="hidden md:flex"     // an entire metadata column when stacked
```

**Score chip scales**:
```tsx
className="min-w-[44px] md:min-w-[58px] font-mono text-body-lg md:text-h3 tabular"
```

**Header utility links**: collapse text-with-icon to icon-only on mobile.
```tsx
<ArrowLeft className="h-3 w-3" />
<span className="hidden sm:inline">All jobs</span>
```

**Tabs row**: allow horizontal overflow rather than wrapping or shrinking.
```tsx
<nav className="px-4 md:px-10 flex items-center gap-6 md:gap-8 overflow-x-auto">
```

### Anti-patterns

- ❌ Using `text-eyebrow` (11px) or `text-meta` (12px) for *body* text on mobile to "make it fit". If text is too small at desktop scale, the page needs less content per row, not smaller letters. Body uses `text-body` / `text-body-lg`.
- ❌ Horizontal scroll on the body. The page itself should never scroll horizontally; only specific containers (tab strips, code blocks) may.
- ❌ Hiding *primary* information on mobile. If a status badge matters at desktop, it matters on mobile — find a place for it. Hide *secondary* metadata (timestamps, secondary counts) only.
- ❌ Sticky elements that take >40% of the mobile viewport. A 340px sticky aside at 360px viewport is 95% — not sticky, just *blocking*. Convert to a non-sticky top section on mobile.

### What stays the same

- The palette doesn't change at any breakpoint
- Typography faces don't change (Newsreader / Geist / Mono are everywhere)
- The 4px spacing scale doesn't relax — mobile still uses values from {4,8,12,16,24,32,48,64,96}, just smaller ones (px-4 instead of px-12)

### Mobile screen review checklist

Before declaring a screen done, view at 375px (iPhone SE) and verify:
- [ ] Page title is fully readable (no truncation that hides meaning)
- [ ] Primary CTAs are reachable and tappable (≥44px tap target)
- [ ] No horizontal page-level scroll
- [ ] Sticky elements take <40% of viewport
- [ ] List rows are scannable — name and primary metric still visible
- [ ] Secondary metadata can be omitted without losing the row's meaning

## Spatial language

- **4px base unit.** Scale: `4, 8, 12, 16, 24, 32, 48, 64, 96`. Don't use 6, 10, 14, 18 etc.
- **Page gutters**: `px-10` (40px) on desktop. Two-column pages: `p-12` (48px) per column.
- **Section spacing on detail pages**: `space-y-12` (48px) between major sections.
- **Table row height**: dense `h-12` (48px) for jobs list, `h-14` (56px) for applicant queue (taller because more info per row).
- **Borders**: 1px solid `--border`. **Radii**: `rounded-sm` (4px) for inputs/buttons/badges, `rounded` (8px) for cards, `rounded-none` for table rows. **Never** larger than 8.

## Reusable patterns

These are typographic atoms that recur across the app. Inline them at the top of each page file rather than abstracting into shared components — abstraction creates a variants-API maintenance burden that violates the no-custom-primitives constraint. Three lines of JSX is not a primitive; six lines with three props is.

### Eyebrow caption

The most-used pattern. Tiny mono caps for metadata, status labels, section antecedents.

```tsx
<span className="eyebrow text-muted-foreground">
  Source file
</span>
```

### Roman-numeral column marker

Use at the top of each major column on two-column spreads (job intake, application detail). Numeral in italic Newsreader display, terracotta. Title in italic Newsreader h1.

```tsx
<div className="flex items-baseline gap-3 md:gap-4 mb-6 md:mb-10">
  <span className="font-serif italic text-display md:text-display-xl leading-none text-primary tabular">i.</span>
  <span className="font-serif italic text-h2 md:text-h1 leading-none text-foreground/85">The job</span>
</div>
```

Use `i. / ii.` for two-column. Use `01 / 02 / 03` mono caps for sequential steps within a single column.

### Hairline rule

```tsx
<div className="h-px bg-border w-full" />
```

Use to separate *concepts*, not paragraphs. Between groups in a list, between a primary action and the section above it, between header and body. Never as decoration.

### Section heading with count

Used in result lists (criteria groups, applicant rankings). Caption + count + extending hairline.

```tsx
<div className="flex items-baseline gap-3 mb-4">
  <span className="eyebrow text-foreground/55">
    Skills
  </span>
  <span className="font-mono text-eyebrow tabular text-muted-foreground/70">
    {String(count).padStart(2, "0")}
  </span>
  <div className="flex-1 border-b border-border/70" />
</div>
```

The `padStart(2, "0")` is intentional — `04` reads more typographic than `4`.

### Editorial empty state

Empty states are *thesis statements*, not "no data yet." Quote the principle the screen embodies.

```tsx
<div className="h-full flex flex-col items-center justify-center text-center">
  <p className="font-serif italic text-h1 text-foreground/35 leading-tight max-w-sm">
    &ldquo;A score without reasoning is not a score.&rdquo;
  </p>
  <p className="mt-6 eyebrow text-muted-foreground/60">
    Awaiting source ←
  </p>
</div>
```

Other reusable empty-state quotes (pick one that fits the screen's purpose):
- Job queue empty: *"No applications yet for this role."*
- Needs-review empty: *"Nothing in review."*
- Notes empty: *"This candidate has no notes — yet."*
- Generic: *"Hiring is a human act."*

### File / metadata card

For showing an uploaded file, a candidate's quick info, etc. Borders not shadows.

```tsx
<div className="border border-border rounded-sm bg-card px-6 py-5 flex items-start gap-4">
  <FileText className="h-5 w-5 text-foreground/50 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
  <div className="min-w-0 flex-1">
    <p className="caps-action text-muted-foreground mb-1">
      Source file
    </p>
    <p className="text-body-lg font-medium truncate">{filename}</p>
    <p className="font-mono text-eyebrow text-muted-foreground mt-1 tabular">{size}</p>
  </div>
</div>
```

### Importance / status indicator (replaces shadcn Badge for state)

Mono caps right-aligned, terracotta for primary state, muted for secondary. Letterforms instead of pill shapes.

```tsx
<span className={`eyebrow ${
  isPrimary ? "text-primary" : "text-muted-foreground/70"
}`}>
  {isPrimary ? "Must" : "Nice"}
</span>
```

When you genuinely need the *shape* of a Badge (e.g., status pills in a dense table where the eye scans for color), use shadcn `<Badge>` with these variant choices: `default` for terracotta, `secondary` for muted, `outline` for neutral. Don't reach for `<Badge>` reflexively.

### "Shelf" pattern — primary CTA with caption

When a button needs context, put a caption to the *left* of it on the same row, separated by space, with a hairline rule above. The rule isolates the CTA without elevating it.

```tsx
<div className="mt-auto pt-10">
  <div className="h-px bg-border" />
  <div className="pt-6 flex items-center justify-between gap-4">
    <p className="text-body-sm text-muted-foreground max-w-[12rem] leading-relaxed">
      One LLM call. No data leaves until you save.
    </p>
    <Button size="lg" className="gap-2 rounded-sm font-medium tracking-tight">
      Extract criteria
      <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
    </Button>
  </div>
</div>
```

### In-progress / loading copy

Italic Newsreader + tiny terracotta spinner. Tells the user what is being thought about, not just that thinking is happening.

```tsx
<div className="flex items-center gap-3 text-body text-foreground/70">
  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
  <span className="font-serif italic">Reading the description…</span>
</div>
```

### Error block

Left vertical rule in terracotta, eyebrow + body. **No card, no shadow, no icon.**

```tsx
<div className="border-l-2 border-primary pl-4 py-2 bg-primary/[0.03]">
  <p className="caps-action text-primary mb-1">
    Couldn't process this file
  </p>
  <p className="text-body text-foreground/80">{error.message}</p>
</div>
```

### Footer rule (full-screen pages)

Full-screen pages get a footer hairline. Issue-number conceit (left), italic ethos line (center), year (right).

```tsx
<footer className="border-t border-border px-10 py-3 flex items-center justify-between
                   eyebrow text-muted-foreground/70">
  <span>Yuvabe ATS · v0.1</span>
  <span className="italic font-serif normal-case tracking-normal text-muted-foreground/50">
    Hiring is a human act.
  </span>
  <span>2026</span>
</footer>
```

### Two-column spread

For pages where left = source/input, right = analysis/output (job intake, application detail).

```tsx
<div className="h-screen flex flex-col overflow-hidden bg-background">
  <header className="border-b border-border ..." />
  <main className="flex-1 grid grid-cols-2 overflow-hidden">
    <section className="border-r border-border flex flex-col overflow-hidden">
      <div className="flex-1 px-12 pt-12 pb-8 overflow-y-auto">
        {/* i. column */}
      </div>
    </section>
    <section className="flex flex-col overflow-hidden">
      <div className="flex-1 px-12 pt-12 pb-8 overflow-y-auto">
        {/* ii. column */}
      </div>
    </section>
  </main>
  <footer ... />
</div>
```

## Behavior layer — clarity, affordances, microinteractions

This is a tool, not a toy. Behavior rules serve **clarity** first; affordance and microinteraction serve clarity; motion serves all three. If any rule below ever conflicts with clarity on a real screen, clarity wins.

Priority order, top to bottom: **clarity → affordance → microinteraction → motion**. Motion is the smallest tool, never the headline.

### The states every interactive element must define

Every `<button>`, `<a>`, `<input>`, `<select>`, `<textarea>`, and shadcn primitive must define five states explicitly — plus *loading* / *busy* where async. Each state must be **distinguishable without color alone** (border weight, opacity shift, label change, icon swap, italic — not just a hue change).

| State | Recipe | Notes |
|---|---|---|
| Default | base classes | The canonical resting look |
| Hover | `hover:bg-secondary` or `hover:text-foreground` (buttons, inputs); `hover:-translate-y-px` + `hover:shadow-[var(--shadow-hover)]` (row-as-link surfaces and clickable cards only) | Color/opacity for controls; hairline lift for destinations. See §Motion VERB 1: RESPOND for the rules per surface class. |
| Focus-visible | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background` | Required on every interactive element |
| Active / pressed | `active:bg-secondary/80` or color shift | Subtle color shift; scale ≤1.02 only if used |
| Disabled | `disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed` + a non-color cue | Opacity alone is **not** enough |
| Loading / busy | inline spinner + label that names *what* + `aria-busy="true"` | "Saving candidate…" not "Loading…" |

### Affordances — what the element tells you it can do

- `cursor-pointer` on every clickable non-link, non-button element (cards used as click targets, custom toggles). Native `<button>` and `<a href>` already get pointer; do not override.
- `cursor-not-allowed` on every disabled interactive element.
- `cursor-text` on text-input wrappers, `cursor-grab` / `cursor-grabbing` on draggable handles.
- **Focus ring is non-negotiable.** `focus-visible:outline-none` without a replacement ring is a clarity failure. The ring uses `--ring` (`#B8553A`, the terracotta) — it doubles as accent and as the "you are here" signal.
- **Minimum hit target**: 40×40px for primary actions. 32×32 acceptable in dense list rows when spaced ≥8px from the next target (matches the dense-table aesthetic without violating WCAG 2.5.8's spacing exception).
- **Disabled = opacity + `pointer-events-none` + cursor change + a non-color cue.** All four. Opacity alone reads as "loading," not "disabled."
- **Link vs button.** Links navigate, buttons act. Underline links on hover (`hover:underline`). Never style a `<button>` to look like a link unless using `<Button variant="link">`. Never style an `<a>` to look like a filled button unless it is a primary navigation CTA — and then the underline-on-hover still applies via the variant.
- **No nested interactive elements.** A `<Link>` wrapping a `<button>` is broken — screen readers handle nesting inconsistently (WCAG 4.1.2). For row-as-target patterns where the row needs both a primary navigation and a secondary action, use the **stretched-link pattern**: the primary `<Link>` covers the row via CSS `::after`, the secondary action sits as a DOM sibling at higher z-index. References: [Adrian Roselli — Block Links, Cards, Clickable Regions, Rows](https://adrianroselli.com/2020/02/block-links-cards-clickable-regions-etc.html), [Piccalilli — Faux-nested interactive controls](https://piccalil.li/blog/accessible-faux-nested-interactive-controls/).

### Microinteractions — Saffer's loop applied to our primitives

Every microinteraction has four parts: **Trigger → Rules → Feedback → Loops/Modes**. Built on shadcn primitives — never a custom UI primitive.

**Universal rule**: every microinteraction must produce **at least one visible response within 100ms of the trigger**, even if the real work is still pending. The pending state itself is the response. A click that does nothing visible for 300ms is a clarity failure.

| Interaction | Primitive | Feedback (within 100ms) | Completion |
|---|---|---|---|
| Button press | shadcn `Button` | `active:` color shift | nothing if sync; spinner + disabled if async |
| Toggle (switch) | shadcn `Switch` | thumb position changes | `aria-checked` flips |
| Copy to clipboard | `Button` | label swaps to "Copied" mono caps | revert label after 1500ms |
| Optimistic save | `Button` | row updates immediately | toast on success; rollback + error toast on failure |
| Destructive confirm | shadcn `AlertDialog` | dialog fades in | only the confirm button is terracotta; cancel is `variant="ghost"` |
| Inline edit | `Input` (focused via click) | focus ring appears | Enter commits, Esc cancels, blur commits |
| Async submit | `Button` + form | button disables and shows `Loader2 animate-spin` + label "Saving…" | toast or inline error block |
| Sortable column | `<button>` in `<th>` | arrow icon appears next to label | URL updates with `?sort=…` |
| Filter chip toggle | `Button variant="outline"` | filled state when on | list re-renders |
| Bulk-action selection | `Checkbox` per row + sticky bar | row highlights + bar fades in | bar shows count and actions |
| Row delete | `Button` + `AlertDialog` | row fades out 150ms | toast with undo for 5s |

### Motion — opinionated, prescriptive, in service of clarity

> *Every state transition is a sentence — say it on purpose, or don't say it.*

Motion in this system has exactly four legitimate jobs. If a piece of motion isn't doing one of these four, it's noise — delete it.

| Verb | Says to the user | Where it shows up |
|---|---|---|
| **RESPOND** | *"You can touch this."* | Hover, focus, press |
| **ACKNOWLEDGE** | *"I heard you."* | Action-button feedback, optimistic UI, error revert |
| **REVEAL** | *"Here is what's happening."* | Skeletons, spinners, progress bars |
| **DIRECT** | *"You are going somewhere."* | Page transitions, panel mount/unmount |

The master principle is still **subtlety**. If a motion would feel at home on a designer's portfolio site, it doesn't belong here. Subtle does not mean *absent*, though — the failure mode of this codebase today is silence: async buttons that show no pending state, rows that don't lift, routes that hard-cut. Both extremes are clarity failures.

#### Hard constraints (the motion budget)

1. **Duration scale**: `100 / 150 / 200 / 300 / 400 / 800ms` for everything in-page. The `800ms` slot is reserved for the in-page confirmation flash (`.highlight-confirm` — applied to a row the user is already looking at after a successful mutation). One exception lives outside this scale: `.highlight-new` runs at `5s` because it fires on page-load arrival (e.g., `/jobs?new={code}`) when the user is still orienting and needs the longer window to *find* the just-created row. Both classes share the same `@keyframes highlight-fade` — only the duration differs. Never invent another off-scale duration.
2. **Easing scale**: `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for color-only state changes, `linear` *only* for indeterminate spinners (`animate-spin`) and progress-bar width fills. Never spring. Never bounce. Never elastic. Never a custom `cubic-bezier(...)` with control points outside `[0,1]`.
3. **One motion per element per state**. Never compose `translate + scale + shadow` on hover; pick one. The hover-lift token (`-translate-y-px` + hairline shadow) ships as a *paired* token but counts as one motion.
4. **Animate `transform` and `opacity` only** on any path that runs every frame. Never `width`, `height`, `top`, `left`, `border-color`, `background-color` for transitions longer than `100ms`. Color hover/focus is the one exception, and it stays at `100–150ms`.
5. **Honour `prefers-reduced-motion`**. Transforms drop entirely. Opacity transitions stay (the fade *is* the reduced-motion experience).

#### Tokens (added to `app/globals.css`)

Two new tokens carry the system's expanded motion vocabulary:

```css
:root {
  --shadow-hover: 0 1px 2px rgb(26 24 21 / 0.04);
}

@keyframes button-shake {
  0%, 100% { transform: translateX(0); }
  25%      { transform: translateX(-2px); }
  75%      { transform: translateX(2px); }
}
```

`--shadow-hover` is the project's *second* shadow — a hairline used only for hover-lift on row-as-link surfaces and clickable cards. The first shadow (heavy, on modals + the bulk-action bar) is unchanged. There is no third.

`button-shake` is the canonical error-revert microanimation. Used once, never looped. Always paired with an error caption.

The existing `@keyframes highlight-fade` (in `app/globals.css`) keeps its current definition. Two classes consume it:

- **`.highlight-new`** (5s) — for the user *arriving* at a list after creating something (e.g., `/jobs?new={code}`). The slow fade gives a still-orienting user time to find the row.
- **`.highlight-confirm`** (800ms) — for an in-page mutation success on a row the user is already looking at (e.g., Shortlist click). Brief, snappy, gone before it overstays.

Same gradient, different attention contexts. Pick by use case, not by aesthetics.

---

#### VERB 1: RESPOND — hover, focus, press

The rule by surface class:

| Surface | Hover | Focus-visible | Active / pressed |
|---|---|---|---|
| **Buttons** (shadcn `<Button>`) | `hover:bg-secondary` (color only — no lift) | `focus-visible:ring-2 ring-ring ring-offset-2` | `active:scale-[0.99]` (NEW default for primary buttons) |
| **Row-as-link** (job rows, applicant rows) | `hover:-translate-y-px` + `hover:shadow-[var(--shadow-hover)]` (paired — counts as one) | `focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2` (REQUIRED for keyboard) | none |
| **Cards** (any bordered, padded container that is itself clickable) | Same as row-as-link | Same as row-as-link | none |
| **Icon-only buttons** (e.g., `MoreHorizontal` overflow trigger) | `hover:bg-secondary` (no lift — they're tools, not destinations) | `focus-visible:ring-2 ring-ring` | none |
| **Inputs / selects** | no hover change | ring fade-in 100ms ease-out | none |
| **Arrow icons inside row-as-link** (`ArrowUpRight`, `ChevronRight`) | `group-hover:translate-x-px` (1px directional cue — UNCHANGED, this rule already exists in the codebase) | inherits from parent | none |

Every interactive element gets `transition-all duration-150 ease-out` as the canonical hover transition (or `transition-colors duration-100` if only color is moving).

Canonical row-as-link example (formalizes the pattern already in `app/jobs/page.tsx`):

```tsx
<li className="
  group relative
  border-b border-border
  px-4 py-3
  transition-all duration-150 ease-out
  hover:-translate-y-px hover:shadow-[var(--shadow-hover)]
  focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2
">
  <Link
    href={`/jobs/${code}`}
    className="absolute inset-0 z-10"
    aria-label={`View ${title}`}
  />
  <h3 className="...">{title}</h3>
  <p className="caps-meta text-muted-foreground">{count} APPLICANTS</p>
  <ArrowUpRight
    className="
      h-4 w-4 text-muted-foreground
      transition-transform duration-150 ease-out
      group-hover:translate-x-px group-hover:text-foreground
    "
  />
</li>
```

**Anti-patterns for RESPOND**:

- ❌ `hover:scale-105` (out of subtlety budget — max is 1.02, and even 1.02 is press-only)
- ❌ `hover:shadow-md` or any Tailwind shadow utility (use `--shadow-hover`; default Tailwind shadows are too heavy for the editorial palette)
- ❌ Hover-lift on a `<Button>` (lift = "I am a destination"; buttons are actions)
- ❌ Color hover *plus* lift on the same element (one motion per state — pick one)
- ❌ `focus-visible:outline-none` without a replacement ring — kills keyboard navigation
- ❌ Row with no `focus-within:ring-*` — keyboard users get no "you are here"

---

#### VERB 2: ACKNOWLEDGE — action-button feedback

Every button that triggers async work owes the user one of these responses, picked by the *expected* return time:

| If the action returns in… | Then show… |
|---|---|
| `< 100ms` | Optimistic UI only (no spinner — the spinner *would* be slower than the action) |
| `100ms – 1000ms` | In-button spinner + button-text swap (`"Save"` → `"Saving…"`) |
| `1000ms – 3000ms` | Spinner + status caption *beneath* the button (italic Newsreader: *"Reviewing your resume…"*) |
| `> 3000ms` | All of the above + ARIA live region announcement + cancel affordance if cancelable |

The four canonical patterns:

**1. Optimistic UI** (canonical use: `app/applications/[id]/_components/status-actions.tsx` Review/Shortlist/Reject)

The action *already happened* in the user's mental model. Reflect it immediately, recover gracefully on failure.

```tsx
const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);
const [error, setError] = useState<string | null>(null);
const buttonRef = useRef<HTMLButtonElement>(null);

async function handleStatusChange(next: Status) {
  setOptimisticStatus(next);              // UI updates instantly
  setError(null);
  try {
    await fetch(`/api/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    // Success: row already shows new state. Add a confirmation flash.
    rowRef.current?.classList.add("highlight-new");
  } catch (e) {
    // Error: revert is automatic via useOptimistic, but flag it.
    setError("Couldn't save. Try again.");
    buttonRef.current?.style.animation = "button-shake 200ms ease-in-out";
    buttonRef.current?.addEventListener(
      "animationend",
      () => { buttonRef.current!.style.animation = ""; },
      { once: true }
    );
  }
}
```

**Do not disable the button during the optimistic period.** The action already took effect; disabling reads as "broken." This is a *change* from the current `disabled={isPending}` pattern in `status-actions.tsx` and `job-actions-menu.tsx` — that pattern is now wrong.

**2. In-button spinner** (canonical use: login form submit, `Save job` button)

For actions where the result is uncertain enough that optimistic UI would lie:

```tsx
<Button type="submit" disabled={submitting} aria-busy={submitting}>
  {submitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
      Saving…
    </>
  ) : (
    "Save job"
  )}
</Button>
```

The text swap is mandatory — it carries the verb. *"Saving…"* not *"Loading…"*. *"Archiving…"* not *"Working…"*.

**3. Confirmation flash** (canonical use: any successful mutation)

Reuses the existing `@keyframes highlight-fade` in `globals.css` via the `.highlight-confirm` class (800ms). For in-page mutations, this is the canonical success cue — apply on the success branch of the handler, remove on `animationend` so it can re-trigger on the next mutation.

```tsx
// After a successful PATCH on a row the user is already looking at:
rowRef.current?.classList.add("highlight-confirm");
rowRef.current?.addEventListener(
  "animationend",
  () => rowRef.current?.classList.remove("highlight-confirm"),
  { once: true }
);
```

Use `.highlight-new` (5s) instead when the user is *arriving* at the page after creating the row — the longer fade gives them time to find it. Don't use `.highlight-new` for in-page mutations; 5s on a row you're staring at feels like a stuck animation.

**4. Error shake** (canonical use: any failed mutation)

Reuses the new `@keyframes button-shake`. 200ms, one oscillation, never looped. Always paired with an error caption that names what went wrong.

```tsx
<div className="space-y-2">
  <Button ref={buttonRef} ...>Submit</Button>
  {error && (
    <p className="text-sm text-primary border-l-2 border-primary pl-3 py-1 italic font-serif">
      {error}
    </p>
  )}
</div>
```

**Anti-patterns for ACKNOWLEDGE**:

- ❌ `disabled={isPending}` as the *only* feedback on an async button (invisible pending state)
- ❌ Disabling an optimistic-UI button during the optimistic period (the action already happened)
- ❌ Spinner on an action that returns in `<300ms` (creates false latency — UI feels slower than it is)
- ❌ `"Loading…"` with no subject (rule restated from existing system)
- ❌ Error toast with no inline indication on the button that failed (toast can be missed; the button must own the error)
- ❌ Looping the shake animation (one oscillation only — looped shake reads as "broken")

---

#### VERB 3: REVEAL — progress and loading

Picking the right indicator is a function of two questions: *do you know the shape of what's coming?* and *how long will it take?*

| Content shape | Duration | Show |
|---|---|---|
| Predictable (you know the layout) | `< 300ms` | Nothing — show stale data, swap silently |
| Predictable | `300ms – 2000ms` | Skeleton matching the final layout (`animate-pulse` only) |
| Predictable | `> 2000ms` | Skeleton + caption (*"Loading 21 applicants…"*) |
| Unpredictable (LLM stream, free-form response) | Any duration | Labeled spinner — never a skeleton (lying about layout) |
| Known progress (% complete) | `> 2000ms` | Progress bar (NEW pattern, see below) |

**Skeleton pattern** (canonical use: `app/jobs/new/page.tsx` extraction placeholder)

Skeletons must mirror the *exact* shape of the final content — same hairline borders, same row heights, same column counts. A skeleton that doesn't match its content layout is worse than no skeleton (the layout shift on swap is jarring).

```tsx
<ul className="divide-y divide-border">
  {Array.from({ length: 5 }).map((_, i) => (
    <li key={i} className="px-4 py-3 animate-pulse">
      <div className="h-4 w-2/3 bg-muted rounded-sm" />
      <div className="mt-2 h-3 w-1/4 bg-muted rounded-sm" />
    </li>
  ))}
</ul>
```

The skeleton-to-content swap is *always* a fade, never a slide:

```tsx
<div className={`transition-opacity duration-300 ease-out ${ready ? "opacity-100" : "opacity-0"}`}>
  {ready ? <ApplicantsList items={items} /> : <ApplicantsListSkeleton />}
</div>
```

**Spinner pattern** (canonical use: `app/jobs/new/apply-form.tsx` LLM call)

Use a spinner only when the result shape is genuinely unpredictable. Always pair with a labeled subject:

```tsx
<div className="flex items-center gap-2 text-foreground/70">
  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden />
  <p className="font-serif italic text-sm">Reviewing your resume…</p>
</div>
```

`Loader2` from `lucide-react` is the *only* spinner. `animate-spin` is the *only* legitimate rotation in the system. The spinner spins linearly (the one place `linear` easing is permitted).

**Progress bar pattern** (NEW — for known-progress operations like file upload, multi-step extraction)

A hairline rule with terracotta fill on a muted track. No shadow, no glow, no pulsing. The bar's width transitions linearly (the second permitted use of `linear`).

```tsx
<div className="space-y-2">
  <div className="h-px w-full bg-muted relative overflow-hidden">
    <div
      className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-300 ease-linear"
      style={{ width: `${pct}%` }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  </div>
  <p className="caps-meta text-muted-foreground tabular-nums">
    {pct}% — {label}
  </p>
</div>
```

**Anti-patterns for REVEAL**:

- ❌ Skeleton on an action where output shape is unknown (use a spinner — skeletons that don't match content layout are jarring on swap)
- ❌ Spinner on an action that returns in `<300ms` (false latency)
- ❌ Shimmer-gradient skeletons (`bg-gradient-to-r animate-pulse`) — `animate-pulse` opacity-only is the *only* loading shimmer in this system
- ❌ Progress bar with non-linear easing or any decoration on the bar itself (glow, shadow, animated fill)
- ❌ Skeleton-to-content swap that slides (always fade)
- ❌ Multiple skeletons + spinners on the same surface at once (pick one indicator per loading boundary)

---

#### VERB 4: DIRECT — page transitions and mount/unmount

**Page-to-page navigation.** Two layers, applied in order. The first is mandatory; the second is polish.

**Layer 1 (mandatory): `loading.tsx` per slow route segment.** This is the *primary* fix for "the screen sits, then suddenly swaps." Next.js prefetches `loading.tsx` with the route, so the moment the user clicks a `<Link>`, the destination's skeleton appears instantly. Real content streams in to replace it when the database/network read resolves.

Add `app/<segment>/loading.tsx` for **every** route whose `page.tsx` `await`s a Supabase query, fetch, or LLM call. The skeleton must mirror the destination layout — same outer shell, same header/footer, same hairline rows, same column counts. See `app/jobs/new/page.tsx:537-609` for the canonical in-codebase pattern, or any of the existing `loading.tsx` files.

Skeleton rules (restated from §VERB 3 REVEAL):
- `animate-pulse` only — no shimmer gradients
- Hairline-bordered rows, never solid blobs
- Reuse `Eyebrow` / `ColumnMarker` atoms inline so the chrome doesn't shift on swap

**Layer 2 (polish): a route fade — either CSS or View Transitions.** Even with `loading.tsx`, the *swap* from skeleton → content is a hard cut at the pixel level. A 200ms cross-fade smooths it.

*Option A — CSS fade wrapper (simpler, recommended for v0.1).* Already wired in this codebase at `app/_components/route-fade.tsx`, mounted in `app/layout.tsx`:

```tsx
"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function RouteFade({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setVisible(false);
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [pathname]);
  return (
    <div
      data-fade
      className={`flex-1 flex flex-col transition-opacity duration-200 ease-out ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {children}
    </div>
  );
}
```

`requestAnimationFrame` (not `setTimeout(0)`) is required — without it React batches the two state updates and the transition never plays. The `data-fade` attribute opts the fade into surviving the reduced-motion override (the fade is the *one* motion that's preserved for motion-sensitive users — a hard cut is more jarring than a fade).

*Option B — Next.js 16 View Transitions API (richer, opt-in).* Enables shared-element morphs (e.g., applicant name list → detail) and directional slides. Requires:

1. Enable in `next.config`:

```ts
const nextConfig: NextConfig = {
  experimental: { viewTransition: true },
};
```

2. Import React's component (not Next's — there is no `unstable_ViewTransition` export from `next` in v16):

```tsx
import { ViewTransition } from "react";

<ViewTransition name={`jobTitle-${code}`}>
  <h1 className="...">{title}</h1>
</ViewTransition>
```

Suggested shared-element names if/when adopted:

| Transition name | Source surface → Destination surface |
|---|---|
| `jobTitle-{code}` | Job title in `/jobs` row → `/jobs/[code]` heading |
| `applicantRow-{id}` | Applicant row in `/applications` → `/applications/[id]` heading |
| `jobBreadcrumb-{code}` | Job heading in any subpage → breadcrumb on the next subpage |

Back-navigation reverses direction automatically. See `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` for the full API surface (directional slides via `transitionTypes`, asymmetric Suspense reveals, header anchoring).

**Don't reach for `useLinkStatus`.** Per the Next docs: *"Before adding inline feedback, consider if … the route has a `loading.js` file, enabling instant transitions with a route-level fallback."* With Layer 1 in place, `useLinkStatus` is unnecessary — and would *add* visual noise on top of the already-instant skeleton. Reserve it for the rare case where you set `prefetch={false}`.

**Mount / unmount of non-route content** (sheets, dialogs, dropdowns, popovers).

Already covered by Radix's `data-[state=open]` / `data-[state=closed]` attributes via `tw-animate-css`. The rule:

- **Permitted**: `fade-in-0` / `fade-out-0` + an optional `slide-in-from-{side}-px` / `slide-out-to-{side}-px` (1px directional cue) at `duration-100`.
- **Forbidden** (override the shadcn defaults): `zoom-in-95` / `zoom-out-95` (5% scale exceeds the 2% subtlety budget) and `slide-in-from-{side}-2`+ (translate exceeds the 2px budget).

Strip the zoom from every shadcn `DialogContent`, `SheetContent`, `DropdownMenuContent`, `PopoverContent`, `SelectContent` you generate. Default to fade-only.

**Mount / unmount of inline content** (expanding `<details>`, revealing an error message, showing a tooltip):

- Opacity fade only. `duration-200 ease-out` in, `duration-150 ease-in` out.
- **No height animation.** Either show or don't. Animating height is paint-heavy and exposes the layout-shift problem (the content underneath bumps).
- Stagger child reveals only when the parent is a list of `>5` items *and* the total stagger fits in `<300ms` (so `<60ms per child for 5+ children`). Below 5 items, stagger reads as fussy.

**Anti-patterns for DIRECT**:

- ❌ Page transition without a `prefers-reduced-motion` fallback (the fade-only rule already handles this — but verify on every implementation)
- ❌ Animating `height` on `<details>` open (paint-heavy + layout shift; either show or don't)
- ❌ Staggered reveals on a list of `<5` items (reads as fussy)
- ❌ shadcn `DialogContent` / `SheetContent` / `DropdownMenuContent` / `PopoverContent` with default `data-[state=open]:zoom-in-95` left in (rule restated and enforced)
- ❌ Slide-in distances `>2px` (e.g., `slide-in-from-top-2` is `8px` — too much)
- ❌ Page transition that re-runs on `searchParams` change (filter chip clicks shouldn't fade the whole page)

---

#### Reduced motion (more nuanced than before)

The current globals.css block drops *all* animation/transition durations to 1ms. That works for transforms and color but flattens opacity fades into hard cuts, which is jarring even for motion-sensitive users (a content swap that pops feels like a glitch, not an accommodation).

Updated block to add to `app/globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
  /* Preserve opacity fades — the fade IS the reduced-motion experience for content swaps. */
  .fade-preserve,
  [data-fade] {
    transition-duration: revert !important;
  }
  /* Hover-lift becomes hover-color-only for motion-sensitive users. */
  *:hover {
    transform: none !important;
  }
}
```

Apply `data-fade` to the route-fade wrapper and the skeleton-to-content swap container so those keep their fade timing under reduced motion.

---

#### Override shadcn defaults toward subtlety

shadcn primitives ship with motion that exceeds this system's budget. Override on every use:

- **`DialogContent`, `SheetContent`, `DropdownMenuContent`, `PopoverContent`, `SelectContent`**: strip `data-[state=open]:zoom-in-95` and `data-[state=closed]:zoom-out-95`. Replace with `data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0` plus an optional `slide-in-from-{side}-px`. Duration stays `duration-100`.
- **`Toast` / `Sonner`**: fade only on enter and exit. No slide-from-bottom-full (too distance, too long).
- **`Accordion`**: fade only. No height animation on the panel.

If a shadcn primitive's default motion is genuinely needed (e.g., the slide on `Sheet` is a directional cue), keep the slide but cap the distance at 2px and the duration at 100ms.

## Anti-patterns — never do

- ❌ Default shadcn neutral palette (zinc, slate, stone gray) — replace with the warm palette
- ❌ Pure white (`#FFFFFF`) as page background — always `--background` (`#FAF8F4`)
- ❌ Pure black (`#000`) as text — always `--foreground` (`#1A1815`)
- ❌ Box shadows for surface elevation — use borders
- ❌ Multiple accent colors — terracotta is the only accent
- ❌ Purple / teal / indigo gradients — none, anywhere
- ❌ Hero illustrations of people pointing at charts — none
- ❌ Material Design defaults / "AI product" gradients
- ❌ Roman / non-italic Newsreader for body paragraphs — Newsreader is for moments
- ❌ Inter, Roboto, Arial, system-ui as the primary sans — Geist only
- ❌ Sentence case in eyebrow captions — uppercase + tracked, always
- ❌ "Loading…" without saying *what* is loading
- ❌ Empty states that say "No data" — quote the principle the screen embodies
- ❌ Pill badges for everything — letterforms (mono caps) for state where possible
- ❌ Card-in-card layouts on detail pages — sections separated by hairlines, not nested cards
- ❌ Avatars for candidates — we don't have headshots; fake ones look terrible
- ❌ Tabs to hide sections — recruiters Cmd+F; everything on one scrollable page
- ❌ Modal dialogs for actions — use inline buttons or the bulk-action bar
- ❌ Filter chips that look like tabs — chips imply filters on one view; tabs imply separate views
- ❌ `focus-visible:outline-none` without a replacement ring — kills keyboard navigation and erases the terracotta "you are here" signal
- ❌ `cursor-pointer` on a disabled or non-interactive element
- ❌ Motion that isn't subtle — no spring, bounce, rotate (except `Loader2 animate-spin`), shimmer gradients, parallax, scroll-triggered choreography
- ❌ Translates > 2px or scales outside `0.98`–`1.02` — subtlety budget exceeded
- ❌ Durations outside the 100 / 150 / 200 / 300 / 400ms scale
- ❌ Shimmer-gradient skeleton loaders — pulse-opacity only
- ❌ Disabled state shown by reduced opacity alone (no cursor, no `pointer-events-none`, no second cue)
- ❌ State distinguishable by color alone (always pair with text, italic, icon, or border weight)
- ❌ Buttons that look like links / links that look like filled buttons (use the right shadcn variant)
- ❌ Custom modal / dropdown / popover instead of the shadcn primitive
- ❌ Action that produces no visible response within 100ms — even an async-pending state counts; silence does not
- ❌ shadcn Dialog / Sheet / DropdownMenu with their default `slide-*` / `zoom-*` animation classes left in — strip them, fade only

## Activation checklist

Before writing any new screen or component in this codebase, run through this:

- [ ] Does this view have a *thesis* — what principle does its empty state quote?
- [ ] Where is the italic Newsreader moment — what's the typographic peak?
- [ ] Where (if anywhere) does terracotta appear, and why those 3–6 places specifically?
- [ ] Is there a Roman-numeral column marker or a sequential `01 / 02` step indicator?
- [ ] Are all numbers tabular (`tabular-nums`)?
- [ ] Are eyebrow captions using the `eyebrow` utility (or `caps-action` / `caps-meta` for the action / informational variants)? No raw `text-[Xpx]` or `tracking-[Xem]` outside `globals.css`.
- [ ] Are state badges letterforms (mono caps) instead of pill shapes — unless the table density genuinely requires the pill shape for scanning?
- [ ] Are dividers hairlines, not shadows or thick rules?
- [ ] Is the page width and gutter aligned to `px-10` or `p-12`?
- [ ] Have you used any color outside the locked palette? (If yes, push back.)
- [ ] Have you defined every required state on each interactive element (default / hover / focus-visible / active / disabled, plus loading where async), each distinguishable without color alone?
- [ ] **Motion verbs**: every async button does ACKNOWLEDGE (spinner / optimistic / shake), every row-as-link does RESPOND (hover-lift on cards/rows; color-only on buttons), every loading boundary does REVEAL (skeleton matching layout / labeled spinner / progress bar — picked from the decision tree), every route change does DIRECT (View Transitions if wired; CSS fade fallback otherwise)?
- [ ] **Motion budget**: every animation uses `transform` + `opacity` only? Durations on the `100 / 150 / 200 / 300 / 400 / 800ms` scale (800ms only for `highlight-fade`)? Easings drawn from `ease-out` / `ease-in` / `ease-in-out` / `linear` (linear only for spinners and progress)? At most one motion per element per state?
- [ ] **Reduced motion**: `app/globals.css` has the `prefers-reduced-motion` block that drops transforms but preserves opacity-fade for content swaps?

## Reference files in this codebase

When adding a new screen, study these for established patterns first:

- `app/globals.css` — the locked tokens. **Do not** add new color tokens unless the brief requires it.
- `app/layout.tsx` — font wiring. Newsreader uses `axes: ["opsz"]` and `style: ["normal", "italic"]` — **never set `weight`** on a variable font (it errors at build time).
- `app/jobs/new/page.tsx` — the canonical two-column editorial spread. Use it as the template for any "left = input, right = output" page.

## When the brief and a request conflict

The user's explicit request always wins. But surface the conflict before silently overriding the system. Example: if asked to "add a purple gradient header," respond with "the system uses warm cream + terracotta only, no gradients — would you like me to do this in terracotta solid, or is the gradient request intentional?"
