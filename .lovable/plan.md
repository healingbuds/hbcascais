
Goal: reduce real app-generated console noise, stop wallet errors in preview, and ignore platform/extension noise that is not caused by this app.

1. Separate “real app issues” from preview noise
- Treat these as real and worth fixing:
  - Wallet/Reown allowlist + 403 errors from `src/providers/WalletProvider.tsx`
  - Missing `/manifest.json`
  - Radix dialog accessibility warning: missing `DialogDescription` / `aria-describedby`
- Treat these as external/preview noise unless still reproducible after cleanup:
  - `rs.lovable.dev` timeouts, TikTok/GA/Bing/LinkedIn analytics failures
  - `api.lovable.dev`, Firestore, WebSocket, `postMessage` origin mismatch
  - SES / Exodus provider / browser extension warnings
  - image proxy timeout/reset errors in the preview shell

2. Fix wallet initialization strategy
Files: `src/App.tsx`, `src/providers/WalletProvider.tsx`, `src/context/WalletContext.tsx`
- Add a small preview-host detector for `lovable.app`, `lovable.dev`, and `lovableproject.com`.
- Stop initializing WalletConnect/Reown globally for every page load in preview.
- Preferred approach:
  - Move wallet providers off the app root and only mount them around admin / NFT-gated areas that actually use wallet state.
- Safe fallback if route-scoping is too invasive:
  - Keep the provider boundary, but return a preview-safe/no-op wallet setup so the preview does not attempt Reown initialization.
- Result:
  - No `Origin not found on Allowlist` / `pulse.walletconnect.org 403` spam on normal preview pages.
  - Wallet still works where it is intentionally needed.

3. Add a real web manifest
Files: `index.html`, `public/manifest.json`
- Add `<link rel="manifest" href="/manifest.json">` in `index.html`.
- Create `public/manifest.json` using existing favicon/icon assets from `public/`.
- Result:
  - `/manifest.json` 404 disappears.

4. Fix Radix dialog accessibility warnings
Files likely needing updates:
- `src/pages/AdminPrescriptions.tsx`
- `src/components/dashboard/PrescriptionManager.tsx`
- `src/components/dashboard/DosageTracker.tsx`
- `src/pages/PatientDashboard.tsx`
- audit other `DialogContent` usages the same way
- For each dialog:
  - add a `DialogDescription`, or
  - explicitly set `aria-describedby={undefined}` when no description is intended
- Result:
  - remove `Missing Description or aria-describedby={undefined} for {DialogContent}` warnings.

5. Do a light tooltip audit
Files to check first:
- `src/layout/AdminLayout.tsx`
- `src/components/ui/sidebar.tsx`
- `src/components/SectionNavigation.tsx`
- I did not find an obvious app-side controlled/uncontrolled tooltip bug from the current search, so this should be treated as secondary.
- Only change tooltip state handling if the warning is still reproducible after wallet/preview cleanup.

Technical details
- Root cause of the loudest app-side errors: `getDefaultConfig(...)` runs at module load in `src/providers/WalletProvider.tsx`, and `WalletProvider` wraps the entire app in `src/App.tsx`, so wallet tooling initializes even on pages that do not need it.
- `public/` currently has favicons but no manifest file.
- Several dialogs have a title/header only, which matches the Radix accessibility warning pattern.

Verification checklist
- Open a normal public page in preview: no WalletConnect/Reown allowlist errors.
- Request `/manifest.json`: returns 200 instead of 404.
- Open the affected dialogs: no missing description warning.
- Confirm admin wallet flow still works where intended.
- Re-check console after that; any remaining Lovable/analytics/WebSocket noise can be safely deprioritized unless it maps to user-facing breakage.
