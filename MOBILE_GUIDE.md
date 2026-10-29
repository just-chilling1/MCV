# Mobile Cash Vault mobile guide

## Breakpoints

| Viewport | Shell |
| --- | --- |
| `< lg` (< 1024px) | Bottom nav + top bar. Sidebar hidden. |
| `>= lg` | Fixed sidebar. No bottom nav. |

## Top bar

Visible only below `lg`. Centered vault mark and **Mobile Cash Vault** on one line (`whitespace-nowrap`).

## Bottom navigation

Component: `src/components/layout/BottomNav.tsx`

| Tab | Route |
| --- | --- |
| Vault HQ | `/dashboard` |
| Write | `/write` |
| My Vault | `/vault` |
| Academy | `/training` |
| More | Sheet with Images, Publish, Link Vault, Vault Upgrades, offers, Support, logout |

## Safe areas

Bottom nav uses the safe-area inset. Main content uses extra bottom padding below `lg` so the tabs do not cover the last button.

## Checklist

- [ ] Product name stays on one line at 320px
- [ ] Bottom tabs do not cover the last call to action
- [ ] More sheet opens, scrolls, and closes
- [ ] No sidebar below `lg`
- [ ] Page titles use `PageHeader`
