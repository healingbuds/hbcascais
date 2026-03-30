

## Remove Admin Route Protection

**What**: Strip the `ProtectedRoute` wrapper from all admin routes in `src/App.tsx` so the admin pages load without requiring authentication.

**Why**: On this freshly remixed project, you need to access admin tools (like the API health check) without first setting up an admin account.

### Changes

**File: `src/App.tsx` (lines ~114-124)**

Remove the `<ProtectedRoute requiredRole="admin">...</ProtectedRoute>` wrapper from each admin route, leaving the page components rendered directly. For example:

```tsx
// Before
<Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />

// After
<Route path="/admin" element={<AdminDashboard />} />
```

Apply the same change to all 11 admin routes (`/admin`, `/admin/clients`, `/admin/orders`, `/admin/prescriptions`, `/admin/strains`, `/admin/strain-sync`, `/admin/strain-knowledge`, `/admin/roles`, `/admin/wallet-mappings`, `/admin/tools`, `/admin/settings`).

**Note**: The `useUserRole` hook inside `AdminLayout` or individual admin pages may still check roles for UI-level gating. Those would remain untouched — this change only removes the route-level auth gate.

