

# Fix Order Details, Checkout Speed, Sign-in Glitch, Admin Client Filtering & Email Review

## Problems Identified

1. **Order details page** — already improved in last pass; user wants all relevant data visible (strains, delivery, order info). Current implementation looks solid but can be tightened.

2. **`create-payment` error** — The proxy still has a `create-payment` action (line 3356) that calls `/dapp/payments`. This endpoint doesn't exist or returns errors because Dr. Green handles payments manually. The `Checkout.tsx` no longer calls it (fixed previously), but the dead code remains in both `orders.ts` and the proxy. Should be cleaned up.

3. **Order page takes too long after checkout** — After order submission, the success screen shows immediately (no payment polling anymore). If users still see delays, it's likely the `retryOperation` wrapper retrying on transient errors during `createOrder`. The retry delays (1s, 2s, 4s) add up. We should reduce max retries from 3 to 2 for the order creation step.

4. **Sign-in loading glitch** — On login, Auth.tsx waits for both `roleLoading` and `clientLoading` from ShopContext before redirecting (line 100). ShopContext's `isLoading` stays true while it fetches client data + does background Dr. Green API calls. The user sees a blank/glitchy state. Fix: redirect admin users immediately (already done at line 94), but for regular users add a brief loading indicator on the Auth page while waiting for client resolution.

5. **Admin sees customer signup details (admin is not a customer)** — The `AdminClientManager` fetches ALL clients from Dr. Green's DApp API (`getDappClients`). This is correct — admins should see customer records. However, the admin's own account (`healingbudsglobal@gmail.com`) may appear in the client list if it was registered as a Dr. Green client. We should filter out admin emails from the displayed client list.

6. **Email hooks review** — All email edge functions (`send-order-confirmation`, `send-onboarding-email`, `send-client-email`, `send-dispatch-email`, `send-password-reset`) are confirmed working. The `send-order-confirmation` log shows successful sends. No code changes needed for emails.

## Plan

### Step 1: Clean up dead payment code
**Files:** `src/lib/drgreen/orders.ts`, `supabase/functions/drgreen-proxy/index.ts`
- Remove `createPayment`, `getPayment` exports from `orders.ts`
- Remove `create-payment` and `get-payment` cases from the proxy switch statement
- This eliminates confusion and prevents accidental future usage

### Step 2: Reduce checkout retry delay
**File:** `src/pages/Checkout.tsx`
- Change `retryOperation` `maxRetries` from 3 to 2 for the `createOrder` call (line 275)
- This reduces worst-case delay from ~7s to ~3s

### Step 3: Fix sign-in loading glitch
**File:** `src/pages/Auth.tsx`
- Add a loading spinner/state on the Auth page while `roleLoading || clientLoading` is true and user is authenticated
- Show "Signing you in..." overlay so the user doesn't see a flash of the login form
- This covers the gap between auth completing and redirect firing

### Step 4: Filter admin accounts from client list
**File:** `src/components/admin/AdminClientManager.tsx`
- After fetching clients from the API, filter out any client whose email matches known admin emails
- Query `user_roles` table to get admin user emails, or hardcode filter for `healingbudsglobal@gmail.com` (matching the `auto_assign_admin_role` trigger)
- Better approach: fetch admin emails from `user_roles` joined with local data, then exclude them from the displayed list

### Step 5: Deploy updated proxy
- Deploy `drgreen-proxy` after removing dead payment actions

## Technical Details

- The `create-payment` proxy action uses `drGreenRequest` (not `drGreenRequestBody`), which may explain the non-2xx error — but it's moot since payments are handled by Dr. Green manually
- Auth.tsx redirect logic is sound but the visual gap between `session` being set and `roleLoading`/`clientLoading` resolving causes a flash of the login form
- The `AdminClientManager` pulls from the Dr. Green DApp API which returns ALL registered clients including any admin test accounts

