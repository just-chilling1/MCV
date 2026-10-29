"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";
import type { ResolvedTheme } from "../types";

interface PublicSiteRootProps {
  theme: ResolvedTheme;
  premium?: boolean;
  children: ReactNode;
}

export function PublicSiteRoot({ theme, premium = false, children }: PublicSiteRootProps) {
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    const prevColor = document.body.style.color;
    const prevClass = document.body.className;

    document.body.style.backgroundColor = theme.colors.bg;
    document.body.style.color = theme.colors.text;
    document.body.classList.remove("text-white");
    document.body.classList.add("blog-public-page");

    return () => {
      document.body.style.backgroundColor = prevBg;
      document.body.style.color = prevColor;
      document.body.className = prevClass;
    };
  }, [theme.colors.bg, theme.colors.text]);

  const style = {
    "--blog-bg": theme.colors.bg,
    "--blog-surface": theme.colors.surface,
    "--blog-text": theme.colors.text,
    "--blog-muted": theme.colors.muted,
    "--blog-accent": theme.colors.accent,
    "--blog-accent-hover": theme.colors.accentHover,
    "--blog-border": theme.colors.border,
    "--blog-pillar": theme.colors.pillar,
    "--blog-hero-overlay": theme.colors.heroOverlay,
    "--blog-gradient-from": theme.colors.gradientFrom,
    "--blog-gradient-to": theme.colors.gradientTo,
    "--blog-accent-soft": theme.colors.accentSoft,
    "--blog-font-heading": theme.fonts.heading,
    "--blog-font-body": theme.fonts.body,
  } as CSSProperties;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={theme.fonts.googleUrl} />
      <div
        className={`blog-public-root flex flex-col min-h-dvh${premium ? " blog-premium-recurring" : ""}`}
        style={style}
      >
        {children}
      </div>
    </>
  );
}
