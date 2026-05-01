import Link from "next/link";
import { listApplications, type ApplicationStatus } from "@/lib/applications-store";
import { listCandidates, type Candidate } from "@/lib/candidates-store";
import { listJobs, type Job } from "@/lib/jobs-store";
import { ArrowUpRight } from "lucide-react";
import NavTabClient from "../jobs/_components/nav-tab";

/* —————————————————————————— atoms —————————————————————————— */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow text-muted-foreground">{children}</span>;
}

function ColumnMarker({ numeral, title }: { numeral: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3 md:gap-4">
      <span className="font-serif italic text-display md:text-display-xl leading-none text-primary tabular">
        {numeral}.
      </span>
      <span className="font-serif italic text-h2 md:text-h1 leading-none text-foreground/85">
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
      className={`inline-flex items-baseline justify-center min-w-[44px] md:min-w-[52px] px-2 py-1 border rounded-sm font-mono text-body-lg md:text-h3 tabular leading-none ${colorClass}`}
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

const VALID_STATUSES: ApplicationStatus[] = [
  "new",
  "reviewing",
  "shortlisted",
  "rejected",
  "offered",
];

export default async function ApplicationsListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const filter =
    params.status && VALID_STATUSES.includes(params.status as ApplicationStatus)
      ? (params.status as ApplicationStatus)
      : null;

  const allApplications = await listApplications();
  const candidates = await listCandidates();
  const jobs = await listJobs();

  const candidatesById = new Map<string, Candidate>(
    candidates.map((c) => [c.id, c])
  );
  const jobsByCode = new Map<string, Job>(jobs.map((j) => [j.code, j]));

  // All counts come from the unfiltered set — chips are navigators, not status.
  const total = allApplications.length;
  const statusCounts = allApplications.reduce<Record<ApplicationStatus, number>>(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    { new: 0, reviewing: 0, shortlisted: 0, rejected: 0, offered: 0 }
  );

  // The list rendered is the filtered set.
  const applications = filter
    ? allApplications.filter((a) => a.status === filter)
    : allApplications;

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      <header className="flex-shrink-0 border-b border-border bg-background z-10">
        <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="font-serif italic text-xl leading-none">Yuvabe</span>
            <span className="text-muted-foreground">/</span>
            <Eyebrow>ATS</Eyebrow>
          </div>
          <Eyebrow>
            <span className="tabular">{String(total).padStart(2, "0")}</span>
            &nbsp;
            <span className="hidden sm:inline">
              {total === 1 ? "application" : "applications"} across {jobs.length}{" "}
              {jobs.length === 1 ? "role" : "roles"}
            </span>
            <span className="sm:hidden">{total === 1 ? "app" : "apps"}</span>
          </Eyebrow>
        </div>
        <nav className="px-4 md:px-10 flex items-center gap-6 md:gap-8 overflow-x-auto">
          <NavTabClient href="/jobs" label="Jobs" prefix="/jobs" />
          <NavTabClient href="/applications" label="Applicants" prefix="/applications" />
          <NavTabClient href="/review" label="Review" prefix="/review" />
        </nav>
      </header>

      <main className="md:flex-1 md:overflow-hidden">
        <section className="md:h-full flex flex-col md:overflow-hidden">
          {/* Static top */}
          <div className="flex-shrink-0 px-4 sm:px-6 md:px-10 pt-6 md:pt-10 pb-5 border-b border-border bg-background">
            <ColumnMarker numeral="i" title="Applications" />
            <p className="mt-4 caps-meta text-muted-foreground tabular">
              {String(applications.length).padStart(2, "0")} of {String(total).padStart(2, "0")}
              &nbsp;·&nbsp; sorted by recency
              {filter && <> &nbsp;·&nbsp; filtered by {filter}</>}
            </p>
            <div className="mt-5 flex items-center gap-1 flex-wrap -ml-2.5">
              <FilterPill href="/applications" label="All" count={total} tone="neutral" active={!filter} />
              {(["shortlisted", "reviewing", "new", "offered", "rejected"] as ApplicationStatus[])
                .filter((s) => statusCounts[s] > 0)
                .map((s) => (
                  <FilterPill
                    key={s}
                    href={`/applications?status=${s}`}
                    label={STATUS_LABEL[s]}
                    count={statusCounts[s]}
                    tone={s === "shortlisted" ? "shortlist" : s === "offered" ? "offered" : "neutral"}
                    active={filter === s}
                  />
                ))}
            </div>
          </div>

          {/* Scrolling list */}
          <div className="md:flex-1 md:overflow-y-auto px-4 sm:px-6 md:px-10 pt-6 md:pt-8 pb-12">
            {applications.length === 0 ? (
              <EmptyState filter={filter} totalAll={total} />
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
                        <div className="flex items-center justify-between gap-3 md:gap-6">
                          <div className="flex items-center gap-3 md:gap-5 min-w-0 flex-1">
                            <ScoreChip score={app.matchScore} />
                            <div className="min-w-0 flex-1">
                              <h3 className="font-serif italic text-xl md:text-2xl leading-tight tracking-tight truncate">
                                {candidate.name}
                              </h3>
                              <div className="mt-1 flex items-center gap-2 text-body text-muted-foreground">
                                <span className="truncate">{job.title}</span>
                                <span className="text-border hidden sm:inline">·</span>
                                <span className="truncate hidden sm:inline">{candidate.location}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 md:gap-5 flex-shrink-0">
                            <span
                              className={`caps-meta ${STATUS_COLOR[app.status]}`}
                            >
                              {STATUS_LABEL[app.status]}
                            </span>
                            <span className="caps-meta text-muted-foreground tabular hidden md:inline">
                              {relativeTime(app.receivedAt)}
                            </span>
                            <ArrowUpRight
                              className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-px group-hover:-translate-y-px transition-all flex-shrink-0"
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

      <footer className="border-t border-border px-4 sm:px-6 md:px-10 py-3 flex-shrink-0 flex items-center justify-between gap-3 eyebrow text-muted-foreground">
        <span className="truncate">Yuvabe ATS &nbsp; · &nbsp; v0.1</span>
        <span className="italic font-serif normal-case tracking-normal text-muted-foreground/80 hidden md:inline">
          Hiring is a human act.
        </span>
        <span>2026</span>
      </footer>
    </div>
  );
}

/* —————————————————————————— filter pill —————————————————————————— */

function FilterPill({
  href,
  label,
  count,
  tone,
  active,
}: {
  href: string;
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
    <Link
      href={href}
      scroll={false}
      className={`
        caps-meta tabular
        flex items-center gap-1.5 px-2.5 py-1 rounded-sm
        transition-all duration-150
        ${toneClass}
        ${active ? "bg-secondary opacity-100" : "opacity-65 hover:opacity-100 hover:bg-secondary/40"}
      `}
    >
      <span>{String(count).padStart(2, "0")}</span>
      <span>{label}</span>
    </Link>
  );
}

/* —————————————————————————— empty state —————————————————————————— */

function EmptyState({
  filter,
  totalAll,
}: {
  filter: ApplicationStatus | null;
  totalAll: number;
}) {
  if (filter && totalAll > 0) {
    // Filter excluded everything
    return (
      <div className="h-full flex flex-col items-center justify-center text-center pb-24">
        <p className="font-serif italic text-display md:text-display-md text-foreground/55 leading-tight">
          No {STATUS_LABEL[filter].toLowerCase()} applications.
        </p>
        <Link
          href="/applications"
          className="mt-4 eyebrow text-primary hover:text-primary/70 transition-colors"
        >
          Show all ←
        </Link>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col items-center justify-center text-center pb-24">
      <p className="font-serif italic text-display md:text-display-md text-foreground/55 leading-tight">
        No applications yet.
      </p>
      <p className="mt-4 max-w-md text-body-lg text-muted-foreground leading-relaxed">
        When candidates apply via email with a job code, their applications
        appear here, scored against that job&apos;s criteria.
      </p>
    </div>
  );
}
