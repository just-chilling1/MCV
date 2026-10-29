# Mobile Cash Vault

Light, brass-on-cream member app for writing promotional articles, publishing them, and using every premium upgrade from the BlackBox-style shell.

## Stack

- Next.js 16 (App Router), React 19, Tailwind CSS 4
- Supabase Auth (shared with the previous app's project)
- Feature modules under `src/features`, switched on in `src/config/features.config.ts`

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Point `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` at the existing Supabase project. New tables for premium modules are listed in [supabase/APPLY.md](supabase/APPLY.md). Do not re-run the article, snippet, or power-up migrations.

## Navigation

| Label | Route |
| --- | --- |
| Vault HQ | `/dashboard` |
| Write | `/write` |
| Images | `/images` |
| Publish | `/publish` |
| My Vault | `/vault` |
| Link Vault | `/links` |
| Academy | `/training` |
| Vault Upgrades | premium routes in the sidebar |

## Checks

```bash
npm run verify
```

Lint, typecheck, brand compliance, and a production build.
