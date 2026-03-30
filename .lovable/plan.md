

## Add Sales Pipeline Table to Revenue Dashboard

### Overview
Add a searchable, paginated sales pipeline table below the existing charts on the AdminRevenue page. This reuses the `getSales` endpoint already available via `useDrGreenApi()`.

### Single file changed
**`src/pages/AdminRevenue.tsx`**

### What gets added

1. **New state** for the sales table:
   - `salesRecords` array, `salesPage` (current page), `salesPageMeta` (pagination info from `PageMetaDto`), `salesSearch` (search string), `salesStage` filter (LEADS/ONGOING/CLOSED/all), `salesLoading` boolean

2. **`fetchSales` function** — calls `api.getSales({ page, take: 10, orderBy: 'desc', search, stage })` and updates state

3. **Sales Pipeline Table section** (below the Orders Chart):
   - **Filter bar**: Search input (debounced), stage filter buttons (All / Leads / Ongoing / Closed)
   - **Table** using existing `Table/TableHeader/TableBody/TableRow/TableCell/TableHead` components with columns:
     - Client name (`firstName lastName`)
     - Email
     - Stage (color-coded Badge — blue for LEADS, amber for ONGOING, green for CLOSED)
     - Order ID (truncated, or "—")
     - Created date (formatted)
   - **Pagination controls**: Previous/Next buttons using `pageMetaDto.hasPreviousPage`/`hasNextPage`, page indicator
   - Loading skeleton rows while fetching

4. **Initial load**: `fetchSales()` called alongside existing `fetchAll()` in the `useEffect`

### Patterns reused
- Stage badge colors from `SalesDashboard.tsx` (blue/amber/green)
- Motion animation wrapper matching existing chart cards
- Same Card/CardHeader/CardContent structure
- Table component from `src/components/ui/table.tsx`

