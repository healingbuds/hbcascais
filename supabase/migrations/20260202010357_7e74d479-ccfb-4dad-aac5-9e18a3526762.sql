-- Add shipping_address column to drgreen_clients table to store address locally
-- This avoids needing dApp API access for checkout

ALTER TABLE public.drgreen_clients 
ADD COLUMN IF NOT EXISTS shipping_address JSONB DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.drgreen_clients.shipping_address IS 'Local copy of shipping address collected during registration. Structure: {address1, address2, city, state, country, countryCode, postalCode, landmark}';