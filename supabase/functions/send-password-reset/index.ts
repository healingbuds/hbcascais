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
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0D9488,#115E59);padding:32px 40px;text-align:center;">
          <img src="https://vzacvnjbdrdpvlbwvpoh.supabase.co/storage/v1/object/public/email-assets/hb-logo-teal.png" alt="${config.brandName}" height="48" style="height:48px;width:auto;" />
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#1a1a1a;">Reset Your Password</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4a4a4a;">
            We received a request to reset the password for your ${config.brandName} account. Click the button below to choose a new password.
          </p>
          
          <!-- CTA Button -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
            <tr><td style="background-color:#0D9488;border-radius:8px;">
              <a href="${resetLink}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
                Reset Password
              </a>
            </td></tr>
          </table>

          <p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#888888;">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
          <p style="margin:0 0 8px;font-size:13px;color:#888888;">
            This link will expire in 1 hour for your security.
          </p>

          <!-- Fallback link -->
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;" />
          <p style="margin:0;font-size:12px;color:#aaaaaa;word-break:break-all;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${resetLink}" style="color:#0D9488;">${resetLink}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background-color:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e5e5;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1a1a1a;">${config.brandName}</p>
          <p style="margin:0 0 4px;font-size:12px;color:#888888;">Your account security is important to us.</p>
          <p style="margin:0;font-size:12px;color:#888888;">
            Need help? Contact us at <a href="mailto:${config.supportEmail}" style="color:#0D9488;text-decoration:none;">${config.supportEmail}</a>
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

    // Use admin API to generate the recovery link (suppresses default email)
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
      // Don't reveal if user exists or not
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

    // Send branded email via Resend
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
