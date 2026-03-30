

## Update KNOWLEDGE.md with Budstacks/Genesis Template Context

Add three new sections to `.agent/KNOWLEDGE.md` that capture the strategic context, franchise model, and target architecture from the uploaded documentation.

### Changes to `.agent/KNOWLEDGE.md`

**1. Rename and expand Section 1 (Project Identity)** to include a new subsection:

**Add after line 22 (after Branding):**

```markdown
### Budstacks Ecosystem Context
- **Budstacks.io** is the SaaS platform that controls all Dr. Green NFT franchise sales
- **Dr. Green NFT** (ERC-721) is the "Digital Franchise License" — mandatory key for tenants to operate a storefront
- **Healing Buds** is the "Genesis Template" — the flagship master codebase that future white-label tenants will clone
- All storefronts are powered by the Budstacks engine, connecting to Dr. Green fulfillment and licensing backend
- Future NFT holders receive a cloned version of this repository to launch their own branded stores
```

**2. Rewrite Section 2 (Deployment)** — remove all cPanel/GitHub Actions references (workflows are deleted), replace with:

```markdown
## 2. Deployment

### Current State
CI/CD workflows have been removed. Deployment infrastructure is pending redesign.

### Target Architecture
- Framework migration target: **Next.js** (App Router)
- Proxy route: `/api/proxy` (replaces Supabase edge function proxy)
- Compatible hosts: Vercel, AWS Amplify, or GitHub Actions to any Next.js host
- Environment variables managed via `.env.local` (dev) and hosting provider secrets (prod)

### Target Environment Variables
| Variable | Purpose |
|----------|---------|
| `DRGREEN_API_KEY` | Base64 API key (provisioned per tenant via Budstacks) |
| `DRGREEN_PRIVATE_KEY` | secp256k1 private key for request signing |
| `DEFAULT_COUNTRY_CODE` | Alpha-3 country targeting (e.g., ZAF, PRT) |
| `NEXT_PUBLIC_API_BASE_URL` | `/api/proxy` |

### Current Stack (Pre-Migration)
- React + Vite + Tailwind + TypeScript
- Backend: Lovable Cloud (Supabase edge functions)
- Proxy: `drgreen-proxy` edge function
```

**3. Add new Section 12 (Compliance & Error Handling)** after Section 11:

```markdown
## 12. Compliance & Error Handling

### System-Driven Compliance
- All regional compliance (e.g., South African 750g daily limits, address verification) is enforced by the Dr. Green API
- The storefront renders product availability and quantity caps provided by the API — no client-side overrides
- Country codes for product fetching use ISO 3166-1 alpha-3 (ZAF, PRT, GBR)

### API Error State Handling
- **Compliance blocks**: Display the exact error string returned by the API (e.g., weight-limit errors)
- **Address rejection**: Show the system's "Invalid Delivery Location" prompt verbatim
- **Auth failures (401/403)**: Immediate redirect to login or KYC verification flow
```

**4. Update the header metadata** (line 5) to reflect the broader context:

```
> **Stack:** React + Vite + Tailwind + TypeScript + Lovable Cloud (Supabase) → migrating to Next.js
```

**5. Update `mem://deployment/cpanel-automation`** to note workflows removed and deployment pending redesign.

### Summary of sections after update
1. Project Identity (+ Budstacks Ecosystem Context)
2. Deployment (rewritten — target Next.js, current Vite)
3–11. Unchanged
12. Compliance & Error Handling (new)

