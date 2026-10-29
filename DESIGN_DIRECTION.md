# Design Direction — Mobile Cash Vault

Dark vault theme. Forest green base, sage structure, gold accent.

## Palette (60 / 30 / 10)

| Role | Hex | Use |
|------|-----|-----|
| Forest (60%) | `#006400` family | Page, sidebar, cards. Dark shades: canvas `#04140A`, surface `#0A2414`, raised `#123A21` |
| Sage (30%) | `#4A6B5B` | Borders, secondary buttons, icon chips, muted lines |
| Gold (10%) | `#D4AF37` | Primary CTA, focus, links, active tabs, accent text (`#E6C65C` on dark) |

## Rules

- Keep dark theme. Never put raw `#006400` on full page — use deep shades.
- Gold fill needs dark type (`#04140A`), not white.
- Sage fill keeps white type.
- Class names stay `brass-*` / `silver-*`; tokens hold the new colors.
- Source of truth: `src/config/brand.config.ts` + `src/app/globals.css` `:root`.
