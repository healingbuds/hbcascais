

# Fix Order Items Displaying R 0,00 and Missing Strain Names

## Problem
The order detail page shows "Qty: 2 × R 0,00" with no product name, even though the total (R 330,00) is correct. The root cause is the background order sync overwriting locally-saved item data with incomplete API data.

## Root Cause

When an order is placed at checkout, items are saved correctly with `unit_price` and `strain_name`. However, the 60-second background sync (`syncFromDrGreen` in `useOrderTracking.ts`) fetches orders from the Dr. Green API, which returns items **without price or name data** in the list endpoint. The sync then overwrites the good local items with normalized items where `unit_price` defaults to `0` and `strain_name` defaults to `"Unknown"` or empty.

**The overwrite path** (lines 181-196 of `useOrderTracking.ts`):
```
hasNewItems = normalizedItems.length > 0  // true, even if data is incomplete
→ overwrites local items that had correct prices/names
```

## Fix

### File: `src/hooks/useOrderTracking.ts`

**Change the item comparison logic** to treat API items as "complete" only when they contain meaningful price data. If the API items have all-zero prices but the local items have real prices, preserve the local items.

Specifically in the sync update block (~line 181):
- Add a check: if ALL normalized items have `unit_price === 0` AND local items have non-zero prices, skip the item overwrite
- Similarly, if normalized items have no `strain_name` (or all "Unknown"), preserve local strain names
- This ensures the sync updates status/payment fields without destroying checkout-captured item details

### File: `src/pages/OrderDetail.tsx`

**Fallback for missing item data** (~line 263):
- If `strain_name` is empty, show "Product" as fallback
- If `unit_price` is 0 but total_amount > 0, show a note like "See total" instead of R 0,00
- Calculate per-item price from total when individual prices are missing (total / sum of quantities)

## Steps

1. **Protect items during sync** — In `useOrderTracking.ts`, add guard logic so API items with no price data don't overwrite locally-saved items that have correct prices
2. **Improve OrderDetail display** — Add fallback rendering for missing strain names and zero unit prices, including deriving unit price from total when possible

