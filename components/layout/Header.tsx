import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export async function Header() {
  const session = await auth();
  const initiale = session?.user?.name?.charAt(0)?.toUpperCase() ?? "?";
  // Le rôle vient du jeton de session : aucune requête en base à chaque rendu.
  const admin = session?.user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-surface/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-20 max-w-container items-center justify-between px-6 md:px-16">
        <Link href="/" className="text-2xl font-bold tracking-tighter text-primary">
          PricePilot
        </Link>
        <div className="flex items-center gap-6 text-sm text-on-surface-variant">
          {session?.user ? (
            <>
              <Link href="/assistant" className="transition-colors hover:text-primary">
                Assistant
              </Link>
              <Link href="/recherche" className="hidden transition-colors hover:text-primary sm:block">
                Base locale
              </Link>
              <Link href="/contribuer" className="hidden transition-colors hover:text-primary sm:block">
                Signaler un prix
              </Link>
              <Link href="/compte" className="transition-colors hover:text-primary">
                Compte
              </Link>
              {admin && (
                <Link
                  href="/console"
                  className="flex items-center gap-1.5 rounded-full border border-tertiary/30 bg-tertiary/10 px-3 py-1.5 text-tertiary transition-colors hover:bg-tertiary/20"
                >
                  <span className="material-symbols-outlined text-[16px]">shield_person</span>
                  Console fondateur
                </Link>
              )}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-primary/15 text-sm font-semibold text-primary">
                  {initiale}
                </div>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button type="submit" className="transition-colors hover:text-primary">
                    Quitter
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              <Link href="/tarifs" className="transition-colors hover:text-primary">
                Tarifs
              </Link>
              <Link href="/connexion" className="transition-colors hover:text-primary">
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="primary-glow rounded-lg bg-primary-container px-5 py-2 font-semibold text-white transition-transform hover:scale-105 active:scale-95"
              >
                Commencer
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
