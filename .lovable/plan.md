

## Fix sync-orders: Populate Missing Fields from Local Client Records

### Problem
The Dr. Green API bulk orders endpoint often returns orders without `client.email` or with minimal client data. The sync function doesn't cross-reference local `drgreen_clients` records, leaving `customer_email`, `customer_name`, and `user_id` null on synced orders.

### Fix (1 file)

**`supabase/functions/sync-orders/index.ts`**

After fetching all orders from Dr. Green API, before the upsert loop:

1. **Build a set of unique `client_id` values** from all fetched orders
2. **Query `drgreen_clients` table** for those IDs to get `email`, `full_name`, `user_id`, `country_code`, and `shipping_address`
3. **Build a lookup map** keyed by `drgreen_client_id`
4. **In the upsert loop**, fall back to local client data when the API response is missing fields:
   - `customer_email` → `order.client?.email || localClient.email`
   - `customer_name` → built from API or `localClient.full_name`
   - `user_id` → `localClient.user_id` (links order to auth user)
   - `country_code` → fall back to `localClient.country_code`
   - `shipping_address` → fall back to `localClient.shipping_address`
5. **Wrap each order upsert in try/catch** (already done) and add safer null coalescing for all numeric parsing to prevent `NaN` crashes

### Technical Detail

```text
Dr. Green API orders
        │
        ▼
  Collect unique clientIds
        │
        ▼
  SELECT from drgreen_clients
  WHERE drgreen_client_id IN (...)
        │
        ▼
  Build clientLookup map
        │
        ▼
  For each order:
    merge API fields + local client fallbacks
    → upsert to drgreen_orders
```

The single DB query adds negligible overhead and ensures all available local data enriches the synced orders.

