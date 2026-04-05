import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderItem { strain_name: string; quantity: number; unit_price: number; }
interface ShippingAddress { address1: string; address2?: string; city: string; state?: string; postalCode: string; country: string; }
interface OrderConfirmationRequest {
  email: string; customerName: string; orderId: string; items: OrderItem[];
  totalAmount: number; currency: string; shippingAddress: ShippingAddress;
  isLocalOrder: boolean; region?: string;
}

const DOMAIN_CONFIG: Record<string, { brandName: string; supportEmail: string; sendDomain: string }> = {
  ZA: { brandName: "Healing Buds South Africa", supportEmail: "support@healingbuds.co.za", sendDomain: "send.healingbuds.co.za" },
  PT: { brandName: "Healing Buds Portugal", supportEmail: "support@healingbuds.pt", sendDomain: "send.healingbuds.pt" },
  GB: { brandName: "Healing Buds UK", supportEmail: "support@healingbuds.co.uk", sendDomain: "send.healingbuds.co.uk" },
  global: { brandName: "Healing Buds", supportEmail: "support@healingbuds.global", sendDomain: "send.healingbuds.co.za" },
};

function getDomainConfig(region?: string) {
  return DOMAIN_CONFIG[region?.toUpperCase() || "global"] || DOMAIN_CONFIG.global;
}

function buildEmailHtml(req: OrderConfirmationRequest, config: { brandName: string; supportEmail: string }) {
  const firstName = req.customerName.split(" ")[0] || req.customerName;
  const logoUrl = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/email-assets/hb-logo-white.png`;
  const currencySymbol = req.currency === "ZAR" ? "R" : req.currency === "GBP" ? "£" : "€";

  const itemRows = req.items.map((item) => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #f3f4f6;color:#1a1a1a;font-size:14px;font-weight:500;">${item.strain_name}</td>
      <td style="padding:14px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;text-align:center;">${item.quantity}</td>
      <td style="padding:14px 0;border-bottom:1px solid #f3f4f6;color:#1a1a1a;font-size:14px;text-align:right;font-weight:500;">${currencySymbol}${(item.unit_price * item.quantity).toFixed(2)}</td>
    </tr>`).join("");

  const statusBanner = req.isLocalOrder
    ? `<div style="border-left:4px solid #f59e0b;background-color:#fffbeb;border-radius:0 12px 12px 0;padding:16px 20px;margin:0 0 28px;">
        <p style="margin:0 0 4px;color:#92400e;font-size:14px;font-weight:600;">⏳ Order Queued for Processing</p>
        <p style="margin:0;color:#a16207;font-size:13px;line-height:1.5;">Your order has been received securely. Our team will confirm and process it via email. No payment taken yet.</p>
      </div>`
    : `<div style="border-left:4px solid #0D9488;background-color:#f0fdf4;border-radius:0 12px 12px 0;padding:16px 20px;margin:0 0 28px;text-align:center;">
        <p style="margin:0;color:#0D4F45;font-size:16px;font-weight:600;">✓ Order Confirmed</p>
      </div>`;

  const addr = req.shippingAddress;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fafaf9;font-family:'Helvetica Neue',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0D4F45 0%,#0A3D35 50%,#072E28 100%);padding:40px 48px;text-align:center;">
          <img src="${logoUrl}" alt="${config.brandName}" height="44" style="height:44px;width:auto;display:inline-block;" />
          <p style="color:rgba(255,255,255,0.7);margin:12px 0 0;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;">Medical Cannabis Care</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px 48px;">
          <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#1a1a1a;letter-spacing:-0.3px;">Thank you, ${firstName}!</h1>
          <p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:#6b7280;">
            Your order with ${config.brandName} has been received. Here's your summary:
          </p>

          ${statusBanner}

          <!-- Order Reference -->
          <div style="background-color:#fafaf9;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
            <p style="margin:0 0 2px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;font-weight:600;">Order Reference</p>
            <p style="margin:0;font-size:18px;font-family:'SF Mono',SFMono-Regular,Menlo,monospace;font-weight:700;color:#1a1a1a;">${req.orderId}</p>
          </div>

          <!-- Items Table -->
          <table width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
            <thead>
              <tr>
                <th style="text-align:left;padding:10px 0;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #f3f4f6;font-weight:600;">Product</th>
                <th style="text-align:center;padding:10px 0;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #f3f4f6;font-weight:600;">Qty</th>
                <th style="text-align:right;padding:10px 0;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #f3f4f6;font-weight:600;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
              <tr>
                <td colspan="2" style="padding:16px 0 0;font-weight:700;color:#1a1a1a;font-size:16px;">Total</td>
                <td style="padding:16px 0 0;font-weight:700;color:#0D9488;font-size:18px;text-align:right;">${currencySymbol}${req.totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <!-- Shipping -->
          <div style="background-color:#fafaf9;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
            <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;font-weight:600;">📍 Shipping Address</p>
            <p style="margin:0;color:#1a1a1a;font-size:14px;line-height:1.7;">
              ${addr.address1}${addr.address2 ? "<br>" + addr.address2 : ""}<br>
              ${addr.city}${addr.state ? ", " + addr.state : ""} ${addr.postalCode}<br>
              ${addr.country}
            </p>
          </div>

          <p style="margin:0;font-size:14px;color:#9ca3af;line-height:1.6;">
            Questions about your order? Contact us at
            <a href="mailto:${config.supportEmail}" style="color:#0D9488;text-decoration:none;font-weight:500;">${config.supportEmail}</a>.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:0 48px;">
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" />
        </td></tr>
        <tr><td style="padding:28px 48px 36px;text-align:center;">
          <img src="${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/email-assets/hb-logo-teal.png" alt="${config.brandName}" height="32" style="height:32px;width:auto;display:inline-block;margin:0 0 16px;" />
          <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#1a1a1a;">${config.brandName}</p>
          <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">Your trusted partner in medical cannabis wellness.</p>
          <p style="margin:0;font-size:11px;color:#d1d5db;">© ${new Date().getFullYear()} ${config.brandName}. All rights reserved.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const request: OrderConfirmationRequest = await req.json();
    if (!request.email || !request.orderId || !request.items?.length) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: "Email service not configured" }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const config = getDomainConfig(request.region);
    const html = buildEmailHtml(request, config);
    const subject = request.isLocalOrder
      ? `Order Received — ${request.orderId} | ${config.brandName}`
      : `Order Confirmed — ${request.orderId} | ${config.brandName}`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${config.brandName} <noreply@${config.sendDomain}>`,
        to: [request.email.trim()], subject, html,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("[send-order-confirmation] Resend error:", data);
      return new Response(JSON.stringify({ success: false, error: data.message }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("[send-order-confirmation] Email sent successfully:", data);
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[send-order-confirmation] Error:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
