
-- Enable RLS on wallet_auth_nonces but add no policies
-- This means ONLY service_role can access it (which is what we want)
ALTER TABLE public.wallet_auth_nonces ENABLE ROW LEVEL SECURITY;
