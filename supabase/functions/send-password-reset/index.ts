import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DOMAIN_CONFIG: Record<string, { brandName: string; supportEmail: string; sendDomain: string }> = {
  ZA: { brandName: "Healing Buds South Africa", supportEmail: "support@healingbuds.co.za", sendDomain: "send.healingbuds.co.za" },
  PT: { brandName: "Healing Buds Portugal", supportEmail: "support@healingbuds.pt", sendDomain: "send.healingbuds.pt" },
  GB: { brandName: "Healing Buds UK", supportEmail: "support@healingbuds.co.uk", sendDomain: "send.healingbuds.co.uk" },
  global: { brandName: "Healing Buds", supportEmail: "support@healingbuds.co.za", sendDomain: "send.healingbuds.co.za" },
};

function getDomainConfig(region?: string) {
  return DOMAIN_CONFIG[region?.toUpperCase() || "global"] || DOMAIN_CONFIG.global;
}

function buildResetEmailHtml(resetLink: string, config: { brandName: string; supportEmail: string }): string {
  const logoUrl = `${SUPABASE_URL}/storage/v1/object/public/email-assets/hb-logo-white.png`;

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
          <div style="text-align:center;margin:0 0 28px;">
            <div style="display:inline-block;width:56px;height:56px;border-radius:28px;background-color:#f0fdf4;line-height:56px;font-size:28px;text-align:center;">🔒</div>
          </div>
          <h1 style="margin:0 0 12px;font-size:28px;font-weight:700;color:#1a1a1a;text-align:center;letter-spacing:-0.3px;">Reset Your Password</h1>
          <p style="margin:0 0 32px;font-size:16px;line-height:1.7;color:#6b7280;text-align:center;">
            We received a request to reset the password for your ${config.brandName} account. Click the button below to choose a new password.
          </p>

          <!-- CTA -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
            <tr><td style="background-color:#0D9488;border-radius:24px;">
              <a href="${resetLink}" target="_blank" style="display:inline-block;padding:14px 40px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
                Reset Password
              </a>
            </td></tr>
          </table>

          <div style="background-color:#fafaf9;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
            <p style="margin:0 0 6px;font-size:13px;color:#9ca3af;">
              ⏱ This link expires in <strong style="color:#6b7280;">1 hour</strong> for your security.
            </p>
            <p style="margin:0;font-size:13px;color:#9ca3af;">
              🛡 If you didn't request this, you can safely ignore this email.
            </p>
          </div>

          <!-- Fallback -->
          <p style="margin:0;font-size:12px;color:#d1d5db;word-break:break-all;text-align:center;">
            Can't click the button? Copy this link:<br/>
            <a href="${resetLink}" style="color:#0D9488;">${resetLink}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:0 48px;">
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" />
        </td></tr>
        <tr><td style="padding:28px 48px 36px;text-align:center;">
          <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#1a1a1a;">${config.brandName}</p>
          <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">Your account security is important to us.</p>
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Need help? <a href="mailto:${config.supportEmail}" style="color:#0D9488;text-decoration:none;font-weight:500;">${config.supportEmail}</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, redirectTo, region } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Valid email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = getDomainConfig(region);
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email.trim(),
      options: {
        redirectTo: redirectTo || "https://healingbuds.co.za/auth",
      },
    });

    if (linkError) {
      console.error("generateLink error:", linkError);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resetLink = linkData?.properties?.action_link;
    if (!resetLink) {
      console.error("No action_link in response");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailHtml = buildResetEmailHtml(resetLink, config);

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${config.brandName} <noreply@${config.sendDomain}>`,
        to: [email.trim()],
        subject: "Reset Your Password — " + config.brandName,
        html: emailHtml,
      }),
    });

    const resendBody = await resendRes.text();

    if (!resendRes.ok) {
      console.error("Resend error:", resendRes.status, resendBody);
      throw new Error("Failed to send email");
    }

    console.log("Password reset email sent successfully via Resend");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-password-reset error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process password reset request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
