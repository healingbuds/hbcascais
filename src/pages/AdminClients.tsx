import AdminLayout from "@/layout/AdminLayout";
import { AdminClientManager } from "@/components/admin/AdminClientManager";
import { AdminClientImport } from "@/components/admin/AdminClientImport";

const AdminClients = () => (
  <AdminLayout
    title="Client Management"
    description="Search, import, and manage client records with Dr. Green DApp"
  >
    <div className="space-y-8">
      <AdminClientImport />
      <AdminClientManager />
    </div>
  </AdminLayout>
);

export default AdminClients;
