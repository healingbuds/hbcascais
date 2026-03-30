

## Missing Proxy Action Handlers — Fix Plan

### Problem

The frontend (`src/lib/drgreen/clients.ts`, `admin.ts`) calls **9 proxy actions** that are declared in `ADMIN_ACTIONS` / `OWNERSHIP_ACTIONS` lists but have **no `case` handler** in the proxy's switch statement. These calls silently hit `default:` and return `"Unknown action"`.

### Missing Actions

| Action | Frontend Caller | API Endpoint | Purpose |
|--------|----------------|--------------|---------|
| `patch-client` | `clients.ts:patchClient()` | `PATCH /dapp/clients/{id}` | Edit client fields |
| `delete-client` | `clients.ts:deleteClient()` | `DELETE /dapp/clients/{id}` | Remove client |
| `activate-client` | `clients.ts:activateClient()` | `PATCH /dapp/clients/{id}/activate` | Reactivate client |
| `deactivate-client` | `clients.ts:deactivateClient()` | `PATCH /dapp/clients/{id}/deactivate` | Deactivate client |
| `bulk-delete-clients` | `clients.ts:bulkDeleteClients()` | Multiple `DELETE` calls | Batch delete |
| `admin-list-all-clients` | (admin debug) | `GET /dapp/clients` | Full client dump |
| `admin-update-shipping-address` | `clients.ts:adminUpdateShippingAddress()` | `PATCH /dapp/clients/{id}` | Admin sets address |
| `admin-reregister-client` | `clients.ts:reregisterClient()` | `POST /dapp/clients` | Re-create client |
| `get-clients-summary` | `clients.ts:getClientsSummary()` | `GET /dapp/clients/summary` | PENDING/VERIFIED counts |
| `update-shipping-address` | `clients.ts:updateShippingAddress()` | `PATCH /dapp/clients/{id}` | User updates own address |

### Fix (1 file)

**`supabase/functions/drgreen-proxy/index.ts`** — Add 10 case handlers before the `default:` case:

1. **`patch-client`**: `PATCH /dapp/clients/{clientId}` with `body.data`
2. **`delete-client`**: `DELETE /dapp/clients/{clientId}`
3. **`activate-client`**: `PATCH /dapp/clients/{clientId}/activate` with empty body
4. **`deactivate-client`**: `PATCH /dapp/clients/{clientId}/deactivate` with empty body
5. **`bulk-delete-clients`**: Loop over `body.clientIds`, call `DELETE /dapp/clients/{id}` for each, return success/fail counts
6. **`admin-list-all-clients`**: `GET /dapp/clients` with `take: 200, page: 1, orderBy: desc` (paginated fetch-all)
7. **`admin-update-shipping-address`**: `PATCH /dapp/clients/{clientId}` with `{ shipping: body.shipping }`
8. **`admin-reregister-client`**: `POST /dapp/clients` with re-registration payload built from body fields
9. **`get-clients-summary`**: `GET /dapp/clients/summary` (or `/dapp/dashboard/summary` if no dedicated endpoint)
10. **`update-shipping-address`**: `PATCH /dapp/clients/{clientId}` with `{ shipping: body.shipping }` (same as admin version but ownership-verified)

### Implementation Notes

- Each handler validates inputs (clientId format, etc.) before calling the API
- All use `adminEnvConfig` for admin actions, `envConfig` for user actions
- `bulk-delete-clients` wraps individual deletes in try/catch and returns `{ deleted, failed }`
- `admin-reregister-client` reuses the same payload structure as `create-client-legacy`
- `get-clients-summary` tries `/dapp/clients/summary` first; if 404, falls back to fetching all clients and counting by `adminApproval` status

