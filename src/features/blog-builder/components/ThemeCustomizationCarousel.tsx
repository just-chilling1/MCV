"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutTemplate,
  Palette,
  Type,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import type { ThemeConfig } from "../types";
import {
  READY_TEMPLATES,
  readyTemplateAccent,
  getReadyTemplate,
  HEADING_FONT_OPTIONS,
  BODY_FONT_OPTIONS,
} from "../themes";

const SLIDES = [
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "colors", label: "Colors", icon: Palette },
  { id: "fonts", label: "Fonts", icon: Type },
] as const;

interface ThemeCustomizationCarouselProps {
  selectedTemplateId: string;
  onTemplateSelect: (templateId: string) => void;
  config: ThemeConfig;
  updateConfig: (patch: Partial<ThemeConfig>) => void;
  accentOptions: string[];
  compact?: boolean;
}

export function ThemeCustomizationCarousel({
  selectedTemplateId,
  onTemplateSelect,
  config,
  updateConfig,
  accentOptions,
  compact = false,
}: ThemeCustomizationCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);

  const selectedTemplate = getReadyTemplate(selectedTemplateId);

  const syncActiveSlide = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const slideWidth = track.clientWidth;
    if (slideWidth <= 0) return;
    const index = Math.round(track.scrollLeft / slideWidth);
    setActiveSlide(Math.max(0, Math.min(SLIDES.length - 1, index)));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", syncActiveSlide, { passive: true });
    return () => track.removeEventListener("scroll", syncActiveSlide);
  }, [syncActiveSlide]);

  const scrollToSlide = (index: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, index));
    slideRefs.current[clamped]?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
    setActiveSlide(clamped);
  };

  return (
    <section className={clsx("wizard-panel overflow-hidden p-0", compact && "theme-custom-carousel-compact")}>
      <div
        className={clsx(
          "flex items-center justify-between gap-3 border-b border-border-dim/60",
          compact ? "px-3 py-2.5" : "px-5 py-4"
        )}
      >
        <div className="flex items-center gap-2">
          {SLIDES.map((slide, index) => {
            const Icon = slide.icon;
            const isActive = activeSlide === index;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => scrollToSlide(index)}
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-grad-brass text-text-on-accent"
                    : "bg-brass-100 text-text-secondary hover:bg-brass-100/70"
                )}
                aria-current={isActive ? "step" : undefined}
              >
                <Icon size={13} />
                {slide.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollToSlide(activeSlide - 1)}
            disabled={activeSlide === 0}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-dim text-text-secondary transition-colors hover:bg-brass-100 disabled:opacity-40"
            aria-label="Previous customization step"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scrollToSlide(activeSlide + 1)}
            disabled={activeSlide === SLIDES.length - 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-dim text-text-secondary transition-colors hover:bg-brass-100 disabled:opacity-40"
            aria-label="Next customization step"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="theme-custom-carousel-track flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
        aria-label="Template and customization options"
      >
        {/* Slide 1 — Templates */}
        <div
          ref={(el) => {
            slideRefs.current[0] = el;
          }}
          className="theme-custom-carousel-slide snap-start"
        >
          <div className="theme-custom-carousel-slide-inner">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="wizard-panel-icon">
                  <LayoutTemplate size={18} />
                </div>
                <div>
                  <h2 className="ds-h4">Templates</h2>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Selected:{" "}
                    <span className="font-medium text-brass-700">{selectedTemplate.name}</span>
                  </p>
                </div>
              </div>
              <span className="text-[13px] font-medium text-text-muted">{READY_TEMPLATES.length} options</span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {READY_TEMPLATES.map((template) => {
                const isSelected = selectedTemplateId === template.id;
                const accent = readyTemplateAccent(template);
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => onTemplateSelect(template.id)}
                    aria-pressed={isSelected}
                    className={clsx("wizard-template-card h-full", isSelected && "is-selected")}
                  >
                    <div
                      className={clsx(
                        "flex items-end gap-1.5 px-2.5 pb-1.5 pt-2",
                        compact ? "h-11" : "h-16"
                      )}
                      style={{ backgroundColor: `${accent}14` }}
                    >
                      <div
                        className={clsx("flex-1 rounded-md opacity-90", compact ? "h-5" : "h-8")}
                        style={{ backgroundColor: accent }}
                      />
                      <div className={clsx("w-1/3 rounded-md bg-black/10", compact ? "h-3" : "h-5")} />
                    </div>
                    <div className={clsx("border-t border-border-dim/60", compact ? "p-2.5" : "p-3.5")}>
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={clsx(
                            "wizard-template-card-title select-card-label",
                            isSelected && "font-medium text-brass-700"
                          )}
                        >
                          {template.name}
                        </p>
                        {isSelected && (
                          <span className="wizard-template-card-check select-check-badge" aria-hidden>
                            <Check size={16} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <p
                        className={clsx(
                          "wizard-template-card-tone",
                          template.structureId === "conversion" && isSelected && "text-success"
                        )}
                      >
                        {template.toneLabel}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Slide 2 — Colors */}
        <div
          ref={(el) => {
            slideRefs.current[1] = el;
          }}
          className="theme-custom-carousel-slide snap-start"
        >
          <div className="theme-custom-carousel-slide-inner">
            <div className="flex items-center gap-3">
              <div className="wizard-panel-icon">
                <Palette size={18} />
              </div>
              <div>
                <h2 className="ds-h4">Color theme</h2>
                <p className="mt-0.5 text-xs text-text-muted">Pick an accent for buttons and highlights</p>
              </div>
            </div>

            <div className={clsx("flex flex-wrap justify-center gap-3 sm:justify-start", compact ? "mt-4" : "mt-6")}>
              {accentOptions.map((color) => {
                const isActive = config.accentOverride === color;
                return (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onClick={() => updateConfig({ accentOverride: color })}
                    className={clsx("wizard-color-swatch", isActive && "is-selected")}
                    style={{ backgroundColor: color }}
                    aria-label={`Accent color ${color}`}
                    aria-pressed={isActive}
                  >
                    {isActive && (
                      <span className="wizard-color-swatch-check" aria-hidden>
                        <Check
                          size={18}
                          strokeWidth={3}
                          className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
                        />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Slide 3 — Fonts */}
        <div
          ref={(el) => {
            slideRefs.current[2] = el;
          }}
          className="theme-custom-carousel-slide snap-start"
        >
          <div className="theme-custom-carousel-slide-inner">
            <div className="flex items-center gap-3">
              <div className="wizard-panel-icon">
                <Type size={18} />
              </div>
              <div>
                <h2 className="ds-h4">Typography</h2>
                <p className="mt-0.5 text-xs text-text-muted">Heading and body fonts for your questionnaire</p>
              </div>
            </div>

            <div className={clsx("grid grid-cols-1 gap-4 sm:grid-cols-2", compact ? "mt-4" : "mt-6")}>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="heading-font" className="wizard-font-field-label flex items-center gap-1.5">
                    <Type size={14} />
                    Heading font
                  </label>
                  <span className="wizard-font-selected-badge">Selected</span>
                </div>
                <select
                  id="heading-font"
                  value={config.headingFont ?? ""}
                  onChange={(e) => updateConfig({ headingFont: e.target.value })}
                  className="input-base w-full font-medium text-text-primary"
                  style={{ fontFamily: config.headingFont ?? HEADING_FONT_OPTIONS[0]?.value }}
                >
                  {HEADING_FONT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ fontFamily: opt.value }}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="body-font" className="wizard-font-field-label flex items-center gap-1.5">
                    <Type size={14} />
                    Body font
                  </label>
                  <span className="wizard-font-selected-badge">Selected</span>
                </div>
                <select
                  id="body-font"
                  value={config.bodyFont ?? ""}
                  onChange={(e) => updateConfig({ bodyFont: e.target.value })}
                  className="input-base w-full font-medium text-text-primary"
                  style={{ fontFamily: config.bodyFont ?? BODY_FONT_OPTIONS[0]?.value }}
                >
                  {BODY_FONT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ fontFamily: opt.value }}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={clsx("flex items-center justify-center gap-2 border-t border-border-dim/60", compact ? "px-3 py-2" : "px-5 py-3")}>
        {SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => scrollToSlide(index)}
            className={clsx(
              "h-2 rounded-full transition-all duration-200",
              activeSlide === index ? "w-6 bg-grad-brass" : "w-2 bg-brass-100 hover:bg-ink-6"
            )}
            aria-label={`Go to ${slide.label}`}
            aria-current={activeSlide === index ? "step" : undefined}
          />
        ))}
      </div>
    </section>
  );
}
