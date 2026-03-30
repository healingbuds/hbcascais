-- Step 2: Update has_role to support hierarchy checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role
        OR (role = 'root_admin' AND _role IN ('admin', 'operator'))
        OR (role = 'admin' AND _role = 'operator')
      )
  )
$$;

-- Step 3: Create is_root_admin helper
CREATE OR REPLACE FUNCTION public.is_root_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'root_admin'
  )
$$;

-- Step 4: Block direct access to wallet_auth_nonces (managed by edge functions via service role)
CREATE POLICY "Block all direct access to nonces"
  ON public.wallet_auth_nonces
  FOR ALL
  USING (false);