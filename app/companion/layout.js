import {requireAdminPage} from "@/lib/admin-auth";
export const dynamic="force-dynamic";
export default async function CompanionLayout({children}){await requireAdminPage();return children;}
