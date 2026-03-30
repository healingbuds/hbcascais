

## Fix KYC Journey Logs: Add Server-Side Logging + Show Customer Names

Two issues to address: (1) the proxy doesn't log events so the journey is incomplete, and (2) the viewer doesn't show who each log belongs to.

### Part 1: Show Customer Name in KYC Journey Viewer

**File: `src/components/admin/KYCJourneyViewer.tsx`**

- After fetching journey logs, cross-reference `user_id` values against the `profiles` table (or `drgreen_clients` table which has `full_name` and `email`) to resolve names
- Join approach: fetch `drgreen_clients` records for all unique `user_id` values in the log set, build a lookup map `user_id → full_name / email`
- Display the customer name prominently in each log row (above or beside the `client_id`)
- Also make the search filter work against customer names
- Add name to the `JourneyLog` interface display (resolved client-side from the lookup)

### Part 2: Add Journey Logging to `drgreen-proxy`

**File: `supabase/functions/drgreen-proxy/index.ts`**

Add a `logKycJourney` helper (non-blocking, fire-and-forget) that inserts into `kyc_journey_logs` using the existing `supabaseClient` (service role). Log at these points:

| Location | Event Type | Data |
|----------|-----------|------|
| `create-client-legacy` success (~line 2221) | `kyc.client_created` | clientId, hasKycLink |
| `create-client-legacy` KYC link present (~line 2233) | `kyc.link_generated` | clientId |
| `create-client-legacy` API error (~line 2202) | `registration.api_error` | status, error snippet |
| `dapp-verify-client` approve/reject | `client.approved` / `client.rejected` | clientId |
| `sync-client-status` / `sync-client-by-email` | `kyc.synced` | clientId, kycStatus |

The helper needs `supabaseClient`, `userId`, `clientId`, `eventType`, and `eventData`. Source will be `'drgreen-proxy'`.

### Part 3: Add RLS Policy for Service Role Inserts

**Database migration**: Add an INSERT policy on `kyc_journey_logs` for service role (or adjust existing). The current INSERT policy requires `auth.uid() = user_id`, but the proxy uses service role which bypasses RLS — so no migration needed.

### Files Changed
1. `src/components/admin/KYCJourneyViewer.tsx` — resolve and display customer names from `drgreen_clients`
2. `supabase/functions/drgreen-proxy/index.ts` — add `logKycJourney` helper + ~5 logging calls

