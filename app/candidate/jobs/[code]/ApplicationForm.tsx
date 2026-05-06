"use client";

import { useState } from "react";

type State =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "success" }
  | { phase: "error"; message: string };

export default function ApplicationForm({ jobCode }: { jobCode: string }) {
  const [state, setState] = useState<State>({ phase: "idle" });
  const [form, setForm] = useState({
    name: "",
    email: "",
    about: "",
    resumeUrl: "",
    skills: "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ phase: "submitting" });

    const skills = form.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, skills, jobCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setState({ phase: "error", message: data.error ?? "Something went wrong. Please try again." });
        return;
      }
      setState({ phase: "success" });
    } catch {
      setState({ phase: "error", message: "Network error. Please check your connection and try again." });
    }
  }

  if (state.phase === "success") {
    return (
      <div className="border border-border rounded-sm p-8 text-center">
        <p className="font-serif italic text-2xl text-foreground">
          Application received.
        </p>
        <p className="mt-3 text-[14px] text-muted-foreground leading-relaxed max-w-sm mx-auto">
          Thank you for applying. We&apos;ve received your application and will
          be in touch if there&apos;s a match.
        </p>
      </div>
    );
  }

  const busy = state.phase === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {state.phase === "error" && (
        <p className="text-[13px] text-primary border border-primary/30 bg-primary/[0.05] rounded-sm px-4 py-3">
          {state.message}
        </p>
      )}

      {/* Name */}
      <div className="space-y-1.5">
        <label
          htmlFor="app-name"
          className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
        >
          Full name <span className="text-primary">*</span>
        </label>
        <input
          id="app-name"
          type="text"
          required
          disabled={busy}
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Aisha Khan"
          className="w-full border border-border rounded-sm px-3 py-2.5 text-[14px] bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 disabled:opacity-50 transition-colors"
        />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="app-email"
          className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
        >
          Email address <span className="text-primary">*</span>
        </label>
        <input
          id="app-email"
          type="email"
          required
          disabled={busy}
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="aisha@example.com"
          className="w-full border border-border rounded-sm px-3 py-2.5 text-[14px] bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 disabled:opacity-50 transition-colors"
        />
      </div>

      {/* Skills */}
      <div className="space-y-1.5">
        <label
          htmlFor="app-skills"
          className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
        >
          Skills
          <span className="ml-2 normal-case tracking-normal font-sans text-[11px] text-muted-foreground/60">
            comma-separated
          </span>
        </label>
        <input
          id="app-skills"
          type="text"
          disabled={busy}
          value={form.skills}
          onChange={(e) => update("skills", e.target.value)}
          placeholder="Python, LLMs, React, Product thinking"
          className="w-full border border-border rounded-sm px-3 py-2.5 text-[14px] bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 disabled:opacity-50 transition-colors"
        />
      </div>

      {/* About */}
      <div className="space-y-1.5">
        <label
          htmlFor="app-about"
          className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
        >
          About you <span className="text-primary">*</span>
        </label>
        <textarea
          id="app-about"
          required
          disabled={busy}
          value={form.about}
          onChange={(e) => update("about", e.target.value)}
          placeholder="Tell us about your background, what you're drawn to in this role, and what you'd bring to the team."
          rows={5}
          className="w-full border border-border rounded-sm px-3 py-2.5 text-[14px] leading-relaxed bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 disabled:opacity-50 transition-colors resize-y"
        />
      </div>

      {/* Resume URL */}
      <div className="space-y-1.5">
        <label
          htmlFor="app-resume"
          className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
        >
          Resume PDF URL
        </label>
        <input
          id="app-resume"
          type="url"
          disabled={busy}
          value={form.resumeUrl}
          onChange={(e) => update("resumeUrl", e.target.value)}
          placeholder="https://drive.google.com/file/d/…"
          className="w-full border border-border rounded-sm px-3 py-2.5 text-[14px] bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 disabled:opacity-50 transition-colors"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-sm bg-primary text-primary-foreground px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {busy ? "Sending…" : "Apply now"}
      </button>
    </form>
  );
}
