import type { ReactNode } from "react";
import { AppNavbar } from "@/components/ui/app-navbar";

export default function SupplierProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)" }}>
      <AppNavbar role="supplier" />
      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 24px" }}>
        {children}
      </main>
    </div>
  );
}