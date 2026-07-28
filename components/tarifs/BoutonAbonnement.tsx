"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  planCode: "START" | "STANDARD" | "GROWTH";
  libelle: string;
  misEnAvant: boolean;
  connecte: boolean;
  /** Montant dans l'unité principale de la devise (ex. 1800 pour 1800 FCFA). */
  montant: number;
  clePublique: string;
  bacASable: boolean;
}

// Fonctions injectées par le script KkiaPay chargé dans app/layout.tsx.
declare global {
  interface Window {
    openKkiapayWidget?: (options: Record<string, unknown>) => void;
    addSuccessListener?: (cb: (reponse: { transactionId: string }) => void) => void;
    addFailedListener?: (cb: (erreur: unknown) => void) => void;
  }
}

export function BoutonAbonnement({
  planCode,
  libelle,
  misEnAvant,
  connecte,
  montant,
  clePublique,
  bacASable,
}: Props) {
  const router = useRouter();
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  // Le widget est partagé par tous les boutons de la page : sans ce drapeau,
  // chaque bouton réagirait au paiement déclenché par un autre.
  const attenteRef = useRef(false);

  const confirmerPaiement = useCallback(
    async (transactionId: string) => {
      setChargement(true);
      setErreur(null);

      const reponse = await fetch("/api/paiement/verifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, plan: planCode }),
      });

      const data = await reponse.json().catch(() => null);
      setChargement(false);

      if (!reponse.ok) {
        setErreur(data?.error ?? "Paiement non confirmé. Contactez le support.");
        return;
      }

      router.push("/paiement/succes");
      router.refresh();
    },
    [planCode, router],
  );

  useEffect(() => {
    const succes = (reponse: { transactionId: string }) => {
      if (!attenteRef.current) return;
      attenteRef.current = false;
      void confirmerPaiement(reponse.transactionId);
    };
    const echec = () => {
      if (!attenteRef.current) return;
      attenteRef.current = false;
      setChargement(false);
      setErreur("Paiement annulé ou refusé.");
    };

    window.addSuccessListener?.(succes);
    window.addFailedListener?.(echec);
  }, [confirmerPaiement]);

  function souscrire() {
    if (!connecte) {
      router.push("/inscription");
      return;
    }
    if (!window.openKkiapayWidget) {
      setErreur("Le module de paiement n'a pas pu être chargé. Rechargez la page.");
      return;
    }

    setErreur(null);
    attenteRef.current = true;
    window.openKkiapayWidget({
      amount: montant,
      key: clePublique,
      sandbox: bacASable,
      position: "center",
      theme: "#ff6600",
      paymentmethod: "momo,card",
      data: JSON.stringify({ app: "pricepilot", planCode }),
    });
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
        {chargement ? "Confirmation…" : libelle}
      </button>
      {erreur && <p className="mt-2 text-xs font-medium text-rose-400">{erreur}</p>}
    </div>
  );
}
