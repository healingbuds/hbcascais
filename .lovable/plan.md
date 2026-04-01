

# Export: Full Migration File + Data Dump

## What You Get

Two downloadable SQL files for your offline PostgreSQL setup:

### File 1: `001_schema.sql` — Complete Schema Migration
A single consolidated migration file combining all 28 migrations into one clean, idempotent script. Adapted for plain PostgreSQL (no Supabase-specific extensions like `pg_cron`, `pg_net`, `supabase_vault`, or `auth.users` references).

Changes from Supabase version:
- Remove Supabase-only extensions (`pg_cron`, `pg_graphql`, `pg_net`, `supabase_vault`)
- Remove all `auth.users` foreign key references (replace with plain `uuid` columns)
- Remove all RLS policies (not applicable without Supabase)
- Remove triggers on `auth.users` (profile creation, admin assignment, drgreen linking)
- Keep all tables, indexes, functions, and data-layer triggers (`updated_at`, `normalize_wallet_address`)
- Include the `app_role` enum, `has_role()` function, and all table constraints
- Make `drgreen_clients.user_id` nullable (matches current live schema)
- Include `invoice_number` on `drgreen_orders`, `source_url` on `articles`
- Include unique constraint on `drgreen_orders.drgreen_order_id`

### File 2: `002_data.sql` — Full Data Export
Export all rows from every table as `INSERT` statements:
- `profiles`, `user_roles`, `drgreen_clients`, `drgreen_orders`, `drgreen_cart`
- `strains`, `strain_knowledge`, `generated_product_images`
- `articles`, `email_templates`, `email_logs`
- `dosage_logs`, `prescription_documents`, `kyc_journey_logs`
- `launch_interest`, `wallet_email_mappings`, `wallet_auth_nonces`

Both files output to `/mnt/documents/` for immediate download.

## Steps

1. Generate `001_schema.sql` — consolidated, Supabase-free schema
2. Query each table via `psql` and generate `002_data.sql` with INSERT statements
3. QA both files for syntax correctness
4. Deliver as downloadable artifacts

