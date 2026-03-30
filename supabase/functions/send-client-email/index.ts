import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DOMAIN_CONFIG: Record<string, {
  domain: string; brandName: string; supportEmail: string; sendDomain: string;
  address: string; phone: string; websiteUrl: string;
}> = {
  'ZA': { domain: 'healingbuds.co.za', brandName: 'Healing Buds South Africa', supportEmail: 'support@healingbuds.co.za', sendDomain: 'send.healingbuds.co.za', address: '123 Sandton Drive, Sandton 2196, South Africa', phone: '+27 11 123 4567', websiteUrl: 'https://healingbuds.co.za' },
  'PT': { domain: 'healingbuds.pt', brandName: 'Healing Buds Portugal', supportEmail: 'support@healingbuds.pt', sendDomain: 'send.healingbuds.pt', address: 'Avenida D. João II, 98 A, 1990-100 Lisboa, Portugal', phone: '+351 210 123 456', websiteUrl: 'https://healingbuds.pt' },
  'GB': { domain: 'healingbuds.co.uk', brandName: 'Healing Buds UK', supportEmail: 'support@healingbuds.co.uk', sendDomain: 'send.healingbuds.co.uk', address: '123 Harley Street, London W1G 6AX, United Kingdom', phone: '+44 20 7123 4567', websiteUrl: 'https://healingbuds.co.uk' },
  'global': { domain: 'healingbuds.global', brandName: 'Healing Buds', supportEmail: 'support@healingbuds.global', sendDomain: 'send.healingbuds.co.za', address: 'Global Medical Cannabis Network', phone: '+27 11 123 4567', websiteUrl: 'https://healingbuds.global' },
};

function getDomainConfig(region?: string) {
  return DOMAIN_CONFIG[region?.toUpperCase() || 'global'] || DOMAIN_CONFIG['global'];
}

interface ClientEmailRequest {
  type: 'welcome' | 'kyc-link' | 'kyc-approved' | 'kyc-rejected' | 'eligibility-approved' | 'eligibility-rejected';
  email: string; name: string; region?: string; kycLink?: string; clientId?: string; rejectionReason?: string;
}

// ── Shared HTML helpers ──

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

function emailHeader(brandName: string, isRejection = false): string {
  const logoUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/email-assets/hb-logo-white.png`;
  const gradient = isRejection
    ? 'linear-gradient(135deg,#7f1d1d 0%,#991b1b 50%,#b91c1c 100%)'
    : 'linear-gradient(135deg,#0D4F45 0%,#0A3D35 50%,#072E28 100%)';
  return `<tr><td style="background:${gradient};padding:40px 48px;text-align:center;">
    <img src="${logoUrl}" alt="${brandName}" height="44" style="height:44px;width:auto;display:inline-block;" />
    <p style="color:rgba(255,255,255,0.7);margin:12px 0 0;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;">Medical Cannabis Care</p>
  </td></tr>`;
}

function emailFooter(config: typeof DOMAIN_CONFIG['global']): string {
  return `<tr><td style="padding:0 48px;">
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" />
  </td></tr>
  <tr><td style="padding:28px 48px 36px;text-align:center;">
    <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#1a1a1a;">${config.brandName}</p>
    <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">${config.address}</p>
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

function statusBanner(type: 'success' | 'warning' | 'error', text: string): string {
  const colors = {
    success: { border: '#0D9488', bg: '#f0fdf4', text: '#0D4F45' },
    warning: { border: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
    error:   { border: '#ef4444', bg: '#fef2f2', text: '#991b1b' },
  };
  const c = colors[type];
  return `<div style="border-left:4px solid ${c.border};background-color:${c.bg};border-radius:0 12px 12px 0;padding:16px 20px;margin:0 0 28px;">
    <p style="margin:0;color:${c.text};font-size:16px;font-weight:600;">${text}</p>
  </div>`;
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

// ── Template bodies ──

function getEmailTemplate(request: ClientEmailRequest, config: typeof DOMAIN_CONFIG['global']) {
  const { type, name, kycLink, rejectionReason } = request;
  const firstName = name.split(' ')[0] || name;
  const isRejection = type.includes('rejected');

  const templates: Record<string, { subject: string; body: string }> = {
    'welcome': {
      subject: `Welcome to ${config.brandName} — Registration Complete`,
      body: `<tr><td style="padding:40px 48px;">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#1a1a1a;letter-spacing:-0.3px;">Welcome, ${firstName}! 🎉</h1>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:#6b7280;">
          Thank you for registering with ${config.brandName}. Your medical cannabis patient registration has been received.
        </p>
        <div style="background-color:#fafaf9;border-radius:12px;padding:24px;margin:0 0 28px;">
          <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#0D4F45;">What happens next:</p>
          ${stepCard("1", "Identity Verification (KYC)", "You'll receive a link to verify your identity.")}
          ${stepCard("2", "Medical Review", "Our medical team will review your application.")}
          ${stepCard("3", "Approval & Access", "Once approved, browse and purchase medical cannabis products.")}
        </div>
        ${kycLink ? ctaButton("Complete Identity Verification →", kycLink) :
          statusBanner('warning', '⏳ Your verification link is being generated and will arrive shortly.')}
      </td></tr>`,
    },
    'kyc-link': {
      subject: `Complete Your Identity Verification — ${config.brandName}`,
      body: `<tr><td style="padding:40px 48px;">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#1a1a1a;letter-spacing:-0.3px;">Verify Your Identity</h1>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:#6b7280;">
          Hi ${firstName}, please complete your identity verification to continue with your ${config.brandName} registration.
        </p>
        <div style="background-color:#fafaf9;border-radius:12px;padding:24px;margin:0 0 28px;">
          <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#0D4F45;">📋 What you'll need:</p>
          <ul style="margin:0;padding-left:20px;color:#6b7280;font-size:14px;line-height:2;">
            <li>A valid government-issued ID</li>
            <li>Good lighting for clear photos</li>
            <li>5 minutes to complete the process</li>
          </ul>
        </div>
        ${ctaButton("Verify My Identity →", kycLink || '#')}
        <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">This link expires in 7 days. If you didn't request this, contact us immediately.</p>
      </td></tr>`,
    },
    'kyc-approved': {
      subject: `✅ Identity Verified — ${config.brandName}`,
      body: `<tr><td style="padding:40px 48px;">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#1a1a1a;letter-spacing:-0.3px;">You're Verified!</h1>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:#6b7280;">
          Hi ${firstName}, great news — your identity has been successfully verified.
        </p>
        ${statusBanner('success', '✓ KYC Verification Complete')}
        <div style="background-color:#fafaf9;border-radius:12px;padding:24px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#1a1a1a;">Next Step: Medical Review</p>
          <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">Your application is now being reviewed by our medical team. This typically takes 1–2 business days. We'll notify you once confirmed.</p>
        </div>
      </td></tr>`,
    },
    'kyc-rejected': {
      subject: `Identity Verification — Additional Information Required`,
      body: `<tr><td style="padding:40px 48px;">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#1a1a1a;letter-spacing:-0.3px;">Verification Incomplete</h1>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:#6b7280;">
          Hi ${firstName}, unfortunately we were unable to verify your identity with the information provided.
        </p>
        <div style="border-left:4px solid #ef4444;background-color:#fef2f2;border-radius:0 12px 12px 0;padding:16px 20px;margin:0 0 28px;">
          <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#991b1b;font-weight:600;">Reason</p>
          <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.5;">${rejectionReason || 'The document quality was insufficient or the information could not be verified.'}</p>
        </div>
        <div style="background-color:#fafaf9;border-radius:12px;padding:24px;margin:0 0 24px;">
          <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1a1a1a;">Tips for resubmission:</p>
          <ul style="margin:0;padding-left:20px;color:#6b7280;font-size:14px;line-height:2;">
            <li>Ensure your ID is not expired</li>
            <li>Take photos in good lighting</li>
            <li>Make sure all text is clearly readable</li>
            <li>Avoid glare or shadows</li>
          </ul>
        </div>
        ${kycLink ? ctaButton("Retry Verification →", kycLink) : ''}
        <p style="margin:0;font-size:13px;color:#9ca3af;">Need help? Contact <a href="mailto:${config.supportEmail}" style="color:#0D9488;text-decoration:none;">${config.supportEmail}</a></p>
      </td></tr>`,
    },
    'eligibility-approved': {
      subject: `🎉 You're Approved — ${config.brandName}`,
      body: `<tr><td style="padding:40px 48px;">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#1a1a1a;letter-spacing:-0.3px;">Congratulations, ${firstName}!</h1>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:#6b7280;">
          Your application for medical cannabis has been approved by our medical team.
        </p>
        ${statusBanner('success', '🎉 Medical Eligibility Confirmed')}
        <p style="margin:0 0 8px;font-size:15px;color:#6b7280;line-height:1.7;">You now have full access to browse and purchase medical cannabis products tailored to your needs.</p>
        ${ctaButton("Browse Products →", config.websiteUrl + '/shop')}
        <div style="background-color:#fafaf9;border-radius:12px;padding:24px;margin:0 0 0;">
          <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1a1a1a;">Important reminders:</p>
          <ul style="margin:0;padding-left:20px;color:#6b7280;font-size:14px;line-height:2;">
            <li>Always follow dosage guidelines</li>
            <li>Keep your prescription documentation accessible</li>
            <li>Contact support if you have any questions</li>
          </ul>
        </div>
      </td></tr>`,
    },
    'eligibility-rejected': {
      subject: `Medical Eligibility Review — ${config.brandName}`,
      body: `<tr><td style="padding:40px 48px;">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#1a1a1a;letter-spacing:-0.3px;">Eligibility Review</h1>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:#6b7280;">
          Hi ${firstName}, after careful review, we regret to inform you that your medical cannabis application could not be approved at this time.
        </p>
        <div style="border-left:4px solid #ef4444;background-color:#fef2f2;border-radius:0 12px 12px 0;padding:16px 20px;margin:0 0 28px;">
          <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#991b1b;font-weight:600;">Reason</p>
          <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.5;">${rejectionReason || 'Based on the medical information provided, you do not currently meet our eligibility criteria.'}</p>
        </div>
        <div style="background-color:#fafaf9;border-radius:12px;padding:24px;margin:0 0 24px;">
          <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1a1a1a;">What you can do:</p>
          <ul style="margin:0;padding-left:20px;color:#6b7280;font-size:14px;line-height:2;">
            <li>Consult with your healthcare provider</li>
            <li>Request a review by contacting our medical team</li>
            <li>Reapply if your medical situation changes</li>
          </ul>
        </div>
        <p style="margin:0;font-size:13px;color:#9ca3af;">Questions? Contact <a href="mailto:${config.supportEmail}" style="color:#0D9488;text-decoration:none;">${config.supportEmail}</a></p>
      </td></tr>`,
    },
  };

  const template = templates[type] || templates['welcome'];
  const header = emailHeader(config.brandName, isRejection);
  const footer = emailFooter(config);

  return {
    subject: template.subject,
    html: emailShell(header, template.body, footer),
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: ClientEmailRequest = await req.json();
    console.log('[send-client-email] Request received:', { type: request.type, email: request.email, region: request.region });

    if (!request.email || !request.type || !request.name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, type, name' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const domainConfig = getDomainConfig(request.region);
    const emailContent = getEmailTemplate(request, domainConfig);
    const fromAddress = `${domainConfig.brandName} <noreply@${domainConfig.sendDomain}>`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromAddress, to: [request.email.trim()],
        subject: emailContent.subject, html: emailContent.html,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[send-client-email] Resend API error:', data);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: data }),
        { status: response.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('[send-client-email] Email sent successfully:', data);

    if (request.clientId) {
      try {
        const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
        const { data: clientData } = await supabase.from('drgreen_clients').select('user_id').eq('drgreen_client_id', request.clientId).single();
        if (clientData?.user_id) {
          await supabase.from('kyc_journey_logs').insert({
            user_id: clientData.user_id, client_id: request.clientId,
            event_type: `email.${request.type}_sent`, event_source: 'send-client-email',
            event_data: { emailType: request.type, region: request.region, success: true },
          });
        }
      } catch (logError) {
        console.warn('[KYC Journey] Failed to log email event:', logError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, messageId: data.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('[send-client-email] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
