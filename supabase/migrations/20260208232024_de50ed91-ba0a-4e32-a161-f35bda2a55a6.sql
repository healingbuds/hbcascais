
-- Drop the trigger that references wrong column name
DROP TRIGGER IF EXISTS normalize_nonce_wallet_address ON public.wallet_auth_nonces;

-- Create a new normalize function specifically for this table
CREATE OR REPLACE FUNCTION public.normalize_nonce_address()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  NEW.address = lower(NEW.address);
  RETURN NEW;
END;
$function$;

-- Create trigger with correct column name
CREATE TRIGGER normalize_nonce_address
  BEFORE INSERT OR UPDATE ON public.wallet_auth_nonces
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_nonce_address();
