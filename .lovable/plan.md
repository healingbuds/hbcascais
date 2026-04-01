

# Plan: Database Export + End-to-End Testing

## Part 1: Full Database Export

Export all table data as downloadable files to `/mnt/documents/`.

### Approach
Run `psql` queries to export each table as CSV, plus a combined SQL INSERT dump for seeding.

**Tables to export (17 total):**
`profiles`, `user_roles`, `drgreen_clients`, `drgreen_orders`, `drgreen_cart`, `strains`, `strain_knowledge`, `generated_product_images`, `articles`, `email_templates`, `email_logs`, `dosage_logs`, `prescription_documents`, `kyc_journey_logs`, `launch_interest`, `wallet_email_mappings`, `wallet_auth_nonces`

**Deliverables:**
- Individual CSV files per table in `/mnt/documents/db-export/`
- One consolidated `seed_data.sql` file with INSERT statements for all tables
- A `001_schema.sql` consolidated migration file (Supabase-free, plain PostgreSQL)

## Part 2: End-to-End Testing

Browser-based testing of the live preview across these areas:

### 2a. Public Site
- Homepage loads, navigation works, responsive at mobile/tablet/desktop
- Footer, language switcher, cookie consent

### 2b. User Auth Flow
- Sign up / Sign in page renders correctly
- Form validation (empty fields, invalid email, short password)
- Password visibility toggle
- Forgot password flow UI

### 2c. Patient Journey
- Post-login redirect based on verification status
- Dashboard status page for unverified users
- Shop access for verified users (ComplianceGuard behavior)

### 2d. Admin Portal
- Admin login and redirect to admin dashboard
- All admin pages load: Dashboard, Orders, Clients, Strains, Tools, Settings, Roles, Wallet Mappings
- Admin layout sidebar navigation
- Tables render with data, filters work
- Responsive behavior at mobile widths

### 2e. Responsiveness Checks
- Test at 375px (mobile), 768px (tablet), 1280px (desktop)
- Navigation overlay on mobile
- Admin sidebar collapse behavior
- Cart/shop layout stacking

### Testing Output
A summary report of findings: bugs, layout issues, broken flows, and recommendations.

