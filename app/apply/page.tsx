import { notFound } from "next/navigation";
import { getJobByCode } from "@/lib/jobs-store";
import { ApplyForm } from "./_components/apply-form";

/** Test mock: the public-facing apply form lives on the marketing site in production.
 *  Hardcoded to a single Job for now; change this constant to retest against another. */
const JOB_CODE = "PDDS4M";

export default async function ApplyPage() {
  const job = await getJobByCode(JOB_CODE);
  if (!job) notFound();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Brand row — minimal, no recruiter nav */}
      <header className="flex-shrink-0 border-b border-border">
        <div className="px-4 md:px-10 py-4 flex items-baseline gap-3">
          <span className="font-serif italic text-h3 leading-none">Yuvabe</span>
          <span className="text-muted-foreground/70">/</span>
          <span className="eyebrow text-muted-foreground">Careers</span>
        </div>
      </header>

      {/* Main editorial column */}
      <main className="flex-1 px-4 md:px-10 py-12 md:py-20">
        <div className="mx-auto max-w-xl">
          <p className="eyebrow text-muted-foreground mb-4">Apply to</p>
          <h1 className="font-serif italic text-display md:text-display-lg leading-tight text-foreground mb-5">
            {job.title}
          </h1>
          <p className="caps-meta text-muted-foreground tabular mb-12">
            <span className="px-1.5 py-0.5 bg-secondary rounded-sm">
              JOB-{job.code}
            </span>
            <span className="mx-3 text-muted-foreground/60">·</span>
            {String(job.criteria.length).padStart(2, "0")} CRITERIA
          </p>

          <div className="h-px bg-border w-full mb-10" />

          <ApplyForm jobCode={job.code} />
        </div>
      </main>

      <footer className="border-t border-border px-4 md:px-10 py-3 flex items-center justify-between eyebrow text-muted-foreground/70">
        <span>Yuvabe ATS · v0.1</span>
        <span className="italic font-serif normal-case tracking-normal text-muted-foreground/50">
          Hiring is a human act.
        </span>
        <span>2026</span>
      </footer>
    </div>
  );
}
