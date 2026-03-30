

## Email Rebrand — Modern 2026 Design System

### Problem
The screenshot shows: broken logo image, plain white layout, basic typography. All 6 email edge functions use inconsistent, dated HTML designs. The logo at `email-assets/hb-logo-teal.png` appears broken in Gmail.

### Design Direction (2026 trends)
- **Dark header with gradient** — deep teal-to-forest gradient header with white logo (already used by some templates, but inconsistent)
- **Generous whitespace** with 48px+ section padding
- **Rounded cards** with subtle shadows for content sections
- **Pill-shaped CTA buttons** with hover-proof padding
- **Icon indicators** using Unicode/emoji sparingly for status
- **Warm neutral body** (`#fafaf9`) instead of cold gray
- **Consistent footer** with social proof line + support link
- **Hero banner images** per email type (decorative background patterns via CSS gradients — no external image dependencies that can break)

### Shared Pattern
Extract a consistent HTML scaffold used by all 6 functions. Each email function will use inline helper functions for:
- `emailHeader(brandName, logoUrl)` — dark gradient header with logo
- `emailFooter(config)` — warm footer with brand, year, support
- `emailWrapper(headerHtml, bodyHtml, footerHtml)` — full document scaffold
- `ctaButton(text, href)` — pill-shaped teal button
- `statusBanner(type, text)` — success/warning/error banner cards

### Logo Fix
The broken image is because `hb-logo-teal.png` may not exist in storage or the URL is malformed. The onboarding email references it via `${SUPABASE_URL}/storage/v1/object/public/email-assets/hb-logo-teal.png`. The password reset hardcodes the full URL. Will standardize all templates to use a white logo on dark header (`hb-logo-white.png`) and add a fallback text-only brand name if the image fails to load.

### Files to Edit

| File | Change |
|------|--------|
| `supabase/functions/send-onboarding-email/index.ts` | Full HTML redesign — dark gradient header, hero welcome section, step cards with numbered circles, pill CTA |
| `supabase/functions/send-password-reset/index.ts` | Redesign — security-themed layout, lock icon, clean single-action CTA |
| `supabase/functions/send-order-confirmation/index.ts` | Redesign — modern order card layout, clean product table, shipping card |
| `supabase/functions/send-dispatch-email/index.ts` | Redesign — shipping progress visual, tracking highlight card |
| `supabase/functions/send-client-email/index.ts` | Redesign all 6 sub-templates (welcome, kyc-link, kyc-approved, kyc-rejected, eligibility-approved, eligibility-rejected) with consistent modern layout |
| `supabase/functions/send-contact-email/index.ts` | Redesign — clean acknowledgment layout |

### Design Specifics

**Color system:**
- Header gradient: `linear-gradient(135deg, #0D4F45 0%, #0A3D35 50%, #072E28 100%)`
- CTA button: `#0D9488` with 12px 32px padding, 24px border-radius (pill)
- Body background: `#fafaf9` (warm white)
- Card background: `#ffffff`
- Text primary: `#1a1a1a`, secondary: `#6b7280`, muted: `#9ca3af`
- Accent borders: `#0D9488` for success, `#f59e0b` for warning, `#ef4444` for error

**Typography:**
- Headings: 28px bold, tight letter-spacing
- Body: 16px, 1.7 line-height
- Font stack: `'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

**Layout improvements:**
- Max-width 560px (narrower = more modern, better mobile)
- 48px horizontal padding in body
- Status banners use left-border accent (4px) instead of full borders
- Footer uses a thin divider line, not a colored background block
- All logos use `hb-logo-white.png` on dark header (consistent, high contrast)

