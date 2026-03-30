import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OnboardingEmailRequest {
  email: string;
  firstName?: string;
  fullName?: string;
  region?: string;
}

const DOMAIN_CONFIG: Record<string, { brandName: string; supportEmail: string; sendDomain: string }> = {
  ZA: { brandName: "Healing Buds South Africa", supportEmail: "support@healingbuds.co.za", sendDomain: "send.healingbuds.co.za" },
  PT: { brandName: "Healing Buds Portugal", supportEmail: "support@healingbuds.pt", sendDomain: "send.healingbuds.pt" },
  GB: { brandName: "Healing Buds UK", supportEmail: "support@healingbuds.co.uk", sendDomain: "send.healingbuds.co.uk" },
  global: { brandName: "Healing Buds", supportEmail: "support@healingbuds.co.za", sendDomain: "send.healingbuds.co.za" },
};

function getDomainConfig(region?: string) {
  return DOMAIN_CONFIG[region?.toUpperCase() || "global"] || DOMAIN_CONFIG.global;
}

function emailShell(headerHtml: string, bodyHtml: string, footerHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fafaf9;font-family:'Helvetica Neue',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.06);">
        ${headerHtml}
        ${bodyHtml}
        ${footerHtml}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function emailHeader(brandName: string): string {
  const logoUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/email-assets/hb-logo-white.png`;
  return `<tr><td style="background:linear-gradient(135deg,#0D4F45 0%,#0A3D35 50%,#072E28 100%);padding:40px 48px;text-align:center;">
    <img src="${logoUrl}" alt="${brandName}" height="44" style="height:44px;width:auto;display:inline-block;" />
    <p style="color:rgba(255,255,255,0.7);margin:12px 0 0;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;">Medical Cannabis Care</p>
  </td></tr>`;
}

function emailFooter(config: { brandName: string; supportEmail: string }): string {
  return `<tr><td style="padding:0 48px;">
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" />
  </td></tr>
  <tr><td style="padding:28px 48px 36px;text-align:center;">
    <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#1a1a1a;">${config.brandName}</p>
    <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">Your trusted partner in medical cannabis wellness.</p>
    <p style="margin:0 0 12px;font-size:12px;color:#9ca3af;">
      Need help? <a href="mailto:${config.supportEmail}" style="color:#0D9488;text-decoration:none;font-weight:500;">${config.supportEmail}</a>
    </p>
    <p style="margin:0;font-size:11px;color:#d1d5db;">© ${new Date().getFullYear()} ${config.brandName}. All rights reserved.</p>
  </td></tr>`;
}

function ctaButton(text: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px auto;">
    <tr><td style="background-color:#0D9488;border-radius:24px;">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
        ${text}
      </a>
    </td></tr>
  </table>`;
}

function stepCard(num: string, title: string, desc: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
    <tr>
      <td width="48" valign="top" style="padding-right:16px;">
        <div style="width:40px;height:40px;border-radius:20px;background-color:#0D9488;color:#ffffff;font-size:16px;font-weight:700;line-height:40px;text-align:center;">${num}</div>
      </td>
      <td valign="top" style="padding-top:2px;">
        <p style="margin:0 0 2px;font-size:15px;font-weight:600;color:#1a1a1a;">${title}</p>
        <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">${desc}</p>
      </td>
    </tr>
  </table>`;
}

function buildOnboardingEmail(config: { brandName: string; supportEmail: string }, displayName: string | null, siteUrl: string): string {
  const greeting = displayName ? `Welcome, ${displayName}!` : "Welcome!";
  const registrationUrl = `${siteUrl}/shop/register`;

  const header = emailHeader(config.brandName);
  const body = `<tr><td style="padding:40px 48px;">
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#1a1a1a;letter-spacing:-0.3px;">${greeting} 🎉</h1>
    <p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:#6b7280;">
      Thank you for creating your ${config.brandName} account. You're one step away from accessing our medical cannabis dispensary.
    </p>

    <div style="background-color:#f0fdf4;border-left:4px solid #0D9488;border-radius:0 12px 12px 0;padding:20px 24px;margin:0 0 28px;">
      <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#0D4F45;">What to expect:</p>
      ${stepCard("1", "Medical Questionnaire", "A brief 2–3 minute questionnaire about your health needs.")}
      ${stepCard("2", "Identity Verification", "Quick KYC check for regulatory compliance.")}
      ${stepCard("3", "Access Granted", "Browse our full range of medical cannabis products.")}
    </div>

    ${ctaButton("Complete Your Registration →", registrationUrl)}

    <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
      Or copy this link: <a href="${registrationUrl}" style="color:#0D9488;word-break:break-all;">${registrationUrl}</a>
    </p>
  </td></tr>`;
  const footer = emailFooter(config);

  return emailShell(header, body, footer);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, fullName, region }: OnboardingEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const displayName = firstName || (fullName ? fullName.split(" ")[0] : null);
    const config = getDomainConfig(region);
    const siteUrl = Deno.env.get("SITE_URL") || "https://healingbuds.co.za";
    const emailHtml = buildOnboardingEmail(config, displayName, siteUrl);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${config.brandName} <noreply@${config.sendDomain}>`,
        to: [email],
        subject: `Welcome to ${config.brandName} — Complete Your Registration`,
        html: emailHtml,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("[send-onboarding-email] Resend API error:", data);
      return new Response(
        JSON.stringify({ success: false, error: data.message || 'Failed to send email' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[send-onboarding-email] Email sent successfully:", data);
    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[send-onboarding-email] Error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
