# Login and access — Mobile Cash Vault

Internal reference for how members and the team get into the app, unlock premium modules, and work locally without a login loop.

---

## 1. Member login (production / staging)

| Step | Action |
| --- | --- |
| 1 | Open the app origin (see `NEXT_PUBLIC_APP_URL`). |
| 2 | Go to `/login`. |
| 3 | Sign in with email + password (Supabase Auth). |
| 4 | After a successful login, the app sends the member to `/dashboard` (or to an allowed `/access/...` return URL if present). |

**Related routes**

| Route | Purpose |
| --- | --- |
| `/login` | Email / password sign-in |
| `/signup` | Create account → `/onboarding` when a session is issued, otherwise `/login` |
| `/forgot-password` | Request reset email |
| `/reset-password` | Set a new password after the email link |
| `/auth/callback` | Supabase redirect handler (password reset and similar) |
| `/onboarding` | Required once after signup until complete |

Unauthenticated visits to protected pages are redirected to `/login` (see `src/proxy.ts`). Signed-in visits to auth pages go to `/dashboard`.

**Support notes**

- Password-reset emails use `NEXT_PUBLIC_APP_URL` as the redirect base. That value must match a allowed redirect URL in the Supabase Auth settings.
- Site URL and redirect allow-list must include the production origin and `http://localhost:3000/**` (see [EXTERNAL-RENAME-CHECKLIST.md](./EXTERNAL-RENAME-CHECKLIST.md)).

---

## 2. Premium unlock links (`/access/...`)

Paid / invite upgrades land on an access page with a token. Old `/unlock/...` URLs redirect here.

| Power-up | Access URL pattern | After unlock |
| --- | --- | --- |
| Social Payouts (`10x`) | `/access/10x?t=<token>` | `/social-payouts` |
| Unlimited (`infinite`) | `/access/infinite?t=<token>` | `/infinite` |
| Automated Profits (`automation`) | `/access/automation?t=<token>` | `/autopilot` |
| Vault Protector (`protector`) | `/access/protector?t=<token>` | `/protector` |

`/access/dfy` is treated as `protector`.

**Flow**

1. Member must be signed in. If not, they are sent to `/login?next=/access/<type>?t=...` and returned to the access page after login.
2. The page requires `?t=` (invite token). Without it, the UI shows an invalid-link message.
3. Submitting registers the grant via `POST /api/powerups/register`, then routes to the feature page above.
4. If the grant already exists, the page offers a direct link to the feature.

---

## 3. Public routes (no login)

These prefixes are not gated by the auth proxy:

- `/sites/...`, `/s/...`, `/article/...`, `/review/...` — hosted / public content
- `/embed/...` — embeds
- Member public sites shaped like `/{handle}/sites/...` still render outside the logged-in shell; auth gating for those paths follows the proxy public-prefix rules where configured

API routes under `/api` are not redirected by the page proxy; individual handlers still call `getApiUser` / similar and return `401` when required.

---

## 4. Local development access

### Standard local login

1. Copy env: `cp .env.local.example .env.local`
2. Set at least:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL=http://localhost:3000`
3. `npm run dev` → open `http://localhost:3000/login`
4. Use a real Supabase user (signup locally or an existing project user).

### Dev auth bypass (local preview only)

Use when you need the app without logging in each time.

| Variable | Required | Notes |
| --- | --- | --- |
| `DEV_BYPASS_AUTH=true` | Yes | Only honored when `NODE_ENV !== "production"` **and** host is `localhost` / `127.0.0.1` / `::1` |
| `SUPABASE_SERVICE_ROLE_KEY` | Strongly recommended | Lets API routes act as a real bypass user |
| `DEV_BYPASS_PASSWORD` | Yes if creating the bypass user | Used to create `dev-local@mobile-cash-vault.local` when missing |
| `DEV_BYPASS_EMAIL` | Optional | Defaults to `dev-local@mobile-cash-vault.local` |
| `DEV_BYPASS_USER_ID` | Optional | Pin an existing Auth user id instead of creating one |

With bypass active on localhost:

- Auth routes redirect to `/dashboard`
- Onboarding redirect is skipped at the proxy
- API `getApiUser` returns the bypass user (service-role backed when configured)

Do **not** enable bypass on shared non-production hosts; the host check exists so a preview deploy cannot silently become the service-role user.

Playwright sets `DEV_BYPASS_AUTH=true` in `playwright.config.ts` for automated runs.

---

## 5. Quick checklist for the team

- [ ] Member can sign in at `/login` and land on `/dashboard`
- [ ] New signup reaches `/onboarding`, then the main app after completion
- [ ] Forgot-password email opens `/reset-password` via `/auth/callback`
- [ ] Invite link `/access/<type>?t=...` works when logged in; redirects through login when not
- [ ] Local `.env.local` has Supabase URL + anon key; optional bypass only on localhost
- [ ] Supabase Auth Site URL / redirect URLs include production and localhost
