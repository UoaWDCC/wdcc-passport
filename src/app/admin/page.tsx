import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { requireAdmin } from "@/lib/access";

export default async function Admin() {
  await requireAdmin();

  return <AdminDashboard />;
}
