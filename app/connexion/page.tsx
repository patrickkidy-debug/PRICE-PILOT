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

    router.push("/recherche");
    router.refresh();
  }

  return (
    <main className="aurora flex min-h-screen flex-col items-center justify-center px-6">
      <div className="glass-card w-full max-w-md rounded-2xl p-8">
        <Link href="/" className="mb-6 block text-xl font-bold text-primary">
          PricePilot
        </Link>
        <h1 className="text-2xl font-bold text-on-surface">Connexion</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-on-surface-variant">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-surface-container-high px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-on-surface-variant">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-surface-container-high px-3 py-2"
            />
          </div>
          {erreur && <p className="text-sm text-error">{erreur}</p>}
          <button
            type="submit"
            disabled={chargement}
            className="w-full rounded-xl bg-primary-container px-4 py-2.5 font-semibold text-white primary-glow transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {chargement ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>
        <p className="mt-4 text-sm text-on-surface-variant">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="font-semibold text-primary">
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}
