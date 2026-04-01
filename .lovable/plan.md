

# Backfill Corrupted Order Items from Dr. Green API

## Problem
Existing orders in `drgreen_orders` have items with `unit_price: 0` and missing `strain_name` because the bulk sync endpoint (`/dapp/orders`) doesn't return line-item details. The detail endpoint (`/dapp/orders/{id}`) does.

## Approach
Create a new edge function `backfill-order-items` that:

1. Queries all `drgreen_orders` where items have zero prices or missing strain names
2. For each, calls the Dr. Green API detail endpoint (`/dapp/orders/{id}`) to get full order line data (strain names, unit prices, quantities)
3. Updates the `items` JSONB column with the enriched data
4. Also update the `sync-orders` function to fetch individual order details for item enrichment during regular syncs

## Technical Details

### New Edge Function: `supabase/functions/backfill-order-items/index.ts`
- Reuse the same signature/auth pattern from `sync-orders`
- Query `drgreen_orders` for rows where items contain zero `unit_price` or empty `strain_name`
- For each order, call `GET /dapp/orders/{orderId}` (same as `dapp-order-details` in proxy) to get `orderLines` with strain details
- Map `orderLines` to `{ strain_id, strain_name, quantity, unit_price }` format
- Upsert enriched items back to `drgreen_orders`
- Add rate limiting (small delay between API calls) to avoid hitting API limits
- Return summary of how many orders were backfilled

### Update: `supabase/functions/sync-orders/index.ts`
- After the bulk fetch loop, identify orders where `orderLines` data is missing (the list endpoint doesn't include it)
- For each such order, fetch individual details via `/dapp/orders/{id}` to get line items with strain names and prices
- Build proper items array: `{ strain_id, strain_name, quantity, unit_price }` from `orderLines`
- This prevents future orders from being saved with corrupted item data

### Steps
1. Create `backfill-order-items` edge function — one-time repair of existing corrupted orders
2. Update `sync-orders` to fetch order details for line-item enrichment during regular syncs
3. Invoke the backfill function to fix existing data

