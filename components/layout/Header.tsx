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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-amber-500 shadow-md shadow-primary/30 group-hover:scale-105 transition-transform text-white">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M2.5 19h19v2h-19zm19.57-9.36c-.21-.8-1.04-1.28-1.84-1.06L14.92 10.2 8.46 3.74 6.34 4.8l3.96 5.86-4.6 1.23-2.12-1.59-1.41.71 2.47 3.29 17.43-4.66z"/>
            </svg>
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
