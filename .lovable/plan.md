

## Add CSV Export to Revenue Dashboard

### Overview
Add a "Export CSV" button to the dashboard header that downloads all currently loaded dashboard data (KPIs, sales trend, order volume, pipeline summary) as a single CSV file.

### Changes

**`src/pages/AdminRevenue.tsx`**

1. **Import** `Download` icon from lucide-react
2. **Add `handleExportCSV` function** that:
   - Builds CSV sections from current state (`sales`, `dashboard`, `analytics.salesData`, `analytics.ordersData`, `pipeline`)
   - Section 1: "Revenue KPIs" — Total/Monthly/Weekly/Daily sales
   - Section 2: "Operations KPIs" — Clients/Orders/Pending/Verified counts
   - Section 3: "Sales Trend" — date,amount rows from `analytics.salesData`
   - Section 4: "Order Volume" — date,count rows from `analytics.ordersData`
   - Section 5: "Pipeline Summary" — Leads/Ongoing/Closed counts
   - Creates a Blob, triggers download via temporary anchor element
   - Filename includes current date: `revenue-dashboard-YYYY-MM-DD.csv`
3. **Add Export button** next to the existing Refresh button in the header, disabled when `loading` or no data

### Technical Notes
- Pure client-side CSV generation — no new dependencies or API calls
- Uses existing state variables, no additional fetching needed
- Button disabled while loading to prevent exporting empty data

