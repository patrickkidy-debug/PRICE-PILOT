"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChampMotDePasse } from "@/components/ui/ChampMotDePasse";

export default function InscriptionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [etape, setEtape] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    setEtape("Création de votre compte…");

    let response: Response;
    try {
      response = await fetch("/api/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
    } catch {
      setChargement(false);
      setErreur("Serveur injoignable. Vérifiez votre connexion et réessayez.");
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setChargement(false);
      setErreur(
        data?.error ??
          `Le serveur a répondu une erreur ${response.status}. Réessayez dans un instant.`,
      );
      return;
    }

    setEtape("Connexion…");
    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setChargement(false);
      router.push("/connexion");
      return;
    }

    setEtape("Ouverture de votre espace…");
    router.push("/assistant");
    router.refresh();
  }

  return (
    <main className="aurora flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 py-12 bg-[#0d0e12] text-white">
      <div className="glass-card w-full max-w-md rounded-3xl p-6 sm:p-10 border border-white/15 shadow-2xl shadow-primary/10">
        <Link href="/" className="mb-8 flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-bold group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-xl">flight_takeoff</span>
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">
            Price<span className="text-primary">Pilot</span>
          </span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Créer un compte</h1>
        <p className="mt-1 text-sm text-slate-300">
          Vous démarrez automatiquement sur le palier Gratuit.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-200">
              Nom complet
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Ex: Aminata Diallo"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-200">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="votre@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-200">
              Mot de passe
            </label>
            <ChampMotDePasse
              id="password"
              valeur={password}
              onChange={setPassword}
              longueurMinimale={8}
              placeholder="Au moins 8 caractères"
              autoComplete="new-password"
            />
          </div>
          {erreur && <p className="text-sm font-medium text-rose-400">{erreur}</p>}
          <button
            type="submit"
            disabled={chargement}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-bold text-white primary-glow transition-all hover:bg-primary-hover active:scale-95 disabled:opacity-60 shadow-lg shadow-primary/25"
          >
            {chargement && (
              <span className="material-symbols-outlined animate-spin text-[18px]">
                progress_activity
              </span>
            )}
            {chargement ? etape : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-300 text-center">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="font-bold text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
