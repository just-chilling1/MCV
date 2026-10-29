"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function ThreadListSection({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-2xl border border-border-dim bg-surface shadow-[var(--mcv-shadow-card)]"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 border-b border-transparent bg-field px-4 py-3.5 transition-colors hover:bg-brass-100 group-open:border-border-dim [&::-webkit-details-marker]:hidden">
        <ChevronDown
          size={16}
          className="shrink-0 text-brass-700 transition-transform group-open:rotate-180"
        />
        <span className="min-w-0 flex-1 text-sm font-medium text-text-heading">{title}</span>
        {count !== undefined && (
          <span className="shrink-0 rounded-full border border-[var(--mcv-line-brass)] bg-brass-100 px-2.5 py-0.5 text-[13px] font-medium tabular-nums text-success">
            {count}
          </span>
        )}
      </summary>
      <div className="space-y-3 bg-surface p-3 sm:p-4">{children}</div>
    </details>
  );
}
