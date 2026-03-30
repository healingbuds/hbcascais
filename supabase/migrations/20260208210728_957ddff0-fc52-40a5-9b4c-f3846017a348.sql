
-- Table to store wallet-to-email mappings for account linking
-- When a wallet connects, the edge function checks this table to resolve
-- the wallet to an existing email-based account instead of creating a new one.
CREATE TABLE public.wallet_email_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  email text NOT NULL,
  label text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wallet_email_mappings_wallet_address_key UNIQUE (wallet_address),
  CONSTRAINT wallet_email_mappings_wallet_address_check CHECK (wallet_address ~ '^0x[a-f0-9]{40}$')
);

-- Always store wallet addresses lowercase
CREATE OR REPLACE FUNCTION public.normalize_wallet_address()
RETURNS TRIGGER AS $$
BEGIN
  NEW.wallet_address = lower(NEW.wallet_address);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER normalize_wallet_address_trigger
BEFORE INSERT OR UPDATE ON public.wallet_email_mappings
FOR EACH ROW
EXECUTE FUNCTION public.normalize_wallet_address();

-- Updated_at trigger
CREATE TRIGGER update_wallet_email_mappings_updated_at
BEFORE UPDATE ON public.wallet_email_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: Only admins can manage mappings
ALTER TABLE public.wallet_email_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage wallet email mappings"
ON public.wallet_email_mappings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view wallet email mappings"
ON public.wallet_email_mappings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
