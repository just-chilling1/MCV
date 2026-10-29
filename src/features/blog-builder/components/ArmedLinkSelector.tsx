"use client";

import { motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { clsx } from "clsx";
import type { ArmedLink } from "../types";
import { isValidAffiliateUrl, normalizeAffiliateUrl } from "../lib/affiliate-url";

/** Pick default selection: first valid link, or index 0 if none yet. */
export function defaultLinkSelection(links: ArmedLink[]): Set<number> {
  const firstValid = links.findIndex((l) => isValidAffiliateUrl(l.url));
  if (firstValid >= 0) return new Set([firstValid]);
  if (links.length > 0) return new Set([0]);
  return new Set([0]);
}

export function getSelectedArmedLinks(
  links: ArmedLink[],
  selected: Set<number>
): ArmedLink[] {
  return links
    .map((link, index) => ({ link, index }))
    .filter(({ index }) => selected.has(index))
    .map(({ link }) => ({
      ...link,
      url: normalizeAffiliateUrl(link.url),
    }))
    .filter((link) => isValidAffiliateUrl(link.url));
}

/** Restore checkbox selection from links previously armed for deploy. */
export function selectionFromArmedLinks(links: ArmedLink[], armed: ArmedLink[]): Set<number> {
  if (armed.length === 0) return defaultLinkSelection(links);

  const armedUrls = new Set(
    armed.map((l) => normalizeAffiliateUrl(l.url)).filter((url) => url.length > 0)
  );
  const indices = links
    .map((link, index) =>
      armedUrls.has(normalizeAffiliateUrl(link.url)) ? index : -1
    )
    .filter((index) => index >= 0);

  if (indices.length > 0) return new Set(indices);
  return defaultLinkSelection(links);
}

interface ArmedLinkSelectorProps {
  links: ArmedLink[];
  selected: Set<number>;
  onLinksChange: (links: ArmedLink[]) => void;
  onSelectedChange: (selected: Set<number>) => void;
}

function emptyLink(): ArmedLink {
  return { label: "DigiStore Offer", url: "", network: "digistore" };
}

function adjustSelectionAfterRemove(selected: Set<number>, removedIndex: number): Set<number> {
  const next = new Set<number>();
  for (const idx of selected) {
    if (idx < removedIndex) next.add(idx);
    else if (idx > removedIndex) next.add(idx - 1);
  }
  return next;
}

export function ArmedLinkSelector({
  links,
  selected,
  onLinksChange,
  onSelectedChange,
}: ArmedLinkSelectorProps) {
  const displayLinks = links.length > 0 ? links : [emptyLink()];

  const update = (index: number, field: keyof ArmedLink, value: string) => {
    const next = [...displayLinks];
    next[index] = { ...next[index], [field]: value };
    onLinksChange(next);
  };

  const normalizeAt = (index: number) => {
    const next = [...displayLinks];
    next[index] = {
      ...next[index],
      url: normalizeAffiliateUrl(next[index].url),
    };
    onLinksChange(next);
  };

  const toggle = (index: number) => {
    const next = new Set(selected);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    onSelectedChange(next);
  };

  const add = () => {
    const nextLinks = [...displayLinks, { label: "My Offer", url: "", network: "digistore" as const }];
    onLinksChange(nextLinks);
    onSelectedChange(new Set([...selected, nextLinks.length - 1]));
  };

  const remove = (index: number) => {
    if (displayLinks.length <= 1) return;
    onLinksChange(displayLinks.filter((_, i) => i !== index));
    onSelectedChange(adjustSelectionAfterRemove(selected, index));
  };

  const selectedValidCount = [...selected].filter(
    (i) => i < displayLinks.length && isValidAffiliateUrl(displayLinks[i].url)
  ).length;

  const firstSelectedIndex = [...selected].sort((a, b) => a - b)[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-brass-700">
          Select links for this deploy
        </p>
        <p className="text-xs text-text-muted tabular-nums">
          {selected.size} selected · {selectedValidCount} ready
        </p>
      </div>

      {displayLinks.map((link, i) => {
        const urlInvalid = link.url.trim().length > 0 && !isValidAffiliateUrl(link.url);
        const isSelected = selected.has(i);
        const isPrimary = isSelected && i === firstSelectedIndex && isValidAffiliateUrl(link.url);

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx("select-card glass-card p-4 flex flex-col gap-3", isSelected && "is-selected")}
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-pressed={isSelected}
                aria-label={`${isSelected ? "Deselect" : "Select"} product link ${i + 1}`}
                className={clsx("select-toggle mt-0.5", isSelected && "is-selected")}
              >
                <Check size={14} strokeWidth={3} />
              </button>

              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-text-muted uppercase tracking-widest font-medium">
                    Product Link {i + 1}
                  </span>
                  {isPrimary && (
                    <span className="status-pill-gold text-[13px] py-0.5">Primary CTA</span>
                  )}
                  {isSelected && !isValidAffiliateUrl(link.url) && (
                    <span className="text-[13px] uppercase tracking-wider text-brass-700">
                      Needs valid URL
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pl-8 flex flex-col gap-3">
              <input
                type="text"
                placeholder="Offer label (e.g. Best Starter Kit)"
                value={link.label}
                onChange={(e) => update(i, "label", e.target.value)}
                className="input-base w-full"
              />
              <input
                type="text"
                inputMode="url"
                placeholder="https://www.digistore24.com/..."
                value={link.url}
                onChange={(e) => update(i, "url", e.target.value)}
                onBlur={() => normalizeAt(i)}
                className={`input-base w-full ${ urlInvalid ? "border-[var(--mcv-line-brass)] focus:border-brass-700" : "" }`}
              />
              {urlInvalid && (
                <p className="text-xs text-brass-700">
                  URL must start with https:// — we&apos;ll try to fix small typos when you leave the
                  field.
                </p>
              )}
              {displayLinks.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-xs text-[var(--mcv-danger)]/80 self-start hover:text-[var(--mcv-danger)]"
                >
                  Remove link
                </button>
              )}
            </div>
          </motion.div>
        );
      })}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-2 text-sm text-brass-700 font-medium self-start hover:underline"
      >
        <Plus size={16} />
        Add another product link
      </button>

      <p className="text-xs text-text-muted leading-relaxed">
        Check at least one link to weave into this website. The first selected link becomes the
        primary in-content recommendation and end CTA. Valid links save to Link Vault automatically.
      </p>
    </div>
  );
}
