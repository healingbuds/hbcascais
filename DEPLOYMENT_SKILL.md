# Skill: Deploying an npm-based SPA to cPanel Shared Hosting

## 1. Build Locally
- Run `npm install` (or `npm ci`) to install dependencies.
- Run `npm run build` to generate the static site (usually in `dist/` or `build/`).

## 2. Prepare for Upload
- Zip the contents of the build output folder (`dist/` or `build/`).
- Do **not** include the folder itself—zip the contents so `index.html` is at the root of the zip.

## 3. Clean the Target Directory
- In cPanel File Manager, go to `public_html/` (or your subfolder).
- Backup `.htaccess` (rename to `.htaccess.backup`).
- Delete all files and folders except your `.htaccess.backup` (or any other critical files).

## 4. Upload and Extract
- Upload your zip file to `public_html/`.
- Extract the zip so `index.html` is directly inside `public_html/`.

## 5. Configure SPA Routing
- Create or edit `.htaccess` in `public_html/` with:
  ```
  <IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
  </IfModule>
  ```
- This ensures client-side routing works for your SPA.

## 6. Environment Variables
- All environment variables must be set at build time (e.g., `VITE_API_URL`). Rebuild if you need to change them.

## 7. Test and Troubleshoot
- Visit your domain to verify the deployment.
- If you see a blank page, check `.htaccess` and make sure all assets are uploaded.
- Purge CDN or browser cache if needed.

## 8. Node.js/SSR Apps (if needed)
- Only use this if your cPanel has “Setup Node.js App.”
- Set up the app, upload code, run `npm install` via cPanel, and start the app as described in the forum post.

---

This skill ensures a clean, reliable deployment for static npm-based apps on shared hosting with cPanel.