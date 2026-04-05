import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;

interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function validateContactForm(data: ContactFormRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.name || typeof data.name !== 'string') errors.push('Name is required');
  else if (data.name.trim().length < 2) errors.push('Name must be at least 2 characters');
  else if (data.name.trim().length > 100) errors.push('Name must be less than 100 characters');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || typeof data.email !== 'string') errors.push('Email is required');
  else if (!emailRegex.test(data.email.trim())) errors.push('Invalid email address');
  else if (data.email.trim().length > 255) errors.push('Email must be less than 255 characters');
  if (!data.subject || typeof data.subject !== 'string') errors.push('Subject is required');
  else if (data.subject.trim().length < 3) errors.push('Subject must be at least 3 characters');
  else if (data.subject.trim().length > 200) errors.push('Subject must be less than 200 characters');
  if (!data.message || typeof data.message !== 'string') errors.push('Message is required');
  else if (data.message.trim().length < 10) errors.push('Message must be at least 10 characters');
  else if (data.message.trim().length > 2000) errors.push('Message must be less than 2000 characters');
  return { valid: errors.length === 0, errors };
}

function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }
  if (record.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }
  record.count++;
  rateLimitMap.set(identifier, record);
  return { allowed: true };
}

function buildContactEmailHtml(name: string, subject: string, message: string): string {
  const logoUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/email-assets/hb-logo-white.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fafaf9;font-family:'Helvetica Neue',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0D4F45 0%,#0A3D35 50%,#072E28 100%);padding:40px 48px;text-align:center;">
          <img src="${logoUrl}" alt="Healing Buds" height="44" style="height:44px;width:auto;display:inline-block;" />
          <p style="color:rgba(255,255,255,0.7);margin:12px 0 0;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;">Medical Cannabis Care</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px 48px;">
          <div style="text-align:center;margin:0 0 24px;">
            <div style="display:inline-block;width:56px;height:56px;border-radius:28px;background-color:#f0fdf4;line-height:56px;font-size:28px;text-align:center;">✉️</div>
          </div>
          <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#1a1a1a;text-align:center;letter-spacing:-0.3px;">Message Received</h1>
          <p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:#6b7280;text-align:center;">
            Thank you for reaching out, ${name.trim()}! We'll get back to you as soon as possible.
          </p>

          <div style="background-color:#fafaf9;border-radius:12px;padding:24px;margin:0 0 24px;">
            <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;font-weight:600;">Subject</p>
            <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;font-weight:500;">${subject.trim()}</p>
            <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;font-weight:600;">Your Message</p>
            <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;white-space:pre-wrap;">${message.trim()}</p>
          </div>

          <p style="margin:0;font-size:15px;color:#6b7280;line-height:1.7;">
            Our team typically responds within 24 hours. In the meantime, feel free to browse our website for more information.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:0 48px;">
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" />
        </td></tr>
        <tr><td style="padding:28px 48px 36px;text-align:center;">
          <img src="${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/email-assets/hb-logo-teal.png" alt="Healing Buds" height="32" style="height:32px;width:auto;display:inline-block;margin:0 0 16px;" />
          <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#1a1a1a;">Healing Buds</p>
          <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">Your trusted partner in medical cannabis wellness.</p>
          <p style="margin:0;font-size:11px;color:#d1d5db;">© ${new Date().getFullYear()} Healing Buds. All rights reserved.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 'unknown';
    
    const body = await req.json();
    const { name, email, subject, message }: ContactFormRequest = body;
    
    const validation = validateContactForm({ name, email, subject, message });
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Validation failed', details: validation.errors }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    const ipRateLimit = checkRateLimit(`ip:${clientIP}`);
    const emailRateLimit = checkRateLimit(`email:${email.trim().toLowerCase()}`);
    
    if (!ipRateLimit.allowed || !emailRateLimit.allowed) {
      const retryAfter = Math.max(ipRateLimit.retryAfter || 0, emailRateLimit.retryAfter || 0);
      return new Response(
        JSON.stringify({ success: false, error: 'Too many requests. Please try again later.', retryAfter }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter), ...corsHeaders } }
      );
    }

    const emailHtml = buildContactEmailHtml(name, subject, message);

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "Healing Buds <noreply@send.healingbuds.co.za>",
        to: [email.trim()],
        subject: "Thank you for contacting Healing Buds",
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();
    if (!resendResponse.ok) {
      console.error(`[Contact Form] Resend API error:`, resendData);
      throw new Error(resendData.message || 'Failed to send email');
    }

    console.log(`[Contact Form] Email sent successfully to ${email}:`, resendData);

    return new Response(
      JSON.stringify({ success: true, message: 'Your message has been sent successfully. We will get back to you soon.' }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[Contact Form] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An unexpected error occurred. Please try again later." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
