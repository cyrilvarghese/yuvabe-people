"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, Plus, Upload, X } from "lucide-react";

type Props = { jobCode: string; criteriaCount: number };

export default function ApplyForm({ jobCode, criteriaCount }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [resumeMode, setResumeMode] = useState<"file" | "text">("file");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  function reset() {
    setOpen(false);
    setStatus("idle");
    setError("");
    setName("");
    setEmail("");
    setResumeFile(null);
    setResumeText("");
    setCoverLetter("");
    setResumeMode("file");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const fd = new FormData();
    fd.append("jobCode", jobCode);
    fd.append("name", name);
    fd.append("email", email);
    fd.append("coverLetter", coverLetter);
    if (resumeMode === "file" && resumeFile) {
      fd.append("resumeFile", resumeFile);
    } else {
      fd.append("resumeText", resumeText);
    }

    try {
      const res = await fetch("/api/applications", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(`/applications/${data.applicationId}`);
    } catch {
      setStatus("error");
      setError("Network error — please try again.");
    }
  }

  /* —— Collapsed trigger —— */
  if (!open) {
    return (
      <div className="flex-shrink-0 border-b border-border px-10 py-3">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3 w-3" strokeWidth={2} />
          Add application
        </button>
      </div>
    );
  }

  /* —— Expanded form —— */
  return (
    <div className="flex-shrink-0 border-b border-border bg-background">
      <div className="px-10 pt-8 pb-8 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-baseline gap-3">
            <span className="font-serif italic text-2xl text-foreground/85">
              New application
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              [JOB-{jobCode}]
            </span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close form"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Row 1 — Name + Email */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="apply-name"
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
              >
                Full name
              </Label>
              <Input
                id="apply-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Candidate name"
                required
                className="rounded-sm bg-background border-border text-[13px]"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="apply-email"
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
              >
                Email
              </Label>
              <Input
                id="apply-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@example.com"
                required
                className="rounded-sm bg-background border-border text-[13px]"
              />
            </div>
          </div>

          {/* Row 2 — Resume */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Resume
              </span>
              {/* Toggle */}
              <div className="flex items-center gap-0.5 rounded-sm border border-border p-0.5">
                {(["file", "text"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setResumeMode(mode)}
                    className={`px-3 py-1 rounded-sm font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                      resumeMode === mode
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {mode === "file" ? "Upload file" : "Paste text"}
                  </button>
                ))}
              </div>
            </div>

            {resumeMode === "file" ? (
              <>
                <input
                  ref={fileInputRef}
                  id="apply-resume-file"
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  className="sr-only"
                  onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                  className="border border-border rounded-sm bg-background px-6 py-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-secondary/40 transition-colors"
                >
                  {resumeFile ? (
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-primary flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-sm text-foreground">{resumeFile.name}</span>
                      <span className="font-mono text-[11px] text-muted-foreground tabular">
                        {(resumeFile.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                      <div className="text-center">
                        <p className="text-sm text-foreground/70">Click to upload resume</p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mt-1">
                          PDF · DOCX · TXT · MD
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste the candidate's full resume text here…"
                rows={8}
                className="rounded-sm bg-background border-border text-[13px] leading-relaxed resize-y"
              />
            )}
          </div>

          {/* Row 3 — Cover letter */}
          <div className="space-y-2">
            <Label
              htmlFor="apply-cover"
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
            >
              Cover letter{" "}
              <span className="normal-case text-muted-foreground/60 tracking-normal font-sans text-[11px]">
                (optional)
              </span>
            </Label>
            <Textarea
              id="apply-cover"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Paste the candidate's cover letter here if they included one…"
              rows={4}
              className="rounded-sm bg-background border-border text-[13px] leading-relaxed resize-y"
            />
          </div>

          {/* Error */}
          {status === "error" && (
            <div className="border-l-2 border-primary pl-4 py-2 bg-primary/[0.03]">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary mb-1">
                Couldn&apos;t score this application
              </p>
              <p className="text-sm text-foreground/80">{error}</p>
            </div>
          )}

          {/* Shelf CTA */}
          <div className="pt-2">
            <div className="h-px bg-border" />
            <div className="pt-5 flex items-center justify-between gap-6">
              {status === "loading" ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary flex-shrink-0" />
                  <span className="font-serif italic text-sm text-foreground/70">
                    Scoring resume against {criteriaCount} criteria…
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground max-w-[20rem] leading-relaxed">
                  One LLM call scores the resume against all {criteriaCount} criteria.
                  Takes about 10–15 seconds.
                </p>
              )}
              <Button
                type="submit"
                disabled={status === "loading"}
                size="lg"
                className="gap-2 rounded-sm font-medium tracking-tight flex-shrink-0"
              >
                Score application
              </Button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
