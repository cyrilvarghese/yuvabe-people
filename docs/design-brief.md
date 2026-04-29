# Yuvabe ATS — Design Brief

A document for Claude to build the prototype. This is paired with the PRD — read that first for *what* exists and the data model. This doc is about *what it looks like and how it feels to use*.

---

## Design philosophy

Hiring is a human act dressed up in software. Most ATS tools forget this — they look like spreadsheets pretending to be apps, and they treat candidates as rows. This product should feel like the opposite: a tool that respects the weight of the decisions being made inside it, while staying ruthlessly efficient for the people who use it eight hours a day.

**Three principles, in priority order:**

1. **Reasoning before numbers.** Every score must show its work. Trust is built by reasoning, not by precision. A 73 with one good sentence behind it is more useful than a 73.4 alone.
2. **Density where it earns its keep.** The applicant queue is a workbench — dense, scannable, keyboard-friendly. Other screens (candidate detail, notes) breathe. Don't apply uniform spacing across the app; match the screen to the work being done on it.
3. **Status changes are the conversation.** HR and HM never need to ping each other outside the tool. The activity log + notes thread on each application is the conversation.

---

## Aesthetic direction

**Considered Editorial × Operational Precision.**

Think *NYT product team* meets *Linear*. The candidate detail page reads like a thoughtful profile. The queue feels like a precise instrument. The two aesthetics coexist because the work on each screen is genuinely different.

Anti-references — what to actively avoid:
- Generic SaaS dashboards (rounded blue buttons, purple gradients, hero illustrations of people pointing at charts)
- Material Design defaults
- "AI product" purple/teal gradients
- Slack/Notion mimicry without intent
- Default shadcn styling left untouched (use it, but theme it)

Reference points (study, don't copy):
- Linear (table density, keyboard-driven actions, restraint)
- Stripe (typography hierarchy, table design, status badge patterns)
- Are.na (editorial calm)
- Posthog dashboards (information density without ugliness)

---

## Visual system

### Color

A warm, restrained palette. One accent, one signal color. No gradients except a single subtle one on the login screen.

```css
:root {
  /* Surfaces — warm, not gray */
  --bg:           #FAF8F4;  /* page background, warm off-white */
  --surface:      #FFFFFF;  /* cards, table rows */
  --surface-2:    #F4F1EA;  /* hover state, subtle wells */
  --border:       #E5E0D5;  /* hairline borders */
  --border-strong:#C9C2B1;

  /* Ink */
  --ink:          #1A1815;  /* primary text — near-black, warm */
  --ink-2:        #4A4640;  /* secondary text */
  --ink-3:        #8A857B;  /* tertiary, metadata */
  --ink-inverse:  #FAF8F4;

  /* Accent — earthy, not corporate */
  --accent:       #B8553A;  /* terracotta, used sparingly for primary CTAs */
  --accent-soft:  #E8D5CC;  /* terracotta-tinted soft surface */

  /* Status — these are the only "bright" colors in the app */
  --status-new:        #8A857B;  /* gray, neutral */
  --status-shortlisted:#2F5E7A;  /* deep teal-blue, HR signal */
  --status-approved:   #3F6B3F;  /* forest green, terminal positive */
  --status-rejected:   #8A857B;  /* same as new + strikethrough */
  --status-review:     #B8893A;  /* warm amber */

  /* Score visualization */
  --score-high: #3F6B3F;  /* >= 75 */
  --score-mid:  #B8893A;  /* 50-74 */
  --score-low:  #B8553A;  /* < 50, terracotta */
}
```

Dark mode is **out of scope for the prototype** — commit to light, do it well.

### Typography

Two faces, paired carefully. Both available on Google Fonts so no licensing fuss.

- **Display / editorial headings — Newsreader** (variable, axis: italic, weight 200–800). Serif with personality. Used for: candidate names on detail page, page-level H1s, empty-state messages, score numbers on the candidate detail.
- **UI / body — Geist** (sans, weights 400/500/600). Used for everything else: tables, forms, buttons, navigation, body copy.
- **Numeric — Geist Mono** (weights 400/500). Used for: scores in the queue table, timestamps, IDs, anywhere alignment matters.

```css
--font-display: 'Newsreader', Georgia, serif;
--font-ui:      'Geist', system-ui, sans-serif;
--font-mono:    'Geist Mono', ui-monospace, monospace;
```

**Type scale** (use these literally — don't invent intermediate sizes):

| Token | Size | Line | Use |
|---|---|---|---|
| `display-xl` | 56/60 | 1.05 | Candidate name on detail page |
| `display-lg` | 40/44 | 1.1  | Page H1 (editorial pages only) |
| `h1` | 28/32 | 1.2 | Page H1 (utility pages) |
| `h2` | 20/24 | 1.3 | Section headings |
| `h3` | 16/20 | 1.4 | Card titles |
| `body` | 15/24 | 1.55 | Body text |
| `body-sm` | 13/20 | 1.5 | Table cells, metadata |
| `caption` | 12/16 | 1.4 | Labels, badges, breadcrumbs |
| `mono-sm` | 13/20 | 1.4 | Scores in tables |
| `mono` | 15/24 | 1.5 | Score numbers on detail |

**Typographic rules:**
- Display sizes use Newsreader, often slightly italic for warmth (`font-style: italic` on candidate names).
- Body and UI in Geist, weight 400 default, 500 for emphasis, 600 for buttons and column headers.
- Tabular numerals (`font-variant-numeric: tabular-nums`) on every score, count, or aligned number.
- Generous letter-spacing on caption/label text (`letter-spacing: 0.04em; text-transform: uppercase`) — this is one of the few "design moves" in the system.

### Spacing

4px base unit. Scale: `4, 8, 12, 16, 24, 32, 48, 64, 96`. Don't use intermediate values.

- Queue table row padding: `12px 16px` (dense)
- Card padding: `24px`
- Section spacing on detail page: `48px`
- Page gutter: `32px` (desktop), `16px` (mobile — but mobile is post-MVP)

### Borders, radii, elevation

- Borders: 1px solid `--border`. Use borders, not shadows, to separate things. This is a deliberate aesthetic choice — shadows feel SaaS-y; borders feel editorial.
- Radii: `4px` for inputs, buttons, badges. `0` for table rows. `8px` for cards. Never more than 8.
- Shadows: only one — `0 1px 0 rgba(26, 24, 21, 0.04), 0 8px 24px -8px rgba(26, 24, 21, 0.08)`. Used on the bulk action bar and modal dialogs only.

### Motion

Restrained. This is a tool, not a toy.

- Default transition: `150ms cubic-bezier(0.4, 0, 0.2, 1)`.
- Status badge color changes: `200ms`.
- Bulk action bar entry: `slide up 200ms` from below the table.
- Score number changes after rematch: count up over `400ms` using `requestAnimationFrame`.
- No spring physics. No bouncy reveals. No scroll-triggered choreography. The first time someone uses this tool they should think "fast and clean," not "this is a designer's portfolio."

---

## Component library (key components)

These are the components that carry the design's identity. Build them carefully; everything else can be standard shadcn.

### 1. Score chip (inline, in tables)

```
[ 87 ]   ← mono, tabular nums, 13px
```
- Box: 32×20, 4px radius, 1px border colored by score band.
- Fill: very subtle tinted background (`--score-high` at 8% opacity, etc.).
- Number: monospace, weight 500, color matches band.

### 2. Score breakdown (on detail page) — *the most important component*

A vertical stack of horizontal rows, one per dimension. For each:
- **Left:** dimension label in `caption` style (uppercase, tracked).
- **Center:** a thin horizontal bar (4px tall, full width of column), filled to score percentage, colored by band.
- **Right:** the number, in `mono` 24px, tabular nums.
- **Below:** the reasoning sentence in `body`, color `--ink-2`, max-width 60ch.

Reasoning is always visible by default on the detail page. Don't hide it behind a click — that's the whole point. (Reasoning *is* collapsed in the table tooltip variant of this component.)

### 3. Status badge

- Pill, 4px radius, `caption` size, uppercase, tracked.
- Background: status color at 12% opacity. Text: status color at full strength.
- Never use status color alone to convey status — always pair with text.

### 4. Activity log entry

A single line of text, no avatars, no boxes. Format:

```
[time]  [actor]  [verb]  [object]
2h ago  Priya    shortlisted  this candidate
```

- Time in `caption`, `--ink-3`.
- Actor in `body-sm`, weight 500.
- Verb past-tense, `--ink-2`.
- System events have no actor, just verb: "received via email" or "scored 73 against JD".

Activity log is dense — entries `8px` apart, no separators between, `--ink-3` for connecting words. Reads like a quiet timeline.

### 5. Note thread

A note is **not** a chat bubble. It's an editorial paragraph.

- Author name: Newsreader italic, 16px.
- Timestamp: `caption`, `--ink-3`, on the same line.
- Body: `body`, `--ink`, max-width 60ch, no background, no card, no border.
- 24px between notes.
- Compose box at the bottom: full-width textarea with a single hairline top border. Submit button is a simple text button — "Add note" — terracotta, no background.

### 6. Bulk action bar

Floats at the bottom of the queue, 24px from bottom edge, centered. Slides in from below when ≥1 row is selected.

- White surface, `8px` radius, the only shadow in the app.
- "3 selected · Shortlist · Reject" — actions inline, separated by middots.
- Cmd+A selects all visible rows. Esc deselects.

### 7. Empty states

Editorial, not cute. No illustrations. A single sentence in Newsreader italic, 24px, centered, `--ink-2`. Optionally one supporting line in `body-sm` underneath.

Examples:
- *"No applications yet for this role."* / "When candidates apply via email, they'll appear here."
- *"Nothing in review."* / "Applications that couldn't be auto-routed will land here."
- *"This candidate has no notes — yet."*

---

## Screen-by-screen specs

For each screen: layout intent, what makes it specific to this product, and what to definitely avoid.

### S1. Login

- Full viewport, single column, centered, max-width 360px.
- "Yuvabe" wordmark at top in Newsreader italic, 28px.
- Below: a single italic line of body copy — *"Hiring is a human act."* — `--ink-3`. This is the only place the product editorializes. Earn it here.
- Email + password fields, single primary button (terracotta).
- No social logins, no "remember me", no marketing imagery.

Avoid: split-screen layouts with imagery, gradient backgrounds, Yuvabe logo enlarged.

### S2. Jobs list (`/jobs`)

The recruiter's home. HR sees all jobs; HM sees only assigned.

**Layout:** standard app shell — left rail nav (60px wide, icon + tooltip), main content with 32px gutters.

**Page header:** page title "Jobs" in `h1`, right-aligned "New job" button (HR only).

**Table columns:**
| Title | Department | Open apps | Needs review | Hiring manager | Last activity |

- Title in `body`, weight 500, link color (terracotta on hover only — default is `--ink`).
- Department: small badge, neutral, with department name.
- Open apps: number in mono, with a tiny score-distribution sparkline next to it (4px tall, shows the spread of overall scores in that job's queue — gives the recruiter a glance at quality before clicking in). This is the kind of detail that elevates the product.
- Needs review: only shown if > 0, in amber.
- Hiring manager: initials in a 24px circle, plus name on hover.
- Last activity: relative time, `--ink-3`.

Row height: 48px. Hover: `--surface-2` background. Click anywhere → job detail.

Avoid: card grid layouts, large thumbnails, "filter by status" chips above the table — there are too few jobs for filtering to matter.

### S3. Job create/edit (`/jobs/new`, `/jobs/{id}/edit`)

A long, sectioned form. Single column, max-width 720px, centered.

Sections (each with `h2` header, `caption` description below):
1. **Basics** — title, department (select), location (text), hiring manager (select).
2. **Description** — large textarea (min 320px tall), supports paste from LinkedIn or Word. Show character count.
3. **Custom criteria** — repeater rows: `[label] [required ✓]`. "Add criterion" link button at bottom.
4. **Competency profile** — select existing or "Create new" inline. If creating new: nested form with competency rows (`name`, `weight slider 0-1`, `description`). The weight sliders share a budget — show a small bar at the top of the competency list visualizing how the weights distribute, with a warning if they don't sum to 1.0.
5. **Sources** — checkboxes for LinkedIn, Careers page, Referral, Other. (Display only for now — actual posting integration is out of scope.)

Save button bottom right, sticky on scroll. Cancel returns to jobs list.

### S4. Job detail / applicant queue (`/jobs/{id}`) — **the workhorse**

This is the screen people will use most. Spend the most design effort here.

**Layout:** two regions stacked.

**Top region — job header (collapsible):**
- Job title in `display-lg` (Newsreader, italic optional).
- Below: department badge, location, hiring manager initials, "Open" status, "23 applicants · 5 shortlisted · 3 approved" in `body-sm`, `--ink-3`.
- Collapse to a single 48px bar after scrolling 100px. (Sticky header pattern.)

**Bottom region — applicant queue:**

Filter row above the table:
- Status filter: chips for `All / New / Shortlisted / Approved / Rejected / Needs review`. Active chip has accent border.
- Sort: dropdown — `Overall score (default) / Recency / Name`.
- Search: tucked right, hairline border, becomes prominent on focus.

Table columns:
| ☐ | Name | Overall | JD fit | Competency | Location | Status | Received |

- Checkbox column for bulk selection.
- Name: `body`, weight 500. Below name in `caption`, `--ink-3`: applicant's email.
- Overall: large score chip (40×24, slightly bigger than table chips elsewhere) — this is the headline number.
- JD fit + Competency: small score chips.
- Location: ✓ or ✗, with the actual location string in `caption` underneath.
- Status: badge.
- Received: relative time.
- Right-most: hover-only kebab menu with `Open / Rematch / Reject`.

Row height: 56px (slightly taller than jobs list because more info).
Click row (not checkbox) → application detail.

Bulk action bar (component #6) floats up when rows are selected.

**Avoid:** tabs for status (use chips, not tabs — tabs imply separate views, chips imply filters on one view), avatar columns (we don't have headshots, fake ones look terrible), modal dialogs for actions (use the bulk bar or inline buttons).

### S5. Application detail (`/applications/{id}`) — **the editorial moment**

Single column on mobile; on desktop, a two-column layout. Max-width 1080px, centered.

**Left column (sticky, ~320px):**
- Applicant name in `display-xl`, Newsreader, italic. This is *the* typographic moment of the product.
- Below: email, phone, location in `body-sm`, `--ink-2`, one per line.
- Resume download — small terracotta text link, "Download resume (PDF)".
- Overall score in `display-lg` mono, color by band, with the band name in `caption` below ("Strong match" / "Fair match" / "Weak match").
- Status badge.
- Action buttons stacked: HR sees `Shortlist`. HM sees `Approve` / `Reject`. Both see `Re-run match`. Buttons are full-width within the column.
- For an approved application: a `Send to scheduling` button replaces approve/reject.

**Right column (scrolling content):**

Sections, separated by 48px and a single `--border` hairline:

1. **Match summary** — one paragraph in Newsreader italic, 18px, `--ink`. This is the LLM's overall reasoning, presented as if it were an editor's note. Quote-marks are okay here (single set, around the whole paragraph).
2. **JD fit breakdown** — score breakdown component (#2), four rows: skills, experience, domain, communication.
3. **Competency match** — same component, one row per competency. Section header includes the linked profile name in `caption`.
4. **Hard filters** — simple two-row mini-table: location (✓/✗ + reasoning), custom criteria (✓/✗ + which criteria matched).
5. **Cover note** — verbatim, in body text, set in a slightly indented column with a hairline left border. Treat it like a pull-quote.
6. **Notes** — note thread (#5) with compose box.
7. **Activity** — activity log (#4).

Avoid: card-in-card layouts, tabs to hide sections (everything is on one page, scrollable — recruiters will Cmd+F), avatars, anything that makes this feel like a CRM.

### S6. Needs review queue (`/needs-review`)

Same structure as the job queue, but with one extra column: **"Why?"** — shows the LLM's classification reasoning in `body-sm`, max two lines, truncated. On hover, full reasoning in a tooltip.

Each row has an inline action: dropdown to assign to a job, then "Save & rematch" button. Once assigned, row leaves this view.

Page tone is amber-accented — small amber dot next to page title, amber border on the "Why?" column. Subtle but noticeable.

### S7. Competency profiles (`/competency-profiles`)

List view: simple table — `Role title | # competencies | Used by # jobs | Last edited`.

Edit view: form with competency repeater. The weight-distribution bar at the top is the visual centerpiece — shows weights as proportional segments of a single horizontal bar, each segment labeled with the competency name. Drag a segment edge to redistribute. (For prototype, sliders are fine; the segmented bar is a v2 polish.)

---

## Interaction patterns

### Bulk approval — the "approve, approve, approve" UX

This was an explicit ask in the original product brief. Make it satisfying.

- Cmd+A selects all visible rows.
- `J` and `K` move row selection (Linear convention).
- `Shift+S` shortlists selected (HR), `Shift+A` approves (HM), `Shift+R` rejects.
- Bulk action bar shows keyboard hints inline: "Shortlist (⇧S) · Reject (⇧R)".
- Confirmation: optimistic UI — badges update instantly, toast at bottom-left "5 candidates shortlisted · Undo". Undo lasts 6 seconds.

### Status transitions

When status changes (single or bulk), the badge animates: 200ms cross-fade between colors. No size changes, no bounce.

### Score updates

After a rematch, the overall score on the application detail counts up/down to its new value over 400ms. Sub-scores update instantly. This signals "something happened" without being theatrical.

### Note submission

Submit on Cmd+Enter. Note appears at the top of the thread instantly (optimistic). On error, the note stays in the compose box with an inline error.

### Empty selection state vs. populated

When no rows selected: show normal table footer (pagination / count).
When rows selected: bulk action bar slides up; table footer fades to 30% opacity.

---

## Accessibility

- All interactive elements keyboard-reachable, with visible focus rings (2px terracotta outline, 2px offset).
- Status badges use both color and text — never color alone.
- Score color bands also have textual labels nearby ("Strong match" / "Fair match" / "Weak match").
- All form inputs have explicit labels (no placeholder-as-label).
- Contrast: body text `--ink` on `--bg` is 14.8:1 — well above AAA. Tertiary `--ink-3` on `--bg` is 4.6:1 — passes AA for body text.
- The terracotta accent on `--bg` is 4.7:1 — okay for interactive elements, but use weight 500+ on terracotta text to ensure legibility.

---

## What to build for the prototype (vs. what's in the PRD)

The PRD describes the full system. The **first design prototype** should be:

- **Static, click-through.** No backend wiring needed for the initial design pass. Mock data only.
- **Three screens at fidelity:** Job detail (S4), Application detail (S5), Login (S1). These three carry the design's identity. If they're right, the rest will follow the visual system.
- **Two screens at lower fidelity:** Jobs list (S2) and Needs review (S6) — sketched out using the visual system but not pixel-perfect.
- **Defer entirely from this prototype:** Job create form (S3) and Competency profiles (S7) — these are utility forms, not where the design lives.

Once the three high-fidelity screens are approved, the rest builds out from the established system.

---

## Mock data for the prototype

Use these to populate the demo. They're chosen to exercise the visual system — different score bands, different status states, a needs-review case.

**Jobs (3):**
1. *Senior AI Engineer* — Engineering — Auroville, IN
2. *Digital Marketing Lead* — Marketing — Remote
3. *Product Designer (UI/UX)* — Design — Auroville, IN

**Applicants for "Senior AI Engineer" (6, demonstrating range):**
1. Aisha Khan — overall 89, shortlisted, location ✓
2. Marcus Chen — overall 81, approved, location ✓
3. Priya Sharma — overall 76, shortlisted, location ✗ (Mumbai)
4. Daniel Okafor — overall 64, scored, location ✓
5. Lakshmi R — overall 52, scored, location ✓, custom criteria ✗
6. James Patel — overall 38, rejected, location ✓

**One needs-review case:** an applicant whose resume looks more like a designer than an engineer; classification confidence 0.42.

**Notes on the top candidate's detail page:** two notes — one from "Priya (HR)" saying "Strong publication record, recommend fast-track", one from "Arvind (Hiring Manager)" replying "Agreed. Let's get her in next week."

These specifics matter — generic "John Doe" placeholder names will let the design feel generic. Use names that would plausibly apply to a Yuvabe role; mix gender and ethnic background; make the notes sound like real working professionals.

---

## One last note

If something in this brief conflicts with what feels right in execution, trust the principles at the top: reasoning before numbers, density where it earns its keep, status changes are the conversation. The visual system serves those — not the other way around.
