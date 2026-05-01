"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X, RotateCcw } from "lucide-react";
import type { ApplicationStatus } from "@/lib/applications-store";

/**
 * Shortlist / Reject actions on /applications/[id].
 *
 * Two paired buttons. Both are reversible — the recruiter can flip a decision
 * by clicking the same button again (button label switches to "Reset" once
 * the application is in that state).
 *
 * The pair is intentionally minimal: full status workflow (new → reviewing →
 * offered) would need a status menu; that's deferred. These two cover the
 * 95% case of triage actions.
 */
export function StatusActions({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: ApplicationStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const setStatus = async (next: ApplicationStatus) => {
    setError(null);
    const res = await fetch(`/api/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't update status");
      return;
    }
    startTransition(() => router.refresh());
  };

  const isShortlisted = currentStatus === "shortlisted";
  const isRejected = currentStatus === "rejected";

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={isShortlisted ? "outline" : "default"}
          size="sm"
          disabled={isPending}
          onClick={() => setStatus(isShortlisted ? "reviewing" : "shortlisted")}
          className="caps-action"
        >
          {isShortlisted ? (
            <>
              <RotateCcw className="h-3 w-3" strokeWidth={1.75} />
              Un-shortlist
            </>
          ) : (
            <>
              <Check className="h-3 w-3" strokeWidth={1.75} />
              Shortlist
            </>
          )}
        </Button>
        <Button
          variant={isRejected ? "outline" : "ghost"}
          size="sm"
          disabled={isPending}
          onClick={() => setStatus(isRejected ? "reviewing" : "rejected")}
          className={`caps-action ${isRejected ? "" : "text-primary hover:text-primary hover:bg-primary/[0.06]"}`}
        >
          {isRejected ? (
            <>
              <RotateCcw className="h-3 w-3" strokeWidth={1.75} />
              Un-reject
            </>
          ) : (
            <>
              <X className="h-3 w-3" strokeWidth={1.75} />
              Reject
            </>
          )}
        </Button>
      </div>
      {error && (
        <p className="caps-meta text-primary">{error}</p>
      )}
    </div>
  );
}
