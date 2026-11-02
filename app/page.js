import { createClient } from "@/lib/supabase-server";
import { isAdminUser } from "@/lib/admin-auth";
import { Suspense } from "react";
import HomeClient from "./HomeClient";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <Suspense fallback={null}>
      <HomeClient isAdmin={isAdminUser(user)} />
    </Suspense>
  );
}