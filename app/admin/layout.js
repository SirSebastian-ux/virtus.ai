import { requireAdminPage } from "@/lib/admin-auth";

export default async function AdminLayout({ children }) {
  await requireAdminPage();

  return children;
}
