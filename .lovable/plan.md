

## Plan: Fetch Full Shipping Addresses via Admin Detail Endpoint

### Problem
The `sync-clients` edge function calls `/dapp/clients` (list endpoint), which returns a `shippings[]` array with only `country` — no street, city, or postal code. The individual client endpoint `/dapp/clients/{id}` (admin-level) returns full address data, but `sync-clients` never calls it.

### Solution
Enhance `sync-clients/index.ts` to make a second pass: after fetching all clients from the list endpoint, iterate and call `/dapp/clients/{clientId}` for each client to retrieve full shipping details, then merge that into the upsert.

### Changes — Single file: `supabase/functions/sync-clients/index.ts`

**Step 1: Add a `drGreenGetWithBody` function** for the detail endpoint, which signs a JSON body (matching how `dapp-client-details` works in the proxy — `drGreenRequestBody` pattern):
- `GET /dapp/clients/{id}` with `{ clientId }` as the sign body

**Step 2: In the client loop, fetch individual details**
- For each client, call `GET /dapp/clients/{client.id}` using admin credentials
- Extract `shippings[0]` from the detail response (which contains full address fields: `address1`, `city`, `postalCode`, etc.)
- Fall back to the list-level shipping data if the detail call fails
- Add a small delay between calls to avoid rate limiting

**Step 3: Merge full address into the upsert**
- Use the detail-level shipping data (with actual street/city/postal) instead of the list-level data
- Keep the existing `resolveCountryCode` logic and `shippingAddress` normalization

### Rate Limiting Consideration
- 13 clients × 1 detail call each = 13 extra API calls
- Add 200ms delay between calls to be respectful of the API
- The page cap (20 pages) keeps this bounded

### No other files change
Checkout already reads `shipping_address` from local DB. Once populated with full address data, it will work without API fallback.

