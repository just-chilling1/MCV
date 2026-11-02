# Known limitations — Mobile Cash Vault

Work reference for product and engineering constraints that are intentional or not yet closed. Update when a limitation is removed.

---

## Auth and access

| Limitation | Detail |
| --- | --- |
| Shared Supabase project | Auth and data reuse the previous product’s Supabase project. Project URL / ref do not change with the Mobile Cash Vault rebrand ([EXTERNAL-RENAME-CHECKLIST.md](./EXTERNAL-RENAME-CHECKLIST.md)). |
| Dev auth bypass is localhost-only | `DEV_BYPASS_AUTH=true` only applies when `NODE_ENV !== "production"` and the host is `localhost` / `127.0.0.1` / `::1`. Preview or staging hosts cannot use bypass. |
| Bypass needs service role for real API user | Without `SUPABASE_SERVICE_ROLE_KEY` (and password/user id as needed), API identity may fall back to a synthetic user id — local preview of DB-backed features can be incomplete. |
| Page proxy vs API auth | `src/proxy.ts` redirects unauthenticated **pages**. `/api/*` is not redirected; handlers must call `getApiUser` (or equivalent) and return `401` themselves. |
| Login `next` return URL | After login, only paths under `/access/` are honored as return URLs; other `?next=` values go to `/dashboard`. |

See also [LOGIN-ACCESS.md](./LOGIN-ACCESS.md).

---

## Product / feature surface

| Limitation | Detail |
| --- | --- |
| Not all catalog modules are on | `FEATURE_CATALOG` lists many modules; only `enabledFeatures` in `src/config/features.config.ts` ship for this product. |
| Blog builder is on but not in the main nav | Kept enabled so DFY / recurring flows can create hosted sites; it is not shown in the primary vault tool nav. |
| Core Find Ads workflow is off for this build | `core-workflow` is in the catalog but not in `enabledFeatures` for Mobile Cash Vault. |
| Premium unlocks need invite tokens | `/access/<type>` requires `?t=`; opening the path alone shows an invalid-link state. |
| Production domain may still be cutting over | Canonical live origin is whatever is set in `NEXT_PUBLIC_APP_URL` on the host; see [PRODUCTION-URL.md](./PRODUCTION-URL.md). |

---

## AI, images, and generation

| Limitation | Detail |
| --- | --- |
| Image generation needs provider keys | Without `GEMINI_API_KEY`, `RAPIDAPI_KEY`, or `OPENAI_API_KEY`, image routes fail with a not-configured error. |
| Provider quotas / busy endpoints | RapidAPI image hosts can return busy or over-quota; the pipeline may fall back to other providers or time out. |
| DFY / article AI may use local fallbacks | When the AI provider fails or the short budget expires, some generators fall back to local template content rather than failing hard. |
| Scrape / RapidAPI dependencies | Offer scrape and several AI paths require ScraperAPI and RapidAPI env keys; missing keys degrade those flows. |

---

## Data and client behavior

| Limitation | Detail |
| --- | --- |
| Vault list can show a browser copy | If `/api/articles` fails (non-401), Content Reserve may toast and show the local store copy — not a guarantee of server state. |
| Clipboard on LAN HTTP | Clipboard API is unavailable on insecure non-localhost origins (e.g. `http://192.168.x.x`). Copy uses a legacy `execCommand` fallback; prefer HTTPS or localhost. |
| Auth cookies are chunked | API clients must use cookie `getAll`/`setAll` so Supabase chunked auth cookies reassemble; legacy get/set drops the session. |

---

## Ops / rebrand

| Limitation | Detail |
| --- | --- |
| External rename still open | GitHub rename, DNS, and `NEXT_PUBLIC_APP_URL` cutover are tracked in [EXTERNAL-RENAME-CHECKLIST.md](./EXTERNAL-RENAME-CHECKLIST.md), not fully assumed done in-repo. |
| Support mailbox vs From address | In-app support address is Freshdesk (`mobilecashvault@neoai.freshdesk.com`); outbound Resend still uses `support@reliteagency.com` unless env is changed. |

---

## Out of scope for this list

Transient bugs, one-off deploy misconfigurations, and planned features that were never enabled for this product are not listed here. Prefer fixing those in code or tickets rather than documenting them as lasting limitations.
