"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

/**
 * Per-row actions on the jobs list. Lives in a client boundary because the
 * "Archive" item triggers a fetch + router.refresh() — the rest of /jobs
 * stays a server component.
 */
export function JobActionsMenu({
  jobCode,
  jobTitle,
  isArchived,
}: {
  jobCode: string;
  jobTitle: string;
  isArchived: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleArchive = async () => {
    setOpen(false);
    if (isArchived) {
      // Restore directly — no confirmation; reversible already.
      const res = await fetch(`/api/jobs/${jobCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unarchive" }),
      });
      if (res.ok) startTransition(() => router.refresh());
      return;
    }
    const ok = window.confirm(
      `Archive "${jobTitle}"?\n\nThis hides the job from the list. Existing applicants stay visible. You can restore it later.`
    );
    if (!ok) return;
    const res = await fetch(`/api/jobs/${jobCode}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive" }),
    });
    if (res.ok) startTransition(() => router.refresh());
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          className="relative z-10 h-8 w-8 text-muted-foreground/70 group-hover:text-muted-foreground hover:!text-foreground hover:bg-secondary transition-colors"
          aria-label={`More actions for ${jobTitle}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href={`/jobs/${jobCode}/view`}>View criteria</Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>Duplicate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            handleArchive();
          }}
          className={
            isArchived
              ? "text-foreground focus:text-foreground"
              : "text-primary focus:text-primary"
          }
        >
          {isArchived ? "Restore" : "Archive"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
