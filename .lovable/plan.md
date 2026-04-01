

# API Pricing Analysis & Branded Invoice Generation

## API Findings

The Dr. Green API response for ZAF **does NOT include** `localRetailPrice` or `localCurrency` fields. The response only contains a base `retailPrice` (e.g., `10` USD). The WordPress document's local pricing approach relies on fields that don't exist in this API version.

**Current system is correct**: prices come as USD, and `formatPrice` + `convertPrice` in `src/lib/currency.ts` handle conversion to local currencies (ZAR for SA clients) using exchange rates. No pricing changes needed.

---

## Branded Invoice — Print Feature

The current "Print Invoice" button calls `window.print()`, which dumps the raw page. The user wants a professional, standardised invoice.

### Approach

Create a dedicated `InvoicePrintView` component rendered in a hidden `div` that becomes visible only during print (via `@media print`). This avoids a separate route or PDF generation dependency.

### Step 1: Create `src/components/shop/InvoicePrintView.tsx`
- **Hidden on screen**, visible only via `@media print`
- **Layout**: Standard commercial invoice format
  - **Header**: Healing Buds logo (top-right), company name + address (top-left)
  - **Invoice meta**: Invoice number (or order ID), date, due date
  - **Bill To**: Customer name, email, shipping address
  - **Items table**: Product name, quantity, unit price, line total — with proper borders and alignment
  - **Totals section**: Subtotal, tax line (if applicable), total in local currency
  - **Footer**: Support email, company registration info, "Thank you for your order"
- Uses the existing `Order` interface and `formatPrice` for currency
- Logo imported from `src/assets/hb-logo-teal.png` (or white variant for contrast)

### Step 2: Update `src/pages/OrderDetail.tsx`
- Import `InvoicePrintView` and render it with the order data
- Add print-specific CSS: hide the header, footer, navigation, and main order view during print; show only the invoice
- Keep the existing "Print Invoice" button (`window.print()`)

### Step 3: Add print styles to `src/index.css`
```css
@media print {
  body * { visibility: hidden; }
  .invoice-print, .invoice-print * { visibility: visible; }
  .invoice-print { position: absolute; top: 0; left: 0; width: 100%; }
}
```

### Invoice Layout (reference)
```text
┌─────────────────────────────────────────────┐
│  HEALING BUDS                    [HB LOGO]  │
│  Cascais, Portugal                          │
│  support@healingbuds.co.za                  │
├─────────────────────────────────────────────┤
│  INVOICE                                    │
│  Invoice #: HB-xxxxxxxx                    │
│  Date: 01 Apr 2026                         │
│                                             │
│  Bill To:                                   │
│  Customer Name                              │
│  customer@email.com                         │
│  123 Street, City, Country                  │
├──────────┬──────┬──────────┬───────────────┤
│ Product  │ Qty  │ Price    │ Total         │
├──────────┼──────┼──────────┼───────────────┤
│ Strain A │  2   │ R180.00  │ R360.00       │
│ Strain B │  1   │ R160.00  │ R160.00       │
├──────────┴──────┴──────────┼───────────────┤
│                   Subtotal │ R520.00       │
│                      Total │ R520.00       │
├─────────────────────────────────────────────┤
│  Thank you for your order.                  │
│  Questions? support@healingbuds.co.za       │
└─────────────────────────────────────────────┘
```

### Technical Details
- No external PDF library needed — pure CSS print stylesheet
- Logo uses the existing `hb-logo-teal.png` asset (already in `src/assets/`)
- Currency formatting uses the existing `formatPrice(amount, countryCode)` from `src/lib/currency.ts`
- The invoice component receives the `Order` object as a prop — no additional data fetching
- Print margins set via `@page { margin: 20mm; }` for proper paper output

