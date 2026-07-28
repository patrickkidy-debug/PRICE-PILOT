"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setChargement(false);

    if (result?.error) {
      setErreur("Email ou mot de passe incorrect.");
      return;
    }

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

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Connexion</h1>
        <p className="mt-1 text-sm text-slate-300">Accédez à votre assistant copilote d&apos;achat</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-200">
              Email
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
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>
          {erreur && <p className="text-sm font-medium text-rose-400">{erreur}</p>}
          <button
            type="submit"
            disabled={chargement}
            className="w-full rounded-xl bg-primary px-4 py-3.5 font-bold text-white primary-glow transition-all hover:bg-primary-hover active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/25"
          >
            {chargement ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-300 text-center">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="font-bold text-primary hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}
