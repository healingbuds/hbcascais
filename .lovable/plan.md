

# Use Dapp Strain Detail Endpoint for Local Pricing

## Problem

The app currently fetches strains via the `/strains` list endpoint (`get-strains-legacy`), which only returns a base `retailPrice` (USD). It then converts USD → local currency using exchange rates. However, the Dr. Green API has a dedicated single-strain endpoint `GET /dapp/strains/{strainId}` that returns `strainLocations` with a `retailPrice` and `location.currency` — native local pricing set by Dr. Green per region.

The StrainDetail page doesn't even call a detail endpoint — it just filters the list results by ID.

## Plan

### Step 1: Add `dapp-strain-detail` action to proxy
In `supabase/functions/drgreen-proxy/index.ts`, add a new case alongside the existing `dapp-strains` action:
- Action name: `dapp-strain-detail`
- Hits `GET /dapp/strains/{strainId}` using query string signing
- Add to `COUNTRY_GATED_ACTIONS` so unauthenticated ZA/TH users can access it
- Validate `strainId` input

### Step 2: Add `getStrainDetail` to `src/lib/drgreen/strains.ts`
New function that calls `callProxy('dapp-strain-detail', { strainId })` and returns the full strain object including `strainLocations`.

### Step 3: Update `useProducts.ts` — extract local pricing from list response
The list endpoint may already include `strainLocations` in its response (just not being used). Update the product transform to check for `strainLocations[].retailPrice` + `strainLocations[].location.currency` and store them on the `Product` interface:
- Add `localRetailPrice?: number` and `localCurrency?: string` fields to `Product`
- In the transform, find the matching location for the user's country and prefer its `retailPrice` + `currency`

### Step 4: Update `ShopContext.tsx` — use local price when available
When `product.localRetailPrice` and `product.localCurrency` are set, skip the USD→local conversion (`convertFromEUR`) and use the native price directly. The cart's `unit_price` should store the API's USD `retailPrice` for order submission, but display should use local pricing.

### Step 5: Update `StrainDetail.tsx` — show native local price
When rendering price, check if `product.localRetailPrice` exists. If so, format using `product.localCurrency` directly instead of converting. The `PriceBreakdownTooltip` should reflect this too — showing "Price set by supplier" instead of an exchange-rate breakdown when local pricing is available.

### Step 6: Update invoice (`InvoicePrintView.tsx`)
If an order's items carry local pricing data, use those values directly in the invoice instead of converting.

## Technical Details

- The proxy will add `dapp-strain-detail` to the existing `COUNTRY_GATED_ACTIONS` array for consistent auth behavior
- The `Product` interface gains two optional fields; no breaking changes
- Cart submission continues sending USD `retailPrice` to the Dr. Green API (their expected format)
- Display-only change: local prices shown when the API provides them, fallback to USD→conversion when not

