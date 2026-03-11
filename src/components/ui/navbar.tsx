// src/components/ui/app-navbar.tsx
// STEP 5 OF 5 — SHARED NAVBAR
// Drop-in replacement. Keeps all existing props/logic, updates visual style only.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNavbar({ role }: { role: "buyer" | "supplier" }) {
  const pathname = usePathname();

  const buyerLinks = [
    { href: "/dashboard/buyer",           label: "Dashboard" },
    { href: "/dashboard/buyer/rfqs/new",  label: "New RFQ" },
    { href: "/dashboard/buyer/rfqs",      label: "My RFQs" },
    { href: "/dashboard/buyer/suppliers", label: "Suppliers" },
  ];

  const supplierLinks = [
    { href: "/dashboard/supplier",          label: "Dashboard" },
    { href: "/dashboard/supplier/rfqs",     label: "RFQ Inbox" },
    { href: "/profile/supplier",            label: "Profile" },
  ];

  const links = role === "buyer" ? buyerLinks : supplierLinks;

  return (
    <header style={{
      height: "44px",
      backgroundColor: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      paddingLeft: "24px",
      paddingRight: "24px",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <Link
        href={role === "buyer" ? "/dashboard/buyer" : "/dashboard/supplier"}
        style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", marginRight: "32px" }}
      >
        <div style={{
          width: "20px", height: "20px",
          backgroundColor: "var(--brand)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="white">
            <rect x="0"   y="0"   width="4.5" height="4.5"/>
            <rect x="6.5" y="0"   width="4.5" height="4.5"/>
            <rect x="0"   y="6.5" width="4.5" height="4.5"/>
            <rect x="6.5" y="6.5" width="4.5" height="4.5"/>
          </svg>
        </div>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12.5px",
          fontWeight: 500,
          color: "var(--text)",
          letterSpacing: "0.04em",
        }}>
          SupplyMesh
        </span>
      </Link>

      {/* Nav links */}
      <nav style={{ display: "flex", alignItems: "center", height: "100%" }}>
        {links.map(({ href, label }) => {
          const isActive = href === "/dashboard/buyer" || href === "/dashboard/supplier"
            ? pathname === href
            : pathname.startsWith(href);

          return (
            <Link key={href} href={href} style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              fontSize: "12px",
              fontWeight: isActive ? 500 : 400,
              color: isActive ? "var(--text)" : "var(--text-muted)",
              textDecoration: "none",
              borderBottom: isActive ? "2px solid var(--brand)" : "2px solid transparent",
              transition: "color 0.1s, border-color 0.1s",
            }}>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right side */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          fontWeight: 500,
          padding: "2px 7px",
          backgroundColor: "var(--surface2)",
          color: "var(--text-muted)",
          border: "1px solid var(--border2)",
          textTransform: "uppercase" as const,
          letterSpacing: "0.07em",
          borderRadius: "2px",
        }}>
          {role}
        </span>

        <form action="/auth/signout" method="POST">
          <button type="submit" style={{
            fontFamily: "var(--font-sans)",
            fontSize: "12px",
            color: "var(--text-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 8px",
            transition: "color 0.1s",
          }}>
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
export { AppNavbar as Navbar } from "./app-navbar";