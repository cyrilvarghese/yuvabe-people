"use client";

import { useState, useRef, useEffect, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2, FileText, ArrowUpRight, ArrowLeft } from "lucide-react";
import NavTabClient from "@/app/jobs/_components/nav-tab";

const ACCEPTED = ".pdf,.docx,.txt,.md";

/* ——————————————————————————————————————————————————————————————————
   Types
—————————————————————————————————————————————————————————————————— */

type JobOption = { id: string; code: string; title: string };

type BreakdownItem = {
  criterionLabel: string;
  importance: "must" | "strong" | "nice";
  matched: "yes" | "partial" | "no";
  evidence: string;
  score: number;
};

type MatchResult = {
  candidate: {
    name: string;
    email: string;
    phone: string;
    location: string;
    skills: string[];
    resumeText: string;
  };
  matchSummary: string;
  breakdown: BreakdownItem[];
  matchScore: number;
  jobId: string;
  jobCode: string;
  jobTitle: string;
};

/* ——————————————————————————————————————————————————————————————————
   Typographic atoms
—————————————————————————————————————————————————————————————————— */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </span>
  );
}

function ColumnMarker({ numeral, title }: { numeral: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4 mb-10">
      <span className="font-serif italic text-5xl leading-none text-primary tabular">
        {numeral}.
      </span>
      <span className="font-serif italic text-2xl leading-none text-foreground/85">
        {title}
      </span>
    </div>
  );
}

function HairRule() {
  return <div className="h-px bg-border w-full" />;
}

/* ——————————————————————————————————————————————————————————————————
   Score helpers
—————————————————————————————————————————————————————————————————— */

function scoreBand(n: number): "high" | "mid" | "low" {
  return n >= 75 ? "high" : n >= 50 ? "mid" : "low";
}

function bandLabel(n: number) {
  return scoreBand(n) === "high"
    ? "Strong match"
    : scoreBand(n) === "mid"
    ? "Fair match"
    : "Weak match";
}

function bandColor(n: number) {
  return scoreBand(n) === "high"
    ? "text-[#3F6B3F]"
    : scoreBand(n) === "mid"
    ? "text-[#B8893A]"
    : "text-primary";
}

/* ——————————————————————————————————————————————————————————————————
   Breakdown constants
—————————————————————————————————————————————————————————————————— */

const IMPORTANCE_LABEL = { must: "Must", strong: "Strong", nice: "Nice" } as const;
const IMPORTANCE_COLOR = {
  must: "text-primary",
  strong: "text-foreground",
  nice: "text-muted-foreground",
} as const;
const IMPORTANCE_ORDER = ["must", "strong", "nice"] as const;

const MATCHED_GLYPH = { yes: "●", partial: "◐", no: "○" } as const;
const MATCHED_COLOR = {
  yes: "text-[#3F6B3F]",
  partial: "text-[#B8893A]",
  no: "text-muted-foreground",
} as const;
const MATCHED_BAR = {
  yes: "bg-[#3F6B3F]",
  partial: "bg-[#B8893A]",
  no: "bg-primary/60",
} as const;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* ——————————————————————————————————————————————————————————————————
   Page
—————————————————————————————————————————————————————————————————— */

export default function NewApplicationPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [jobCode, setJobCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs ?? []));
  }, []);

  function pick() {
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.click();
  }

  function onFile(f: File) {
    setFile(f);
    setResult(null);
    setError(null);
    setSaveState("idle");
    setSaveError(null);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }

  async function match() {
    if (!jobCode || !file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("jobCode", jobCode);
      fd.append("file", file);
      const res = await fetch("/api/match-resume", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Match failed");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!result) return;
    setSaveState("saving");
    setSaveError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId:        result.jobId,
          jobCode:      result.jobCode,
          candidate:    result.candidate,
          matchSummary: result.matchSummary,
          breakdown:    result.breakdown,
          matchScore:   result.matchScore,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      router.push(`/applications/${data.application.id}`);
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "Save failed");
    }
  }

  // Group breakdown by importance for display.
  const grouped = result
    ? IMPORTANCE_ORDER.map((imp) => ({
        importance: imp,
        items: result.breakdown.filter((c) => c.importance === imp),
      })).filter((g) => g.items.length > 0)
    : [];

  const canMatch = !!jobCode && !!file && !loading;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* ——— Header ——— */}
      <header className="flex-shrink-0 border-b border-border bg-background z-10">
        <div className="px-10 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-serif italic text-lg leading-none">Yuvabe</span>
            <span className="text-muted-foreground">/</span>
            <Eyebrow>ATS</Eyebrow>
          </div>
          <div className="flex items-center gap-6">
            <Eyebrow>
              <span className="tabular">02</span> &nbsp;/&nbsp; Match resume
            </Eyebrow>
            {result && (
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setError(null);
                  setSaveState("idle");
                  setSaveError(null);
                }}
                className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-primary transition-colors"
              >
                Start over →
              </button>
            )}
          </div>
        </div>
        <nav className="px-10 flex items-center gap-8">
          <NavTabClient href="/jobs" label="Jobs" prefix="/jobs" />
          <NavTabClient href="/applications" label="Applications" prefix="/applications" />
          <NavTabClient href="/review" label="Review" prefix="/review" />
        </nav>
      </header>

      {/* ——— Two-column body ——— */}
      <main className="flex-1 grid grid-cols-2 overflow-hidden">

        {/* ════ LEFT — the application ════ */}
        <section className="border-r border-border flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col px-12 pt-12 pb-8 overflow-y-auto">
            <ColumnMarker numeral="i" title="The application" />

            {/* Job selector */}
            <div className="mb-8">
              <Eyebrow>Job</Eyebrow>
              <div className="mt-3">
                <Select value={jobCode} onValueChange={setJobCode} disabled={loading}>
                  <SelectTrigger className="w-full rounded-sm border-border bg-background font-sans text-sm focus:ring-primary">
                    <SelectValue placeholder="Select a job…" />
                  </SelectTrigger>
                  <SelectContent className="rounded-sm">
                    {jobs.map((j) => (
                      <SelectItem key={j.code} value={j.code} className="text-sm">
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mr-2">
                          {j.code}
                        </span>
                        {j.title}
                      </SelectItem>
                    ))}
                    {jobs.length === 0 && (
                      <div className="px-3 py-4 text-center">
                        <p className="font-serif italic text-sm text-foreground/55">
                          No jobs saved yet.
                        </p>
                        <Link
                          href="/jobs/new"
                          className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-primary hover:text-primary/70 transition-colors"
                        >
                          Create one →
                        </Link>
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <HairRule />
            <div className="mt-8 flex-1 flex flex-col">
              <Eyebrow>Resume</Eyebrow>

              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                onChange={onChange}
                className="hidden"
              />

              {/* Drop zone — shown when no file picked yet */}
              {!file && !loading && (
                <div
                  onClick={pick}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={`
                    relative cursor-pointer mt-3 flex-1
                    flex flex-col items-center justify-center text-center
                    border border-border rounded-sm
                    transition-all duration-200
                    ${dragOver
                      ? "border-primary bg-primary/[0.04]"
                      : "hover:border-foreground/30 hover:bg-foreground/[0.015]"}
                  `}
                >
                  <div className="absolute top-3 left-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/75">
                    ◦ resume
                  </div>
                  <div className="absolute top-3 right-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/75">
                    drop here
                  </div>
                  <Upload className="h-7 w-7 text-foreground/40 mb-8" strokeWidth={1.25} />
                  <p className="font-serif italic text-3xl leading-tight max-w-xs">
                    Drop the resume.
                  </p>
                  <p className="mt-5 text-sm text-muted-foreground max-w-xs leading-relaxed">
                    We&apos;ll read it and score it against each criterion.
                  </p>
                  <div className="mt-10 flex items-center gap-4 text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono">
                    <span>pdf</span>
                    <span className="text-border">·</span>
                    <span>docx</span>
                    <span className="text-border">·</span>
                    <span>txt</span>
                    <span className="text-border">·</span>
                    <span>md</span>
                  </div>
                </div>
              )}

              {/* File card — shown once file is picked */}
              {file && (
                <div className="mt-3">
                  <div className="border border-border rounded-sm bg-card px-6 py-5 flex items-start gap-4">
                    <FileText className="h-5 w-5 text-foreground/50 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-mono mb-1">
                        Resume file
                      </p>
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground mt-1 tabular">
                        {formatSize(file.size)}
                      </p>
                    </div>
                    {!loading && (
                      <button
                        onClick={pick}
                        className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                      >
                        Replace
                      </button>
                    )}
                  </div>

                  {/* Loading feedback */}
                  {loading && (
                    <div className="mt-8 flex flex-col items-start gap-3">
                      <div className="flex items-center gap-3 text-sm text-foreground/70">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        <span className="font-serif italic">Scoring the resume…</span>
                      </div>
                      <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                        Evaluating each criterion against the resume text. Usually 10–20 seconds.
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {!loading && error && (
                    <div className="mt-6 border-l-2 border-primary pl-4 py-2 bg-primary/[0.03]">
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary mb-1">
                        Couldn&apos;t process this resume
                      </p>
                      <p className="text-sm text-foreground/80">{error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action shelf */}
            {!result && (
              <div className="mt-auto pt-10">
                <HairRule />
                <div className="pt-6 flex items-center justify-between gap-4">
                  <p className="text-xs text-muted-foreground max-w-[12rem] leading-relaxed">
                    {!jobCode
                      ? "Select a job to continue."
                      : !file
                      ? "Drop a resume to continue."
                      : "One LLM call. No data leaves until you save."}
                  </p>
                  <Button
                    size="lg"
                    onClick={match}
                    disabled={!canMatch}
                    className="gap-2 rounded-sm font-medium tracking-tight"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Matching
                      </>
                    ) : error ? (
                      <>
                        Try again
                        <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                      </>
                    ) : (
                      <>
                        Match resume
                        <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {result && !loading && (
              <div className="mt-auto pt-10">
                <HairRule />
                <div className="pt-6 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Analysis ready. Review on the right.
                  </p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    ii. →
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ════ RIGHT — the match ════ */}
        <section className="flex flex-col overflow-hidden">

          {/* Empty / loading state */}
          {!result && (
            <div className="flex-1 px-12 pt-12 pb-8 overflow-y-auto">
              {!loading && (
                <div className="h-full flex flex-col">
                  <ColumnMarker numeral="ii" title="The match" />
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="max-w-sm">
                      <p className="font-serif italic text-2xl text-foreground/55 leading-tight">
                        &ldquo;A score without reasoning is not a score.&rdquo;
                      </p>
                      <p className="mt-6 text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono">
                        Awaiting resume ←
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading skeleton — mirrors the result layout */}
              {loading && (
                <div className="max-w-2xl">
                  {/* Eyebrow */}
                  <div className="h-3 w-40 bg-muted rounded-sm animate-pulse" />
                  {/* Candidate name */}
                  <div className="mt-4 mb-5 space-y-2">
                    <div className="h-10 w-3/4 bg-muted rounded-sm animate-pulse" />
                    <div className="h-10 w-2/5 bg-muted rounded-sm animate-pulse" />
                  </div>
                  {/* Score */}
                  <div className="h-16 w-28 bg-muted rounded-sm animate-pulse mb-8" />
                  {/* Summary lines */}
                  <div className="space-y-2 mb-12">
                    <div className="h-4 w-full bg-muted rounded-sm animate-pulse" />
                    <div className="h-4 w-5/6 bg-muted rounded-sm animate-pulse" />
                    <div className="h-4 w-2/3 bg-muted rounded-sm animate-pulse" />
                  </div>
                  {/* Breakdown section */}
                  <div className="flex items-baseline gap-3 mb-5">
                    <div className="h-3 w-10 bg-muted rounded-sm animate-pulse" />
                    <div className="h-3 w-5 bg-muted/70 rounded-sm animate-pulse" />
                    <div className="flex-1 border-b border-border/70" />
                  </div>
                  <ul>
                    {["w-2/3", "w-1/2", "w-4/5", "w-3/5", "w-1/2"].map((w, i, arr) => (
                      <li
                        key={i}
                        className={`py-4 ${i !== arr.length - 1 ? "border-b border-border/50" : ""}`}
                      >
                        <div className={`h-4 ${w} bg-muted rounded-sm animate-pulse`} />
                        <div className="mt-2.5 h-[3px] w-1/2 bg-muted/70 rounded-full animate-pulse" />
                        <div className="mt-2 h-3 w-3/4 bg-muted/50 rounded-sm animate-pulse" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Result: static header + scrolling body */}
          {result && (
            <>
              {/* Static header */}
              <div className="flex-shrink-0 px-12 pt-10 pb-6 border-b border-border bg-background">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Eyebrow>Candidate</Eyebrow>
                    <h2 className="font-serif italic text-4xl leading-[1.05] mt-2 tracking-tight truncate">
                      {result.candidate.name}
                    </h2>
                    {result.candidate.location && (
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
                        {result.candidate.location}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <Eyebrow>Match score</Eyebrow>
                    <div className="mt-2 flex items-baseline gap-2 justify-end">
                      <span className={`font-mono text-[3rem] leading-none tabular ${bandColor(result.matchScore)}`}>
                        {String(result.matchScore).padStart(2, "0")}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        / 100
                      </span>
                    </div>
                    <p className={`mt-1 font-serif italic text-base ${bandColor(result.matchScore)}`}>
                      {bandLabel(result.matchScore)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scrolling body */}
              <div className="flex-1 px-12 pt-8 pb-8 overflow-y-auto">
                <div className="max-w-3xl">

                  {/* Match summary */}
                  <Eyebrow>Match summary</Eyebrow>
                  <blockquote className="mt-4 mb-12 font-serif italic text-[19px] leading-[1.55] text-foreground/85 border-l-2 border-primary/40 pl-6 max-w-[64ch]">
                    {result.matchSummary}
                  </blockquote>

                  {/* Criterion breakdown */}
                  <Eyebrow>Criterion breakdown</Eyebrow>
                  <div className="mt-5 space-y-10">
                    {grouped.map((group) => (
                      <div key={group.importance}>
                        <div className="flex items-baseline gap-3 mb-4">
                          <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${IMPORTANCE_COLOR[group.importance]}`}>
                            {IMPORTANCE_LABEL[group.importance]}
                          </span>
                          <span className="font-mono text-[10px] tabular text-muted-foreground">
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
                                    className={`font-mono text-[14px] leading-none ${MATCHED_COLOR[c.matched]} flex-shrink-0`}
                                    aria-label={c.matched}
                                  >
                                    {MATCHED_GLYPH[c.matched]}
                                  </span>
                                  <span className="text-[15px] leading-snug">
                                    {c.criterionLabel}
                                  </span>
                                </div>
                                <span className="font-mono text-[13px] tabular text-muted-foreground flex-shrink-0">
                                  {c.score}
                                  <span className="text-muted-foreground/60"> / 10</span>
                                </span>
                              </div>
                              {/* Score bar */}
                              <div className="ml-6 mt-2.5 h-[3px] bg-border/60 rounded-full overflow-hidden max-w-md">
                                <div
                                  className={`h-full ${MATCHED_BAR[c.matched]}`}
                                  style={{ width: `${c.score * 10}%` }}
                                />
                              </div>
                              {/* Evidence */}
                              <p className="ml-6 mt-2.5 font-serif italic text-[14px] text-foreground/70 leading-relaxed max-w-[60ch]">
                                &ldquo;{c.evidence}&rdquo;
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Skills */}
                  {result.candidate.skills.length > 0 && (
                    <div className="mt-12">
                      <Eyebrow>Skills extracted</Eyebrow>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {result.candidate.skills.map((s) => (
                          <span
                            key={s}
                            className="font-mono text-[11px] uppercase tracking-[0.12em] px-2.5 py-1 rounded-sm bg-secondary text-foreground/80"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {/* ——— Save action bar ——— */}
      {result && !loading && (
        <div className="border-t border-border bg-background px-12 py-4 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex-1 min-w-0">
            {saveState === "error" && saveError ? (
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                Couldn&apos;t save · {saveError}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic font-serif truncate">
                {result.candidate.name} ·{" "}
                <span className="not-italic font-sans">
                  {result.matchScore}/100 for{" "}
                  <Link
                    href={`/jobs/${result.jobCode}`}
                    className="underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    {result.jobTitle}
                  </Link>
                </span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/applications"
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3 w-3" />
              Discard
            </Link>
            <Button
              onClick={save}
              disabled={saveState === "saving"}
              size="sm"
              className="rounded-sm font-mono text-[10px] uppercase tracking-[0.16em] gap-2 min-w-[130px]"
            >
              {saveState === "saving" ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  Save application
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ——— Footer ——— */}
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
