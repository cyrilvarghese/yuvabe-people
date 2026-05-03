"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Eye, Check, X } from "lucide-react";
import type { ApplicationStatus } from "@/lib/applications-store";

type ToggleStatus = "reviewing" | "shortlisted" | "rejected";

function toToggleStatus(status: ApplicationStatus): ToggleStatus {
  // `new` → "Review" (pre-triage); `offered` → "Shortlist" (post-shortlist progression).
  if (status === "shortlisted" || status === "offered") return "shortlisted";
  if (status === "rejected") return "rejected";
  return "reviewing";
}

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
  const [optimisticStatus, setOptimisticStatus] = useOptimistic<ApplicationStatus>(currentStatus);

  const displayValue = toToggleStatus(optimisticStatus);

  const setStatus = (next: ToggleStatus) => {
    if (next === toToggleStatus(currentStatus)) return;
    setError(null);
    startTransition(async () => {
      setOptimisticStatus(next);
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
      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <ToggleGroup
        type="single"
        orientation="vertical"
        variant="outline"
        value={displayValue}
        onValueChange={(v) => v && setStatus(v as ToggleStatus)}
        disabled={isPending}
        className="w-full"
      >
        <ToggleGroupItem
          value="reviewing"
          className="caps-action justify-start gap-2"
        >
          <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
          Review
        </ToggleGroupItem>
        <ToggleGroupItem
          value="shortlisted"
          className="caps-action justify-start gap-2 data-[state=on]:bg-[#2F5E7A]/10 data-[state=on]:text-[#2F5E7A]"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={1.75} />
          Shortlist
        </ToggleGroupItem>
        <ToggleGroupItem
          value="rejected"
          className="caps-action justify-start gap-2 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.75} />
          Reject
        </ToggleGroupItem>
      </ToggleGroup>
      {error && <p className="caps-meta text-primary">{error}</p>}
    </div>
  );
}
