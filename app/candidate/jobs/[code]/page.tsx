import Link from "next/link";
import { notFound } from "next/navigation";
import { listJobs } from "@/lib/jobs-store";
import { ArrowLeft } from "lucide-react";
import ApplicationForm from "./ApplicationForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const jobs = await listJobs();
  const job = jobs.find((j) => j.code === code);
  if (!job) return { title: "Role not found — Yuvabe" };
  return { title: `${job.title} — Yuvabe Careers` };
}

export default async function CandidateJobDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const jobs = await listJobs();
  const job = jobs.find((j) => j.code === code);
  if (!job) notFound();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background z-10">
        <div className="max-w-3xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link
            href="/candidate"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            All roles
          </Link>
          <span className="font-serif italic text-base leading-none text-muted-foreground/70">
            Yuvabe
          </span>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-8 py-12">
          {/* Job title */}
          <div className="mb-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
              [JOB-{job.code}]
            </p>
            <h1 className="font-serif italic text-4xl leading-tight tracking-tight text-foreground">
              {job.title}
            </h1>
          </div>

          {/* JD — section i */}
          <section className="mb-14">
            <div className="flex items-baseline gap-3 mb-6 pb-4 border-b border-border">
              <span className="font-serif italic text-3xl leading-none text-primary">i.</span>
              <span className="font-serif italic text-xl leading-none text-foreground/80">
                About the role
              </span>
            </div>
            <div className="prose-custom">
              {job.description.split("\n").map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-4" />;
                return (
                  <p
                    key={i}
                    className="text-[15px] leading-relaxed text-foreground/90 mb-0"
                  >
                    {line}
                  </p>
                );
              })}
            </div>
          </section>

          {/* Criteria — section ii */}
          {job.criteria.length > 0 && (
            <section className="mb-14">
              <div className="flex items-baseline gap-3 mb-6 pb-4 border-b border-border">
                <span className="font-serif italic text-3xl leading-none text-primary">ii.</span>
                <span className="font-serif italic text-xl leading-none text-foreground/80">
                  What we&apos;re looking for
                </span>
              </div>
              <ul className="space-y-3">
                {job.criteria.map((c, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className={`mt-1 flex-shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] px-1.5 py-0.5 rounded-sm border ${
                        c.importance === "must"
                          ? "text-primary border-primary/40 bg-primary/[0.06]"
                          : c.importance === "strong"
                          ? "text-foreground border-border bg-secondary/40"
                          : "text-muted-foreground border-border/60"
                      }`}
                    >
                      {c.importance}
                    </span>
                    <span className="text-[14px] leading-relaxed text-foreground/85">
                      {c.label}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Application form — section iii */}
          <section>
            <div className="flex items-baseline gap-3 mb-8 pb-4 border-b border-border">
              <span className="font-serif italic text-3xl leading-none text-primary">iii.</span>
              <span className="font-serif italic text-xl leading-none text-foreground/80">
                Apply
              </span>
            </div>
            <ApplicationForm jobCode={job.code} />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-3xl mx-auto px-8 py-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <span>Yuvabe · Auroville, India</span>
          <span className="font-serif italic normal-case tracking-normal text-muted-foreground/70">
            Hiring is a human act.
          </span>
        </div>
      </footer>
    </div>
  );
}
