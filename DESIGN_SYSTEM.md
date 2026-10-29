# Mobile Cash Vault design system

Dark page, light ink, metallic silver primary and muted silver secondary. Tokens live in `src/app/globals.css` as `--mcv-*` and in `src/config/brand.config.ts`. Tailwind sees `canvas`, `ink`, `brass-*`, `silver-*`, `surface`, `raised`, `field`, and `border-dim`. The primary accent utilities are still named `brass-*`. The values are metallic silver.

## Color

| Token | Hex | Use |
| --- | --- | --- |
| Canvas | `#0A0B0C` | Page background, PWA theme |
| Sidebar | `#101214` | Sidebar and fields |
| Surface | `#141618` | Cards |
| Raised | `#262B31` | Menus, modals, popovers |
| Ink | `#F2F4F6` | Primary text |
| Secondary | `#C5CDD6` | Secondary text (`ink-2`) |
| Muted | `#8A939E` | Muted text and placeholders (`ink-4`) |
| Metallic | `#6E7884` | Solid accent fill (`brass-500`). White label. |
| Hover | `#818B96` | Solid accent hover |
| Pressed | `#5A636E` | Solid accent pressed |
| Action | `#C5CDD6` | Icons and big marks. Not small button labels |
| Chrome text | `#E2E7ED` | Accent type on dark surfaces (`brass-700`) |
| Silver | `#7A8490` | Secondary button fill (`silver-500`). White label. |
| Silver hover | `#8F99A5` | Secondary hover |
| Silver pressed | `#636C78` | Secondary pressed |
| Silver text | `#C5CDD6` | Secondary accent type on dark (`silver-700`) |
| On accent | `#0A0B0C` | Label on metallic primary. White on secondary. |
| Line | `#2A3038` | Quiet rules |
| Card edge | `#4A525C` | Card and panel edges |
| Control edge | `#6A7380` | Input borders (clears 3:1) |
| Success | `#36C982` | Success text |
| Warning | `#F0B44D` | Warning text |
| Error | `#F16B70` | Error text. Filled danger buttons use dark `#0A0B0C` type |
| Info | `#65B8F0` | Info text |

Accent scale (metallic silver): 100 `#1A1E22`, 200 `#262B31`, 300 `#4A525C`, 500 `#6E7884`, 700 `#E2E7ED`, 900 `#FFFFFF`. Primary buttons use a chrome gradient (`#C5CDD6` → `#9AA5B0` → `#7A8490`) with dark labels.

Silver scale: 100 `#1A1E22`, 200 `#262B31`, 300 `#4A525C`, 500 `#7A8490`, 700 `#C5CDD6`.

## Type

- UI: Inter (`--font-ui`)
- Headings: Fraunces (`--font-brand`), weight 400
- `.ds-h1` 44px, `.ds-h2` 30px
- `.page-eyebrow`, `.ds-h1` through `.ds-h4`, `.ds-subtitle`
- Pages start with `PageHeader`

## Controls

| Class | Style |
| --- | --- |
| `.btn-primary` | Metallic silver gradient, dark text, pill |
| `.btn-secondary` | Solid `#7A8490`, white text, pill |
| `.btn-ink` | Near-black pill |
| `.input-base` | 48px field, silver focus ring |
| `.card-base` / `.card` | Dark card, hairline shadow, 20px radius, roomy padding |

## Layout

- Content max width: `--layout-content-max` (80rem)
- Page stack: `.page-container` uses a wide gap (`gap-8`, `sm:gap-12`)
- Desktop main padding: 3rem top and right. Sidebar gap: `2.5rem`

## Motion

- Duration: `--mcv-dur` (160ms)
- Ease: `--mcv-ease`

## PWA

Theme and background `#0A0B0C`. Manifest: `src/app/manifest.ts`. Icon: `public/icon.svg`.
