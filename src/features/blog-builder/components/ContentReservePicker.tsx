"use client";

import { useMemo, useState } from "react";
import { Check, Link2, Search } from "lucide-react";
import { clsx } from "clsx";
import type { ArmedLink } from "../types";

/** Show the search filter once the list is long enough to need scanning. */
const SEARCH_THRESHOLD = 5;

const NETWORK_LABELS: Record<ArmedLink["network"], string | null> = {
  digistore: "Digistore24",
  amazon: "Amazon",
  other: null,
};

interface ContentReservePickerProps {
  links: ArmedLink[];
  selectedUrl: string | null;
  onSelect: (link: ArmedLink | null) => void;
  showDivider?: boolean;
  /** Extra classes for saved-link cards and the search field */
  roundedClassName?: string;
}

export function ContentReservePicker({
  links,
  selectedUrl,
  onSelect,
  showDivider = true,
  roundedClassName = "rounded-xl",
}: ContentReservePickerProps) {
  const [query, setQuery] = useState("");

  const filteredLinks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return links;
    return links.filter(
      (link) =>
        link.label.toLowerCase().includes(q) ||
        link.url.toLowerCase().includes(q)
    );
  }, [links, query]);

  if (links.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="wizard-form-label block">Select from Links Library</label>
        <span className="text-xs text-text-muted">
          {links.length} saved link{links.length === 1 ? "" : "s"}
        </span>
      </div>

      {links.length >= SEARCH_THRESHOLD && (
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search saved links by name or URL..."
            aria-label="Search saved links"
            className={clsx("input-base w-full pl-9 text-sm", roundedClassName)}
          />
        </div>
      )}

      <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
        {filteredLinks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border-dim px-3 py-4 text-center text-sm text-text-muted">
            No saved links match &ldquo;{query.trim()}&rdquo;
          </p>
        ) : (
          filteredLinks.map((link, index) => {
            const isSelected = selectedUrl === link.url;
            const networkLabel = NETWORK_LABELS[link.network];
            return (
              <button
                key={`${link.url}-${index}`}
                type="button"
                onClick={() => onSelect(isSelected ? null : link)}
                className={clsx(
                  "select-card flex w-full items-center gap-3 p-3",
                  roundedClassName,
                  isSelected && "is-selected"
                )}
              >
                <Link2
                  size={16}
                  className={clsx("shrink-0", isSelected ? "text-brass-700" : "text-text-muted")}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={clsx(
                        "select-card-label truncate",
                        isSelected && "font-medium text-brass-700"
                      )}
                    >
                      {link.label || "Untitled Link"}
                    </p>
                    {networkLabel && (
                      <span className="shrink-0 rounded-full border border-[var(--mcv-line-brass)] bg-brass-100 px-2 py-0.5 text-[11px] font-medium text-brass-700">
                        {networkLabel}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-text-muted">{link.url}</p>
                </div>
                {isSelected && (
                  <span className="select-check-badge" aria-hidden>
                    <Check size={18} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
      {showDivider && <p className="wizard-divider-label">or enter manually</p>}
    </div>
  );
}
