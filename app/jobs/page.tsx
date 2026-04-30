import Link from "next/link";
import { listJobs, type Job } from "@/lib/jobs-store";
import { listApplications } from "@/lib/applications-store";
import { ArrowUpRight, Plus } from "lucide-react";
import NavTabClient from "./_components/nav-tab";

/* —————————————————————————— small typographic atoms —————————————————————————— */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </span>
  );
}

function ColumnMarker({
  numeral,
  title,
}: {
  numeral: string;
  title: string;
}) {
  return (
    <div className="flex items-baseline gap-3 md:gap-4">
      <span className="font-serif italic text-3xl md:text-5xl leading-none text-primary tabular">
        {numeral}.
      </span>
      <span className="font-serif italic text-xl md:text-2xl leading-none text-foreground/85">
        {title}
      </span>
    </div>
  );
}

/* —————————————————————————— time helpers —————————————————————————— */

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function importanceCounts(criteria: Job["criteria"]) {
  let must = 0,
    strong = 0,
    nice = 0;
  for (const c of criteria) {
    if (c.importance === "must") must++;
    else if (c.importance === "strong") strong++;
    else nice++;
  }
  return { must, strong, nice };
}

/* —————————————————————————— page —————————————————————————— */

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const params = await searchParams;
  const newCode = params.new;
  const jobs = await listJobs();
  const count = jobs.length;

  // Cross-reference applications so each row shows its application count.
  const allApplications = await listApplications();
  const appsByJobCode = new Map<string, number>();
  for (const a of allApplications) {
    appsByJobCode.set(a.jobCode, (appsByJobCode.get(a.jobCode) ?? 0) + 1);
  }

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      {/* —————— Sticky header — brand + tabs —————— */}
      <header className="flex-shrink-0 border-b border-border bg-background z-10">
        <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="font-serif italic text-lg leading-none">
              Yuvabe
            </span>
            <span className="text-muted-foreground">/</span>
            <Eyebrow>ATS</Eyebrow>
          </div>
          <Eyebrow>
            <span className="tabular">{String(count).padStart(2, "0")}</span>
            &nbsp;{count === 1 ? "job" : "jobs"}
          </Eyebrow>
        </div>
        <nav className="px-4 md:px-10 flex items-center gap-6 md:gap-8 overflow-x-auto">
          <NavTabClient href="/jobs" label="Jobs" prefix="/jobs" />
          <NavTabClient
            href="/applications"
            label="Applicants"
            prefix="/applications"
          />
          <NavTabClient href="/review" label="Review" prefix="/review" />
        </nav>
      </header>

      <main className="md:flex-1 md:overflow-hidden">
        <section className="md:h-full flex flex-col md:overflow-hidden">
          {/* Static top */}
          <div className="flex-shrink-0 px-4 sm:px-6 md:px-10 pt-6 md:pt-10 pb-6 border-b border-border bg-background">
            <div className="flex items-end justify-between gap-6">
              <ColumnMarker numeral="i" title="Jobs" />
              <Link
                href="/jobs/new"
                className="inline-flex items-center gap-2 rounded-sm bg-primary text-primary-foreground px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                New job
              </Link>
            </div>
            {count > 0 && (
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground tabular">
                {String(count).padStart(2, "0")} {count === 1 ? "role" : "roles"} posted &nbsp;·&nbsp; sorted by newest
              </p>
            )}
          </div>

          {/* Scrolling list */}
          <div className="md:flex-1 md:overflow-y-auto px-4 sm:px-6 md:px-10 pt-6 md:pt-8 pb-12">
            {count === 0 ? (
              <EmptyState />
            ) : (
              <ul className="max-w-4xl">
                {jobs.map((job, idx) => {
                  const counts = importanceCounts(job.criteria);
                  const isNew = job.code === newCode;
                  const appCount = appsByJobCode.get(job.code) ?? 0;
                  return (
                    <li
                      key={job.id}
                      className={`
                        group border-b border-border/60 last:border-b-0
                        ${idx === 0 ? "border-t border-border/60" : ""}
                        ${isNew ? "highlight-new" : ""}
                      `}
                    >
                      <div className="py-5 md:py-6 -mx-4 px-4 rounded-sm">
                        <div className="flex items-start justify-between gap-3 md:gap-6">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-3 mb-2">
                              <h3 className="font-serif italic text-xl md:text-2xl leading-tight tracking-tight truncate">
                                {job.title}
                              </h3>
                              {isNew && (
                                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-primary flex-shrink-0 hidden sm:inline">
                                  ← just saved
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary tabular">
                                [JOB-{job.code}]
                              </span>
                              <span className="text-border">·</span>
                              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground tabular">
                                {String(job.criteria.length).padStart(2, "0")} criteria
                              </span>
                              <span className="text-border hidden sm:inline">·</span>
                              <span className="font-mono text-[10px] uppercase tracking-[0.14em] tabular hidden sm:inline">
                                <span
                                  className={appCount > 0 ? "text-foreground font-medium" : "text-muted-foreground/70"}
                                >
                                  {String(appCount).padStart(2, "0")}
                                </span>{" "}
                                <span className="text-muted-foreground">
                                  {appCount === 1 ? "applicant" : "applicants"}
                                </span>
                              </span>
                              <span className="text-border hidden md:inline">·</span>
                              <span className="font-mono text-[10px] uppercase tracking-[0.14em] tabular hidden md:inline">
                                <span className="text-primary">
                                  {String(counts.must).padStart(2, "0")} must
                                </span>
                                <span className="text-muted-foreground/60 mx-1.5">·</span>
                                <span className="text-foreground">
                                  {String(counts.strong).padStart(2, "0")} strong
                                </span>
                                <span className="text-muted-foreground/60 mx-1.5">·</span>
                                <span className="text-muted-foreground">
                                  {String(counts.nice).padStart(2, "0")} nice
                                </span>
                              </span>
                              <span className="text-border hidden lg:inline">·</span>
                              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground hidden lg:inline">
                                {relativeTime(job.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-stretch gap-1 flex-shrink-0 min-w-[140px]">
                            <Link
                              href={`/jobs/${job.code}`}
                              className="font-mono text-[10px] uppercase tracking-[0.16em] px-3 py-2 rounded-sm text-foreground hover:bg-secondary border border-border hover:border-foreground/20 transition-colors inline-flex items-center justify-center gap-1.5"
                            >
                              View applicants
                              <ArrowUpRight
                                className="h-3 w-3"
                                strokeWidth={2}
                              />
                            </Link>
                            <button
                              type="button"
                              disabled
                              title="Edit coming next"
                              className="font-mono text-[10px] uppercase tracking-[0.16em] px-3 py-2 rounded-sm text-muted-foreground/65 italic cursor-not-allowed inline-flex items-center justify-center"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>

      {/* —————— Footer —————— */}
      <footer className="border-t border-border px-4 sm:px-6 md:px-10 py-3 flex-shrink-0 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className="truncate">Yuvabe ATS &nbsp; · &nbsp; v0.1</span>
        <span className="italic font-serif normal-case tracking-normal text-muted-foreground/80 hidden md:inline">
          Hiring is a human act.
        </span>
        <span>2026</span>
      </footer>
    </div>
  );
}

/* —————————————————————————— empty state —————————————————————————— */

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center pb-24">
      <p className="font-serif italic text-3xl text-foreground/55 leading-tight">
        No jobs yet.
      </p>
      <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
        Upload a job description and we&apos;ll pull out the criteria
        recruiters screen on. Saved jobs appear here.
      </p>
      <Link
        href="/jobs/new"
        className="mt-8 inline-flex items-center gap-2 rounded-sm bg-primary text-primary-foreground px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        Create the first job
      </Link>
    </div>
  );
}
