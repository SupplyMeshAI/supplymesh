import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { AppNavbar } from "@/components/ui/app-navbar";

export default async function SupplierLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)" }}>
      <AppNavbar role="supplier" />
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "28px 24px" }}>
        {children}
      </main>
    </div>
  );
}