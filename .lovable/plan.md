

## Add Column Sorting to Sales Pipeline Table

### Overview
Add client-side sorting to the Client, Stage, and Date columns with clickable headers and sort direction indicators.

### Changes — `src/components/admin/SalesPipelineTable.tsx`

1. **New state**: `sortField` (`"client" | "stage" | "date" | null`) and `sortDir` (`"asc" | "desc"`)

2. **Sort logic**: After records are loaded, derive a `sortedRecords` array via `useMemo` that sorts locally:
   - **Client**: compare `firstName + lastName` alphabetically
   - **Stage**: compare stage strings alphabetically
   - **Date**: compare `createdAt` timestamps

3. **Toggle function**: `handleSort(field)` — if same field clicked, flip direction; if new field, set to `"asc"`

4. **Sortable headers**: Replace plain text in Client, Stage, and Date `TableHead` cells with clickable buttons showing an `ArrowUpDown` / `ArrowUp` / `ArrowDown` icon from lucide-react based on active sort state. Add `cursor-pointer select-none` styling.

5. **Render**: Use `sortedRecords` instead of `records` in the table body map.

### Technical notes
- Client-side sorting on the current page's 10 records (API doesn't support multi-column sort)
- Sort resets to default when new data is fetched (page change, search, stage filter)
- No new dependencies needed — lucide-react already available

