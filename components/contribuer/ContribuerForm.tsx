"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PAYS, PAYS_PAR_DEFAUT, deviseDuPays, villesDuPays } from "@/lib/countries";

const CATEGORIES = [
  { value: "ALIMENTATION", label: "Alimentation" },
  { value: "BOISSONS", label: "Boissons" },
  { value: "HYGIENE_BEAUTE", label: "Hygiène & beauté" },
  { value: "ELECTRONIQUE", label: "Électronique" },
  { value: "ELECTROMENAGER", label: "Électroménager" },
  { value: "MAISON_JARDIN", label: "Maison & jardin" },
  { value: "AUTRE", label: "Autre" },
];

const TYPES_BOUTIQUE = [
  { value: "LOCAL_SHOP", label: "Commerçant / boutique de quartier" },
  { value: "CHAIN", label: "Grande enseigne" },
  { value: "ONLINE", label: "Vendeur en ligne" },
];

export function ContribuerForm() {
  const router = useRouter();
  const [produit, setProduit] = useState("");
  const [categorie, setCategorie] = useState("ALIMENTATION");
  const [prix, setPrix] = useState("");
  const [nomBoutique, setNomBoutique] = useState("");
  const [typeBoutique, setTypeBoutique] = useState("LOCAL_SHOP");
  const [adresse, setAdresse] = useState("");
  const [pays, setPays] = useState(PAYS_PAR_DEFAUT);
  const [ville, setVille] = useState(villesDuPays(PAYS_PAR_DEFAUT)[0]?.nom ?? "");
  const [lienBoutique, setLienBoutique] = useState("");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);

  const villes = villesDuPays(pays);
  const devise = deviseDuPays(pays);
  const estEnLigne = typeBoutique === "ONLINE";

  function changerPays(code: string) {
    setPays(code);
    setVille(villesDuPays(code)[0]?.nom ?? "");
    setPosition(null);
  }

  function localiser() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) =>
      setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setSucces(false);
    setChargement(true);

    const response = await fetch("/api/contributions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        produit,
        categorie,
        prix: Number(prix),
        nomBoutique,
        typeBoutique,
        adresse: adresse || undefined,
        ville,
        countryCode: pays,
        lat: position?.lat,
        lng: position?.lng,
        lienBoutique: lienBoutique || undefined,
      }),
    });

    const data = await response.json();
    setChargement(false);

    if (!response.ok) {
      setErreur(data.error ?? "Une erreur est survenue.");
      return;
    }

    setSucces(true);
    setProduit("");
    setPrix("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card mt-6 space-y-5 rounded-2xl p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="produit" className="block text-sm font-medium text-on-surface-variant">
            Produit
          </label>
          <input
            id="produit"
            type="text"
            required
            placeholder="ex : riz parfumé 25kg"
            value={produit}
            onChange={(e) => setProduit(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-surface-container-high px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="categorie" className="block text-sm font-medium text-on-surface-variant">
            Catégorie
          </label>
          <select
            id="categorie"
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-surface-container-high px-3 py-2"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="prix" className="block text-sm font-medium text-on-surface-variant">
            Prix observé ({devise})
          </label>
          <input
            id="prix"
            type="number"
            required
            min="0"
            step="any"
            value={prix}
            onChange={(e) => setPrix(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-surface-container-high px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="nomBoutique" className="block text-sm font-medium text-on-surface-variant">
            Nom de la boutique
          </label>
          <input
            id="nomBoutique"
            type="text"
            required
            placeholder="ex : Boutique Mame Diarra"
            value={nomBoutique}
            onChange={(e) => setNomBoutique(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-surface-container-high px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="typeBoutique"
            className="block text-sm font-medium text-on-surface-variant"
          >
            Type de vendeur
          </label>
          <select
            id="typeBoutique"
            value={typeBoutique}
            onChange={(e) => setTypeBoutique(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-surface-container-high px-3 py-2"
          >
            {TYPES_BOUTIQUE.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="pays-contrib" className="block text-sm font-medium text-on-surface-variant">
            Pays
          </label>
          <select
            id="pays-contrib"
            value={pays}
            onChange={(e) => changerPays(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-surface-container-high px-3 py-2"
          >
            {PAYS.map((p) => (
              <option key={p.code} value={p.code}>
                {p.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ville-contrib" className="block text-sm font-medium text-on-surface-variant">
            Ville
          </label>
          <select
            id="ville-contrib"
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-surface-container-high px-3 py-2"
          >
            {villes.map((v) => (
              <option key={v.nom} value={v.nom}>
                {v.nom}
              </option>
            ))}
          </select>
        </div>

        {!estEnLigne && (
          <div className="sm:col-span-2">
            <label htmlFor="adresse" className="block text-sm font-medium text-on-surface-variant">
              Adresse ou repère <span className="text-outline">(facultatif)</span>
            </label>
            <input
              id="adresse"
              type="text"
              placeholder="ex : Marché Sandaga, allée 3"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-surface-container-high px-3 py-2"
            />
          </div>
        )}

        <div className="sm:col-span-2">
          <label htmlFor="lien" className="block text-sm font-medium text-on-surface-variant">
            Lien vers la boutique <span className="text-outline">(facultatif)</span>
          </label>
          <input
            id="lien"
            type="url"
            placeholder="site web, page Facebook, fiche Google Maps..."
            value={lienBoutique}
            onChange={(e) => setLienBoutique(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-surface-container-high px-3 py-2"
          />
          <p className="mt-1 text-xs text-on-surface-variant">
            Sans lien, les acheteurs verront la boutique sur une carte à partir
            de sa position.
          </p>
        </div>
      </div>

      {!estEnLigne && (
        <button
          type="button"
          onClick={localiser}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[18px]">
            {position ? "my_location" : "location_searching"}
          </span>
          {position
            ? "Position de la boutique enregistrée"
            : "Je suis dans la boutique : enregistrer sa position"}
        </button>
      )}

      {erreur && (
        <p className="rounded-xl border border-error/30 bg-error-container/20 p-3 text-sm text-on-error-container">
          {erreur}
        </p>
      )}

      {succes && (
        <p className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
          Merci ! Votre prix est publié et visible immédiatement dans les
          recherches, signalé comme contribution communautaire.
        </p>
      )}

      <button
        type="submit"
        disabled={chargement}
        className="flex items-center gap-2 rounded-xl bg-primary-container px-6 py-2.5 font-semibold text-white primary-glow transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
      >
        {chargement ? "Publication en cours..." : "Publier ce prix"}
      </button>
    </form>
  );
}
