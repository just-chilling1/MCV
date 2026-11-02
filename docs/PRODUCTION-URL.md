# Production URL — Mobile Cash Vault

Work reference for the live app origin and where it must be configured.

---

## Canonical production origin

| Environment | URL |
| --- | --- |
| Local development | `http://localhost:3000` |
| Production | Set via hosting env as `NEXT_PUBLIC_APP_URL` (no hostname is committed in this repo) |

Resolve the live origin from the deployment’s `NEXT_PUBLIC_APP_URL` value. Update this table when DNS / hosting for Mobile Cash Vault is finalized (see [EXTERNAL-RENAME-CHECKLIST.md](./EXTERNAL-RENAME-CHECKLIST.md)).

**Code default:** if `NEXT_PUBLIC_APP_URL` is unset, server code falls back to `http://localhost:3000` (`src/lib/brand-vars.ts` → `getAppUrl()`). That fallback is for local use only and must not be relied on in production.

---

## Where the URL is used

| Concern | Dependency |
| --- | --- |
| Password-reset / auth email redirects | `NEXT_PUBLIC_APP_URL` → `/auth/callback` |
| Public hosted sites, RSS, sitemap absolute links | `NEXT_PUBLIC_APP_URL` (or `getAppUrl()`) |
| Offer / site share URLs in the member UI | Browser `window.location.origin` when available; otherwise `getAppUrl()` |
| Supabase Auth allow-list | Site URL + redirect URLs must include the production origin and `http://localhost:3000/**` |

---

## Required configuration (production host)

1. Point DNS for the chosen production domain at the host.
2. Set `NEXT_PUBLIC_APP_URL` to that origin (scheme + host, no trailing path), e.g. `https://example.com`.
3. Issue TLS for the hostname.
4. Add the same origin to Supabase Authentication → URL configuration (Site URL and Redirect URLs).
5. Redeploy so the client bundle picks up the public env var.

Local `.env.local` should keep:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Related origins (not the member app)

| Purpose | Location |
| --- | --- |
| Support mailbox / help center | `src/config/support.config.ts` (`mobilecashvault@neoai.freshdesk.com`, Freshdesk help center) |
| Outbound transactional From address | Resend (`support@reliteagency.com` — see env example) |
| External scale training | `src/config/training.config.ts` → `externalTrainingUrl` |
| Git repository | Configure `origin` per team; in-repo checklist still tracks rename/host cutover |

---

## Checklist

- [ ] Production hostname chosen and DNS live
- [ ] `NEXT_PUBLIC_APP_URL` set on the production host to that origin
- [ ] Supabase redirect allow-list includes production + localhost
- [ ] This doc’s production table row updated with the final URL
- [ ] Smoke: `/login`, forgot-password email link, and a public `/sites/...` page resolve on the production host
