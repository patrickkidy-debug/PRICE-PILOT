import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { HeaderNav } from "./HeaderNav";

export async function Header() {
  const session = await auth();

  const handleSignOut = async () => {
    "use server";
    await signOut({ redirectTo: "/" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0d0e12]/80 backdrop-blur-2xl">
      <nav className="mx-auto flex h-20 max-w-container items-center justify-between px-4 sm:px-8 md:px-16">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-amber-500 shadow-md shadow-primary/30 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-white text-2xl font-bold">flight_takeoff</span>
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">
            Price<span className="text-primary">Pilot</span>
          </span>
        </Link>

        <HeaderNav sessionUser={session?.user ?? null} signOutAction={handleSignOut} />
      </nav>
    </header>
  );
}
