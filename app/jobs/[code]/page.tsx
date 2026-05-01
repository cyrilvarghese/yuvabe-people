import Link from "next/link";
import { notFound } from "next/navigation";
import { listJobs } from "@/lib/jobs-store";
import { listApplicationsByJobCode, type Application, type ApplicationStatus } from "@/lib/applications-store";
import { ArrowLeft, ArrowUpRight, Eye } from "lucide-react";
import NavTabClient from "../_components/nav-tab";
import { JobIdBadge } from "@/app/_components/job-id-badge";

/* —————————————————————————— atoms (inlined per design system) —————————————————————————— */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow text-muted-foreground">{children}</span>;
}

function ColumnMarker({ numeral, title }: { numeral: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3 md:gap-4">
      <span className="font-serif italic text-display md:text-display-xl leading-none text-primary tabular">
        {numeral}.
      </span>
      <h1 className="font-serif italic text-h2 md:text-h1 leading-tight md:leading-none text-foreground tracking-tight max-w-[36ch]">
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
      className={`inline-flex items-baseline justify-center min-w-[44px] md:min-w-[58px] px-2 md:px-2.5 py-1.5 border rounded-sm font-mono text-body-lg md:text-h3 tabular leading-none ${colorClass}`}
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

const VALID_STATUSES: ApplicationStatus[] = [
  "new",
  "reviewing",
  "shortlisted",
  "rejected",
  "offered",
];

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { code } = await params;
  const sp = await searchParams;
  const filter =
    sp.status && VALID_STATUSES.includes(sp.status as ApplicationStatus)
      ? (sp.status as ApplicationStatus)
      : null;

  const jobs = await listJobs();
  const job = jobs.find((j) => j.code === code);
  if (!job) notFound();

  // Listing reads denormalized snapshots off Application — no candidates
  // fan-out. The full Candidate doc is only fetched on /applications/[id].
  const allApplications = await listApplicationsByJobCode(code);

  // Counts always come from the unfiltered set — chips are navigators.
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
      {/* —————— Sticky header —————— */}
      <header className="flex-shrink-0 border-b border-border bg-background z-10">
        <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="font-serif italic text-h3 leading-none">Yuvabe</span>
            <span className="text-muted-foreground">/</span>
            <Eyebrow>ATS</Eyebrow>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 caps-action text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-3 w-3" />
            <span className="hidden sm:inline">All jobs</span>
          </Link>
        </div>
        <nav className="px-4 md:px-10 flex items-center gap-6 md:gap-8 overflow-x-auto">
          <NavTabClient href="/jobs" label="Jobs" prefix="/jobs" />
          <NavTabClient href="/applications" label="Applicants" prefix="/applications" />
          <NavTabClient href="/review" label="Review" prefix="/review" />
        </nav>
      </header>

      <main className="md:flex-1 md:overflow-hidden">
        <section className="md:h-full flex flex-col md:overflow-hidden">
          {/* Static top — job title + filter chips */}
          <div className="flex-shrink-0 px-4 sm:px-6 md:px-10 pt-6 md:pt-10 pb-5 border-b border-border bg-background">
            <div className="max-w-5xl">
              <nav className="mb-4 eyebrow flex items-center gap-2.5">
                <Link
                  href="/jobs"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Jobs
                </Link>
                <span className="text-base leading-none text-muted-foreground/65">
                  ›
                </span>
                <span className="text-foreground/80 truncate max-w-[40ch]">
                  {job.title}
                </span>
              </nav>
              <ColumnMarker numeral="i" title={job.title} />
              <div className="mt-4 flex items-center gap-4 flex-wrap">
                <JobIdBadge code={job.code} />
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
                  href={`/jobs/${job.code}/view`}
                  className="ml-auto inline-flex items-center gap-1.5 caps-action text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                >
                  View criteria
                  <Eye className="h-3 w-3" strokeWidth={1.75} />
                </Link>
              </div>

              {allApplications.length > 0 && (
                <div className="mt-6 flex items-center gap-1 flex-wrap -ml-2.5">
                  <StatusFilterChip
                    href={`/jobs/${code}`}
                    label="All"
                    count={allApplications.length}
                    tone="neutral"
                    active={!filter}
                  />
                  {(["shortlisted", "reviewing", "new", "offered", "rejected"] as ApplicationStatus[])
                    .filter((s) => statusCounts[s] > 0)
                    .map((s) => (
                      <StatusFilterChip
                        key={s}
                        href={`/jobs/${code}?status=${s}`}
                        label={STATUS_LABEL[s]}
                        count={statusCounts[s]}
                        tone={s === "shortlisted" ? "shortlist" : s === "offered" ? "offered" : "neutral"}
                        active={filter === s}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Scrolling list */}
          <div className="md:flex-1 md:overflow-y-auto px-4 sm:px-6 md:px-10 pt-6 md:pt-8 pb-12">
            {applications.length === 0 ? (
              <EmptyState
                code={job.code}
                filter={filter}
                hasAny={allApplications.length > 0}
              />
            ) : (
              <ul className="max-w-5xl">
                {applications.map((app, idx) => (
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
                      <ApplicationRow application={app} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      {/* —————— Footer —————— */}
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

/* —————————————————————————— application row —————————————————————————— */

function ApplicationRow({
  application,
}: {
  application: Application;
}) {
  return (
    <div className="flex items-center justify-between gap-3 md:gap-6">
      <div className="flex items-center gap-3 md:gap-5 min-w-0 flex-1">
        <ScoreChip score={application.matchScore} />
        <div className="min-w-0 flex-1">
          <h3 className="font-serif italic text-xl md:text-2xl leading-tight tracking-tight truncate">
            {application.candidateName ?? ""}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-body text-muted-foreground">
            <span className="truncate">{application.candidateLocation ?? ""}</span>
            <span className="text-border hidden sm:inline">·</span>
            <span className="hidden sm:inline truncate">{application.candidateEmail ?? ""}</span>
            <span className="text-border hidden md:inline">·</span>
            <span className="tabular hidden md:inline">
              {application.candidateYearsOfExperience ?? 0}y experience
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 md:gap-5 flex-shrink-0">
        <span className={`caps-meta ${STATUS_COLOR[application.status]}`}>
          {STATUS_LABEL[application.status]}
        </span>
        <span className="caps-meta text-muted-foreground tabular hidden md:inline">
          {relativeTime(application.receivedAt)}
        </span>
        <ArrowUpRight
          className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-px group-hover:-translate-y-px transition-all flex-shrink-0"
          strokeWidth={1.75}
        />
      </div>
    </div>
  );
}

/* —————————————————————————— status filter chip (URL-driven) —————————————————————————— */

function StatusFilterChip({
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
  code,
  filter,
  hasAny,
}: {
  code: string;
  filter: ApplicationStatus | null;
  hasAny: boolean;
}) {
  // The role HAS applicants but the current filter excluded them all.
  if (filter && hasAny) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center pb-24">
        <p className="font-serif italic text-display md:text-display-md text-foreground/55 leading-tight">
          No {STATUS_LABEL[filter].toLowerCase()} candidates for this role.
        </p>
        <Link
          href={`/jobs/${code}`}
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
        No applications yet for this role.
      </p>
      <p className="mt-4 max-w-md text-body-lg text-muted-foreground leading-relaxed">
        When candidates apply via email with{" "}
        <span className="font-mono text-primary">[JOB-{code}]</span> in the subject,
        they&apos;ll appear here, scored against the criteria you set.
      </p>
    </div>
  );
}
