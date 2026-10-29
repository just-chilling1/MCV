"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ParticleBackground = dynamic(
  () => import("@/components/ui/particle-background").then((m) => ({ default: m.ParticleBackground })),
  { ssr: false }
);

const DEFER_MS = 1500;

/** Mount particle canvas after idle time so first paint stays fast. */
export function DeferredParticleBackground() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const mount = () => {
      if (!cancelled) setShow(true);
    };

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(mount, { timeout: DEFER_MS });
    } else {
      timeoutId = setTimeout(mount, DEFER_MS);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  if (!show) return null;
  return <ParticleBackground />;
}
