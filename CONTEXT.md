# Yuvabe ATS

A small applicant-tracking system for Yuvabe. Inbound applications arrive via email; the system routes each to the right Job, scores the fit, and surfaces a ranked list with explainable reasoning.

## Language

**Job**:
A posted role that applicants apply to.
_Avoid_: Position, requisition, opening, posting (use "Job" everywhere).

**Job code**:
A short, human-typeable identifier for a Job, embedded in postings and email subjects as `[JOB-<code>]`. Six characters from an unambiguous alphabet. Distinct from the internal database id.
_Avoid_: Job ID, ticket number, posting reference. (Internal record's primary key is "id", not exposed to applicants.)

**Application**:
A candidate's submission for one Job, originating from an inbound email. Carries the resume, a cover note, and a Match Score.
_Avoid_: Submission, candidacy, applicant record.

**Applicant**:
The person who sent the email. Identified by their email address. May produce multiple Applications across different Jobs. **In the UI, "Applicants" is the user-facing label** — recruiters think about people, not application records. The data model retains `Application` as a distinct entity (the submission event); the UI just labels them as Applicants because that's how recruiters reason about them.
_Avoid_: Candidate (we use Applicant during intake; future slices may distinguish "applicant who's been progressed" as Candidate).

**Match Score**:
The system's assessment of how well an Application fits its Job. A single overall number (0..100) plus a per-criterion breakdown — one row per **Criterion** in the Job's criteria list (typically 8–16 rows, grouped by importance tier Must / Strong / Nice). Each row records `matched: yes | partial | no`, a 0–10 score, and a short evidence sentence quoted or paraphrased from the resume. The reasoning is the point — a number without reasoning is not a Match Score.
_Avoid_: per-dimension scoring (an earlier design that hard-coded skills/experience/domain/communication). The current model is dynamic per-criterion, grounded in the JD.

**Criterion**:
A single requirement extracted from the JD when the Job was created — e.g., "4+ years UX/UI design", "Figma proficiency". Has a stable `id` (8-char nanoid, generated in code at extraction time, not by the LLM), a `category` (skill / experience / education / domain / other), a short `label` (3–8 words), and an `importance` tier (Must / Strong / Nice). The full set of Criteria for a Job is what an Application is matched against. Each `matchBreakdown` row on an Application carries the parent Criterion's `id` so renaming a label doesn't orphan existing match evidence.

**JD fit**:
The single dimension of matching this slice covers — how well the resume + cover note match the Job's description. Distinct from "competency fit" (against a separately-defined competency profile, deferred to later slices) and "hard filters" (location, custom criteria, also deferred).

**Inbound email contract**:
The rules an email must follow to become an Application. The email must arrive at the configured inbox and must contain a valid Job code in the form `[JOB-<code>]` somewhere in subject or body. Without a valid code, the email is bounced via auto-reply and produces no Application.

## Relationships

- A **Job** has many **Applications**
- An **Application** belongs to exactly one **Job** and has at most one **Match Score**
- An **Applicant** is identified by email and may have many **Applications** (one per Job they applied to)

## Example dialogue

> **Dev:** "When an **Applicant** sends an email, do we create the **Application** before we know the **Match Score**?"
> **Domain expert:** "Yes. The **Application** exists the moment we receive a valid email. The **Match Score** is computed seconds later. The two are separate records."
> **Dev:** "And if the email's missing the **Job code**?"
> **Domain expert:** "Then it never becomes an **Application** at all — we bounce it. The **Inbound email contract** wasn't met."

## Flagged ambiguities

- "Job ID" appeared in early conversation to mean what we now call **Job code**. Resolved: the public-facing identifier is **Job code** (6-char nanoid); the database primary key is "id" and is never shown to applicants.
