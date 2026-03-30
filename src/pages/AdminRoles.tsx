/**
 * AdminRoles Page
 * 
 * Admin page for managing user roles.
 * Uses AdminLayout for consistent admin navigation.
 */

import { lazy, Suspense } from "react";
import AdminLayout from "@/layout/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";

const AdminUserRoles = lazy(() => import("@/components/admin/AdminUserRoles"));

const AdminRoles = () => {
  return (
    <AdminLayout
      title="User Role Management"
      description="Assign and manage user roles across the platform"
    >
      <Suspense fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      }>
        <AdminUserRoles />
      </Suspense>
    </AdminLayout>
  );
};

export default AdminRoles;
