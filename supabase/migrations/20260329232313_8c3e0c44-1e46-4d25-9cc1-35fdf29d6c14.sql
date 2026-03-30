-- Attach the existing auto_assign_admin_role function as a trigger
CREATE OR REPLACE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_admin_role();

-- Also attach the handle_new_user (profile creation) trigger  
CREATE OR REPLACE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also attach auto_link_drgreen_on_signup trigger
CREATE OR REPLACE TRIGGER on_profile_created_link_drgreen
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_drgreen_on_signup();

-- Manually insert admin role for the just-created user
INSERT INTO public.user_roles (user_id, role)
VALUES ('5b20a59d-71ec-4a96-91b0-3e5fb4781d01', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;