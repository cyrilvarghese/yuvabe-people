import Link from "next/link";
import { notFound } from "next/navigation";
import { listJobs } from "@/lib/jobs-store";
import {
  getApplicationById,
  type Application,
  type ApplicationStatus,
  type CriterionMatch,
} from "@/lib/applications-store";
import { getCandidateById, type Candidate } from "@/lib/candidates-store";
import { ArrowLeft, ExternalLink, Mail, MapPin, Phone, FileText } from "lucide-react";
import NavTabClient from "../../jobs/_components/nav-tab";

/* —————————————————————————— atoms —————————————————————————— */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow text-muted-foreground">{children}</span>;
}

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  offered: "Offered",
};

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  new: "text-foreground",
  reviewing: "text-foreground",
  shortlisted: "text-[#2F5E7A]",
  rejected: "text-muted-foreground",
  offered: "text-[#3F6B3F]",
};

function ScoreBand(score: number): "high" | "mid" | "low" {
  return score >= 75 ? "high" : score >= 50 ? "mid" : "low";
}

function bandLabel(score: number): string {
  return ScoreBand(score) === "high"
    ? "Strong match"
    : ScoreBand(score) === "mid"
    ? "Fair match"
    : "Weak match";
}

function bandTextClass(score: number): string {
  const b = ScoreBand(score);
  return b === "high"
    ? "text-[#3F6B3F]"
    : b === "mid"
    ? "text-[#B8893A]"
    : "text-primary";
}

const IMPORTANCE_LABEL = { must: "Must", strong: "Strong", nice: "Nice" } as const;
const IMPORTANCE_COLOR = {
  must: "text-primary",
  strong: "text-foreground",
  nice: "text-muted-foreground",
} as const;

const MATCHED_GLYPH: Record<CriterionMatch["matched"], string> = {
  yes: "●",
  partial: "◐",
  no: "○",
};

const MATCHED_COLOR: Record<CriterionMatch["matched"], string> = {
  yes: "text-[#3F6B3F]",
  partial: "text-[#B8893A]",
  no: "text-muted-foreground",
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

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await getApplicationById(id);
  if (!application) notFound();

  const candidate = await getCandidateById(application.candidateId);
  if (!candidate) notFound();

  const jobs = await listJobs();
  const job = jobs.find((j) => j.id === application.jobId);
  if (!job) notFound();

  // Group breakdown by importance (must → strong → nice)
  const importanceOrder = ["must", "strong", "nice"] as const;
  const grouped = importanceOrder.map((imp) => ({
    importance: imp,
    items: application.matchBreakdown.filter((c) => c.importance === imp),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      {/* —————— Sticky header —————— */}
      <header className="flex-shrink-0 border-b border-border bg-background z-10">
        <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="font-serif italic text-xl leading-none">Yuvabe</span>
            <span className="text-muted-foreground">/</span>
            <Eyebrow>ATS</Eyebrow>
          </div>
          <Link
            href={`/jobs/${job.code}`}
            className="inline-flex items-center gap-1.5 caps-action text-muted-foreground hover:text-foreground transition-colors min-w-0 max-w-[40ch]"
          >
            <ArrowLeft className="h-3 w-3 flex-shrink-0" />
            <span className="truncate hidden sm:inline">{job.title}</span>
          </Link>
        </div>
        <nav className="px-4 md:px-10 flex items-center gap-6 md:gap-8 overflow-x-auto">
          <NavTabClient href="/jobs" label="Jobs" prefix="/jobs" />
          <NavTabClient href="/applications" label="Applicants" prefix="/applications" />
          <NavTabClient href="/review" label="Review" prefix="/review" />
        </nav>
      </header>

      <main className="md:flex-1 grid grid-cols-1 md:grid-cols-[340px_1fr] md:overflow-hidden">
        {/* ════════ LEFT — candidate profile ════════ */}
        <aside className="border-b border-border md:border-r md:border-b-0 md:overflow-y-auto px-4 sm:px-6 md:px-10 py-6 md:py-10 flex flex-col">
          <nav className="mb-3 eyebrow flex items-center gap-2.5 flex-wrap">
            <Link
              href="/jobs"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Jobs
            </Link>
            <span className="text-base leading-none text-muted-foreground/65">›</span>
            <Link
              href={`/jobs/${job.code}`}
              className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[20ch]"
            >
              {job.title}
            </Link>
            <span className="text-base leading-none text-muted-foreground/65">›</span>
            <span className="text-foreground/80 truncate max-w-[20ch]">
              {candidate.name}
            </span>
          </nav>
          <h1 className="font-serif italic text-display md:text-display-lg leading-[1.05] mt-1 mb-1 tracking-tight">
            {candidate.name}
          </h1>

          {/* Contact */}
          <div className="mt-5 space-y-2 text-body-sm text-foreground/85">
            <div className="flex items-center gap-2.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
              <span className="truncate">{candidate.email}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
              <span className="font-mono text-meta">{candidate.phone}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
              <span>{candidate.location}</span>
            </div>
          </div>

          {/* Score block */}
          <div className="mt-8 pt-6 border-t border-border">
            <Eyebrow>Match score</Eyebrow>
            <div className="mt-2 flex items-baseline gap-3">
              <span
                className={`font-mono text-display-md md:text-display-lg leading-none tabular ${bandTextClass(application.matchScore)}`}
              >
                {String(application.matchScore).padStart(2, "0")}
              </span>
              <span className="eyebrow text-muted-foreground">
                / 100
              </span>
            </div>
            <p
              className={`mt-1 font-serif italic text-base ${bandTextClass(application.matchScore)}`}
            >
              {bandLabel(application.matchScore)}
            </p>
          </div>

          {/* Status */}
          <div className="mt-6 pt-6 border-t border-border">
            <Eyebrow>Status</Eyebrow>
            <p className={`mt-2 caps-meta ${STATUS_COLOR[application.status]}`}>
              {STATUS_LABEL[application.status]}
            </p>
            <p className="mt-1 caps-meta text-muted-foreground tabular">
              Received {relativeTime(application.receivedAt)}
            </p>
          </div>

          {/* Quick stats */}
          <div className="mt-6 pt-6 border-t border-border space-y-3">
            <div>
              <Eyebrow>Experience</Eyebrow>
              <p className="mt-1 font-mono text-body tabular text-foreground">
                {candidate.yearsOfExperience}{" "}
                {candidate.yearsOfExperience === 1 ? "year" : "years"}
              </p>
            </div>
            {candidate.education[0] && (
              <div>
                <Eyebrow>Education</Eyebrow>
                <p className="mt-1 text-body text-foreground/85 leading-tight">
                  {candidate.education[0].degree}
                </p>
                <p className="text-body-sm text-muted-foreground italic font-serif">
                  {candidate.education[0].institution}, {candidate.education[0].year}
                </p>
              </div>
            )}
          </div>

          {/* Resume + links */}
          <div className="mt-6 pt-6 border-t border-border space-y-2">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 caps-action text-muted-foreground/65 italic cursor-not-allowed"
              title="Resume download coming when intake is wired"
            >
              <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
              Download resume (mock)
            </button>
            {candidate.links?.linkedin && (
              <a
                href={`https://${candidate.links.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 caps-action text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                LinkedIn
              </a>
            )}
            {candidate.links?.portfolio && (
              <a
                href={`https://${candidate.links.portfolio}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 caps-action text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                Portfolio
              </a>
            )}
            {candidate.links?.github && (
              <a
                href={`https://${candidate.links.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 caps-action text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                GitHub
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="mt-auto pt-8 space-y-2">
            <button
              type="button"
              disabled
              className="w-full caps-action py-2.5 rounded-sm border border-border text-muted-foreground/70 italic cursor-not-allowed"
              title="Action wiring coming next"
            >
              Shortlist (mock)
            </button>
            <button
              type="button"
              disabled
              className="w-full caps-action py-2.5 rounded-sm text-muted-foreground/70 italic hover:bg-secondary/40 cursor-not-allowed"
            >
              Reject (mock)
            </button>
          </div>
        </aside>

        {/* ════════ RIGHT — match analysis ════════ */}
        <section className="md:overflow-y-auto px-4 sm:px-6 md:px-12 py-6 md:py-10">
          <div className="max-w-3xl">
            {/* Match summary — editorial moment */}
            <Eyebrow>Match summary</Eyebrow>
            <blockquote className="mt-4 mb-12 font-serif italic text-h3 leading-[1.55] text-foreground/85 border-l-2 border-primary/40 pl-6 max-w-[64ch]">
              {application.matchSummary}
            </blockquote>

            {/* Breakdown by importance */}
            <Eyebrow>Criterion breakdown</Eyebrow>
            <div className="mt-5 space-y-10">
              {grouped.map((group) => (
                <div key={group.importance}>
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className={`eyebrow ${IMPORTANCE_COLOR[group.importance]}`}>
                      {IMPORTANCE_LABEL[group.importance]}
                    </span>
                    <span className="font-mono text-eyebrow tabular text-muted-foreground">
                      {String(group.items.length).padStart(2, "0")}
                    </span>
                    <div className="flex-1 border-b border-border/70" />
                  </div>
                  <ul>
                    {group.items.map((c, i) => (
                      <li
                        key={i}
                        className="border-b border-border/50 last:border-b-0 py-4"
                      >
                        <div className="flex items-baseline justify-between gap-6">
                          <div className="flex items-baseline gap-3 min-w-0">
                            <span
                              className={`font-mono text-body-sm leading-none ${MATCHED_COLOR[c.matched]} flex-shrink-0`}
                              aria-label={c.matched}
                            >
                              {MATCHED_GLYPH[c.matched]}
                            </span>
                            <span className="text-body leading-snug">
                              {c.criterionLabel}
                            </span>
                          </div>
                          <span className="font-mono text-body-sm tabular text-muted-foreground flex-shrink-0">
                            {c.score}
                            <span className="text-muted-foreground/60"> / 10</span>
                          </span>
                        </div>
                        {/* Score bar */}
                        <div className="ml-6 mt-2.5 h-[3px] bg-border/60 rounded-full overflow-hidden max-w-md">
                          <div
                            className={`h-full ${
                              c.matched === "yes"
                                ? "bg-[#3F6B3F]"
                                : c.matched === "partial"
                                ? "bg-[#B8893A]"
                                : "bg-primary/60"
                            }`}
                            style={{ width: `${c.score * 10}%` }}
                          />
                        </div>
                        {/* Evidence */}
                        <p className="ml-6 mt-2.5 font-serif italic text-body-sm text-foreground/70 leading-relaxed max-w-[60ch]">
                          &ldquo;{c.evidence}&rdquo;
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Cover letter */}
            <div className="mt-16">
              <Eyebrow>Cover letter</Eyebrow>
              <div className="mt-4 border-l-2 border-border pl-6 max-w-[60ch]">
                <p className="font-serif italic text-body-lg leading-[1.7] text-foreground/85 whitespace-pre-line">
                  {application.coverLetter}
                </p>
              </div>
            </div>

            {/* Resume — collapsible */}
            <details className="mt-16 group">
              <summary className="cursor-pointer list-none flex items-center gap-3 eyebrow text-muted-foreground hover:text-foreground transition-colors">
                <span className="font-mono text-body-sm leading-none group-open:rotate-90 transition-transform">
                  ▸
                </span>
                Show resume text
              </summary>
              <p className="mt-5 text-body leading-relaxed text-foreground/80 max-w-[68ch] whitespace-pre-line">
                {candidate.resumeText}
              </p>
            </details>

            {/* Candidate experience details */}
            <div className="mt-16 mb-8">
              <Eyebrow>Experience</Eyebrow>
              <ol className="mt-5 space-y-6">
                {candidate.experience.map((e, i) => (
                  <li key={i} className="border-l border-border pl-5 max-w-[60ch]">
                    <div className="flex items-baseline justify-between gap-4">
                      <h4 className="text-body font-medium text-foreground">
                        {e.title}
                        <span className="text-muted-foreground font-normal"> · {e.company}</span>
                      </h4>
                      <span className="caps-meta text-muted-foreground tabular flex-shrink-0">
                        {e.startDate} – {e.endDate}
                      </span>
                    </div>
                    <p className="mt-1.5 text-body-sm text-foreground/75 leading-relaxed">
                      {e.description}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
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
