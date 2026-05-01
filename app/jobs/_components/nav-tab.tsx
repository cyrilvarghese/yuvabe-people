"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavTab({
  href,
  label,
  prefix,
}: {
  href: string;
  label: string;
  prefix?: string;
}) {
  const pathname = usePathname();
  const active = prefix ? pathname.startsWith(prefix) : pathname === href;
  return (
    <Link
      href={href}
      className={`
        caps-meta py-3 -mb-px border-b-2 transition-colors
        ${
          active
            ? "text-foreground border-primary"
            : "text-foreground/55 border-transparent hover:text-foreground"
        }
      `}
    >
      {label}
    </Link>
  );
}
