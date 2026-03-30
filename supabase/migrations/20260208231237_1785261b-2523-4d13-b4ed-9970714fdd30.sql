
-- Create wallet_auth_nonces table for server-issued nonce authentication
CREATE TABLE public.wallet_auth_nonces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  nonce TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL CHECK (purpose IN ('login', 'create', 'link', 'delete')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ
);

-- Index for fast lookups by nonce
CREATE INDEX idx_wallet_auth_nonces_nonce ON public.wallet_auth_nonces (nonce);

-- Index for cleanup of expired nonces
CREATE INDEX idx_wallet_auth_nonces_expires_at ON public.wallet_auth_nonces (expires_at);

-- Index for address lookups
CREATE INDEX idx_wallet_auth_nonces_address ON public.wallet_auth_nonces (address);

-- Trigger to normalize wallet address to lowercase
CREATE TRIGGER normalize_nonce_wallet_address
  BEFORE INSERT OR UPDATE ON public.wallet_auth_nonces
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_wallet_address();

-- RLS disabled: only accessed by edge function via service role
-- No RLS policies needed
