"use client";

import { clsx } from "clsx";
import { resolveThemeConfig, getReadyTemplate } from "../themes";
import type { ThemeConfig } from "../types";

interface ThemePreviewProps {
  config: ThemeConfig;
  templateId?: string;
  nicheLabel?: string;
  compact?: boolean;
  /** When true, emphasizes link to the selected template card below */
  linkedSelection?: boolean;
}

function darkPreviewAccent(accent: string): string {
  return accent.toLowerCase() === "#059669" ? "#34d399" : accent;
}

export function ThemePreview({
  config,
  templateId,
  nicheLabel,
  compact = false,
  linkedSelection = false,
}: ThemePreviewProps) {
  const { colors, headingFont, bodyFont } = resolveThemeConfig(config);
  const template = getReadyTemplate(templateId ?? config.templateId ?? "editorial-sage");
  const accent = colors.accent;
  const isDark = template.structureId === "conversion";
  const previewAccent = isDark ? darkPreviewAccent(accent) : accent;
  const previewKey = templateId ?? config.templateId ?? "editorial-sage";

  const headerBorderColor = linkedSelection
    ? isDark
      ? "rgba(255,255,255,0.14)"
      : colors.border
    : isDark
      ? "rgba(255,255,255,0.08)"
      : colors.border;

  const headerBackground = linkedSelection
    ? isDark
      ? "#27272a"
      : "rgba(238, 179, 16, 0.1)"
    : isDark
      ? "#18181b"
      : colors.surface;

  const eyebrowClass = linkedSelection
    ? isDark
      ? compact
        ? "text-[13px] font-medium uppercase tracking-widest text-success"
        : "text-[13px] font-medium uppercase tracking-[0.2em] text-success"
      : compact
        ? "text-[13px] font-medium uppercase tracking-widest text-brass-700"
        : "page-eyebrow"
    : clsx(
        "text-[13px] font-medium uppercase tracking-widest",
        isDark ? "text-zinc-400" : "opacity-60"
      );

  const toneBadgeStyle = linkedSelection
    ? isDark
      ? {
          backgroundColor: "#047857",
          color: "#ecfdf5",
          border: "1px solid #6ee7b7",
        }
      : {
          backgroundColor: "rgba(238, 179, 16, 0.22)",
          color: "#78350f",
          border: "1px solid rgba(180, 83, 9, 0.35)",
        }
    : isDark
      ? {
          backgroundColor: "rgba(4, 120, 87, 0.35)",
          color: "#a7f3d0",
          border: "1px solid rgba(52, 211, 153, 0.45)",
        }
      : {
          backgroundColor: `${accent}22`,
          color: accent,
        };

  return (
    <div
      key={previewKey}
      className={
        linkedSelection
          ? "theme-preview-animate overflow-hidden"
          : "overflow-hidden rounded-2xl border"
      }
      style={{
        borderColor: linkedSelection ? undefined : isDark ? "rgba(255,255,255,0.1)" : colors.border,
        backgroundColor: isDark ? "#0f0f10" : colors.bg,
        color: isDark ? "#f4f4f5" : colors.text,
      }}
    >
      <div
        className={
          compact
            ? "flex items-center justify-between gap-2 border-b px-3 py-2.5"
            : "flex flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
        }
        style={{
          borderColor: headerBorderColor,
          backgroundColor: headerBackground,
        }}
      >
        <div className="min-w-0">
          <p className={eyebrowClass}>
            {linkedSelection ? `Previewing: ${template.name}` : "Questionnaire preview"}
          </p>
          {!compact && (
            <p
              className="text-base font-medium truncate sm:text-lg"
              style={{ fontFamily: headingFont, color: isDark ? "#fafafa" : undefined }}
            >
              {template.name}
            </p>
          )}
          {!compact && (
            <p className={clsx("mt-0.5 line-clamp-1 text-xs", isDark ? "text-zinc-400" : "text-text-muted")}>
              {template.tagline}
            </p>
          )}
        </div>
        <span
          className={
            compact
              ? "shrink-0 rounded-full px-2 py-0.5 text-[13px] font-medium uppercase tracking-wide"
              : "shrink-0 self-start rounded-full px-3 py-1 text-[13px] font-medium uppercase tracking-wide sm:self-center"
          }
          style={toneBadgeStyle}
        >
          {template.toneLabel}
        </span>
      </div>

      <div className={compact ? "p-3" : `grid gap-4 p-4 sm:p-5 ${"lg:grid-cols-[1.2fr_1fr]"}`}>
        <QuestionnaireMock
          compact={compact}
          isDark={isDark}
          colors={colors}
          headingFont={headingFont}
          bodyFont={bodyFont}
          nicheLabel={nicheLabel}
          accent={previewAccent}
        />

        {!compact && (
          <div
            className={clsx(
              "flex flex-col justify-center gap-3 rounded-xl border p-4",
              isDark ? "border-white/10 bg-zinc-900/80" : "border-black/5 bg-black/20"
            )}
          >
            <div>
              <p
                className={clsx(
                  "mb-1 text-[13px] font-medium uppercase tracking-widest",
                  isDark ? "text-zinc-400" : "text-text-muted"
                )}
              >
                Site format
              </p>
              <p className={clsx("text-sm", isDark ? "text-zinc-200" : "text-text-secondary")}>
                Multi-step niche questionnaire
              </p>
            </div>
            <div>
              <p
                className={clsx(
                  "mb-1 text-[13px] font-medium uppercase tracking-widest",
                  isDark ? "text-zinc-400" : "text-text-muted"
                )}
              >
                Final page
              </p>
              <p
                className={clsx(
                  "text-sm leading-relaxed",
                  isDark ? "text-zinc-200" : "text-text-secondary"
                )}
              >
                Personalized results + your affiliate offer as the recommended next step
              </p>
            </div>
            {nicheLabel && (
              <p className={clsx("text-xs", isDark ? "text-zinc-400" : "text-text-muted")}>
                Tailored for{" "}
                <span className={isDark ? "text-zinc-100" : "text-text-primary"}>{nicheLabel}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionnaireMock({
  compact,
  isDark,
  colors,
  headingFont,
  bodyFont,
  nicheLabel,
  accent,
}: {
  compact?: boolean;
  isDark: boolean;
  colors: { border: string; surface: string; text: string; accent: string };
  headingFont: string;
  bodyFont: string;
  nicheLabel?: string;
  accent: string;
}) {
  const cardBg = isDark ? "#18181b" : colors.surface;
  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : colors.border;
  const mutedLabel = isDark ? "#a1a1aa" : undefined;
  const progressTrack = isDark ? "rgba(255,255,255,0.12)" : `${accent}18`;
  const continueBg = isDark ? "#059669" : accent;

  return (
    <div
      className={compact ? "space-y-2 rounded-lg border p-2.5" : "space-y-3 rounded-xl border p-4"}
      style={{ backgroundColor: cardBg, borderColor: cardBorder }}
    >
      <div
        className={
          compact
            ? "flex items-center justify-between text-[13px] font-medium uppercase tracking-wider"
            : "flex items-center justify-between text-[13px] font-medium uppercase tracking-wider"
        }
        style={{ color: mutedLabel }}
      >
        <span>Question 2 of 5</span>
        <span style={{ color: accent }}>40%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full" style={{ backgroundColor: progressTrack }}>
        <div className="h-full w-2/5 rounded-full" style={{ backgroundColor: accent }} />
      </div>
      <p
        className={compact ? "pt-0.5 text-[13px] font-medium" : "pt-1 text-sm font-medium"}
        style={{ fontFamily: headingFont, color: isDark ? "#fafafa" : colors.text }}
      >
        {nicheLabel
          ? `What's your biggest challenge with ${nicheLabel.toLowerCase()}?`
          : "What's your biggest challenge right now?"}
      </p>
      {(compact
        ? ["Just getting started", "Too much conflicting advice"]
        : ["Just getting started", "Too much conflicting advice", "Lack of consistency"]
      ).map((opt, i) => (
        <div
          key={opt}
          className={compact ? "rounded-md border px-2 py-1.5 text-[13px]" : "rounded-lg border px-3 py-2 text-xs"}
          style={{
            fontFamily: bodyFont,
            borderColor: i === 1 ? accent : cardBorder,
            backgroundColor: i === 1 ? (isDark ? "rgba(16, 185, 129, 0.14)" : `${accent}12`) : "transparent",
            color: isDark ? "#e4e4e7" : colors.text,
          }}
        >
          {opt}
        </div>
      ))}
      <div
        className={
          compact
            ? "mt-1 rounded-md py-1.5 text-center text-[13px] font-medium text-white"
            : "mt-2 rounded-lg py-2 text-center text-[13px] font-medium text-white"
        }
        style={{ backgroundColor: continueBg }}
      >
        Continue →
      </div>
    </div>
  );
}
