-- ============================================================
-- HealingBuds Cascais - COMPLETE DATABASE DEPLOYMENT
-- Project: vzacvnjbdrdpvlbwvpoh (Lovable)
-- Admin: healingbudsglobal@gmail.com
-- ============================================================

-- SCHEMA CREATION
-- ============================================================
-- Consolidated Schema Migration (Supabase-free, plain PostgreSQL)
-- Generated for offline/self-hosted PostgreSQL
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Helper function: updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Helper function: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Helper function: normalize wallet address
CREATE OR REPLACE FUNCTION public.normalize_wallet_address()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.wallet_address = lower(NEW.wallet_address); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.normalize_nonce_address()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.address = lower(NEW.address); RETURN NEW; END; $$;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  avatar_url text,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.drgreen_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drgreen_client_id text NOT NULL,
  user_id uuid,
  email text,
  full_name text,
  country_code text NOT NULL DEFAULT 'PT',
  is_kyc_verified boolean DEFAULT false,
  kyc_link text,
  admin_approval text DEFAULT 'PENDING',
  shipping_address jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.drgreen_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drgreen_order_id text NOT NULL UNIQUE,
  user_id uuid,
  client_id text,
  customer_name text,
  customer_email text,
  country_code text,
  currency text DEFAULT 'EUR',
  invoice_number text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  payment_status text NOT NULL DEFAULT 'PENDING',
  shipping_address jsonb,
  sync_status text DEFAULT 'pending',
  synced_at timestamptz,
  sync_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.drgreen_cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  strain_id text NOT NULL,
  strain_name text NOT NULL,
  unit_price numeric NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.strains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL,
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'Hybrid',
  thc_content numeric NOT NULL DEFAULT 0,
  cbd_content numeric NOT NULL DEFAULT 0,
  cbg_content numeric NOT NULL DEFAULT 0,
  retail_price numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 100,
  availability boolean NOT NULL DEFAULT true,
  is_archived boolean NOT NULL DEFAULT false,
  image_url text,
  client_url text,
  brand_name text DEFAULT 'Dr. Green',
  flavors text[] DEFAULT '{}',
  feelings text[] DEFAULT '{}',
  helps_with text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.strain_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strain_name text NOT NULL,
  source_name text NOT NULL,
  source_url text NOT NULL,
  category text NOT NULL DEFAULT 'dispensary',
  country_code text NOT NULL DEFAULT 'PT',
  scraped_content text,
  effects text[],
  medical_conditions text[],
  patient_reviews text,
  product_info jsonb DEFAULT '{}'::jsonb,
  last_scraped_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.generated_product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  product_name text NOT NULL,
  generated_image_url text NOT NULL,
  original_image_url text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL,
  summary text NOT NULL,
  content text NOT NULL,
  author text DEFAULT 'Healing Buds',
  category text DEFAULT 'news',
  featured_image text,
  source_url text,
  is_featured boolean DEFAULT false,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  subject text NOT NULL,
  html_body text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type text NOT NULL,
  recipient text NOT NULL,
  subject text NOT NULL,
  html_body text,
  template_slug text,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dosage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  strain_name text NOT NULL,
  dosage_amount numeric NOT NULL,
  dosage_unit text NOT NULL DEFAULT 'g',
  consumption_method text NOT NULL DEFAULT 'inhalation',
  effects_noted text,
  side_effects text,
  symptom_relief integer,
  notes text,
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prescription_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  document_type text NOT NULL DEFAULT 'prescription',
  status text NOT NULL DEFAULT 'pending',
  expiry_date date,
  notes text,
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  expiry_notification_sent boolean DEFAULT false,
  expiry_notification_sent_at timestamptz,
  upload_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kyc_journey_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id text NOT NULL,
  event_type text NOT NULL,
  event_source text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.launch_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  country_code text NOT NULL,
  interested_region text NOT NULL,
  phone text,
  language text DEFAULT 'en',
  source text DEFAULT 'coming_soon_page',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_email_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  email text NOT NULL,
  label text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_auth_nonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL,
  nonce text NOT NULL,
  purpose text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes')
);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drgreen_clients_updated_at BEFORE UPDATE ON public.drgreen_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drgreen_orders_updated_at BEFORE UPDATE ON public.drgreen_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drgreen_cart_updated_at BEFORE UPDATE ON public.drgreen_cart
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strains_updated_at BEFORE UPDATE ON public.strains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strain_knowledge_updated_at BEFORE UPDATE ON public.strain_knowledge
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_images_updated_at BEFORE UPDATE ON public.generated_product_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescription_docs_updated_at BEFORE UPDATE ON public.prescription_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_mappings_updated_at BEFORE UPDATE ON public.wallet_email_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER normalize_wallet_address_trigger BEFORE INSERT OR UPDATE ON public.wallet_email_mappings
  FOR EACH ROW EXECUTE FUNCTION normalize_wallet_address();

CREATE TRIGGER normalize_nonce_address_trigger BEFORE INSERT OR UPDATE ON public.wallet_auth_nonces
  FOR EACH ROW EXECUTE FUNCTION normalize_nonce_address();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_drgreen_clients_user_id ON public.drgreen_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_drgreen_clients_email ON public.drgreen_clients(email);
CREATE INDEX IF NOT EXISTS idx_drgreen_orders_user_id ON public.drgreen_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_drgreen_orders_drgreen_id ON public.drgreen_orders(drgreen_order_id);
CREATE INDEX IF NOT EXISTS idx_strains_sku ON public.strains(sku);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_wallet_mappings_address ON public.wallet_email_mappings(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);


-- DATA POPULATION
-- Auto-generated seed data
-- Generated from Supabase export

-- profiles: no data

-- user_roles: 1 rows
INSERT INTO public.user_roles (id, user_id, role, created_at) VALUES ('2be2601e-ebd2-4c80-9f4a-586852995461', 'f8ad88be-2e96-49c4-8255-baa98146a228', 'admin', '2026-03-30 02:44:07.319904+00');

-- drgreen_clients: 13 rows
INSERT INTO public.drgreen_clients (id, user_id, drgreen_client_id, country_code, is_kyc_verified, admin_approval, kyc_link, created_at, updated_at, email, full_name, shipping_address) VALUES ('18958de9-f071-40e0-a390-c61fad3df2d4', '2948762a-605d-4fe7-b1a9-b1d60cd32fd3', '458b3110-8465-4e34-84e1-df327a9386a5', 'ZA', 'f', 'PENDING', NULL, '2026-03-30 02:46:53.484568+00', '2026-04-01 01:14:20.177869+00', 'jamesdegouveia@yahoo.com', 'James de Gouveia', '{"city": "Johannesburg", "state": "Johannesburg", "country": "ZA", "address1": "53 1st Avenue Lambton", "address2": "", "landmark": "", "postalCode": "1414", "countryCode": "ZA"}');
INSERT INTO public.drgreen_clients (id, user_id, drgreen_client_id, country_code, is_kyc_verified, admin_approval, kyc_link, created_at, updated_at, email, full_name, shipping_address) VALUES ('35b00414-5a9a-4536-a723-656e83686817', 'b2eb8eb4-570a-4084-94c4-9211a6cb403e', '2a9b4d8b-dbbe-4769-8864-c4718ed7dff3', 'ZA', 'f', 'PENDING', NULL, '2026-03-30 02:46:54.166524+00', '2026-04-01 01:14:23.404859+00', 'test9876@yopmail.com', 'Test Me', '{"city": "Sandton", "state": "Sandton", "country": "ZA", "address1": "123 sandton drive", "address2": "", "landmark": "", "postalCode": "2196", "countryCode": "ZA"}');
INSERT INTO public.drgreen_clients (id, user_id, drgreen_client_id, country_code, is_kyc_verified, admin_approval, kyc_link, created_at, updated_at, email, full_name, shipping_address) VALUES ('848a7035-345b-445f-85cc-3b200327c490', 'e6f43fc4-f682-4a11-9b1c-498fed5b5c6a', 'd69ad9ce-ac05-4106-bf7d-baa18822debe', 'ZA', 'f', 'PENDING', NULL, '2026-03-30 02:46:54.230687+00', '2026-04-01 01:14:23.768376+00', 'testhb@yopmail.com', 'scott pahhh', '{"city": "Welkom", "state": "Welkom", "country": "ZA", "address1": "368 North Street", "address2": "", "landmark": "", "postalCode": "9467", "countryCode": "ZA"}');
INSERT INTO public.drgreen_clients (id, user_id, drgreen_client_id, country_code, is_kyc_verified, admin_approval, kyc_link, created_at, updated_at, email, full_name, shipping_address) VALUES ('7b2d4798-01df-4257-9c83-02959286fb7f', '82e55a1f-7e29-46b8-8dd1-79a9b87d3ab6', 'fb70d208-8f12-4444-9b1b-e92bd68f675f', 'ZA', 't', 'VERIFIED', NULL, '2026-03-30 02:46:54.293362+00', '2026-04-01 01:14:24.132035+00', 'scott@healingbuds.global', 'Healing Buds', '{"city": "Sandton", "state": "Sandton", "country": "South Africa", "address1": "123 sandton drive", "address2": "", "landmark": "", "postalCode": "2196", "countryCode": "ZA"}');
INSERT INTO public.drgreen_clients (id, user_id, drgreen_client_id, country_code, is_kyc_verified, admin_approval, kyc_link, created_at, updated_at, email, full_name, shipping_address) VALUES ('228cb3fb-8fb0-4158-9753-46b96e81eb27', 'cf5de0d7-d576-4d6e-bdad-bf161273a9bc', 'f1dc1031-23f3-438b-981d-1dee245ececa', 'ZA', 'f', 'PENDING', NULL, '2026-03-30 02:46:53.548432+00', '2026-04-01 01:14:20.760033+00', 'motester@yopmail.com', 'Mohammed Tester', '{"city": "Sandton", "state": "Sandton", "country": "ZA", "address1": "123 Sandton Drive", "address2": "", "landmark": "", "postalCode": "2196", "countryCode": "ZA"}');
INSERT INTO public.drgreen_clients (id, user_id, drgreen_client_id, country_code, is_kyc_verified, admin_approval, kyc_link, created_at, updated_at, email, full_name, shipping_address) VALUES ('f0658f3e-2ece-443c-b611-57e0f6c21b1b', '868b5ac7-96ba-4be4-95f4-11a731256a36', 'c7be55af-eada-4a64-b4e8-83c4b7fa1b0f', 'ZA', 't', 'VERIFIED', NULL, '2026-03-30 02:46:53.868261+00', '2026-04-01 01:14:21.171313+00', 'gerard161+budstacks@gmail.com', 'Gerard Kavanagh', '{"city": "Cape Town", "state": "South Cape", "country": "South Africa", "address1": "123 Long Street", "address2": "", "landmark": "", "postalCode": "8001", "countryCode": "ZA"}');
INSERT INTO public.drgreen_clients (id, user_id, drgreen_client_id, country_code, is_kyc_verified, admin_approval, kyc_link, created_at, updated_at, email, full_name, shipping_address) VALUES ('a5d1d595-adc1-4d47-b21e-4b19aa567d49', '1f9f0215-4b40-427d-a183-ce43096ef950', 'b9fa5b16-4045-49e9-951b-72d8eaf64705', 'ZA', 't', 'VERIFIED', NULL, '2026-03-30 02:46:53.931864+00', '2026-04-01 01:14:21.598361+00', 'maykendaal23@gmail.com', 'Mayke Odendaal', '{"city": "Centurion", "state": "Gauteng", "country": "South Africa", "address1": "18 pall mall cresent", "address2": "Stand 133", "landmark": "", "postalCode": "1692", "countryCode": "ZA"}');
INSERT INTO public.drgreen_clients (id, user_id, drgreen_client_id, country_code, is_kyc_verified, admin_approval, kyc_link, created_at, updated_at, email, full_name, shipping_address) VALUES ('4599398e-d057-48e1-b608-4107a0a33533', 'ff92e812-1159-4c7a-aae4-6ea55f3cab83', '23e80a63-ae5d-41f0-8385-a6f652c08347', 'ZA', 'f', 'PENDING', NULL, '2026-03-30 02:46:54.377318+00', '2026-04-01 01:14:24.488715+00', 'wwe2xjhickei@drewzen.com', 'John Demo', '{"city": "Queenstown", "state": "Queenstown", "country": "ZA", "address1": "380 Old Cres", "address2": "", "landmark": "", "postalCode": "5330", "countryCode": "ZA"}');
INSERT INTO public.drgreen_clients (id, user_id, drgreen_client_id, country_code, is_kyc_verified, admin_approval, kyc_link, created_at, updated_at, email, full_name, shipping_address) VALUES ('00442444-c69c-44b3-99e0-918a3fb9c4cc', 'f12ec713-b35a-4c32-8efb-999c7af83655', '28944b52-54ce-4e1f-ad37-63151ba8bb60', 'ZA', 'f', 'PENDING', NULL, '2026-03-30 02:46:54.438235+00', '2026-04-01 01:14:24.848803+00', 'testflow3@healingbuds.test', 'Test FlowUser', '{"city": "Cape Town", "state": "Western Cape", "country": "South Africa", "address1": "123 Test Street", "address2": "", "landmark": "", "postalCode": "8001", "countryCode": "ZA"}');
INSERT INTO public.drgreen_clients (id, user_id, drgreen_client_id, country_code, is_kyc_verified, admin_approval, kyc_link, created_at, updated_at, email, full_name, shipping_address) VALUES ('1493e996-eff9-4ae2-ba74-0d7b3ef56808', '24579a45-7e86-4103-8e0f-bdd673c324bc', '7360dfb6-95f5-4a3b-9995-2d4f6513cfd2', 'PT', 'f', 'PENDING', NULL, '2026-03-30 02:46:53.411523+00', '2026-04-01 01:14:19.582359+00', 'sara-pickup@live.co.uk', 'Sarah Doe', '{"city": "Sintra", "state": "Sintra", "country": "PT", "address1": "Alameda Campo Da Ourique 15 , Quinta Da Beloura II", "address2": "", "landmark": "", "postalCode": "2710-698", "countryCode": "PT"}');
INSERT INTO public.drgreen_clients (id, user_id, drgreen_client_id, country_code, is_kyc_verified, admin_approval, kyc_link, created_at, updated_at, email, full_name, shipping_address) VALUES ('9bc03654-434e-4126-b242-43a9544aafbf', '0a6c7c00-a8b7-43fe-8d3a-c1e30f7ae7bc', 'a4357132-7e8c-4c8a-b005-6f818b3f173e', 'ZA', 't', 'VERIFIED', NULL, '2026-03-30 02:46:53.989627+00', '2026-04-01 01:14:22.127684+00', 'varseainc@gmail.com', 'Benjamin Varcianna', '{"city": "Centurion", "state": "Gauteng", "country": "South Africa", "address1": "18 pall mall crescent", "address2": "Stand 133", "landmark": "", "postalCode": "1692", "countryCode": "ZA"}');
INSERT INTO public.drgreen_clients (id, user_id, drgreen_client_id, country_code, is_kyc_verified, admin_approval, kyc_link, created_at, updated_at, email, full_name, shipping_address) VALUES ('509a9ef2-08d3-4af0-83f2-abd0403de1d0', '3a5f9149-b593-4aa1-b17f-a721946c0198', 'dfd81e64-c17d-4a1b-8111-cdf49f879e82', 'ZA', 't', 'VERIFIED', NULL, '2026-03-30 02:46:54.048306+00', '2026-04-01 01:14:22.529732+00', 'scott.k1@outlook.com', 'Scott Hickling', '{"city": "Sandton", "state": "Sandton", "country": "South Africa", "address1": "123 sandton drive", "address2": "", "landmark": "", "postalCode": "2196", "countryCode": "ZA"}');
INSERT INTO public.drgreen_clients (id, user_id, drgreen_client_id, country_code, is_kyc_verified, admin_approval, kyc_link, created_at, updated_at, email, full_name, shipping_address) VALUES ('3ea748c8-c47b-4faa-b218-a487152e08e5', '32beedd7-a588-4919-a789-98a587e2c4e0', '47542db8-3982-4204-bd32-2f36617c5d3d', 'ZA', 't', 'VERIFIED', NULL, '2026-03-30 02:46:54.104305+00', '2026-04-01 01:14:22.941354+00', 'kayliegh.sm@gmail.com', 'Kayliegh Moutinho', '{"city": "Cape Town", "state": "Western Cape", "country": "South Africa", "address1": "10 Nelson Mandela Blvd", "address2": "", "landmark": "", "postalCode": "8001", "countryCode": "ZA"}');

-- drgreen_orders: 9 rows
INSERT INTO public.drgreen_orders (id, user_id, drgreen_order_id, status, payment_status, total_amount, items, created_at, updated_at, sync_status, synced_at, sync_error, client_id, shipping_address, customer_email, customer_name, country_code, currency, invoice_number) VALUES ('01baee78-e3b2-4f9b-93bc-52755ba1ade2', '1f9f0215-4b40-427d-a183-ce43096ef950', 'dc5dc527-40b5-45b4-9c6b-cfca7b36ff08', 'PENDING', 'PENDING', '330.00', '[{"quantity": 2, "totalPrice": 20}]', '2026-03-30 01:30:54.586+00', '2026-04-01 01:14:26.057009+00', 'synced', '2026-04-01 01:14:26.02+00', NULL, 'b9fa5b16-4045-49e9-951b-72d8eaf64705', '{"country": "South Africa", "currency": "ZAR", "countryCode": "ZAF"}', 'maykendaal23@gmail.com', 'Mayke Odendaal', 'ZA', 'ZAR', 'DG_1774834254585b9fa5b16-4045-49e9-951b-72d8eaf64705');
INSERT INTO public.drgreen_orders (id, user_id, drgreen_order_id, status, payment_status, total_amount, items, created_at, updated_at, sync_status, synced_at, sync_error, client_id, shipping_address, customer_email, customer_name, country_code, currency, invoice_number) VALUES ('442940d5-2c7a-495a-8e23-cf0379dca636', '1f9f0215-4b40-427d-a183-ce43096ef950', 'e446778d-1535-4ac1-adaf-617d49b576fc', 'PENDING', 'PENDING', '330.00', '[{"quantity": 2, "totalPrice": 20}]', '2026-03-20 17:09:27.984+00', '2026-04-01 01:14:26.118678+00', 'synced', '2026-04-01 01:14:26.079+00', NULL, 'b9fa5b16-4045-49e9-951b-72d8eaf64705', '{"country": "South Africa", "currency": "ZAR", "countryCode": "ZAF"}', 'maykendaal23@gmail.com', 'Mayke Odendaal', 'ZA', 'ZAR', 'DG_1774026567983b9fa5b16-4045-49e9-951b-72d8eaf64705');
INSERT INTO public.drgreen_orders (id, user_id, drgreen_order_id, status, payment_status, total_amount, items, created_at, updated_at, sync_status, synced_at, sync_error, client_id, shipping_address, customer_email, customer_name, country_code, currency, invoice_number) VALUES ('9efdb5a9-718b-4d8a-8f8e-ac473abceb16', '0a6c7c00-a8b7-43fe-8d3a-c1e30f7ae7bc', '21c003ab-3218-44e4-b535-ba35e4c13309', 'PENDING', 'PENDING', '165.00', '[{"quantity": 1, "totalPrice": 10}]', '2026-03-02 20:07:06.171+00', '2026-04-01 01:14:26.177348+00', 'synced', '2026-04-01 01:14:26.14+00', NULL, 'a4357132-7e8c-4c8a-b005-6f818b3f173e', '{"country": "South Africa", "currency": "ZAR", "countryCode": "ZAF"}', 'varseainc@gmail.com', 'Benjamin Varcianna', 'ZA', 'ZAR', 'DG_1772482026170a4357132-7e8c-4c8a-b005-6f818b3f173e');
INSERT INTO public.drgreen_orders (id, user_id, drgreen_order_id, status, payment_status, total_amount, items, created_at, updated_at, sync_status, synced_at, sync_error, client_id, shipping_address, customer_email, customer_name, country_code, currency, invoice_number) VALUES ('cbf035c1-3e8a-4be9-8e81-127d233bf41e', '0a6c7c00-a8b7-43fe-8d3a-c1e30f7ae7bc', '95d0534b-15d4-44cb-bc33-53a363ceb59e', 'PENDING', 'PENDING', '330.00', '[{"quantity": 2, "totalPrice": 20}]', '2026-03-30 02:24:57.77+00', '2026-04-01 01:14:25.879157+00', 'synced', '2026-04-01 01:14:25.841+00', NULL, 'a4357132-7e8c-4c8a-b005-6f818b3f173e', '{"country": "South Africa", "currency": "ZAR", "countryCode": "ZAF"}', 'varseainc@gmail.com', 'Benjamin Varcianna', 'ZA', 'ZAR', 'DG_1774837497769a4357132-7e8c-4c8a-b005-6f818b3f173e');
INSERT INTO public.drgreen_orders (id, user_id, drgreen_order_id, status, payment_status, total_amount, items, created_at, updated_at, sync_status, synced_at, sync_error, client_id, shipping_address, customer_email, customer_name, country_code, currency, invoice_number) VALUES ('e2fe9b03-c203-4f7c-97da-ea5a7c939464', '0a6c7c00-a8b7-43fe-8d3a-c1e30f7ae7bc', '7ce80464-11ba-4694-9707-c16808d8df72', 'PENDING', 'PENDING', '165.00', '[{"quantity": 1, "totalPrice": 10}]', '2026-02-21 00:08:09.058+00', '2026-04-01 01:14:26.237121+00', 'synced', '2026-04-01 01:14:26.197+00', NULL, 'a4357132-7e8c-4c8a-b005-6f818b3f173e', '{"country": "South Africa", "currency": "ZAR", "countryCode": "ZAF"}', 'varseainc@gmail.com', 'Benjamin Varcianna', 'ZA', 'ZAR', 'DG_1771632489057a4357132-7e8c-4c8a-b005-6f818b3f173e');
INSERT INTO public.drgreen_orders (id, user_id, drgreen_order_id, status, payment_status, total_amount, items, created_at, updated_at, sync_status, synced_at, sync_error, client_id, shipping_address, customer_email, customer_name, country_code, currency, invoice_number) VALUES ('50a2dabb-cc0c-48da-a6f3-c35eec2edd75', '1f9f0215-4b40-427d-a183-ce43096ef950', '3642f55e-ffc7-49dc-8936-b1d207a95c90', 'PENDING', 'PENDING', '330.00', '[{"quantity": 2, "totalPrice": 20}]', '2026-03-30 02:06:47.581+00', '2026-04-01 01:14:25.94015+00', 'synced', '2026-04-01 01:14:25.903+00', NULL, 'b9fa5b16-4045-49e9-951b-72d8eaf64705', '{"country": "South Africa", "currency": "ZAR", "countryCode": "ZAF"}', 'maykendaal23@gmail.com', 'Mayke Odendaal', 'ZA', 'ZAR', 'DG_1774836407580b9fa5b16-4045-49e9-951b-72d8eaf64705');
INSERT INTO public.drgreen_orders (id, user_id, drgreen_order_id, status, payment_status, total_amount, items, created_at, updated_at, sync_status, synced_at, sync_error, client_id, shipping_address, customer_email, customer_name, country_code, currency, invoice_number) VALUES ('d571e9ee-c194-45ee-83c7-8ae2f690a2bf', '1f9f0215-4b40-427d-a183-ce43096ef950', '3ddf6d88-9be6-4344-bfce-6ee0a0880d03', 'DELIVERED', 'PAID', '495.00', '[{"quantity": 3, "totalPrice": 30}]', '2026-02-20 18:39:15.029+00', '2026-04-01 01:14:26.296355+00', 'synced', '2026-04-01 01:14:26.258+00', NULL, 'b9fa5b16-4045-49e9-951b-72d8eaf64705', '{"country": "South Africa", "currency": "ZAR", "countryCode": "ZAF"}', 'maykendaal23@gmail.com', 'Mayke Odendaal', 'ZA', 'ZAR', 'gnjHzHDIxK4LaoHv');
INSERT INTO public.drgreen_orders (id, user_id, drgreen_order_id, status, payment_status, total_amount, items, created_at, updated_at, sync_status, synced_at, sync_error, client_id, shipping_address, customer_email, customer_name, country_code, currency, invoice_number) VALUES ('e2096963-2c20-4d63-b6cf-a5f047d0c997', '0a6c7c00-a8b7-43fe-8d3a-c1e30f7ae7bc', '40aea60b-b241-4883-ad4d-44ad10666965', 'PENDING', 'PENDING', '330.00', '[{"quantity": 2, "totalPrice": 20}]', '2026-02-19 20:22:09.414+00', '2026-04-01 01:14:26.354395+00', 'synced', '2026-04-01 01:14:26.316+00', NULL, 'a4357132-7e8c-4c8a-b005-6f818b3f173e', '{"country": "South Africa", "currency": "ZAR", "countryCode": "ZAF"}', 'varseainc@gmail.com', 'Benjamin Varcianna', 'ZA', 'ZAR', 'DG_1771532529413a4357132-7e8c-4c8a-b005-6f818b3f173e');
INSERT INTO public.drgreen_orders (id, user_id, drgreen_order_id, status, payment_status, total_amount, items, created_at, updated_at, sync_status, synced_at, sync_error, client_id, shipping_address, customer_email, customer_name, country_code, currency, invoice_number) VALUES ('b60eac69-78fb-4090-8c05-511ddfe1a666', '1f9f0215-4b40-427d-a183-ce43096ef950', '7a516207-22a8-43bf-b35a-ca50045d24f1', 'PENDING', 'PENDING', '330.00', '[{"quantity": 2, "totalPrice": 20}]', '2026-03-30 01:47:06.496+00', '2026-04-01 01:14:25.99957+00', 'synced', '2026-04-01 01:14:25.96+00', NULL, 'b9fa5b16-4045-49e9-951b-72d8eaf64705', '{"country": "South Africa", "currency": "ZAR", "countryCode": "ZAF"}', 'maykendaal23@gmail.com', 'Mayke Odendaal', 'ZA', 'ZAR', 'DG_1774835226495b9fa5b16-4045-49e9-951b-72d8eaf64705');

-- drgreen_cart: 2 rows
INSERT INTO public.drgreen_cart (id, user_id, strain_id, strain_name, quantity, unit_price, created_at, updated_at) VALUES ('6e794a39-af57-4449-83bc-717c2adcb3c8', '1f9f0215-4b40-427d-a183-ce43096ef950', '7a268bf3-6ab6-4219-9189-7169e3a4276d', 'Blue Zushi', '1', '10.00', '2026-03-30 04:08:07.484315+00', '2026-03-30 09:12:36.154884+00');
INSERT INTO public.drgreen_cart (id, user_id, strain_id, strain_name, quantity, unit_price, created_at, updated_at) VALUES ('5ddaca32-5cf1-4fd9-b045-94c511e0ecb4', '0a6c7c00-a8b7-43fe-8d3a-c1e30f7ae7bc', '6c51c435-f1b6-41a8-b3bf-98033f39eace', 'BlockBerry', '2', '10.00', '2026-03-31 10:57:13.14231+00', '2026-03-31 10:57:13.14231+00');

-- strains: 7 rows
INSERT INTO public.strains (id, sku, name, description, type, flavors, helps_with, feelings, thc_content, cbd_content, cbg_content, image_url, client_url, brand_name, retail_price, availability, stock, is_archived, created_at, updated_at) VALUES ('c0a31701-a2b5-42c0-8ed2-59636e981338', '100007', 'Peanut Butter Breath', 'Nutty, earthy flavors. Cerebral lift followed by full body relaxation. Excellent for appetite loss, stress, nausea, and insomnia.

Hybrid (50% Indica / 50% Sativa)

', 'Hybrid', '{Nutty,Earthy,Herbal}', '{Pain,Insomnia,Stress}', '{Relaxed,Sleepy,Hungry}', '22.6', '0', '0.8', 'https://prod-profiles-backend.s3.amazonaws.com/56e1c80b-3670-4b76-a9bf-8bd1c9859966-Peanut-Butter-Breath-Main.png', NULL, 'Dr. Green', '10', 't', '13', 'f', '2026-03-30 03:13:48.137184+00', '2026-03-30 03:13:59.031377+00');
INSERT INTO public.strains (id, sku, name, description, type, flavors, helps_with, feelings, thc_content, cbd_content, cbg_content, image_url, client_url, brand_name, retail_price, availability, stock, is_archived, created_at, updated_at) VALUES ('7a268bf3-6ab6-4219-9189-7169e3a4276d', '100006', 'Blue Zushi', 'Fruit, mint, and fuel terpene profile. Euphoric uplift transitioning to calm relaxation. Ideal for creative activities and stress relief.

Indica-leaning hybrid (60% Indica / 40% Sativa)
', 'Hybrid', '{Fruit,Mint,Diesel}', '{Anxiety,Stress}', '{Focused,Relaxed,Euphoric}', '21.9', '0.1', '1.3', 'https://prod-profiles-backend.s3.amazonaws.com/39a46b1f-ae7b-4677-b5c8-11b301d34de1-Blue Zushi.png', NULL, 'Dr. Green', '10', 't', '53', 'f', '2026-03-30 03:13:48.227205+00', '2026-03-30 03:13:59.324233+00');
INSERT INTO public.strains (id, sku, name, description, type, flavors, helps_with, feelings, thc_content, cbd_content, cbg_content, image_url, client_url, brand_name, retail_price, availability, stock, is_archived, created_at, updated_at) VALUES ('c77dd198-ec9a-4ced-8105-937fde104424', '100005', 'Femme Fatale', 'Grape, tropical fruits, pear, and berry flavors. Smooth, calming experience. Great for light evening use without overwhelming sedation.

Indica-dominant hybrid
', 'Hybrid', '{Grape,Tropical,Pear,Berry}', '{Depression,Anxiety}', '{Relaxed,Happy,Sleepy}', '21.9', '0.1', '0.8', 'https://prod-profiles-backend.s3.amazonaws.com/33eac80b-58c4-46d3-a82b-b70c875d333f-cakes n cream.png', NULL, 'Dr. Green', '9.09', 'f', '2399', 'f', '2026-03-30 03:13:48.309069+00', '2026-03-30 03:13:59.535999+00');
INSERT INTO public.strains (id, sku, name, description, type, flavors, helps_with, feelings, thc_content, cbd_content, cbg_content, image_url, client_url, brand_name, retail_price, availability, stock, is_archived, created_at, updated_at) VALUES ('6c51c435-f1b6-41a8-b3bf-98033f39eace', '100004', 'BlockBerry', 'Berry, vanilla, and citrus aromas. Happy, clear-headed high with functional relaxation. Good for social settings or creative work.

Hybrid (50% Indica / 50% Sativa)
', 'Hybrid', '{Berry,Vanilla,Citrus}', '{Pain,Insomnia}', '{Relaxed,Sleepy,Hungry}', '23', '0.1', '1.2', 'https://prod-profiles-backend.s3.amazonaws.com/ecf860f8-bcea-4f0b-b5fa-0c17fe49fa42-Blockberry.png', NULL, 'Dr. Green', '10', 't', '75', 'f', '2026-03-30 03:13:48.375429+00', '2026-03-30 03:13:59.755426+00');
INSERT INTO public.strains (id, sku, name, description, type, flavors, helps_with, feelings, thc_content, cbd_content, cbg_content, image_url, client_url, brand_name, retail_price, availability, stock, is_archived, created_at, updated_at) VALUES ('9049a304-04e4-4ae2-89f5-dd73c900f6fb', '100003', 'NFS 12', 'Piney, earthy aroma with diesel and spice. Heavy head buzz with strong body sedation. Best for nighttime use and chronic pain relief.

Indica-leaning hybrid (70% Indica / 30% Sativa)
', 'Hybrid', '{Pine,Diesel,Spicy,Earthy}', '{Pain,Insomnia}', '{Relaxed,Sleepy,Euphoric}', '17.5', '0.1', '0.8', 'https://prod-profiles-backend.s3.amazonaws.com/2cd72ff7-bb9c-45c8-8e6e-7729def59248-nfsheeshjpg.png', NULL, 'Dr. Green', '10', 't', '92', 'f', '2026-03-30 03:13:48.659205+00', '2026-03-30 03:13:59.982442+00');
INSERT INTO public.strains (id, sku, name, description, type, flavors, helps_with, feelings, thc_content, cbd_content, cbg_content, image_url, client_url, brand_name, retail_price, availability, stock, is_archived, created_at, updated_at) VALUES ('25c9bdc7-0e4e-4572-b089-37b2ca60e965', '100002', 'Candy Pave', 'Sweet candy, floral, creamy flavors with gas undertones. Uplifting euphoria leading to heavy relaxation. Ideal for nighttime and experienced users.

Indica-dominant hybrid (80% Indica / 20% Sativa)
', 'Hybrid', '{Candy,Floral,Creamy,Gas}', '{Anxiety,Stress,Depression}', '{Giggly,Euphoric,Uplifted,Relaxed}', '24.5', '0', '0.7', 'https://prod-profiles-backend.s3.amazonaws.com/88b16c0b-fe9b-4585-9aa2-6c52601645fd-E85.png', NULL, 'Dr. Green', '10', 't', '55', 'f', '2026-03-30 03:13:48.732825+00', '2026-03-30 03:14:00.188974+00');
INSERT INTO public.strains (id, sku, name, description, type, flavors, helps_with, feelings, thc_content, cbd_content, cbg_content, image_url, client_url, brand_name, retail_price, availability, stock, is_archived, created_at, updated_at) VALUES ('5c5674cc-9122-47fe-9fee-3b2fc58d612a', '100001', 'Caribbean Breeze', 'Tropical flavors of pineapple, mango, and citrus. Energizing, uplifting, and mentally clear. Great for daytime use, combats fatigue and stress.

Sativa-dominant hybrid
', 'Hybrid', '{Tropical,Citrus,Pineapple}', '{Stress,Depression}', '{Energetic,Happy,Uplifted}', '23', '0', '0.9', 'https://prod-profiles-backend.s3.amazonaws.com/7f12e541-6ffd-4bc1-aa22-8ad388afbe8c-caribbean-breeze-strain.png', NULL, 'Dr. Green', '9.09', 'f', '8230', 'f', '2026-03-30 03:13:48.807191+00', '2026-03-30 03:14:00.255815+00');

-- strain_knowledge: no data

-- generated_product_images: no data

-- articles: no data

-- email_templates: no data

-- email_logs: no data

-- dosage_logs: no data

-- prescription_documents: no data

-- kyc_journey_logs: 2 rows
INSERT INTO public.kyc_journey_logs (id, user_id, client_id, event_type, event_source, event_data, created_at) VALUES ('8a28c975-2470-4cb4-8b8a-dc3fc6859c5c', 'f8ad88be-2e96-49c4-8255-baa98146a228', 'pending', 'registration.started', 'client', '{"step": 0, "stepName": "personal"}', '2026-03-30 02:40:56.821785+00');
INSERT INTO public.kyc_journey_logs (id, user_id, client_id, event_type, event_source, event_data, created_at) VALUES ('68d0ff3c-94eb-46f2-acac-f28d9cabb21c', 'f8ad88be-2e96-49c4-8255-baa98146a228', 'pending', 'registration.started', 'client', '{"step": 0, "stepName": "personal"}', '2026-03-30 03:11:58.075265+00');

-- launch_interest: no data

-- wallet_email_mappings: no data

-- wallet_auth_nonces: no data



-- ADMIN SETUP: Assign super_admin role to healingbudsglobal@gmail.com
-- NOTE: This requires the user to be created first in Supabase Auth
-- The database trigger will auto-assign admin role on signup
INSERT INTO public.user_roles (id, user_id, role, created_at) 
SELECT gen_random_uuid(), auth.users.id, 'admin', now()
FROM auth.users 
WHERE email = 'healingbudsglobal@gmail.com'
ON CONFLICT DO NOTHING;

-- VERIFICATION: Check deployment
SELECT 'Admin User Role' as check_name, count(*) as count FROM public.user_roles WHERE role = 'admin' UNION ALL
SELECT 'DrGreen Clients', count(*) FROM public.drgreen_clients UNION ALL
SELECT 'DrGreen Orders', count(*) FROM public.drgreen_orders;
