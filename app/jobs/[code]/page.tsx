import Link from "next/link";
import { notFound } from "next/navigation";
import { listJobs } from "@/lib/jobs-store";
import { listApplicationsByJobCode, type Application, type ApplicationStatus } from "@/lib/applications-store";
import { listCandidates, type Candidate } from "@/lib/candidates-store";
import { ArrowLeft, ArrowUpRight, Pencil } from "lucide-react";
import NavTabClient from "../_components/nav-tab";

/* —————————————————————————— atoms (inlined per design system) —————————————————————————— */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </span>
  );
}

function ColumnMarker({ numeral, title }: { numeral: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="font-serif italic text-5xl leading-none text-primary tabular">
        {numeral}.
      </span>
      <h1 className="font-serif italic text-3xl leading-none text-foreground tracking-tight max-w-[36ch] truncate">
        {title}
      </h1>
    </div>
  );
}

/** Score chip — colored by band per the Design Brief: ≥75 high, 50-74 mid, <50 low. */
function ScoreChip({ score }: { score: number }) {
  const band =
    score >= 75 ? "high" : score >= 50 ? "mid" : "low";
  const colorClass =
    band === "high"
      ? "text-[#3F6B3F] border-[#3F6B3F]/40 bg-[#3F6B3F]/[0.06]"
      : band === "mid"
      ? "text-[#B8893A] border-[#B8893A]/45 bg-[#B8893A]/[0.06]"
      : "text-primary border-primary/40 bg-primary/[0.06]";
  return (
    <div
      className={`inline-flex items-baseline justify-center min-w-[58px] px-2.5 py-1.5 border rounded-sm font-mono text-[20px] tabular leading-none ${colorClass}`}
      aria-label={`Match score ${score}`}
    >
      {String(score).padStart(2, "0")}
    </div>
  );
}

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  offered: "Offered",
};

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  new: "text-foreground/70",
  reviewing: "text-foreground",
  shortlisted: "text-[#2F5E7A]",
  rejected: "text-muted-foreground line-through",
  offered: "text-[#3F6B3F]",
};

/* —————————————————————————— time —————————————————————————— */

function relativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* —————————————————————————— page —————————————————————————— */

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const jobs = await listJobs();
  const job = jobs.find((j) => j.code === code);
  if (!job) notFound();

  const applications = await listApplicationsByJobCode(code);
  const allCandidates = await listCandidates();
  const candidatesById = new Map<string, Candidate>(
    allCandidates.map((c) => [c.id, c])
  );

  // Status counts for the chips
  const statusCounts = applications.reduce<Record<ApplicationStatus, number>>(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    { new: 0, reviewing: 0, shortlisted: 0, rejected: 0, offered: 0 }
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* —————— Sticky header —————— */}
      <header className="flex-shrink-0 border-b border-border bg-background z-10">
        <div className="px-10 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-serif italic text-lg leading-none">Yuvabe</span>
            <span className="text-muted-foreground">/</span>
            <Eyebrow>ATS</Eyebrow>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            All jobs
          </Link>
        </div>
        <nav className="px-10 flex items-center gap-8">
          <NavTabClient href="/jobs" label="Jobs" prefix="/jobs" />
          <NavTabClient href="/applications" label="Applications" prefix="/applications" />
          <NavTabClient href="/review" label="Review" prefix="/review" />
        </nav>
      </header>

      <main className="flex-1 overflow-hidden">
        <section className="h-full flex flex-col overflow-hidden">
          {/* Static top — job title + filter chips */}
          <div className="flex-shrink-0 px-10 pt-10 pb-5 border-b border-border bg-background">
            <div className="max-w-5xl">
              <ColumnMarker numeral="i" title={job.title} />
              <div className="mt-4 flex items-center gap-4 flex-wrap">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary tabular">
                  [JOB-{job.code}]
                </span>
                <span className="text-border">·</span>
                <Eyebrow>
                  <span className="tabular">
                    {String(job.criteria.length).padStart(2, "0")}
                  </span>{" "}
                  criteria
                </Eyebrow>
                <span className="text-border">·</span>
                <Eyebrow>
                  <span className="tabular">
                    {String(applications.length).padStart(2, "0")}
                  </span>{" "}
                  {applications.length === 1 ? "applicant" : "applicants"}
                </Eyebrow>
                <span className="text-border">·</span>
                <Eyebrow>posted {relativeTime(job.createdAt)}</Eyebrow>
                <Link
                  href={`/jobs/${job.code}/edit`}
                  className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                >
                  Edit
                  <Pencil className="h-3 w-3" strokeWidth={1.75} />
                </Link>
              </div>

              {applications.length > 0 && (
                <div className="mt-6 flex items-center gap-1 flex-wrap -ml-2.5">
                  <StatusFilterChip
                    label="All"
                    count={applications.length}
                    tone="neutral"
                    active
                  />
                  {(["shortlisted", "reviewing", "new", "offered", "rejected"] as ApplicationStatus[])
                    .filter((s) => statusCounts[s] > 0)
                    .map((s) => (
                      <StatusFilterChip
                        key={s}
                        label={STATUS_LABEL[s]}
                        count={statusCounts[s]}
                        tone={s === "shortlisted" ? "shortlist" : s === "offered" ? "offered" : "neutral"}
                        active={false}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Scrolling list */}
          <div className="flex-1 overflow-y-auto px-10 pt-8 pb-12">
            {applications.length === 0 ? (
              <EmptyState code={job.code} />
            ) : (
              <ul className="max-w-5xl">
                {applications.map((app, idx) => {
                  const candidate = candidatesById.get(app.candidateId);
                  if (!candidate) return null;
                  return (
                    <li
                      key={app.id}
                      className={`group border-b border-border/60 ${
                        idx === 0 ? "border-t border-border/60" : ""
                      }`}
                    >
                      <Link
                        href={`/applications/${app.id}`}
                        className="block py-5 -mx-4 px-4 rounded-sm hover:bg-secondary/40 transition-colors"
                      >
                        <ApplicationRow application={app} candidate={candidate} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>

      {/* —————— Footer —————— */}
      <footer className="border-t border-border px-10 py-3 flex-shrink-0 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>Yuvabe ATS &nbsp; · &nbsp; v0.1</span>
        <span className="italic font-serif normal-case tracking-normal text-muted-foreground/80">
          Hiring is a human act.
        </span>
        <span>2026</span>
      </footer>
    </div>
  );
}

/* —————————————————————————— application row —————————————————————————— */

function ApplicationRow({
  application,
  candidate,
}: {
  application: Application;
  candidate: Candidate;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex items-center gap-5 min-w-0 flex-1">
        <ScoreChip score={application.matchScore} />
        <div className="min-w-0 flex-1">
          <h3 className="font-serif italic text-xl leading-tight tracking-tight truncate">
            {candidate.name}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-[12px] text-muted-foreground flex-wrap">
            <span className="truncate">{candidate.email}</span>
            <span className="text-border">·</span>
            <span>{candidate.location}</span>
            <span className="text-border">·</span>
            <span className="tabular">
              {candidate.yearsOfExperience}y experience
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-5 flex-shrink-0">
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.18em] ${STATUS_COLOR[application.status]}`}
        >
          {STATUS_LABEL[application.status]}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground tabular hidden sm:inline">
          {relativeTime(application.receivedAt)}
        </span>
        <ArrowUpRight
          className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-px group-hover:-translate-y-px transition-all"
          strokeWidth={1.75}
        />
      </div>
    </div>
  );
}

/* —————————————————————————— status filter chip (display-only for now) —————————————————————————— */

function StatusFilterChip({
  label,
  count,
  tone,
  active,
}: {
  label: string;
  count: number;
  tone: "neutral" | "shortlist" | "offered";
  active: boolean;
}) {
  const toneClass =
    tone === "shortlist"
      ? "text-[#2F5E7A]"
      : tone === "offered"
      ? "text-[#3F6B3F]"
      : "text-muted-foreground";
  return (
    <button
      type="button"
      className={`
        font-mono text-[11px] uppercase tracking-[0.14em] tabular
        flex items-center gap-1.5 px-2.5 py-1 rounded-sm
        transition-all duration-150
        ${toneClass}
        ${active ? "bg-secondary opacity-100" : "opacity-65 hover:opacity-100 hover:bg-secondary/40"}
      `}
    >
      <span>{String(count).padStart(2, "0")}</span>
      <span>{label}</span>
    </button>
  );
}

/* —————————————————————————— empty state —————————————————————————— */

function EmptyState({ code }: { code: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center pb-24">
      <p className="font-serif italic text-3xl text-foreground/55 leading-tight">
        No applications yet for this role.
      </p>
      <p className="mt-4 max-w-md text-sm text-muted-foreground leading-relaxed">
        When candidates apply via email with{" "}
        <span className="font-mono text-primary">[JOB-{code}]</span> in the subject,
        they&apos;ll appear here, scored against the criteria you set.
      </p>
    </div>
  );
}
