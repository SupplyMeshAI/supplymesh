import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(20,42,64,0.72)] backdrop-blur-xl">
      <div className="container-shell flex h-[84px] items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/brand/logo-full-white.svg"
            alt="SupplyMesh"
            width={220}
            height={52}
            className="h-11 w-auto"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          <Link
            href="/suppliers"
            className="text-sm font-medium text-white/75 transition hover:text-white"
          >
            Suppliers
          </Link>
          <Link
            href="/buyers"
            className="text-sm font-medium text-white/75 transition hover:text-white"
          >
            Buyers
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-white/75 transition hover:text-white"
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-white hover:bg-white/8 hover:text-white">
              Log in
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="bg-white text-[#173650] hover:bg-white/90 font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
              Get early access
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}