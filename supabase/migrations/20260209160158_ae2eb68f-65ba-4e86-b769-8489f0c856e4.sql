
-- 1. Update data first
UPDATE public.user_roles SET role = 'admin' WHERE role = 'root_admin';
DELETE FROM public.user_roles WHERE role = 'operator';

-- 2. Drop is_root_admin (standalone function)
DROP FUNCTION IF EXISTS public.is_root_admin(uuid);

-- 3. Drop articles policy (directly references user_roles.role column)
DROP POLICY IF EXISTS "Admins can manage articles" ON public.articles;

-- 4. Drop has_role CASCADE (takes all dependent policies with it)
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;

-- 5. Swap enum: column to text, replace enum, column back
ALTER TABLE public.user_roles ALTER COLUMN role TYPE text;
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING role::public.app_role;
DROP TYPE public.app_role_old;

-- 6. Recreate has_role (simple, no inheritance)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 7. Recreate all policies
CREATE POLICY "Admins can manage articles" ON public.articles FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete product images" ON public.generated_product_images FOR DELETE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert product images" ON public.generated_product_images FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update product images" ON public.generated_product_images FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage interest signups" ON public.launch_interest FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all interest signups" ON public.launch_interest FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage strain knowledge" ON public.strain_knowledge FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage strains" ON public.strains FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage wallet email mappings" ON public.wallet_email_mappings FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view wallet email mappings" ON public.wallet_email_mappings FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can read all journey logs" ON public.kyc_journey_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all drgreen clients" ON public.drgreen_clients FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all drgreen clients" ON public.drgreen_clients FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all orders" ON public.drgreen_orders FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all orders" ON public.drgreen_orders FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all prescription documents" ON public.prescription_documents FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all prescription documents" ON public.prescription_documents FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all prescription documents" ON storage.objects FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all prescription files" ON storage.objects FOR SELECT USING (has_role(auth.uid(), 'admin'));
