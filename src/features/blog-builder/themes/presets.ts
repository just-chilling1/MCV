import type { ThemePreset } from "./types";

/**
 * Five 2026 high-performer blog templates:
 * editorial = publication hero + horizontal cards
 * magazine = bento grid hub
 * minimal = distraction-free reader
 * authority = review-site grid + sidebar articles
 * affiliate-pro = conversion-first cards + CTA hero
 */
export const THEME_PRESETS: Record<string, ThemePreset> = {
  editorial: {
    id: "editorial",
    name: "Editorial",
    tagline: "Modern publication — hero feature + horizontal cards",
    fonts: {
      heading: "'Instrument Serif', Georgia, serif",
      body: "'DM Sans', system-ui, sans-serif",
      googleUrl:
        "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Instrument+Serif:ital@0;1&display=swap",
    },
    colors: {
      bg: "#f7f5f2",
      surface: "#ffffff",
      text: "#141414",
      muted: "#6b6560",
      accent: "#0f766e",
      accentHover: "#0d635c",
      border: "rgba(20, 20, 20, 0.08)",
      pillar: "#b45309",
      heroOverlay: "rgba(15, 118, 110, 0.06)",
      gradientFrom: "#0f766e",
      gradientTo: "#134e4a",
      accentSoft: "rgba(15, 118, 110, 0.1)",
    },
    modules: {
      header: "split",
      hero: "featured-pillar",
      homeList: "horizontal",
      postLayout: "narrow",
      footer: "rich",
    },
  },

  magazine: {
    id: "magazine",
    name: "Magazine",
    tagline: "2026 bento grid — image-first modular hub",
    fonts: {
      heading: "'Fraunces', Georgia, serif",
      body: "'Manrope', system-ui, sans-serif",
      googleUrl:
        "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Manrope:wght@400;500;600;700&display=swap",
    },
    colors: {
      bg: "#f3f1ec",
      surface: "#ffffff",
      text: "#171717",
      muted: "#737373",
      accent: "#ea580c",
      accentHover: "#c2410c",
      border: "rgba(23, 23, 23, 0.08)",
      pillar: "#ea580c",
      heroOverlay: "rgba(234, 88, 12, 0.08)",
      gradientFrom: "#fb923c",
      gradientTo: "#9a3412",
      accentSoft: "rgba(234, 88, 12, 0.1)",
    },
    modules: {
      header: "minimal",
      hero: "featured-pillar",
      homeList: "bento",
      postLayout: "wide",
      footer: "rich",
    },
  },

  minimal: {
    id: "minimal",
    name: "Minimal Reader",
    tagline: "Substack-style — typography-first, zero clutter",
    fonts: {
      heading: "'Newsreader', Georgia, serif",
      body: "'Inter', system-ui, sans-serif",
      googleUrl:
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Newsreader:opsz,wght@6..72,500;6..72,600;6..72,700&display=swap",
    },
    colors: {
      bg: "#ffffff",
      surface: "#ffffff",
      text: "#0a0a0a",
      muted: "#737373",
      accent: "#2563eb",
      accentHover: "#1d4ed8",
      border: "rgba(10, 10, 10, 0.08)",
      pillar: "#2563eb",
      heroOverlay: "transparent",
      gradientFrom: "#3b82f6",
      gradientTo: "#1e40af",
      accentSoft: "rgba(37, 99, 235, 0.08)",
    },
    modules: {
      header: "minimal",
      hero: "none",
      homeList: "stack",
      postLayout: "narrow",
      footer: "simple",
    },
  },

  authority: {
    id: "authority",
    name: "Authority",
    tagline: "Wirecutter-style trust + review grid + sticky sidebar",
    fonts: {
      heading: "'Plus Jakarta Sans', system-ui, sans-serif",
      body: "'Plus Jakarta Sans', system-ui, sans-serif",
      googleUrl:
        "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
    },
    colors: {
      bg: "#f8fafc",
      surface: "#ffffff",
      text: "#0f172a",
      muted: "#64748b",
      accent: "#0369a1",
      accentHover: "#075985",
      border: "rgba(15, 23, 42, 0.08)",
      pillar: "#0369a1",
      heroOverlay: "rgba(3, 105, 161, 0.06)",
      gradientFrom: "#0ea5e9",
      gradientTo: "#0369a1",
      accentSoft: "rgba(3, 105, 161, 0.08)",
    },
    modules: {
      header: "split",
      hero: "cta-banner",
      homeList: "grid-2",
      postLayout: "sidebar",
      footer: "rich",
    },
  },

  "recurring-premium": {
    id: "recurring-premium",
    name: "Society Premium",
    tagline: "Recurring Wealth — image-rich bento hub with editorial polish",
    fonts: {
      heading: "'Playfair Display', Georgia, serif",
      body: "'Source Sans 3', system-ui, sans-serif",
      googleUrl:
        "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Source+Sans+3:wght@400;500;600;700&display=swap",
    },
    colors: {
      bg: "#f4f1ea",
      surface: "#ffffff",
      text: "#121212",
      muted: "#5c574f",
      accent: "#0d9488",
      accentHover: "#0f766e",
      border: "rgba(18, 18, 18, 0.09)",
      pillar: "#b45309",
      heroOverlay: "rgba(13, 148, 136, 0.07)",
      gradientFrom: "#14b8a6",
      gradientTo: "#0f766e",
      accentSoft: "rgba(13, 148, 136, 0.12)",
    },
    modules: {
      header: "split",
      hero: "featured-pillar",
      homeList: "bento",
      postLayout: "wide",
      footer: "rich",
    },
  },

  "affiliate-pro": {
    id: "affiliate-pro",
    name: "Affiliate Pro",
    tagline: "Conversion hub — bold type, CTA hero, card grid",
    fonts: {
      heading: "'Syne', system-ui, sans-serif",
      body: "'Inter', system-ui, sans-serif",
      googleUrl:
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Syne:wght@600;700;800&display=swap",
    },
    colors: {
      bg: "#fafaf9",
      surface: "#ffffff",
      text: "#1c1917",
      muted: "#78716c",
      accent: "#059669",
      accentHover: "#047857",
      border: "rgba(28, 25, 23, 0.08)",
      pillar: "#d97706",
      heroOverlay: "rgba(212, 175, 55, 0.08)",
      gradientFrom: "#10b981",
      gradientTo: "#047857",
      accentSoft: "rgba(212, 175, 55, 0.1)",
    },
    modules: {
      header: "centered",
      hero: "cta-banner",
      homeList: "grid-2",
      postLayout: "wide",
      footer: "rich",
    },
  },
};

export const PRESET_IDS = Object.keys(THEME_PRESETS);
