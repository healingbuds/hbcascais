

## Fix Medical Verification Flash and Speed Up Loading

### Problem
1. **Flash of medical verification UI on login** — When an admin (or any user) logs in, `ShopContext.isLoading` stays `true` while it calls the Dr. Green API through an edge function. During this window, components like `EligibilityGate`, `ComplianceGuard`, and `VerificationProgress` briefly render their "pending" states before the role/client data resolves.
2. **Slow sync** — `fetchClient` in ShopContext blocks on a round-trip to the Dr. Green API via `drgreen-proxy` edge function on every auth event. Shop.tsx also fires an immediate `syncVerificationFromDrGreen()` on mount, doubling the delay.

### Changes

**1. ShopContext — Show cached data immediately, sync API in background** (`src/context/ShopContext.tsx`)
- Split `fetchClient` into two phases:
  - **Phase 1 (instant)**: Read the local `drgreen_clients` row from the database. Set `drGreenClient` and `isLoading = false` immediately with this cached data.
  - **Phase 2 (background)**: Fire the Dr. Green API call to get live status. When it returns, silently update `drGreenClient` state and the local cache. No loading spinner during this phase.
- This eliminates the long pause — users see their cached status instantly.

**2. Auth.tsx — Don't wait for client data if user is admin** (`src/pages/Auth.tsx`)
- In the redirect `useEffect`, check `isAdmin` first. If admin and `!roleLoading`, redirect to `/admin` immediately — don't wait for `clientLoading` to finish. Admins don't need client data.

**3. Shop.tsx — Remove redundant immediate sync** (`src/pages/Shop.tsx`)
- Remove the `syncVerificationFromDrGreen()` call on mount (line 36). ShopContext already fetches live data in Phase 2. Keep only the 3-minute polling interval for non-eligible users.

**4. EligibilityGate — Skip flash for loading states** (`src/components/shop/EligibilityGate.tsx`)
- Already handles `isLoading` with a spinner, but the spinner itself is the flash. Since ShopContext will now resolve `isLoading` instantly from cache, the spinner will be near-zero duration.

### Technical detail

The key architectural change is in `fetchClient`:

```text
Current flow:
  auth event → query local DB → call edge function → call Dr Green API → set state → isLoading=false
  (total: 2-5 seconds)

New flow:
  auth event → query local DB → set state → isLoading=false  (< 200ms)
                              ↘ call edge function in background → update state silently
```

No database migrations needed. No edge function changes.

