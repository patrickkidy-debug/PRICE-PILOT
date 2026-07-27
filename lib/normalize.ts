/**
 * Normalisation de texte partagée par le scraping (matcher.ts) et la recherche
 * (search.ts), afin qu'un même produit soit reconnu qu'il vienne d'un scraper
 * ou d'une saisie utilisateur. La correspondance produit à l'ingestion reste
 * EXACTE sur (normalizedName, unit, unitValue) — jamais floue — pour ne pas
 * fusionner deux produits différents par erreur (voir prisma/schema.prisma
 * PriceObservation + plan d'implémentation).
 */

const UNIT_REGEX =
  /(\d+[.,]?\d*)\s*(kg|g|l|ml|cl|unite|unités|unité|u)\b/i;

const ACCENTS_MAP: Record<string, string> = {
  à: "a", â: "a", ä: "a",
  é: "e", è: "e", ê: "e", ë: "e",
  î: "i", ï: "i",
  ô: "o", ö: "o",
  ù: "u", û: "u", ü: "u",
  ç: "c",
};

function stripAccents(input: string): string {
  return input.replace(/[àâäéèêëîïôöùûüç]/g, (char) => ACCENTS_MAP[char] ?? char);
}

export interface ParsedQuantity {
  unit: string | null;
  unitValue: number | null;
}

export function extractQuantity(rawText: string): ParsedQuantity {
  const match = rawText.match(UNIT_REGEX);
  if (!match) {
    return { unit: null, unitValue: null };
  }
  const value = parseFloat(match[1].replace(",", "."));
  let unit = match[2].toLowerCase();
  if (unit === "unités" || unit === "unité" || unit === "u") {
    unit = "unite";
  }
  return { unit, unitValue: Number.isFinite(value) ? value : null };
}

/**
 * Réduit un texte brut (titre scrapé ou requête utilisateur) à une forme
 * canonique : minuscules, sans accents, sans ponctuation, espaces uniques,
 * quantité/unité retirée du corps du texte (elle est extraite séparément).
 */
export function normalizeProductName(rawText: string): string {
  let text = stripAccents(rawText.toLowerCase());
  text = text.replace(UNIT_REGEX, " ");
  text = text.replace(/[^a-z0-9\s]/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

export interface NormalizedProduct {
  normalizedName: string;
  unit: string | null;
  unitValue: number | null;
}

export function normalizeProduct(rawText: string): NormalizedProduct {
  const { unit, unitValue } = extractQuantity(rawText);
  const normalizedName = normalizeProductName(rawText);
  return { normalizedName, unit, unitValue };
}
