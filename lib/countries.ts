/**
 * Pays couverts par PricePilot. L'architecture est multi-pays : ajouter un
 * marché consiste à ajouter une entrée ici (+ des données), pas à modifier le
 * code. Le catalogue réellement alimenté aujourd'hui reste le Sénégal — les
 * autres pays sont ouverts aux contributions communautaires (/contribuer).
 */

export interface Ville {
  nom: string;
  lat: number;
  lng: number;
}

export interface Pays {
  code: string; // ISO 3166-1 alpha-2
  nom: string;
  currency: string; // ISO 4217
  locale: string;
  villes: Ville[];
}

export const PAYS: Pays[] = [
  {
    code: "SN",
    nom: "Sénégal",
    currency: "XOF",
    locale: "fr-SN",
    villes: [
      { nom: "Dakar", lat: 14.7167, lng: -17.4677 },
      { nom: "Thiès", lat: 14.7833, lng: -16.9333 },
      { nom: "Saint-Louis", lat: 16.0179, lng: -16.4896 },
    ],
  },
  {
    code: "CI",
    nom: "Côte d'Ivoire",
    currency: "XOF",
    locale: "fr-CI",
    villes: [
      { nom: "Abidjan", lat: 5.3599, lng: -4.0083 },
      { nom: "Bouaké", lat: 7.6906, lng: -5.0301 },
    ],
  },
  {
    code: "FR",
    nom: "France",
    currency: "EUR",
    locale: "fr-FR",
    villes: [
      { nom: "Paris", lat: 48.8566, lng: 2.3522 },
      { nom: "Lyon", lat: 45.764, lng: 4.8357 },
      { nom: "Marseille", lat: 43.2965, lng: 5.3698 },
    ],
  },
  {
    code: "CA",
    nom: "Canada",
    currency: "CAD",
    locale: "fr-CA",
    villes: [
      { nom: "Montréal", lat: 45.5019, lng: -73.5674 },
      { nom: "Toronto", lat: 43.6532, lng: -79.3832 },
    ],
  },
  {
    code: "US",
    nom: "États-Unis",
    currency: "USD",
    locale: "en-US",
    villes: [
      { nom: "New York", lat: 40.7128, lng: -74.006 },
      { nom: "Los Angeles", lat: 34.0522, lng: -118.2437 },
    ],
  },
  {
    code: "MA",
    nom: "Maroc",
    currency: "MAD",
    locale: "fr-MA",
    villes: [
      { nom: "Casablanca", lat: 33.5731, lng: -7.5898 },
      { nom: "Rabat", lat: 34.0209, lng: -6.8416 },
    ],
  },
];

export const PAYS_PAR_DEFAUT = "SN";

export function trouverPays(code: string): Pays | undefined {
  return PAYS.find((p) => p.code === code);
}

export function deviseDuPays(code: string): string {
  return trouverPays(code)?.currency ?? "XOF";
}

export function villesDuPays(code: string): Ville[] {
  return trouverPays(code)?.villes ?? [];
}
