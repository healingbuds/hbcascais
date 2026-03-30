
-- Email send log
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  html_body TEXT,
  metadata JSONB DEFAULT '{}',
  template_slug TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email templates
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for email_logs
CREATE POLICY "Admins can view all email logs"
ON public.email_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert email logs"
ON public.email_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can delete email logs"
ON public.email_logs FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin-only policies for email_templates
CREATE POLICY "Admins can view all email templates"
ON public.email_templates FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage email templates"
ON public.email_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger for email_templates
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Pre-seed default templates
INSERT INTO public.email_templates (name, slug, subject, html_body, variables) VALUES
('Welcome Email', 'welcome', 'Welcome to Healing Buds', '<h1>Welcome {{firstName}}!</h1><p>Thank you for joining Healing Buds.</p>', '["firstName", "region"]'),
('KYC Verification Link', 'kyc-link', 'Complete Your Verification', '<h1>Hello {{firstName}}</h1><p>Please complete your identity verification: <a href="{{kycLink}}">Verify Now</a></p>', '["firstName", "kycLink"]'),
('KYC Approved', 'kyc-approved', 'Your Verification is Approved', '<h1>Congratulations {{firstName}}!</h1><p>Your identity verification has been approved.</p>', '["firstName"]'),
('KYC Rejected', 'kyc-rejected', 'Verification Update', '<h1>Hello {{firstName}}</h1><p>Unfortunately your verification could not be completed. Please contact support.</p>', '["firstName"]'),
('Eligibility Approved', 'eligibility-approved', 'You Are Eligible!', '<h1>Great news {{firstName}}!</h1><p>You are now eligible to purchase medical cannabis products.</p>', '["firstName"]'),
('Eligibility Rejected', 'eligibility-rejected', 'Eligibility Update', '<h1>Hello {{firstName}}</h1><p>Based on our review, we are unable to approve your eligibility at this time.</p>', '["firstName"]');
