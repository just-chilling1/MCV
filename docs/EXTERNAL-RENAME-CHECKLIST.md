# External rename checklist (Mobile Cash Vault)

Use this after the in-repo rebrand so hosting, auth, and URLs stay consistent.

## GitHub

1. Create or rename the repository (for example `mobile-cash-vault`).
2. Point the local remote at the new URL: `git remote set-url origin <url>`.
3. Update CI, hosting hooks, and badges that still point at the old repository.

## Supabase

This app reuses the existing project. The project ref and `*.supabase.co` URL do not change.

1. Set the project display name to Mobile Cash Vault (cosmetic).
2. In Authentication, Site URL and redirect URLs must include the new production origin and `http://localhost:3000/**`.
3. Run only the new SQL files listed in [supabase/APPLY.md](../supabase/APPLY.md).

## Domain

1. Point DNS for the production domain at the host.
2. Set `NEXT_PUBLIC_APP_URL` to that origin.
3. Issue TLS for the new hostname.

## Support

The in-app address is `MobileCashVault@neoai.freshdesk.com` in `src/config/support.config.ts`. Create that mailbox, or change the constant to the address the manager confirms. Outbound mail still uses `support@reliteagency.com` on Resend.
