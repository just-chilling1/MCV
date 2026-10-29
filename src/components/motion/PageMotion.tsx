"use client";

import type { ReactNode } from "react";

/** Route wrapper — content renders immediately (no enter fade delay). */
export function PageMotion({ children }: { children: ReactNode }) {
  return <div className="min-h-full">{children}</div>;
}
