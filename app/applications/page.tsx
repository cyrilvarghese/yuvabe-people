import Link from "next/link";
import { listApplications, type ApplicationStatus } from "@/lib/applications-store";
import { listCandidates, type Candidate } from "@/lib/candidates-store";
import { listJobs, type Job } from "@/lib/jobs-store";
import { ArrowUpRight } from "lucide-react";
import NavTabClient from "../jobs/_components/nav-tab";

/* —————————————————————————— atoms —————————————————————————— */

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
      <span className="font-serif italic text-2xl leading-none text-foreground/85">
        {title}
      </span>
    </div>
  );
}

function ScoreChip({ score }: { score: number }) {
  const colorClass =
    score >= 75
      ? "text-[#3F6B3F] border-[#3F6B3F]/40 bg-[#3F6B3F]/[0.06]"
      : score >= 50
      ? "text-[#B8893A] border-[#B8893A]/45 bg-[#B8893A]/[0.06]"
      : "text-primary border-primary/40 bg-primary/[0.06]";
  return (
    <div
      className={`inline-flex items-baseline justify-center min-w-[52px] px-2 py-1 border rounded-sm font-mono text-[16px] tabular leading-none ${colorClass}`}
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

export default async function ApplicationsListPage() {
  const applications = await listApplications();
  const candidates = await listCandidates();
  const jobs = await listJobs();

  const candidatesById = new Map<string, Candidate>(
    candidates.map((c) => [c.id, c])
  );
  const jobsByCode = new Map<string, Job>(jobs.map((j) => [j.code, j]));

  const total = applications.length;
  const statusCounts = applications.reduce<Record<ApplicationStatus, number>>(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    { new: 0, reviewing: 0, shortlisted: 0, rejected: 0, offered: 0 }
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <header className="flex-shrink-0 border-b border-border bg-background z-10">
        <div className="px-10 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-serif italic text-lg leading-none">Yuvabe</span>
            <span className="text-muted-foreground">/</span>
            <Eyebrow>ATS</Eyebrow>
          </div>
          <div className="flex items-center gap-6">
            <Eyebrow>
              <span className="tabular">{String(total).padStart(2, "0")}</span>
              &nbsp;{total === 1 ? "application" : "applications"} across {jobs.length}{" "}
              {jobs.length === 1 ? "role" : "roles"}
            </Eyebrow>
            <Link
              href="/applications/new"
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-primary transition-colors"
            >
              Match resume →
            </Link>
          </div>
        </div>
        <nav className="px-10 flex items-center gap-8">
          <NavTabClient href="/jobs" label="Jobs" prefix="/jobs" />
          <NavTabClient href="/applications" label="Applications" prefix="/applications" />
          <NavTabClient href="/review" label="Review" prefix="/review" />
        </nav>
      </header>

      <main className="flex-1 overflow-hidden">
        <section className="h-full flex flex-col overflow-hidden">
          {/* Static top */}
          <div className="flex-shrink-0 px-10 pt-10 pb-5 border-b border-border bg-background">
            <ColumnMarker numeral="i" title="Applications" />
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground tabular">
              {String(total).padStart(2, "0")} total &nbsp;·&nbsp; sorted by recency
            </p>
            <div className="mt-5 flex items-center gap-1 flex-wrap -ml-2.5">
              <FilterPill label="All" count={total} tone="neutral" active />
              {(["shortlisted", "reviewing", "new", "offered", "rejected"] as ApplicationStatus[])
                .filter((s) => statusCounts[s] > 0)
                .map((s) => (
                  <FilterPill
                    key={s}
                    label={STATUS_LABEL[s]}
                    count={statusCounts[s]}
                    tone={s === "shortlisted" ? "shortlist" : s === "offered" ? "offered" : "neutral"}
                    active={false}
                  />
                ))}
            </div>
          </div>

          {/* Scrolling list */}
          <div className="flex-1 overflow-y-auto px-10 pt-8 pb-12">
            {applications.length === 0 ? (
              <EmptyState />
            ) : (
              <ul className="max-w-5xl">
                {applications.map((app, idx) => {
                  const candidate = candidatesById.get(app.candidateId);
                  const job = jobsByCode.get(app.jobCode);
                  if (!candidate || !job) return null;
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
                        <div className="flex items-center justify-between gap-6">
                          <div className="flex items-center gap-5 min-w-0 flex-1">
                            <ScoreChip score={app.matchScore} />
                            <div className="min-w-0 flex-1">
                              <h3 className="font-serif italic text-xl leading-tight tracking-tight truncate">
                                {candidate.name}
                              </h3>
                              <div className="mt-1 flex items-center gap-2 text-[12px] text-muted-foreground flex-wrap">
                                <span className="truncate">{job.title}</span>
                                <span className="text-border">·</span>
                                <span className="font-mono text-primary">
                                  [JOB-{job.code}]
                                </span>
                                <span className="text-border">·</span>
                                <span className="truncate">{candidate.location}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-5 flex-shrink-0">
                            <span
                              className={`font-mono text-[10px] uppercase tracking-[0.18em] ${STATUS_COLOR[app.status]}`}
                            >
                              {STATUS_LABEL[app.status]}
                            </span>
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground tabular hidden sm:inline">
                              {relativeTime(app.receivedAt)}
                            </span>
                            <ArrowUpRight
                              className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-px group-hover:-translate-y-px transition-all"
                              strokeWidth={1.75}
                            />
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>

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

/* —————————————————————————— filter pill —————————————————————————— */

function FilterPill({
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

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center pb-24">
      <p className="font-serif italic text-3xl text-foreground/55 leading-tight">
        No applications yet.
      </p>
      <p className="mt-4 max-w-md text-sm text-muted-foreground leading-relaxed">
        When candidates apply via email with a job code, their applications
        appear here, scored against that job&apos;s criteria.
      </p>
    </div>
  );
}
