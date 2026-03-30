

## Revenue & Sales Dashboard Page

### Overview
Create a new dedicated admin page at `/admin/revenue` that combines data from the Dr Green API's `dashboard-summary` and `sales-summary` endpoints with the existing `dashboard-analytics` time-series data and `get-sales-summary` pipeline data, rendering KPI cards, charts, and a sales pipeline breakdown.

### Data Sources (already wired in `src/lib/drgreen/admin.ts`)
- `getDashboardSummary()` — totalClients, totalOrders, totalSales, pendingOrders
- `getSalesSummary()` — totalSales, monthlySales, weeklySales, dailySales
- `getDashboardAnalytics()` — salesData time-series (date + amount), ordersData time-series (date + count)
- `getSalesSummaryNew()` — pipeline counts (LEADS, ONGOING, CLOSED)

### Files to Create/Edit

**1. `src/pages/AdminRevenue.tsx`** (new)
- Admin page wrapped in `AdminLayout`
- Fetches all 4 endpoints in parallel on mount
- **KPI Row** (4 cards): Total Revenue, Monthly Sales, Weekly Sales, Daily Sales — using `getSalesSummary()` data, formatted with `formatPrice`
- **Secondary KPI Row** (4 cards): Total Clients, Total Orders, Pending Orders, Verified Clients — from `getDashboardSummary()`
- **Sales Trend Chart**: Line/area chart using Recharts (`ChartContainer` from `src/components/ui/chart.tsx`) plotting `salesData` from `getDashboardAnalytics()`
- **Orders Trend Chart**: Bar chart plotting `ordersData` from `getDashboardAnalytics()`
- **Pipeline Breakdown**: Donut/pie chart showing LEADS vs ONGOING vs CLOSED from `getSalesSummaryNew()`
- Refresh button, loading skeletons, error states — matching existing admin patterns

**2. `src/App.tsx`** (edit)
- Add lazy import for `AdminRevenue`
- Add route: `/admin/revenue` protected with `ProtectedRoute requiredRole="admin"`

**3. `src/layout/AdminLayout.tsx`** (edit — add nav link)
- Add "Revenue" link to admin sidebar navigation pointing to `/admin/revenue`

### Technical Details
- Uses existing `useDrGreenApi()` hook — no new API functions needed
- Charts use the project's existing Recharts + `ChartContainer`/`ChartTooltip` components
- Currency formatting via `formatPrice()` from `src/lib/currency.ts`
- Follows existing admin page patterns (motion animations, Card components, Skeleton loading)
- Date range filter for analytics endpoint (optional controls for startDate/endDate)

