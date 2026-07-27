import { Plan, RetailerKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeProductName } from "@/lib/normalize";
import { distanceKm } from "@/lib/geo";
import type { ResultatRecherche, TriMode, TypeVendeur } from "@/types/recherche";

export interface RechercheParams {
  query: string;
  lat: number;
  lng: number;
  /** Code ISO du pays de l'utilisateur — borne les vendeurs physiques affichés. */
  countryCode: string;
  tri: TriMode;
  plan: Plan;
}

const FRESHNESS_WINDOW_DAYS = 14;

/**
 * Recherche floue sur Product.normalizedName via pg_trgm (extension activée
 * dans schema.prisma). Repli sur une recherche ILIKE si l'extension n'est
 * pas disponible (ex: base non encore migrée avec l'extension) — ne doit
 * jamais faire échouer la recherche utilisateur.
 */
async function findMatchingProductIds(normalizedQuery: string): Promise<string[]> {
  try {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Product"
      WHERE similarity("normalizedName", ${normalizedQuery}) > 0.15
         OR "normalizedName" ILIKE ${"%" + normalizedQuery + "%"}
      ORDER BY similarity("normalizedName", ${normalizedQuery}) DESC
      LIMIT 50
    `;
    if (rows.length > 0) return rows.map((r) => r.id);
  } catch {
    // pg_trgm indisponible — on bascule sur le repli ILIKE ci-dessous.
  }

  const fallback = await prisma.product.findMany({
    where: { normalizedName: { contains: normalizedQuery, mode: "insensitive" } },
    select: { id: true },
    take: 50,
  });
  return fallback.map((p) => p.id);
}

/**
 * Lien cliquable vers la boutique du vendeur. Priorité au lien le plus précis :
 * page produit chez le vendeur > page de la succursale > site de l'enseigne.
 * Pour une boutique physique sans aucune présence en ligne (petit commerçant),
 * on renvoie une recherche cartographique sur ses coordonnées — jamais un lien
 * inventé vers un site qui n'existe pas.
 */
function construireLienBoutique(
  sourceUrl: string | null,
  storeUrl: string | null,
  websiteUrl: string | null,
  lat: number | null,
  lng: number | null,
  nomBoutique: string,
): string | null {
  if (sourceUrl) return sourceUrl;
  if (storeUrl) return storeUrl;
  if (websiteUrl) return websiteUrl;
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nomBoutique)}`;
}

export async function rechercherProduits(
  params: RechercheParams,
): Promise<ResultatRecherche[]> {
  const { query, lat, lng, countryCode, tri, plan } = params;
  const normalizedQuery = normalizeProductName(query);

  const productIds = await findMatchingProductIds(normalizedQuery);
  if (productIds.length === 0) return [];

  const freshnessThreshold = new Date();
  freshnessThreshold.setDate(freshnessThreshold.getDate() - FRESHNESS_WINDOW_DAYS);

  const observations = await prisma.priceObservation.findMany({
    where: { productId: { in: productIds } },
    include: {
      product: true,
      retailer: { include: { branches: { where: { isActive: true } } } },
      branch: true,
    },
    orderBy: { scrapedAt: "desc" },
  });

  // Garde uniquement l'observation la plus récente par (retailer, succursale) —
  // PriceObservation est un historique append-only, on ne veut que l'état courant.
  const latestByRetailerBranch = new Map<string, (typeof observations)[number]>();
  for (const obs of observations) {
    const key = `${obs.retailerId}:${obs.branchId ?? "national"}`;
    if (!latestByRetailerBranch.has(key)) {
      latestByRetailerBranch.set(key, obs);
    }
  }

  const results: ResultatRecherche[] = [];
  for (const obs of latestByRetailerBranch.values()) {
    const enLigne = obs.retailer.kind === RetailerKind.ONLINE;

    let distance: number | null = null;
    if (obs.branch?.lat != null && obs.branch?.lng != null) {
      distance = distanceKm(lat, lng, obs.branch.lat, obs.branch.lng);
    } else if (!enLigne) {
      // Prix national d'une enseigne physique : on situe par rapport à sa
      // succursale active la plus proche, à titre de repère.
      const branchDistances = obs.retailer.branches
        .filter((b) => b.lat != null && b.lng != null)
        .map((b) => distanceKm(lat, lng, b.lat as number, b.lng as number));
      distance = branchDistances.length > 0 ? Math.min(...branchDistances) : null;
    }

    // Un vendeur en ligne livre : il n'est pas contraint par le rayon de
    // recherche du palier, qui ne concerne que les boutiques physiques.
    if (!enLigne) {
      const paysBoutique = obs.branch?.countryCode ?? obs.retailer.countryCode;
      if (paysBoutique && paysBoutique !== countryCode) continue;
      if (distance != null && distance > plan.searchRadiusKm) continue;
    }

    results.push({
      productId: obs.productId,
      productName: obs.product.name,
      retailerName: obs.retailer.name,
      retailerKind: obs.retailer.kind as TypeVendeur,
      branchName: obs.branch?.name ?? null,
      city: obs.branch?.city ?? null,
      countryCode: obs.branch?.countryCode ?? obs.retailer.countryCode ?? null,
      distanceKm: distance != null ? Math.round(distance * 10) / 10 : null,
      priceMinor: obs.priceMinor,
      currency: obs.currency,
      lienBoutique: construireLienBoutique(
        obs.sourceUrl,
        obs.branch?.storeUrl ?? null,
        obs.retailer.websiteUrl,
        obs.branch?.lat ?? null,
        obs.branch?.lng ?? null,
        `${obs.retailer.name} ${obs.branch?.city ?? ""}`.trim(),
      ),
      contributionCommunautaire: obs.source === "USER_SUBMITTED",
      scrapedAt: obs.scrapedAt.toISOString(),
      isStale: obs.scrapedAt < freshnessThreshold,
    });
  }

  // Le tri ne compare que des montants de même devise : sans taux de change à
  // jour, convertir serait inventer une donnée. Les résultats sont donc classés
  // devise par devise, celle de l'utilisateur en premier.
  const deviseUtilisateur = results.find((r) => r.countryCode === countryCode)?.currency;
  const parDevise = new Map<string, ResultatRecherche[]>();
  for (const r of results) {
    const groupe = parDevise.get(r.currency) ?? [];
    groupe.push(r);
    parDevise.set(r.currency, groupe);
  }

  const groupesTries = [...parDevise.entries()].sort(([a], [b]) => {
    if (a === deviseUtilisateur) return -1;
    if (b === deviseUtilisateur) return 1;
    return a.localeCompare(b);
  });

  const finaux: ResultatRecherche[] = [];
  for (const [, groupe] of groupesTries) {
    if (tri === "moins_cher") {
      groupe.sort((a, b) => a.priceMinor - b.priceMinor);
    } else {
      // "Meilleur rapport qualité-prix" — heuristique honnête MVP : prix ET
      // proximité, pas un vrai signal qualité (Product.qualityScore n'est pas
      // encore alimenté).
      const maxPrice = Math.max(...groupe.map((r) => r.priceMinor), 1);
      const maxDistance = Math.max(...groupe.map((r) => r.distanceKm ?? 0), 1);
      groupe.sort(
        (a, b) =>
          scoreQualitePrix(b, maxPrice, maxDistance) - scoreQualitePrix(a, maxPrice, maxDistance),
      );
    }
    finaux.push(...groupe);
  }

  return finaux.slice(0, plan.maxCompareItems);
}

function scoreQualitePrix(r: ResultatRecherche, maxPrice: number, maxDistance: number): number {
  const inversePrice = 1 - r.priceMinor / maxPrice;
  const inverseDistance = maxDistance > 0 ? 1 - (r.distanceKm ?? 0) / maxDistance : 1;
  return 0.7 * inversePrice + 0.3 * inverseDistance;
}
