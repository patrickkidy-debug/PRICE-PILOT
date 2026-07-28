"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  planCode: "START" | "STANDARD" | "GROWTH";
  libelle: string;
  misEnAvant: boolean;
  connecte: boolean;
}

export function BoutonAbonnement({ planCode, libelle, misEnAvant, connecte }: Props) {
  const router = useRouter();
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function souscrire() {
    if (!connecte) {
      router.push("/inscription");
      return;
    }

    setErreur(null);
    setChargement(true);

    const response = await fetch("/api/paiement/initier", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planCode }),
    });

    const data = await response.json();

    if (!response.ok) {
      setChargement(false);
      setErreur(data.error ?? "Le paiement n'a pas pu démarrer.");
      return;
    }

    // PayTech héberge la page de paiement (Orange Money, Wave, carte...).
    window.location.href = data.urlRedirection;
  }

  return (
    <div>
      <button
        onClick={souscrire}
        disabled={chargement}
        className={`w-full rounded-xl px-4 py-3.5 text-center text-sm font-bold transition-all active:scale-95 disabled:opacity-50 ${
          misEnAvant
            ? "primary-glow bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/25"
            : "border border-white/20 text-white hover:bg-white/10"
        }`}
      >
        {chargement ? "Redirection..." : libelle}
      </button>
      {erreur && <p className="mt-2 text-xs text-rose-400 font-medium">{erreur}</p>}
    </div>
  );
}
