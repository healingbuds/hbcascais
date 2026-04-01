# Healing Buds Deployment & Setup Guide

**Last Updated:** 2026-04-01  
**Status:** Production Live ✓  
**Site:** https://healingbuds.co.za

---

## TABLE OF CONTENTS
1. [Quick Deployment](#quick-deployment)
2. [Credentials & Keys](#credentials--keys)
3. [Server Information](#server-information)
4. [Common Pitfalls & Fixes](#common-pitfalls--fixes)
5. [File Permissions](#file-permissions)
6. [.htaccess Configuration](#htaccess-configuration)
7. [Build & Deploy Process](#build--deploy-process)
8. [Troubleshooting](#troubleshooting)

---

## QUICK DEPLOYMENT

### One-Command Deploy (from local machine):
```bash
cd /path/to/hbcascais

# 1. Build latest version
npm run build

# 2. Copy dist to public
cp -r dist/* public/

# 3. Deploy to server
scp -r -i id_rsa_nodepass public/* healingbuds@healingbuds.co.za:~/public_html/

# 4. Fix permissions on server
ssh -i id_rsa_nodepass healingbuds@healingbuds.co.za \
  "chmod -R 755 public_html/assets public_html/fonts public_html/email-assets; \
   find public_html/assets -type f -exec chmod 644 {} \; 2>/dev/null; \
   find public_html/fonts -type f -exec chmod 644 {} \; 2>/dev/null"
```

---

## CREDENTIALS & KEYS

### SSH Access
- **SSH Key File:** `id_rsa_nodepass`
- **SSH Key ID:** `id_rsa_claude` (alternate)
- **Server User:** `healingbuds`
- **Server Host:** `healingbuds.co.za`
- **Port:** 22 (standard)

**SSH Connection Test:**
```bash
ssh -i id_rsa_nodepass -o StrictHostKeyChecking=no healingbuds@healingbuds.co.za "id; pwd"
```

Expected output:
```
uid=3285(healingbuds) gid=3290(healingbuds) groups=3290(healingbuds)
/home/healingbuds
```

### cPanel Access
- **Account:** healingbuds2025 (legacy reference, do NOT use for SSH)
- **Hosting Path:** `/home/healingbuds/public_html/`
- **Server IP:** 91.204.209.43
- **Web Server:** LiteSpeed (NOT Apache)

### Environment Variables (GitHub Secrets)
```
CPANEL_SSH_KEY    = contents of id_rsa_nodepass
CPANEL_HOST       = healingbuds.co.za
CPANEL_USER       = healingbuds
```

### Application Secrets (.env)
```
VITE_SUPABASE_PROJECT_ID=vzacvnjbdrdpvlbwvpoh
VITE_SUPABASE_URL=https://vzacvnjbdrdpvlbwvpoh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[store offline]
VITE_MAPBOX_TOKEN=[store offline]
VITE_WALLET_CONNECT_PROJECT_ID=[store offline]
```

---

## SERVER INFORMATION

### Server Specs
- **Web Server:** LiteSpeed
- **OS:** Linux/cPanel
- **PHP:** Available
- **Node.js:** Available (via nvm)
- **SSH Allowed:** Yes
- **SCP Allowed:** Yes

### Directory Structure
```
/home/healingbuds/
├── public_html/                 ← PRODUCTION ROOT
│   ├── .htaccess               ← LiteSpeed-optimized
│   ├── index.html              ← SPA entry point
│   ├── favicon.ico
│   ├── manifest.json
│   ├── robots.txt
│   ├── .cpanel.yml
│   ├── assets/                 ← 1100+ minified files (755 dir, 644 files)
│   ├── fonts/
│   ├── email-assets/
│   └── hero-video.mp4
└── [other system dirs]
```

### Key File Permissions
```
public_html/                755  drwxr-xr-x
public_html/.htaccess       644  -rw-r--r--
public_html/index.html      644  -rw-r--r--
public_html/assets/         755  drwxr-xr-x
public_html/assets/*.js     644  -rw-r--r--
public_html/assets/*.css    644  -rw-r--r--
public_html/fonts/          755  drwxr-xr-x
public_html/fonts/*         644  -rw-r--r--
```

---

## COMMON PITFALLS & FIXES

### ❌ MIME Type Errors: "text/html instead of text/css"
**Cause:** Missing `AddType` directives in .htaccess  
**Solution:** Ensure .htaccess contains:
```apache
AddType application/javascript .js
AddType text/css .css
AddType font/woff2 .woff2
AddType font/woff .woff
```

### ❌ MIME Type Errors: Rewrite Loop
**Cause:** LiteSpeed doesn't respect `!-f` conditions like Apache  
**Solution:** Add LiteSpeed StaticContext:
```apache
<LiteSpeed>
  StaticContext /assets { }
  StaticContext /fonts { }
</LiteSpeed>
```

### ❌ 404 Errors on Assets
**Cause:** Directory permissions too restrictive (700)  
**Solution:** Set to 755:
```bash
chmod -R 755 public_html/assets public_html/fonts
find public_html/assets -type f -exec chmod 644 {} \;
```

### ❌ 403 Forbidden on Files
**Cause:** Files have execute bit set (755 instead of 644)  
**Solution:** Strip execute:
```bash
find public_html/assets -type f -exec chmod 644 {} \;
find public_html/fonts -type f -exec chmod 644 {} \;
```

### ❌ SPA Routes Return 404
**Cause:** .htaccess rewrite rules broken  
**Solution:** Verify RewriteRule order:
```apache
# CORRECT - Exclude static paths FIRST
RewriteRule ^assets/ - [L]
RewriteRule ^fonts/ - [L]
# THEN - Catch-all redirect to index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]
```

### ❌ Supabase "URL is required" Error
**Cause:** Build missing .env file during npm run build  
**Solution:** Ensure .env in latest-hb before building:
```bash
cp .env latest-hb/.env
cd latest-hb
npm run build
```

### ❌ SSH "Permission denied (publickey)"
**Cause:** Wrong SSH key or user  
**Solution:** Use correct key:
```bash
ssh -i id_rsa_nodepass (NOT id_rsa_claude)
ssh healingbuds@healingbuds.co.za (NOT healingbuds2025)
```

---

## FILE PERMISSIONS

### After Every Deployment, Run:
```bash
# Via SSH:
ssh -i id_rsa_nodepass healingbuds@healingbuds.co.za << 'EOF'
  chmod -R 755 public_html/assets public_html/fonts public_html/email-assets
  find public_html/assets -type f -exec chmod 644 {} \; 2>/dev/null
  find public_html/fonts -type f -exec chmod 644 {} \; 2>/dev/null
  find public_html/email-assets -type f -exec chmod 644 {} \; 2>/dev/null
  echo "Done"
EOF
```

### Verify Permissions:
```bash
ssh -i id_rsa_nodepass healingbuds@healingbuds.co.za \
  "ls -ld public_html/assets; ls -ld public_html/fonts; stat public_html/assets"
```

Expected:
```
drwxr-xr-x  healingbuds healingbuds  public_html/assets
drwxr-xr-x  healingbuds healingbuds  public_html/fonts
```

---

## .htaccess CONFIGURATION

### Critical .htaccess Rules (Must Have)

**1. LiteSpeed StaticContext** (MUST come first):
```apache
<LiteSpeed>
  StaticContext /assets { }
  StaticContext /fonts { }
  StaticContext /email-assets { }
</LiteSpeed>
```

**2. Exclude Static Paths Before Catch-All:**
```apache
RewriteRule ^assets/ - [L]
RewriteRule ^fonts/ - [L]
RewriteRule ^email-assets/ - [L]
```

**3. MIME Types MUST be at End:**
```apache
AddType application/javascript .js
AddType text/css .css
AddType font/woff2 .woff2
AddCharset UTF-8 .js .css .json
```

### Check .htaccess on Server:
```bash
ssh -i id_rsa_nodepass healingbuds@healingbuds.co.za \
  "grep -E 'StaticContext|AddType|RewriteRule' public_html/.htaccess"
```

---

## BUILD & DEPLOY PROCESS

### Step 1: Prepare Local Build
```bash
cd ~/hbcascais

# Ensure latest code
git pull origin main

# Copy environment vars if needed
cp .env latest-hb/.env 2>/dev/null || true

# Install deps & build
npm install
npm run build

# Verify dist created
ls -la dist/ | head -10
```

### Step 2: Sync to Public Folder
```bash
# Remove old assets
rm -rf public/assets public/fonts public/email-assets

# Copy new build
cp -r dist/* public/

# Verify
ls -lh public/assets | head -5
```

### Step 3: Deploy to Server
```bash
# Deploy via SCP
scp -r -i id_rsa_nodepass public/* healingbuds@healingbuds.co.za:~/public_html/

# Verify upload
ssh -i id_rsa_nodepass healingbuds@healingbuds.co.za \
  "ls -lah public_html/index.html; echo '---'; ls -1 public_html/assets/*.js | wc -l"
```

### Step 4: Fix Permissions
```bash
ssh -i id_rsa_nodepass healingbuds@healingbuds.co.za << 'EOF'
chmod -R 755 public_html/assets public_html/fonts public_html/email-assets
find public_html/assets -type f -exec chmod 644 {} \; 2>/dev/null
find public_html/fonts -type f -exec chmod 644 {} \; 2>/dev/null
echo "✓ Permissions fixed"
EOF
```

### Step 5: Clear Cache & Test
```bash
# Browser: Ctrl+Shift+Delete (clear all)
# Browser: Ctrl+F5 (hard refresh)
# Check: https://healingbuds.co.za
# Console: No MIME type errors should appear
```

---

## TROUBLESHOOTING

### Verify CSS/JS MIME Types
```bash
# From server:
ssh -i id_rsa_nodepass healingbuds@healingbuds.co.za << 'EOF'
echo "=== CSS MIME Type ==="
curl -Is https://healingbuds.co.za/assets/index-*.css 2>/dev/null | grep content-type | head -1

echo "=== JS MIME Type ==="
curl -Is https://healingbuds.co.za/assets/index-*.js 2>/dev/null | grep content-type | head -1

echo "=== Asset Count ==="
ls -1 public_html/assets/*.js 2>/dev/null | wc -l
ls -1 public_html/assets/*.css 2>/dev/null | wc -l
EOF
```

Expected Output:
```
=== CSS MIME Type ===
content-type: text/css

=== JS MIME Type ===
content-type: application/javascript

=== Asset Count ===
1100+
4
```

### Check .htaccess Processing
```bash
ssh -i id_rsa_nodepass healingbuds@healingbuds.co.za \
  "head -30 public_html/.htaccess"
```

Verify output includes:
- `<LiteSpeed>` section
- `StaticContext /assets`
- `RewriteRule ^assets/ - [L]`

### View Server Response Headers
```bash
# CSS file headers
ssh -i id_rsa_nodepass healingbuds@healingbuds.co.za \
  "curl -Is https://healingbuds.co.za/fonts/geist.css | head -15"

# Should show: content-type: text/css

# JS file headers  
ssh -i id_rsa_nodepass healingbuds@healingbuds.co.za \
  "curl -Is https://healingbuds.co.za/assets/index-*.js 2>/dev/null | head -15"

# Should show: content-type: application/javascript
```

### GitHub Actions Deployment (Alternative)
The repo includes automated deployment via `.github/workflows/deploy_to_cpanel.yml`  
When pushing to `main`:
1. Builds project on GitHub CI
2. Syncs via SSH to server
3. Requires secrets: `CPANEL_SSH_KEY`, `CPANEL_HOST`, `CPANEL_USER`

---

## EMERGENCY ROLLBACK

If deployment fails:
```bash
# Restore previous working version
git checkout HEAD~1

# Rebuild & redeploy
npm install && npm run build
cp -r dist/* public/
scp -r -i id_rsa_nodepass public/* healingbuds@healingbuds.co.za:~/public_html/

# Fix permissions
ssh -i id_rsa_nodepass healingbuds@healingbuds.co.za \
  "chmod -R 755 public_html/assets public_html/fonts; \
   find public_html/assets -type f -exec chmod 644 {} \; 2>/dev/null"
```

---

## NOTES

- **Never use `id_rsa_claude.pub`** - it doesn't work, use `id_rsa_nodepass`
- **Server uses LiteSpeed**, not Apache - StaticContext directives are critical
- **Always set 755 for dirs, 644 for files** - permissions fix most issues
- **Env vars must be in .env BEFORE building** - they're embedded in the artifact
- **Cache issues after deploy?** - Browser Ctrl+Shift+Del + Ctrl+F5, or wait 5 mins

---

**For Support:** Check logs via SSH or review browser console (F12)
