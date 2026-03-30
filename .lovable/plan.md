

## Part 1: Client Name in Desktop Header

**File: `src/layout/Header.tsx`** — Line 240

Replace `truncatedEmail` with `drGreenClient?.full_name || truncatedEmail` in the dropdown trigger button. `drGreenClient` is already destructured from `useShop()` on line 59.

---

## Part 2: Branded Password Reset Email via Resend

The project already uses Resend (API key configured) with sender domain `send.healingbuds.co.za`. Password reset emails currently use the default system templates. We'll create a custom Edge Function that intercepts the password reset flow and sends a branded email through the existing Resend integration.

### Approach

Create a new Edge Function `send-password-reset` that:
- Accepts email + reset link
- Renders a branded HTML email matching the Healing Buds aesthetic (teal `#0D9488` header, logo from storage, pharmaceutical tone)
- Sends via Resend from `noreply@send.healingbuds.co.za` using the existing `RESEND_API_KEY`

Then update `src/pages/Auth.tsx` to:
1. Call `supabase.auth.resetPasswordForEmail()` with `shouldCreateUser: false`
2. Generate a custom token via a helper, OR use the simpler approach: after the default reset email is triggered, also send our branded version

**Simpler approach chosen**: Since Supabase Auth handles token generation and we can't easily intercept the built-in hook without the managed email system, we'll:

1. **Create `supabase/functions/send-password-reset/index.ts`** — a Resend-powered branded password reset email function that:
   - Receives `{ email, resetLink }` 
   - Uses the existing `RESEND_API_KEY` and `send.healingbuds.co.za` domain
   - Renders branded HTML with: teal header + HB logo, "Reset Your Password" heading, reset button, support contact, footer
   - Region-aware using the same `DOMAIN_CONFIG` pattern from `send-order-confirmation`

2. **Update `src/pages/Auth.tsx`** password reset handler to:
   - Call `supabase.auth.resetPasswordForEmail()` as before (generates the token/link)
   - Then invoke `send-password-reset` Edge Function with the email and constructed reset URL
   - The default system email still fires, but the branded one arrives too

**Better approach**: Actually, to avoid duplicate emails, we should use Supabase's `emailRedirectTo` and have the Edge Function generate the OTP link itself using the admin API. But that's complex.

**Cleanest approach**: Use `supabase.auth.admin.generateLink()` in an Edge Function to get the reset link, then send only the branded email (suppressing the default). This requires the service role key (already available as `SUPABASE_SERVICE_ROLE_KEY`).

### Final Plan

1. **Create `supabase/functions/send-password-reset/index.ts`**:
   - Accepts `{ email, redirectTo }` from authenticated or public request
   - Uses service role to call `supabase.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo } })`
   - Gets the action link from the response
   - Sends branded HTML email via Resend from `noreply@send.healingbuds.co.za`
   - HTML template: teal header with HB logo, "Reset Your Password" copy, CTA button, support footer
   - Region-aware sender config (ZA/PT/GB/global)

2. **Update `src/pages/Auth.tsx`**:
   - Replace `supabase.auth.resetPasswordForEmail()` with `supabase.functions.invoke('send-password-reset', { body: { email, redirectTo } })`
   - This ensures only the branded email is sent (no duplicate default email)

3. **Deploy** the new Edge Function

### Branded Email Design
- Header: `#0D9488` teal background with white HB logo from `email-assets` bucket
- Body: white background, dark text
- CTA button: teal `#0D9488` with white text, rounded
- Footer: light gray background, "Healing Buds" branding, support email
- Tone: professional, medical/pharmaceutical ("Your account security is important to us")
- Multi-language support via `region` parameter (EN default)

### Files
- `src/layout/Header.tsx` — show client name
- `supabase/functions/send-password-reset/index.ts` — new Edge Function
- `src/pages/Auth.tsx` — use new function for password reset

