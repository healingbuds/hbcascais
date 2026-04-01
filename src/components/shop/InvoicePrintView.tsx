import { format } from "date-fns";
import { formatPrice } from "@/lib/currency";
import { calculateVatBreakdown } from "@/lib/tax";
import hbLogo from "@/assets/hb-logo-teal.png";

interface OrderItem {
  strain_id: string;
  strain_name: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  drgreen_order_id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  country_code: string | null;
  currency: string | null;
  customer_name: string | null;
  customer_email: string | null;
  invoice_number: string | null;
  client_id: string | null;
  shipping_address: Record<string, string> | null;
}

interface InvoicePrintViewProps {
  order: Order;
}

export default function InvoicePrintView({ order }: InvoicePrintViewProps) {
  const cc = order.country_code || "ZA";
  const invoiceNumber = order.invoice_number || `HB-${order.drgreen_order_id.slice(0, 8).toUpperCase()}`;
  const orderDate = format(new Date(order.created_at), "dd MMMM yyyy");

  const totalQty = order.items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const allZeroPrice = order.items.every(i => !i.unit_price || Number(i.unit_price) === 0);
  const derivedUnitPrice = allZeroPrice && totalQty > 0 && order.total_amount > 0
    ? order.total_amount / totalQty
    : null;

  const { subtotal, vatAmount, total, vatLabel, vatRate } = calculateVatBreakdown(order.total_amount, cc);
  const addr = order.shipping_address;

  const S = {
    page: {
      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      color: "#1a1a1a",
      fontSize: "13px",
      lineHeight: "1.5",
      maxWidth: "210mm",
      margin: "0 auto",
      padding: "0",
    } as React.CSSProperties,
    header: {
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      marginBottom: "32px", borderBottom: "2px solid #1C4F4D", paddingBottom: "20px",
    } as React.CSSProperties,
    brandName: {
      fontSize: "28px", fontWeight: 700, color: "#1C4F4D", margin: "0 0 4px 0", letterSpacing: "-0.5px",
    } as React.CSSProperties,
    subText: { margin: "2px 0", color: "#555", fontSize: "12px" } as React.CSSProperties,
    metaRow: { display: "flex", justifyContent: "space-between", marginBottom: "28px" } as React.CSSProperties,
    invoiceTitle: {
      fontSize: "22px", fontWeight: 700, color: "#1C4F4D", margin: "0 0 12px 0",
      textTransform: "uppercase" as const, letterSpacing: "2px",
    } as React.CSSProperties,
    metaLabel: { padding: "2px 12px 2px 0", color: "#777", fontWeight: 600 } as React.CSSProperties,
    metaVal: { padding: "2px 0" } as React.CSSProperties,
    billToTitle: {
      fontSize: "11px", fontWeight: 700, color: "#777", textTransform: "uppercase" as const,
      letterSpacing: "1px", margin: "0 0 8px 0",
    } as React.CSSProperties,
    thCell: {
      textAlign: "left" as const, padding: "10px 8px", fontSize: "11px", fontWeight: 700,
      color: "#1C4F4D", textTransform: "uppercase" as const, letterSpacing: "1px",
    } as React.CSSProperties,
  };

  return (
    <div id="invoice-print-content" className="invoice-print hidden print:block">
      <div style={S.page}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <h1 style={S.brandName}>HEALING BUDS</h1>
            <p style={S.subText}>Cascais, Portugal</p>
            <p style={S.subText}>support@healingbuds.co.za</p>
            <p style={S.subText}>www.healingbuds.co.za</p>
          </div>
          <img src={hbLogo} alt="Healing Buds" style={{ width: "80px", height: "auto" }} />
        </div>

        {/* Invoice Title + Meta */}
        <div style={S.metaRow}>
          <div>
            <h2 style={S.invoiceTitle}>Invoice</h2>
            <table style={{ fontSize: "12px", borderCollapse: "collapse" }}>
              <tbody>
                <tr><td style={S.metaLabel}>Invoice #:</td><td style={S.metaVal}>{invoiceNumber}</td></tr>
                <tr><td style={S.metaLabel}>Date:</td><td style={S.metaVal}>{orderDate}</td></tr>
                <tr><td style={S.metaLabel}>Order ID:</td><td style={S.metaVal}>{order.drgreen_order_id}</td></tr>
                <tr><td style={S.metaLabel}>Status:</td><td style={{ ...S.metaVal, textTransform: "capitalize" }}>{order.payment_status}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Bill To */}
          <div style={{ textAlign: "right" }}>
            <h3 style={S.billToTitle}>Bill To</h3>
            {order.customer_name && <p style={{ margin: "2px 0", fontWeight: 600 }}>{order.customer_name}</p>}
            {order.customer_email && <p style={S.subText}>{order.customer_email}</p>}
            {addr && (
              <>
                {addr.address1 && <p style={S.subText}>{addr.address1}</p>}
                {addr.address2 && <p style={S.subText}>{addr.address2}</p>}
                {(addr.city || addr.state) && (
                  <p style={S.subText}>{[addr.city, addr.state].filter(Boolean).join(", ")}</p>
                )}
                {addr.postalCode && <p style={S.subText}>{addr.postalCode}</p>}
                {(addr.country || addr.countryCode) && (
                  <p style={S.subText}>{addr.country || addr.countryCode}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #1C4F4D" }}>
              <th style={S.thCell}>Product</th>
              <th style={{ ...S.thCell, textAlign: "center" }}>Qty</th>
              <th style={{ ...S.thCell, textAlign: "right" }}>Unit Price</th>
              <th style={{ ...S.thCell, textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => {
              const displayName = item.strain_name && item.strain_name !== "Unknown" ? item.strain_name : "Product";
              const effectivePrice = (Number(item.unit_price) || 0) > 0
                ? Number(item.unit_price)
                : derivedUnitPrice ?? 0;
              const lineTotal = item.quantity * effectivePrice;

              return (
                <tr key={i} style={{ borderBottom: "1px solid #e5e5e5" }}>
                  <td style={{ padding: "10px 8px", fontWeight: 500 }}>{displayName}</td>
                  <td style={{ padding: "10px 8px", textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right" }}>{formatPrice(effectivePrice, cc)}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600 }}>{formatPrice(lineTotal, cc)}</td>
                </tr>
              );
            })}
            {order.items.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: "20px 8px", textAlign: "center", color: "#999", fontStyle: "italic" }}>
                  No item details available
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals with VAT */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "40px" }}>
          <table style={{ borderCollapse: "collapse", minWidth: "240px" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid #e5e5e5" }}>
                <td style={{ padding: "8px 16px 8px 0", color: "#555", fontWeight: 600 }}>Subtotal (excl. tax)</td>
                <td style={{ padding: "8px 0", textAlign: "right" }}>{formatPrice(subtotal, cc)}</td>
              </tr>
              {vatRate > 0 && (
                <tr style={{ borderBottom: "1px solid #e5e5e5" }}>
                  <td style={{ padding: "8px 16px 8px 0", color: "#555", fontWeight: 600 }}>{vatLabel}</td>
                  <td style={{ padding: "8px 0", textAlign: "right" }}>{formatPrice(vatAmount, cc)}</td>
                </tr>
              )}
              <tr style={{ borderTop: "2px solid #1C4F4D" }}>
                <td style={{ padding: "10px 16px 10px 0", fontWeight: 700, fontSize: "15px", color: "#1C4F4D" }}>Total</td>
                <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, fontSize: "15px", color: "#1C4F4D" }}>
                  {formatPrice(total, cc)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #ddd", paddingTop: "16px", textAlign: "center", color: "#888", fontSize: "11px" }}>
          <p style={{ margin: "4px 0", fontWeight: 600, color: "#1C4F4D" }}>Thank you for your order.</p>
          <p style={{ margin: "4px 0" }}>
            Questions? Contact us at{" "}
            <span style={{ color: "#1C4F4D", fontWeight: 500 }}>support@healingbuds.co.za</span>
          </p>
          <p style={{ margin: "8px 0 0 0", fontSize: "10px", color: "#aaa" }}>
            Healing Buds Global · Cascais, Portugal · healingbuds.co.za
          </p>
        </div>
      </div>
    </div>
  );
}
