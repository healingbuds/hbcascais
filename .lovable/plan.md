

## Problem: Shipping Address Not Syncing from Dr Green API to Local DB

### Root Cause

The `sync-clients` edge function fetches clients from the Dr Green API — which includes a `shippings[]` array with full address data — but **never writes it to the `shipping_address` column**. It only extracts `countryCode` from the first shipping entry and discards the rest.

This means:
- The Dr Green API has the address (e.g. Mayke's address)
- The local `drgreen_clients.shipping_address` column is `null`
- Checkout checks local DB first (line 152-163 of `Checkout.tsx`), finds `null`, then falls back to an API call
- If the API call also fails (401 for non-admin keys), the user is prompted to enter their address again

### Fix

**1. `supabase/functions/sync-clients/index.ts`** — Save shipping address during sync

In the upsert block (lines 225-235), add the `shipping_address` field by normalizing `client.shippings[0]` into the standard format:

```typescript
const shipping = client.shippings?.[0] || null;
const shippingAddress = shipping ? {
  address1: shipping.address1 || '',
  address2: shipping.address2 || '',
  city: shipping.city || '',
  state: shipping.state || shipping.city || '',
  country: shipping.country || '',
  countryCode: shipping.countryCode || '',
  postalCode: shipping.postalCode || shipping.zipCode || '',
  landmark: shipping.landmark || '',
} : null;
```

Then include `shipping_address: shippingAddress` in the upsert object. Use a conditional merge so we don't overwrite a locally-saved address with `null` if the API has no shipping data:

```typescript
...(shippingAddress && { shipping_address: shippingAddress }),
```

**2. `supabase/functions/sync-clients/index.ts`** — Fix `countryCode` extraction

Currently: `client.shippings?.[0]?.country` — this gets the country name ("Portugal"), not the code. Should also check `client.shippings?.[0]?.countryCode` and apply alpha-3 → alpha-2 conversion (same map used in `sync-orders`).

### No other files need changes

The checkout flow (`Checkout.tsx`) already correctly reads `shipping_address` from local DB as priority #1 (lines 152-163) and falls back to the API. Once `sync-clients` populates the field, addresses will be available immediately without API calls.

### Summary

One file change: `supabase/functions/sync-clients/index.ts` — add `shipping_address` to the upsert payload and fix `countryCode` extraction.

