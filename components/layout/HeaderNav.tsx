"use client";

import { useState } from "react";
import Link from "next/link";

interface HeaderNavProps {
  sessionUser: {
    name?: string | null;
    email?: string | null;
    role?: string;
  } | null;
  signOutAction: () => Promise<void>;
}

export function HeaderNav({ sessionUser, signOutAction }: HeaderNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const initiale = sessionUser?.name?.charAt(0)?.toUpperCase() ?? "?";
  const admin = sessionUser?.role === "ADMIN";

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex md:items-center md:gap-6 text-sm text-slate-200">
        {sessionUser ? (
          <>
            <Link href="/assistant" className="transition-colors hover:text-primary font-medium">
              Assistant
            </Link>
            <Link href="/compte" className="transition-colors hover:text-primary font-medium">
              Compte
            </Link>
            {admin && (
              <Link
                href="/console"
                className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                <span className="material-symbols-outlined text-[16px]">shield_person</span>
                Console fondateur
              </Link>
            )}
            <div className="flex items-center gap-3 pl-2 border-l border-white/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-amber-500 text-sm font-bold text-white shadow-md shadow-primary/20">
                {initiale}
              </div>
              <form action={signOutAction}>
                <button type="submit" className="text-slate-300 transition-colors hover:text-primary text-sm font-medium">
                  Quitter
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <Link href="/tarifs" className="transition-colors hover:text-primary font-medium">
              Tarifs
            </Link>
            <Link href="/connexion" className="transition-colors hover:text-primary font-medium">
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="primary-glow rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 hover:bg-primary-hover"
            >
              Commencer
            </Link>
          </>
        )}
      </div>

      {/* Mobile Hamburger Button */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="flex md:hidden items-center justify-center p-2.5 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
        aria-label="Toggle Navigation Menu"
      >
        <span className="material-symbols-outlined text-2xl">
          {mobileMenuOpen ? "close" : "menu"}
        </span>
      </button>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-20 z-40 md:hidden border-b border-white/10 bg-[#0d0e12]/95 backdrop-blur-2xl p-6 shadow-2xl animate-fade-up">
          <div className="flex flex-col gap-4 text-base font-medium text-white">
            {sessionUser ? (
              <>
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-amber-500 font-bold text-white">
                    {initiale}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">{sessionUser.name}</span>
                    <span className="text-xs text-slate-400">{sessionUser.email}</span>
                  </div>
                </div>
                <Link
                  href="/assistant"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-primary">smart_toy</span>
                  Assistant AI
                </Link>
                <Link
                  href="/compte"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-primary">person</span>
                  Mon Compte
                </Link>
                {admin && (
                  <Link
                    href="/console"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg bg-primary/10 text-primary font-semibold"
                  >
                    <span className="material-symbols-outlined">shield_person</span>
                    Console fondateur
                  </Link>
                )}
                <form action={signOutAction} className="pt-2 border-t border-white/10">
                  <button
                    type="submit"
                    className="w-full text-left flex items-center gap-3 py-2 px-3 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <span className="material-symbols-outlined">logout</span>
                    Déconnexion
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/tarifs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Tarifs
                </Link>
                <Link
                  href="/connexion"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  onClick={() => setMobileMenuOpen(false)}
                  className="primary-glow mt-2 w-full text-center py-3 rounded-xl bg-primary font-bold text-white shadow-lg hover:bg-primary-hover"
                >
                  Commencer gratuitement
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
