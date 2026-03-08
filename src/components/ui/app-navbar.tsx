import Link from "next/link";
import Image from "next/image";

export function AppNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(20,42,64,0.85)] backdrop-blur-xl">
      <div className="container-shell flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/brand/logo-full-white.svg"
            alt="SupplyMesh"
            width={160}
            height={38}
            className="h-9 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center gap-5">
          <Link
            href="/profile"
            className="text-sm font-medium text-white/75 transition hover:text-white"
          >
            Profile
          </Link>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm font-medium text-white/75 transition hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
