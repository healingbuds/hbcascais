

## Analysis: Checkout Flow vs API Lifecycle

The user's documented lifecycle is:

```text
1. POST /dapp/clients           → create client
2. GET  /dapp/clients/list      → confirm Active + KYC Verified
3. GET  /dapp/strains            → fetch products
4. Cart endpoints               → add items
5. POST /dapp/orders            → create order from cart
6. GET  /dapp/orders/:orderId   → confirm order details
7. Admin reviews                → PENDING → VERIFIED | REJECTED
```

### Current State

| Step | Status | Implementation |
|------|--------|---------------|
| 1 | ✅ Implemented | `ShopRegister` → proxy `create-client` |
| 2 | ⚠️ Partial | `EligibilityGate` checks **local DB** (`is_kyc_verified` + `admin_approval`), but does NOT re-validate against the API at checkout time. Stale local data could let an inactive client attempt an order. |
| 3 | ✅ Implemented | `useProducts` → proxy `get-strains` |
| 4 | ✅ Implemented | Local `drgreen_cart` table; synced to API cart during `create-order` (Step 2 inside proxy) |
| 5 | ✅ Implemented | Atomic 3-step flow in proxy: PATCH shipping → POST cart → POST order |
| 6 | ❌ Missing | After order creation, checkout **never calls** `GET /dapp/orders/:orderId` to confirm the order was actually created with correct details. It trusts the POST response blindly. |
| 7 | N/A | Admin-side, handled externally |

### What Needs Fixing

**A. Add post-order confirmation (Step 6)**
In `Checkout.tsx`, after the order is created successfully, call `getOrder(createdOrderId)` to fetch the confirmed order from the API. Use the returned `totalAmount` and `status` as the source of truth for:
- The local `saveOrder()` call (use API-confirmed values instead of client-computed `cartTotal`)
- The success confirmation UI

**B. Add pre-checkout client validation (Step 2 hardening)**
In `Checkout.tsx → handlePlaceOrder()`, before starting the order flow, make a lightweight API call to verify the client is still Active and KYC Verified. This catches cases where:
- Admin rejected the client after the page loaded
- KYC expired or was revoked
- Local DB is stale

### Files to Change

**1. `src/pages/Checkout.tsx`**
- In `handlePlaceOrder()`, add a pre-flight check: call `getClientDetails(clientId)` and verify `adminApproval === 'VERIFIED'` and `isKYCVerified === true`. If not, show an error and abort.
- After successful order creation, call `getOrder(createdOrderId)` to fetch confirmed order details. Use the API-returned `totalAmount` and `status` for the `saveOrder()` call instead of the client-side `cartTotal`.

**2. No proxy changes needed** — `get-order` and `get-my-details` handlers already exist.

### Technical Detail

```text
handlePlaceOrder():
  ┌─────────────────────────────────────────┐
  │ PRE-FLIGHT: getClientDetails(clientId)  │
  │  → Verify adminApproval === 'VERIFIED'  │
  │  → Verify isKYCVerified === true        │
  │  → Abort with clear message if not      │
  └───────────────┬───────────────────────--─┘
                  ↓
  ┌─────────────────────────────────────────┐
  │ CREATE ORDER (existing atomic flow)     │
  └───────────────┬─────────────────────────┘
                  ↓
  ┌─────────────────────────────────────────┐
  │ CONFIRM: getOrder(orderId)              │  ← NEW
  │  → Use API totalAmount for saveOrder()  │
  │  → Log any discrepancy vs cartTotal     │
  └───────────────┬─────────────────────────┘
                  ↓
  ┌─────────────────────────────────────────┐
  │ saveOrder() + clearCart() + email        │
  └─────────────────────────────────────────┘
```

