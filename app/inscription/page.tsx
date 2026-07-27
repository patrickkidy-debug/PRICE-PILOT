"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function InscriptionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const response = await fetch("/api/inscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      setErreur(data.error ?? "Une erreur est survenue.");
      setChargement(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    setChargement(false);

    if (result?.error) {
      router.push("/connexion");
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
        <h1 className="text-2xl font-bold text-on-surface">Créer un compte</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Vous démarrez automatiquement sur le palier Gratuit.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-on-surface-variant">
              Nom
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-surface-container-high px-3 py-2"
            />
          </div>
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
              minLength={8}
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
            {chargement ? "Création en cours..." : "Créer mon compte"}
          </button>
        </form>
        <p className="mt-4 text-sm text-on-surface-variant">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="font-semibold text-primary">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
