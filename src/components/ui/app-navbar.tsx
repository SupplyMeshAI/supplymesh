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
    { href: "/dashboard/supplier",        label: "Dashboard" },
    { href: "/dashboard/supplier/rfqs",   label: "RFQ Inbox" },
    { href: "/profile/supplier",          label: "Profile" },
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
        style={{ textDecoration: "none", display: "flex", alignItems: "center", marginRight: "32px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-full-white.svg"
          alt="SupplyMesh"
          style={{ height: "50px", width: "auto" }}
        />
      </Link>

      {/* Nav links */}
      <nav style={{ display: "flex", alignItems: "center", height: "100%" }}>
        {links.map(({ href, label }) => {
          // Exact match for dashboard root and /rfqs list; prefix match for everything else
          const isActive = (
            href === "/dashboard/buyer" ||
            href === "/dashboard/supplier" ||
            href === "/dashboard/buyer/rfqs" ||
            href === "/dashboard/supplier/rfqs"
          )
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
          fontWeight: 600,
          padding: "2px 8px",
          backgroundColor: role === "buyer" ? "rgba(37,99,235,0.15)" : "rgba(245,158,11,0.15)",
          color: role === "buyer" ? "#60a5fa" : "#fbbf24",
          border: `1px solid ${role === "buyer" ? "rgba(37,99,235,0.4)" : "rgba(245,158,11,0.4)"}`,
          textTransform: "uppercase" as const,
          letterSpacing: "0.08em",
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

// Keeps existing imports of { Navbar } from "./navbar" working
export { AppNavbar as Navbar };
