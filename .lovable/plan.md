

## Plan: Add 3 Missing Proxy Handlers + Update KNOWLEDGE.md

### Part 1: Add 3 proxy handlers to `supabase/functions/drgreen-proxy/index.ts`

Insert before the `default:` case (line 4328). Also update the action lists at the top.

**1. `get-client-order-detail`** (Admin action)
- Endpoint: `GET /dapp/clients/:clientId/orders/:orderId`
- Validates both `clientId` and `orderId`
- Add to `ADMIN_ACTIONS` array

**2. `update-primary-nft`** (Admin action)
- Endpoint: `PATCH /dapp/users/primary-nft`
- Accepts `{ tokenId }` body
- Add to `ADMIN_ACTIONS` array

**3. `delete-cart-item`** (Ownership action)
- Endpoint: `DELETE /dapp/carts/:cartId?strainId=:strainId`
- Validates `cartId` and `strainId`
- Add to `OWNERSHIP_ACTIONS` array (alongside existing `empty-cart`, `remove-from-cart`)

**Changes summary for the proxy file:**
- Line 98: Add `'get-client-order-detail'`, `'update-primary-nft'` to `ADMIN_ACTIONS`
- Line 104: Add `'delete-cart-item'` to `OWNERSHIP_ACTIONS`
- Before line 4328: Insert 3 new `case` blocks

### Part 2: Update `.agent/KNOWLEDGE.md`

Replace section **3.4 Key Endpoints** with the complete 23-endpoint list organized by folder (Dashboard, Clients, Sales, Products, Orders, NFTs, Profile, Carts).

Add new section **3.8 Order Lifecycle** documenting the 7-step flow:
```text
1. POST /dapp/clients → create client
2. GET /dapp/clients/list → confirm Active + KYC Verified
3. GET /dapp/strains → fetch products for country
4. Cart endpoints → add items
5. POST /dapp/orders → create order from cart
6. GET /dapp/orders/:orderId → confirm order
7. Admin reviews → PENDING → VERIFIED | REJECTED
```

Add new section **3.9 Currency & Pricing** clarifying:
- No currency/locale parameter on any endpoint
- `price` and `totalAmount` are raw numbers (USD-standardized)
- `countryCode` filters product availability, not currency
- UI converts to local currency using exchange rates

Update the date header to `2026-03-30`.

### Files changed
1. `supabase/functions/drgreen-proxy/index.ts` — 3 new case handlers + 2 action list updates
2. `.agent/KNOWLEDGE.md` — Replace §3.4, add §3.8 and §3.9, update date

