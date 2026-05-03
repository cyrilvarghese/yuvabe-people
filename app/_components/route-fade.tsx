"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Route-level cross-fade. Wraps {children} in app/layout.tsx so that every
 * navigation (including the loading.tsx → page.tsx swap) gets a 200ms opacity
 * transition instead of a hard cut.
 *
 * See yuvabe-design-system §Motion VERB 4: DIRECT — page transitions.
 *
 * `data-fade` opts the transition into surviving the prefers-reduced-motion
 * override in app/globals.css (transforms drop to 1ms; opacity stays).
 *
 * The first render starts visible so cold loads don't fade-in from black.
 * Only pathname *changes* drop to opacity-0 for one rAF tick, then climb back.
 */
export function RouteFade({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(false);
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <div
      data-fade
      className={`flex-1 flex flex-col transition-opacity duration-200 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {children}
    </div>
  );
}
