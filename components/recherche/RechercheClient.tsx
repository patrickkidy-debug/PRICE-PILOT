"use client";

import { useState } from "react";
import Link from "next/link";
import type { RechercheReponse, ResultatRecherche, TriMode } from "@/types/recherche";
import { PAYS, PAYS_PAR_DEFAUT, villesDuPays } from "@/lib/countries";
import { formatMoney } from "@/lib/money";

type Position = { lat: number; lng: number } | null;

// Préremplit depuis la barre de recherche de la page d'accueil (?q=...) —
// lu une seule fois à l'initialisation du state, pas via un effet.
function requeteInitiale(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

const LIBELLES_VENDEUR: Record<string, string> = {
  CHAIN: "Enseigne",
  ONLINE: "En ligne",
  LOCAL_SHOP: "Commerçant local",
};

export function RechercheClient() {
  const [query, setQuery] = useState(requeteInitiale);
  const [tri, setTri] = useState<TriMode>("moins_cher");
  const [position, setPosition] = useState<Position>(null);
  const [pays, setPays] = useState(PAYS_PAR_DEFAUT);
  const [ville, setVille] = useState(villesDuPays(PAYS_PAR_DEFAUT)[0]?.nom ?? "");
  const [resultats, setResultats] = useState<ResultatRecherche[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [quotaAtteint, setQuotaAtteint] = useState<{ limit: number; planCode: string } | null>(
    null,
  );
  const [chargement, setChargement] = useState(false);

  const villes = villesDuPays(pays);

  function changerPays(codePays: string) {
    setPays(codePays);
    setVille(villesDuPays(codePays)[0]?.nom ?? "");
    setPosition(null);
  }

  function positionVille(): { lat: number; lng: number } {
    const v = villes.find((x) => x.nom === ville) ?? villes[0];
    return { lat: v?.lat ?? 0, lng: v?.lng ?? 0 };
  }

  function localiser() {
    if (!navigator.geolocation) {
      setPosition(positionVille());
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setPosition(positionVille()),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setQuotaAtteint(null);
    setResultats(null);
    setChargement(true);

    const pos = position ?? positionVille();

    const response = await fetch("/api/recherche", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, lat: pos.lat, lng: pos.lng, countryCode: pays, tri }),
    });

    const data = await response.json();
    setChargement(false);

    if (response.status === 403 && data.quota) {
      setQuotaAtteint({ limit: data.quota.limit, planCode: data.quota.planCode });
      setErreur(data.error);
      return;
    }

    if (!response.ok) {
      setErreur(data.error ?? "Une erreur est survenue.");
      return;
    }

    const reponse = data as RechercheReponse;
    setResultats(reponse.resultats);
  }

  return (
    <div className="mt-6">
      <form onSubmit={handleSubmit} className="glass-card space-y-4 rounded-2xl p-6">
        <div>
          <label htmlFor="query" className="block text-sm font-medium text-on-surface-variant">
            Produit recherché
          </label>
          <div className="mt-1 flex items-center rounded-xl border border-white/10 bg-surface-container-high px-3">
            <span className="material-symbols-outlined text-primary">search</span>
            <input
              id="query"
              type="text"
              required
              placeholder="ex : riz parfumé 25kg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border-none bg-transparent px-2 py-2.5 text-on-surface focus:outline-none focus:ring-0"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="pays" className="block text-sm font-medium text-on-surface-variant">
              Pays
            </label>
            <select
              id="pays"
              value={pays}
              onChange={(e) => changerPays(e.target.value)}
              className="mt-1 rounded-xl border border-white/10 bg-surface-container-high px-3 py-2"
            >
              {PAYS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ville" className="block text-sm font-medium text-on-surface-variant">
              Ville
            </label>
            <select
              id="ville"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="mt-1 rounded-xl border border-white/10 bg-surface-container-high px-3 py-2"
            >
              {villes.map((v) => (
                <option key={v.nom} value={v.nom}>
                  {v.nom}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={localiser}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">
              {position ? "my_location" : "location_searching"}
            </span>
            {position ? "Position détectée" : "Utiliser ma position"}
          </button>

          <div>
            <label htmlFor="tri" className="block text-sm font-medium text-on-surface-variant">
              Trier par
            </label>
            <select
              id="tri"
              value={tri}
              onChange={(e) => setTri(e.target.value as TriMode)}
              className="mt-1 rounded-xl border border-white/10 bg-surface-container-high px-3 py-2"
            >
              <option value="moins_cher">Prix le moins cher</option>
              <option value="qualite_prix">Meilleur rapport qualité-prix</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={chargement}
          className="flex items-center gap-2 rounded-xl bg-primary-container px-6 py-2.5 font-semibold text-white primary-glow transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          {chargement ? "Recherche en cours..." : "Rechercher"}
        </button>
      </form>

      {erreur && (
        <div className="mt-6 rounded-2xl border border-error/30 bg-error-container/20 p-4 text-sm text-on-error-container">
          <p>{erreur}</p>
          {quotaAtteint && (
            <Link href="/tarifs" className="mt-2 inline-block font-semibold underline">
              Voir les paliers supérieurs
            </Link>
          )}
        </div>
      )}

      {resultats && resultats.length === 0 && !erreur && (
        <div className="glass-card mt-6 rounded-2xl p-6 text-center">
          <p className="text-on-surface-variant">
            Aucun résultat pour cette recherche dans notre base.
          </p>
          <Link
            href="/contribuer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary-container px-5 py-2 text-sm font-semibold text-white primary-glow transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add_business</span>
            Signaler un prix que vous connaissez
          </Link>
        </div>
      )}

      {resultats && resultats.length > 0 && (
        <ul className="mt-6 space-y-3">
          {resultats.map((r, i) => (
            <li key={`${r.productId}-${r.retailerName}-${r.branchName ?? "national"}-${i}`}>
              <a
                href={r.lienBoutique ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card block rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-on-surface">{r.productName}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">storefront</span>
                      {r.retailerName}
                      {r.branchName ? ` — ${r.branchName}` : ""}
                      {r.city ? ` · ${r.city}` : ""}
                      {r.distanceKm != null && ` · à ${r.distanceKm} km`}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-on-surface-variant">
                        {LIBELLES_VENDEUR[r.retailerKind] ?? r.retailerKind}
                      </span>
                      {r.contributionCommunautaire && (
                        <span className="rounded-full bg-tertiary-container/15 px-2.5 py-0.5 text-[11px] font-medium text-tertiary">
                          Prix signalé par la communauté
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-lg font-bold text-primary">
                      {formatMoney(r.priceMinor, r.currency)}
                    </span>
                    <p className="mt-1 flex items-center justify-end gap-1 text-xs text-on-surface-variant">
                      Voir la boutique
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </p>
                  </div>
                </div>
                {r.isStale && (
                  <p className="mt-2 text-xs text-amber-600">
                    Prix non actualisé depuis plus de 14 jours — à confirmer auprès du vendeur.
                  </p>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
