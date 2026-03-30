import AdminLayout from "@/layout/AdminLayout";
import { WalletEmailMappings } from "@/components/admin/WalletEmailMappings";

const AdminWalletMappings = () => (
  <AdminLayout
    title="Wallet-Email Mappings"
    description="Manage wallet-to-email account linking for NFT-authenticated admin access"
  >
    <WalletEmailMappings />
  </AdminLayout>
);

export default AdminWalletMappings;
