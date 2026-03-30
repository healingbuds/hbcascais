# Healing Buds — Master Knowledge Base

> **Last Updated:** 2026-03-29  
> **Project:** Healing Buds Medical Cannabis Platform  
> **Stack:** React + Vite + Tailwind + TypeScript + Lovable Cloud (Supabase) → migrating to Next.js

---

## 1. Project Identity

| Key | Value |
|-----|-------|
| **Company** | Healing Buds |
| **Primary Domain** | healingbuds.co.za (South Africa — live) |
| **Secondary Domain** | healingbuds.pt (Portugal — coming soon) |
| **Repository** | `healingbuds/sun712` |
| **Locale** | en, pt |
| **Email** | info@healingbuds.pt |

### Branding
- **No Lovable references** in production builds
- Remove `componentTagger` from `vite.config.ts` and Lovable `<meta>` tags from `index.html`

### Budstacks Ecosystem Context
- **Budstacks.io** is the SaaS platform that controls all Dr. Green NFT franchise sales
- **Dr. Green NFT** (ERC-721) is the "Digital Franchise License" — mandatory key for tenants to operate a storefront
- **Healing Buds** is the "Genesis Template" — the flagship master codebase that future white-label tenants will clone
- All storefronts are powered by the Budstacks engine, connecting to Dr. Green fulfillment and licensing backend
- Future NFT holders receive a cloned version of this repository to launch their own branded stores
- Remove `componentTagger` from `vite.config.ts` and Lovable `<meta>` tags from `index.html`

---

## 2. Deployment

### cPanel Deployment via GitHub Actions

| Setting | Value |
|---------|-------|
| SSH Host | `server712.brixly.uk` |
| SSH Port | `21098` |
| SSH User | `healingu` |
| Remote Path (healingbuds.pt) | `~/public_html/` |
| Remote Path (healingbuds.co.za) | `~/healingbuds.co.za/` |

**Workflow:** `.github/workflows/deploy_to_cpanel.yml`  
**Trigger:** Push to `main` branch  
**Process:** Checkout → Build → rsync via SSH to cPanel  

**GitHub Secrets (configured):**
- `CPANEL_HOST`, `CPANEL_USER`, `CPANEL_SSH_KEY` (ED25519)

### Vite Configuration (Critical)
```typescript
export default defineConfig({
  base: "./", // REQUIRED — prevents white screen on cPanel
});
```

### Troubleshooting
- **White screen:** Check `base: "./"` in `vite.config.ts`, and search for merge conflict markers (`<<<<<<<`)
- **403 Forbidden:** Run `chmod -R a+rX public_html` via SSH
- **Deployment fails:** Check GitHub Actions logs, verify SSH key is authorized

### Manual Deployment
```bash
npm run build
# Upload contents of dist/ to public_html via cPanel File Manager
```

---

## 3. Dr. Green DApp API

### 3.1 Architecture

```
Frontend (React) → Edge Function (drgreen-proxy) → Dr. Green API
                                                      ↓
                                              Local DB (Supabase)
```

**Rules:**
1. Frontend NEVER calls Dr. Green API directly
2. API keys stored server-side only (edge function secrets)
3. Request signing happens server-side only
4. Error responses are sanitized before returning to client

### 3.2 Environments

| Environment | API URL | Credentials |
|-------------|---------|-------------|
| **Production** | `api.drgreennft.com` | `DRGREEN_API_KEY` / `DRGREEN_PRIVATE_KEY` |
| **Staging** | `stage-api.drgreennft.com` | `DRGREEN_STAGING_API_KEY` / `DRGREEN_STAGING_PRIVATE_KEY` |
| **Railway** | Railway URL | Shares staging credentials |

All operations (read + write) use the same credential set per environment. No separate read/write keys.

### 3.3 Authentication & Signing

**Method:** secp256k1 ECDSA for `/dapp/*` endpoints; HMAC-SHA256 for `/strains`

| Header | Value |
|--------|-------|
| `x-auth-apikey` | Raw Base64 API key (send as-is, no processing) |
| `x-auth-signature` | Base64-encoded signature |
| `Content-Type` | `application/json` |

**What to sign:**

| HTTP Method | Sign This |
|-------------|-----------|
| GET with query params | The query string (without `?`) |
| GET without query params | A JSON `signBody` (NOT sent in request) |
| POST / PATCH / DELETE | The JSON body string |

### 3.4 Key Endpoints

| Action | Method | Endpoint |
|--------|--------|----------|
| List strains | GET | `/strains?countryCode={alpha3}&take=100&page=1` |
| List clients | GET | `/dapp/clients?take=200&page=1&orderBy=desc` |
| Get client | GET | `/dapp/clients/{clientId}` |
| Create client | POST | `/dapp/clients` |
| Update client | PATCH | `/dapp/clients/{clientId}` |
| Add to cart | POST | `/dapp/carts` |
| Create order | POST | `/dapp/orders` |
| Get orders | GET | `/dapp/client/{clientId}/orders` |
| Sales summary | GET | `/dapp/dashboard/sales` |

**Country codes:** Dr. Green uses ISO 3166-1 **alpha-3** (ZAF, PRT, GBR), not alpha-2.

### 3.5 Critical: clientId vs clientCartId

| Field | What It Is | Where You Get It |
|-------|-----------|-----------------|
| `clientId` | Patient UUID | From client creation or DB |
| `clientCartId` | Cart's own UUID | `GET /dapp/clients/{clientId}` → `data.clientCart[0].id` |

**`clientCartId ≠ clientId`** — cart operations (`POST /dapp/carts`) require `clientCartId`. The proxy's `resolveClientCartId()` helper handles this automatically.

### 3.6 Response Normalization

The proxy includes normalization helpers to handle varying API response structures:
- `normalizeListResponse()` → consistent `{ items: [...], meta: {...} }` shape
- `normalizeSingleResponse()` → unwraps double-nested objects
- `normalizeClientResponse()` → client-specific normalization + shipping normalization

### 3.7 Known Issues

- `GET /dapp/clients/{id}` sometimes returns 401 — fallback: list all clients and filter
- Response nesting varies between endpoints — normalization helpers handle this
- NFT-scoped access: clients created with one API key are invisible to another
- **Order list endpoint returns empty `items[]`**: `GET /dapp/client/{id}/orders` returns `totalAmount` but no item details. The sync code must NOT overwrite locally-stored items with empty arrays. Orders created via checkout have correct items; only API-synced orders may have empty items.
- **Legacy orders with `user_id = null`**: Orders synced by edge functions (sync-orders) may lack `user_id`. Admin hooks must guard against querying `drgreen_clients` with null `user_id` to prevent 400 errors.

---

## 4. Authentication Systems

### Patient Auth (Email/Password)
- Supabase Auth with email/password signup
- Profile auto-created via `handle_new_user()` trigger
- Email verification required (auto-confirm NOT enabled)

### Admin Auth (Wallet/NFT)
1. Connect MetaMask via RainbowKit
2. Sign SIWE message
3. `wallet-auth` edge function verifies signature + checks NFT `balanceOf > 0`
4. Resolves wallet → email via `wallet_email_mappings` table
5. Issues OTP → establishes Supabase session
6. Assigns `admin` role in `user_roles` table

**NFT Contract:** `0x217ddEad61a42369A266F1Fb754EB5d3EBadc88a` (ERC-721, Ethereum Mainnet)  
**WalletConnect Project ID:** `0ed43641317392e224a038f3edc04ae7`

### Eligibility Rule (Non-Negotiable)
```typescript
const isEligible = client.isKYCVerified === true && client.adminApproval === "VERIFIED";
```
If either is false: cart disabled, checkout blocked, medical verification message shown.

---

## 5. Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profile (auto-created on signup) |
| `user_roles` | RBAC roles (admin, moderator, user) |
| `drgreen_clients` | Patient records linked to Dr. Green API |
| `drgreen_cart` | Shopping cart items per user |
| `drgreen_orders` | Order records synced with Dr. Green |
| `strains` | Product catalog (synced from Dr. Green) |
| `articles` | Blog/news content (The Wire) |
| `dosage_logs` | Patient dosage tracking |
| `prescription_documents` | Uploaded prescription files |
| `strain_knowledge` | Scraped strain medical info |
| `generated_product_images` | AI-generated product images |
| `email_templates` / `email_logs` | Email system |
| `launch_interest` | Pre-launch lead signups |
| `wallet_auth_nonces` | Wallet auth nonce tracking |
| `wallet_email_mappings` | Wallet ↔ email links |
| `kyc_journey_logs` | KYC verification audit trail |

### Key Functions
- `has_role(_user_id, _role)` — SECURITY DEFINER, used in RLS policies
- `handle_new_user()` — Trigger: auto-creates profile on signup
- `normalize_wallet_address()` — Trigger: lowercases wallet addresses

### Storage Buckets
- `email-assets` (public) — Email logos
- `product-images` (public) — Generated product images
- `prescription-documents` (private) — Patient prescriptions

---

## 6. Edge Functions

| Function | Purpose |
|----------|---------|
| `drgreen-proxy` | Main proxy to Dr. Green API (signing, routing, normalization) |
| `drgreen-health` | API health check |
| `wallet-auth` | SIWE wallet authentication + NFT check |
| `sync-strains` | Sync strain catalog from Dr. Green |
| `sync-clients` | Sync client data |
| `sync-orders` | Sync order data |
| `exchange-rates` | Currency conversion rates |
| `generate-product-image` | AI product image generation |
| `batch-generate-images` | Bulk image generation |
| `strain-knowledge` | Strain knowledge scraping |
| `strain-medical-info` | Medical info lookup |
| `send-client-email` | Transactional email |
| `send-contact-email` | Contact form handler |
| `send-onboarding-email` | New client onboarding |
| `send-dispatch-email` | Order dispatch notification |
| `send-order-confirmation` | Order confirmation email |
| `prescription-expiry-check` | Expiry monitoring |
| `admin-update-user` | Admin user management |
| `drgreen-api-tests` | API test runner |
| `drgreen-comparison` | Cross-environment comparison |
| `drgreen-webhook` | Inbound webhooks |
| `fetch-wire-articles` | Article fetching |
| `repair-accounts` | Account repair utility |

---

## 7. Typography

| Font | Usage | Tailwind Class |
|------|-------|---------------|
| **Geist** | Body text, cards, buttons, UI | `font-geist` |
| **Archivo Narrow** | Page titles, section headers | `font-pharma` |
| **Geist Mono** | Technical/code display | `font-geist-mono` |
| **Cinzel** | Decorative accent (limited) | — |

---

## 8. Navigation UX Rules

### Header 3-Zone Grid
```
[ Logo (fixed) ] [ Navigation (flexible, collapses first) ] [ Actions (fixed) ]
```

### Breakpoints
- **Desktop (≥1280px):** Full horizontal nav, dropdown menus
- **Mobile (<1280px):** Hamburger → full-screen overlay (z-9999, opaque backdrop, focus trap, scroll lock)

### Z-Index Hierarchy
| Layer | Z-Index |
|-------|---------|
| Mobile overlay | 9999 |
| Dropdown menus | 200 |
| Progress bar | 100 |
| Header | 50 |

---

## 9. Medical Questionnaire Reference

Client creation requires a `medicalRecord` object with 22 fields. Key mappings:

- `medicalConditions`: Multi-select array (adhd, anxiety, chronic_and_long_term_pain, etc.)
- `medicalHistory0-4`: Boolean flags (cardiac, cancer, immunity, liver, psychiatry)
- `medicalHistory5`: Array — diagnosed conditions
- `medicalHistory8-10`: Boolean — drug/alcohol history
- `medicalHistory12`: Boolean — cannabis to reduce meds
- `medicalHistory13`: String — cannabis frequency (everyday, every_other_day, 1_2_times_per_week, never)
- `medicalHistory14`: Array — cannabis methods (smoking_joints, vaporizing, ingestion, topical, never)

**Rule:** Optional fields must be omitted entirely from payload (not sent as null or empty string).

---

## 10. Security Patterns

- Never expose API keys in frontend code or logs
- Truncate keys in logs to first 8 characters
- All user tables have RLS enabled
- `user_roles` table is separate from `profiles` (prevents privilege escalation)
- Admin status checked via `has_role()` SECURITY DEFINER function
- Never check admin status via client-side storage

---

## 11. Third-Party Integrations

| Service | Purpose | Credential |
|---------|---------|-----------|
| Dr. Green DApp API | Commerce/fulfilment | Edge function secrets |
| Resend | Transactional email | `RESEND_API_KEY` |
| WalletConnect | Wallet connection relay | Hardcoded project ID |
| Ethereum Mainnet | NFT ownership verification | Public RPC |
| Lovable AI | Image generation, strain knowledge | Auto-managed |
