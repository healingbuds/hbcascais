

## Fix: Admin Orders Page Infinite Re-render Loop ("Flashing")

### Problem
The admin orders page enters an infinite re-render loop causing "Maximum update depth exceeded" errors and the visual "flashing" behavior. The order rows never finish loading because the component keeps resetting.

### Root Cause
In `src/pages/AdminOrders.tsx`:
1. `useEffect` at line 76 syncs `initialOrders` → local `orders` state
2. `useEffect` at line 97 calls `handleFilterChange()` whenever `activeTab` or `handleFilterChange` changes
3. `handleFilterChange` (via `useCallback`) depends on `fetchOrders` from the hook
4. `fetchOrders` is defined inline in the hook's return object (line 631 of `useAdminOrderSync.ts`), creating a **new function reference every render**
5. This causes `handleFilterChange` to be recreated → triggers the `useEffect` → calls `fetchOrders` → data updates → `initialOrders` changes → `setOrders` triggers re-render → loop

### Secondary Issue
The `ShopContext` is calling `get-client` with a `demo-` prefixed client ID for the admin user, which returns 400 from the Dr. Green API. This generates repeated console errors but doesn't cause the flashing.

### Fix Plan

**File 1: `src/hooks/useAdminOrderSync.ts`**
- Wrap the `fetchOrders` function in `useCallback` so it has a stable reference, or move it out of the return object into a memoized ref

**File 2: `src/pages/AdminOrders.tsx`**
- Remove the redundant `orders` local state and the `useEffect` that syncs `initialOrders` into it — just use `initialOrders` directly (or a filtered version)
- Remove the `handleFilterChange` effect that depends on `fetchOrders` and instead use React Query's built-in filter params (pass `activeTab`/`searchQuery` as query keys to `useAdminOrderSync`)
- Alternatively, stabilize the dependency chain by debouncing the search and removing `fetchOrders` from the `useCallback` deps

**Recommended approach (minimal risk):**
1. In `useAdminOrderSync.ts`, wrap `fetchOrders` in `useCallback`:
```typescript
const stableFetchOrders = useCallback(async (filters: OrderFilters) => {
  return await fetchAllOrders(filters);
}, [/* fetchAllOrders if stable, or empty */]);
```
2. In `AdminOrders.tsx`, remove the `useEffect` that copies `initialOrders` to local state. Instead, use the hook's orders directly and only use local state for filtered results from `fetchOrders`.
3. Guard the filter effect with a check to prevent cascading updates.

**File 3: `src/context/ShopContext.tsx` (minor)**
- Add a guard to skip the live API call when the `drgreen_client_id` starts with `demo-` (same as the existing `local-` guard at line 306), preventing the repeated 400 errors for admin users.

### Expected Outcome
- No more infinite re-render loop or "Maximum update depth exceeded" errors
- Order rows load and display correctly
- No more 400 errors from `get-client` with demo IDs
- KPI cards already work (10 Total, 8 Synced, 2 Failed visible in test)

