import Link from "next/link";
import { listJobs } from "@/lib/jobs-store";
import { ArrowUpRight } from "lucide-react";

export const metadata = {
  title: "Open Roles — Yuvabe",
  description: "Explore open positions and apply to join the Yuvabe team.",
};

export default async function CandidateJobsPage() {
  const jobs = await listJobs();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-serif italic text-xl leading-none">Yuvabe</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Open Roles
            </span>
          </div>
          <Link
            href="/jobs"
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-primary transition-colors"
          >
            Recruiter login →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border">
        <div className="max-w-3xl mx-auto px-8 py-14">
          <p className="font-serif italic text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
            i. Careers at Yuvabe
          </p>
          <h1 className="font-serif italic text-4xl leading-tight tracking-tight text-foreground max-w-lg">
            We&apos;re building something human.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground max-w-lg">
            Yuvabe is a community-centered organization based in Auroville. We
            hire for curiosity, craft, and care — not just credentials. Browse
            our open roles below and apply directly.
          </p>
        </div>
      </section>

      {/* Jobs list */}
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-8 py-10">
          {jobs.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-serif italic text-2xl text-foreground/50">
                No open roles right now.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Check back soon — we post new positions as they open.
              </p>
            </div>
          ) : (
            <>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-6">
                {jobs.length} {jobs.length === 1 ? "role" : "roles"} open
              </p>
              <ul>
                {jobs.map((job, idx) => (
                  <li
                    key={job.id}
                    className={`border-b border-border/60 ${idx === 0 ? "border-t border-border/60" : ""}`}
                  >
                    <Link
                      href={`/candidate/jobs/${job.code}`}
                      className="group flex items-center justify-between gap-6 py-7 -mx-4 px-4 rounded-sm hover:bg-secondary/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <h2 className="font-serif italic text-2xl leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                          {job.title}
                        </h2>
                        <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed line-clamp-2 max-w-xl">
                          {job.description.slice(0, 160).trimEnd()}
                          {job.description.length > 160 ? "…" : ""}
                        </p>
                      </div>
                      <span className="flex-shrink-0 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground group-hover:text-primary transition-colors">
                        Apply
                        <ArrowUpRight
                          className="h-3 w-3 group-hover:translate-x-px group-hover:-translate-y-px transition-transform"
                          strokeWidth={2}
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
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
