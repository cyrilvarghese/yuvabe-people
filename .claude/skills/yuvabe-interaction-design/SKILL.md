---
name: yuvabe-interaction-design
description: Use when designing or building any list, table, card-grid, or other "collection of items" surface in the Yuvabe ATS, or when adding/removing actions on row items, or when a list will fork into a detail view. Covers row-as-link patterns, primary-action discipline, overflow menus, bulk actions, empty states, skeleton loading, density, sort/filter affordances, drill-down navigation, and card-vs-table-vs-list choice. Companion to `yuvabe-design-system` (which informs how a single surface looks) — this skill informs how surfaces compose into flows. Activate proactively before writing a `.tsx` file that renders a list/table, before adding row-level actions, or when the user mentions "list", "table", "rows", "cards", "actions", "bulk", "empty state", "filter", or "drill-down".
---

# Yuvabe ATS — Interaction Design

A living skill. First draft today; appended to as the application grows. Pairs with `yuvabe-design-system`: that skill answers *how a surface looks*; this one answers *how surfaces fork into flows.*

## The thesis

> *Visual design tells the eye where to look. Interaction design tells the hand what to do.*

Lists are the most-touched surface in this app — every recruiter session begins on `/jobs` or `/applications` and ends in a detail view. They deserve the most discipline.

The single rule that subsumes most others: **every row should have one obvious primary action.** Two equally-weighted CTAs is a bug, not a feature.

## When to invoke

- Before writing a new list, table, card-grid, or any "collection of items" surface
- Before adding or removing actions on existing row items
- When a list will fork into detail views (drill-down navigation)
- When the user says: "list", "table", "rows", "cards", "actions", "bulk select", "empty state", "filter", "sort", "drill-down", "row click"
- After completing a list surface — pair with `yuvabe-vd-checker` for the visual audit

**Do not invoke** for backend code, single-form pages, schemas, or copy edits.

## 1. Lists, tables, and rows

### One primary action per row — the locked rule

If a row has two equally-weighted CTAs, demote one. The candidates for the demoted action are:

1. **Move to a kebab `⋯` overflow** at the right edge of the row (preferred for low-frequency or destructive actions)
2. **Move into the detail view** (preferred when the action is rare AND non-destructive — e.g. "Edit job" lives on the job detail page, not the list)
3. **Make the row click *be* the primary action** (preferred when the primary action is "navigate to detail")

Combining (1) + (3) is the most common correct answer for ATS list surfaces.

❌ **FAIL**: a list row with two side-by-side `<Button>` elements (e.g. `[VIEW APPLICANTS] [EDIT]`) where neither is visually demoted.
❌ **FAIL**: row primary action expressed as a button when it could be a link. Buttons trigger; links navigate. Mismatching them breaks middle-click, cmd-click, browser history, and assistive tech.

### Row-as-link pattern

When the row's primary action is "go to detail view," the entire row IS the link.

The accessibility-correct pattern (no nested interactives, no `stopPropagation`):

```tsx
// Container is `relative`; link uses an absolutely-positioned ::after to cover
// the row; secondary controls sit on a higher z-index sibling.
<li className="relative grid grid-cols-[1fr_auto] items-center gap-4 py-6 hover:bg-muted/40">
  <Link
    href={`/jobs/${job.code}`}
    className="after:absolute after:inset-0 after:content-['']"
  >
    <h3 className="font-serif italic text-2xl">{job.title}</h3>
    <p className="caps-meta text-foreground/70">
      [{job.code}] · {job.criteria.length} criteria · {job.applicants} applicants
    </p>
  </Link>

  {/* z-10 lifts secondary controls above the link's ::after overlay */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="relative z-10" aria-label={`More actions for ${job.title}`}>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem disabled>Edit job</DropdownMenuItem>
      <DropdownMenuItem disabled>Duplicate</DropdownMenuItem>
      <DropdownMenuItem disabled className="text-primary">Archive</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</li>
```

❌ **FAIL**: `<button onClick={() => router.push(...)}>` wrapping the row content. Breaks open-in-new-tab, middle-click, right-click context menu, and forces a JS round-trip for what should be a normal `<a href>`.
❌ **FAIL**: `e.stopPropagation()` on inner buttons inside a `<button>`-wrapped row. Symptom of the wrong primitive — switch to the row-as-link pattern instead.
❌ **FAIL**: nested `<button>` inside `<a>` (or vice versa). Invalid HTML, undefined a11y semantics. Use the `::after` overlay sibling pattern above.

### Trailing chevron `›`

Rows that navigate to a detail view should end with a small trailing `›` (right-pointing chevron). It signals drill-down without taking up a button.

```tsx
<ChevronRight className="h-4 w-4 text-muted-foreground/70" />
```

Place it last in the row, after the kebab if both are present. Communicates "this row goes somewhere" the way a button can't.

### Overflow (kebab) menu thresholds

| Action count on row | Pattern |
|---|---|
| 0 | Nothing — row-as-link only |
| 1 | Inline button OR row-as-link, not both |
| 2 | Inline only if BOTH are common; otherwise primary inline + secondary in kebab |
| 3+ | Always kebab |
| Any destructive action (Delete, Archive, Reject, Withdraw) | Always kebab, regardless of count |

Rationale: destructive actions belong behind a deliberate second click. Don't give recruiters a one-click "Reject" on a long list — they'll mis-click.

❌ **FAIL**: an inline `Delete`, `Archive`, `Reject`, or `Withdraw` button on a row.
⚠️ **WARN**: more than 2 inline action buttons on a row. Each extra button makes the row harder to scan.

### Action ordering inside the kebab

Order: **safe → normal → destructive**, with a divider before destructive. The destructive item gets `text-primary` (terracotta) — consistent with the design-system's "primary = error/destructive accent" rule.

```
Edit
Duplicate
View activity
─────────
Archive       ← text-primary
```

## 2. Bulk actions

Defer until users routinely act on **>5 items at once.** Below that, multi-select chrome (checkbox column, select-all header, bulk action bar) is visual noise that hurts the common case to serve a rare one.

For Yuvabe today (3 jobs, 21 applications): bulk is premature. Revisit when the **shortlist/reject** flow ships and recruiters need to triage 30+ inbound resumes per role.

When you do introduce bulk:

- Checkbox column at the leading edge, separate from the row-link
- Select-all in the header row
- Bulk action bar appears on first selection — sticky bottom on mobile, sticky top on desktop
- Bar shows count: *"3 applicants selected"* + 2-3 inline buttons + a kebab for the long tail
- The bar is the **one shadow surface** in the system (per design-system skill) — uses the single permitted shadow

## 3. Empty states

Three jobs:
1. Explain *why* it's empty (no jobs yet vs. filters too narrow)
2. Teach the *next step*
3. Offer **one** primary CTA — never two

Render the empty state **outside** the table/list container, not as an empty `<tbody>`. Empty rows inside a table look like a bug.

Editorial peak: the empty-state quote is one of the canonical Newsreader italic moments (per design-system §Editorial peak). A *thesis* sentence beats *"No items found."*

```tsx
// ❌ Bad
<tbody>{jobs.length === 0 && <tr><td>No jobs found.</td></tr>}</tbody>

// ✅ Good
{jobs.length === 0 ? (
  <div className="py-24 text-center">
    <p className="font-serif italic text-3xl text-foreground/55 max-w-xl mx-auto">
      No roles posted yet. Add a job description and the system will extract its criteria.
    </p>
    <Button className="mt-8 bg-primary text-primary-foreground" asChild>
      <Link href="/jobs/new">+ New job</Link>
    </Button>
  </div>
) : (
  <ol>{jobs.map(j => <JobRow key={j.code} job={j} />)}</ol>
)}
```

❌ **FAIL**: empty state with two CTAs.
❌ **FAIL**: empty state rendered inside the table body.
⚠️ **WARN**: empty-state copy that doesn't explain *why* it's empty (e.g. just "No items").

### Filter-empty vs. data-empty

If the list is empty *because of an active filter*, the empty state should offer **"Clear filters"** as its CTA, not the "create new" CTA. Two different states, two different copy:

- Data-empty: *"No roles posted yet."* → CTA: `+ New job`
- Filter-empty: *"No applicants match the current filter."* → CTA: `Clear filter`

## 4. Loading & skeletons

| Wait time | Pattern |
|---|---|
| <1s | Show nothing — flicker is worse than wait |
| 1–10s, full list/page | Skeleton rows |
| 1–10s, single component refresh | Spinner (`Loader2` from lucide) |
| >10s | Skeleton + a *specific* status line ("Reading the description…", "Scoring candidate…") |

Skeleton row height **must match** the real row height. Layout shift on data arrival is jarring and erodes trust.

```tsx
// Skeleton matches the real JobRow's vertical rhythm
<li className="grid grid-cols-[1fr_auto] items-center gap-4 py-6 border-b border-border">
  <div className="space-y-3">
    <div className="h-7 w-2/3 bg-muted animate-pulse rounded-sm" />
    <div className="h-4 w-1/2 bg-muted animate-pulse rounded-sm" />
  </div>
</li>
```

Use plain `animate-pulse`, not gradient shimmers (per design-system §Motion).

## 5. Density & scannability

- **Fixed column widths** for tables. Auto-fit jitters between pages and breaks scanning.
- **Right-align numerics, left-align text.** Numbers compare faster on a vertical line.
- **`tabular-nums`** (or Geist Mono) on every visible number — counts, scores, dates, durations. Without it digits twitch as data updates.
- **Truncate with ellipsis + `title` tooltip.** Never wrap to a second line in a dense list — wrapping breaks vertical rhythm. Long content goes to the detail view.
- **Density toggle** only when rows >50. Below that, pick one density and stick with it.

```tsx
<span className="tabular-nums">{count.toString().padStart(2, '0')}</span>
```

The current `JOB-XXXX` codes already use `font-mono` + `tabular-nums` — keep that pattern.

## 6. Sort, filter, search

**URL-driven**. Use `searchParams` (Next.js App Router) so state is bookmarkable, shareable, and survives back/forward. The current `?status=...` pattern on `/applications` is correct — keep doing it.

| Number of mutually-exclusive filter options | Pattern |
|---|---|
| 2–5 | Chip filters (visible, one-click clear) |
| 6+ | Dropdown / `<Select>` |
| Continuous (date, score range) | Range input or two date pickers |

Multi-select filters always use a `<Select>` or popover — chips for multi-select get unwieldy fast.

If typed search-param sync gets gnarly (object-shaped filters, debounced text search, multi-key invalidation), reach for [`nuqs`](https://nuqs.47ng.com/) — but only when needed. Plain `searchParams` covers ATS today.

❌ **FAIL**: filter state held in `useState` only (resets on navigation, can't be shared, breaks back button).
⚠️ **WARN**: filter chips wrapping to a second line. Switch to a dropdown when chip count exceeds the row width.

## 7. Detail-view navigation

- **Back must preserve filter, sort, and scroll position.** Free if filter state is in `searchParams` and you use the browser back button (`router.back()` or just the native chevron).
- **Always render breadcrumbs** on detail pages. Format follows the existing pattern:
  ```
  Jobs › Senior Frontend Engineer › Aisha Khan
  ```
  Each segment is a link except the current page. Lets recruiters jump up two levels without two back-taps.
- **Don't use a modal** for what should be a route. Modals lose URL state, can't be deep-linked, and break the back button. Reserve modals for transient confirmations.

## 8. Card vs. table vs. list

| Surface | When | Yuvabe example |
|---|---|---|
| **Table** | Comparing attributes across rows; sorting matters | (none yet — possibly future ranked applicant table) |
| **List (Entity rows)** | Text-heavy items with a few attributes; one primary action per row | `/jobs`, `/applications`, applicants under a job |
| **Card grid** | A visual carries decision weight (image, chart, color sample) | (none — Yuvabe surfaces are text-driven) |

Yuvabe's surfaces are **list-shaped**, not card-shaped. Resist the temptation to "make it a card grid for visual interest" — cards force spatial re-orientation per item and are the slowest to scan when content is text.

The Vercel Geist `Entity` pattern — "row of descriptive content paired with a single action" — is exactly the right mental model for this app.

## 9. The jobs-list worked example

Applying every rule above to the current `/jobs` screen, which today renders **two equally-weighted CTAs per row** (`VIEW APPLICANTS` and `EDIT`):

1. **Make each row a single `<a href="/jobs/[code]">`** using the row-as-link `::after` overlay pattern.
2. **Drop the `VIEW APPLICANTS` button entirely.** The row click *is* viewing applicants — that's what clicking a job row means.
3. **Move `EDIT` (currently disabled) into a kebab `⋯`** on the right edge with menu items: *Edit job*, *Duplicate*, *Archive* (last item terracotta).
4. **Add a trailing `›`** chevron after the kebab to signal navigability.
5. **Keep the existing hover bg tint** (per design-system). **Do NOT add hover-revealed actions** — they're invisible on touch and hurt discoverability for new recruiters.

Result: the row reads as one navigable unit, the secondary actions are out of the scanning path, and the visual rhythm of the page recovers.

## 10. Anti-patterns checklist

A scanning checklist — if any of these are true on a list/table you just wrote, fix before declaring done.

❌ Two equally-weighted CTAs in a row
❌ `<button onClick={() => router.push(...)}>` wrapping a row
❌ `e.stopPropagation()` on inner buttons inside a row-button
❌ Nested `<button>` inside `<a>` (or vice versa)
❌ Inline destructive action (`Delete`, `Archive`, `Reject`, `Withdraw`) on a row
❌ Empty state rendered as an empty `<tbody>` instead of a separate block
❌ Empty state with two CTAs
❌ Empty state copy that doesn't explain *why* it's empty
❌ Spinner for a full-page initial load (use skeleton)
❌ Skeleton row height that doesn't match the real row (causes layout shift)
❌ Hover-only actions on a touch-capable surface
❌ Auto-fit column widths on a multi-page table (jitters between pages)
❌ Filter state in `useState` instead of `searchParams`
❌ Modal where a route would do
❌ Card grid for content that's purely text
⚠️ Numbers without `tabular-nums` / Geist Mono
⚠️ Row content wrapping to a second line (truncate instead)
⚠️ More than 2 inline action buttons on a row

## 11. References

- [NN/G — Action Menus in Tables](https://www.nngroup.com/articles/action-menus-tables/)
- [NN/G — Empty State Interface Design](https://www.nngroup.com/articles/empty-state-interface-design/)
- [NN/G — Skeleton Screens](https://www.nngroup.com/articles/skeleton-screens/)
- [NN/G — Bulk Actions Guidelines](https://www.nngroup.com/videos/bulk-actions-design-guidelines/)
- [NN/G — Data Tables: Four Major User Tasks](https://www.nngroup.com/articles/data-tables/)
- [Piccalilli — Accessible faux-nested interactive controls](https://piccalil.li/blog/accessible-faux-nested-interactive-controls/) — the source of the row-as-link pattern
- [GitHub Primer — ActionList](https://primer.style/product/components/action-list)
- [Vercel Geist — Entity, Table](https://vercel.com/geist) — the canonical row-with-single-action pattern
- [Shopify Polaris — Resource List](https://polaris-react.shopify.com/components/lists/resource-list)
- [PatternFly — Bulk Selection](https://www.patternfly.org/patterns/bulk-selection/)
- [Apple HIG — Disclosure Controls](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls)
- [UX Patterns Dev — Table vs List vs Cards](https://uxpatterns.dev/pattern-guide/table-vs-list-vs-cards)
- [Aurora Scharff — Managing search params in Next.js App Router](https://aurorascharff.no/posts/managing-advanced-search-param-filtering-next-app-router/)
- [`nuqs` — typed search-param state](https://nuqs.47ng.com/)

## 12. Open questions / future additions

This skill is a living document. Topics deliberately not yet covered, to be added as the app grows:

- **Drag-and-drop reorder** (kanban-style applicant pipelines)
- **Inline edit** (vs. detail-view edit) and when each wins
- **Undo toasts** for destructive actions and the timing window
- **Keyboard navigation** in lists (`j`/`k` row stepping, `Enter` to open, `?` for shortcut sheet)
- **Virtual scrolling** thresholds (when row count justifies the complexity)
- **Optimistic updates** for status changes (shortlist/reject flow)
- **Pagination vs. infinite scroll vs. "load more"** — Yuvabe's row counts are small; revisit when a single role draws 200+ applicants
- **Column show/hide** controls for power-user views
- **Saved filter presets** ("My open roles", "Needs review this week")
- **Detail-view side-by-side preview pane** (Gmail/Linear-style two-column reading) vs. full-page detail

When adding to this list, append in the section above with rules + a worked example, then note the resolution here.
