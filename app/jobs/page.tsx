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
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* —————— Sticky header — brand + tabs —————— */}
      <header className="flex-shrink-0 border-b border-border bg-background z-10">
        <div className="px-10 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
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
        <nav className="px-10 flex items-center gap-8">
          <NavTabClient href="/jobs" label="Jobs" prefix="/jobs" />
          <NavTabClient
            href="/applications"
            label="Applications"
            prefix="/applications"
          />
          <NavTabClient href="/review" label="Review" prefix="/review" />
        </nav>
      </header>

      <main className="flex-1 overflow-hidden">
        <section className="h-full flex flex-col overflow-hidden">
          {/* Static top */}
          <div className="flex-shrink-0 px-10 pt-10 pb-6 border-b border-border bg-background">
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
          <div className="flex-1 overflow-y-auto px-10 pt-8 pb-12">
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
                      <Link
                        href={`/jobs/${job.code}`}
                        className="block py-6 -mx-4 px-4 rounded-sm hover:bg-secondary/40 transition-colors"
                      >
                        <div className="flex items-baseline justify-between gap-6">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-3 mb-2">
                              <h3 className="font-serif italic text-2xl leading-tight tracking-tight truncate">
                                {job.title}
                              </h3>
                              {isNew && (
                                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-primary flex-shrink-0">
                                  ← just saved
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary tabular">
                                [JOB-{job.code}]
                              </span>
                              <span className="text-border">·</span>
                              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground tabular">
                                {String(job.criteria.length).padStart(2, "0")}{" "}
                                criteria
                              </span>
                              <span className="text-muted-foreground/60">·</span>
                              <span className="font-mono text-[10px] uppercase tracking-[0.14em] tabular">
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
                            </div>
                          </div>
                          <div className="flex items-center gap-5 flex-shrink-0">
                            <div className="text-right leading-none">
                              <span
                                className={`font-mono text-[15px] tabular block ${
                                  appCount > 0 ? "text-foreground" : "text-muted-foreground/70"
                                }`}
                              >
                                {String(appCount).padStart(2, "0")}
                              </span>
                              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground mt-1.5 block">
                                {appCount === 1 ? "applicant" : "applicants"}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                              {relativeTime(job.createdAt)}
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground group-hover:text-primary transition-colors">
                              View
                              <ArrowUpRight
                                className="h-3 w-3 group-hover:translate-x-px group-hover:-translate-y-px transition-transform"
                                strokeWidth={2}
                              />
                            </span>
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
