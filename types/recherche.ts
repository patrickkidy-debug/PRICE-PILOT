export type TriMode = "moins_cher" | "qualite_prix";

export type TypeVendeur = "CHAIN" | "ONLINE" | "LOCAL_SHOP";

export interface ResultatRecherche {
  productId: string;
  productName: string;
  retailerName: string;
  retailerKind: TypeVendeur;
  branchName: string | null;
  city: string | null;
  countryCode: string | null;
  distanceKm: number | null;
  priceMinor: number;
  currency: string;
  /** Lien cliquable vers la boutique : page produit, site du vendeur, ou carte. */
  lienBoutique: string | null;
  /** Vrai si le prix vient d'un signalement communautaire et non d'un scraper. */
  contributionCommunautaire: boolean;
  scrapedAt: string;
  isStale: boolean;
}

export interface RechercheReponse {
  resultats: ResultatRecherche[];
  plan: { code: string; name: string };
}

export interface RechercheErreur {
  error: string;
  quota?: { limit: number; current: number; planCode: string };
}
