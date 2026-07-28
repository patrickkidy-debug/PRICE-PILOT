import { AlertFrequency, PlanCode } from "@prisma/client";

/**
 * Source unique de vérité pour les paliers d'abonnement.
 * Utilisé par prisma/seed.ts (création des lignes Plan) et par lib/quota.ts
 * (comparaison des limites au moment de la vérification). Modifier les
 * limites ici, puis relancer `npm run prisma:seed`, propage le changement en base.
 */
export const PLAN_DEFINITIONS: Record<
  PlanCode,
  {
    name: string;
    priceMinor: number;
    priceCurrency: string;
    searchQuotaMonthly: number | null;
    searchRadiusKm: number;
    maxCompareItems: number;
    maxWatchlistItems: number;
    priceHistoryMonths: number;
    csvExportEnabled: boolean;
    csvExportMonthlyQuota: number | null;
    multiCityLimit: number;
    adsEnabled: boolean;
    alertFrequency: AlertFrequency;
    supportPriority: number;
  }
> = {
  FREE: {
    name: "Gratuit",
    priceMinor: 0,
    priceCurrency: "XOF",
    // 5 recherches pour découvrir le produit, puis passage à l'abonnement.
    searchQuotaMonthly: 5,
    searchRadiusKm: 3,
    maxCompareItems: 3,
    maxWatchlistItems: 1,
    priceHistoryMonths: 0,
    csvExportEnabled: false,
    csvExportMonthlyQuota: null,
    multiCityLimit: 1,
    adsEnabled: true,
    alertFrequency: AlertFrequency.NONE,
    supportPriority: 0,
  },
  START: {
    name: "Start",
    priceMinor: 1000,
    priceCurrency: "XOF",
    searchQuotaMonthly: 60,
    searchRadiusKm: 10,
    maxCompareItems: 5,
    maxWatchlistItems: 3,
    priceHistoryMonths: 1,
    csvExportEnabled: false,
    csvExportMonthlyQuota: null,
    multiCityLimit: 1,
    adsEnabled: true,
    alertFrequency: AlertFrequency.DAILY_DIGEST,
    supportPriority: 1,
  },
  STANDARD: {
    name: "Standard",
    priceMinor: 1800,
    priceCurrency: "XOF",
    searchQuotaMonthly: 200,
    searchRadiusKm: 25,
    maxCompareItems: 10,
    maxWatchlistItems: 10,
    priceHistoryMonths: 6,
    csvExportEnabled: true,
    csvExportMonthlyQuota: 5,
    multiCityLimit: 2,
    adsEnabled: false,
    alertFrequency: AlertFrequency.DAILY_DIGEST,
    supportPriority: 2,
  },
  GROWTH: {
    name: "Growth",
    priceMinor: 2500,
    priceCurrency: "XOF",
    // "Illimité" est plafonné techniquement pour éviter tout abus (usage bot/API).
    searchQuotaMonthly: 1000,
    searchRadiusKm: 99999, // national — aucune contrainte de rayon pratique
    maxCompareItems: 25,
    maxWatchlistItems: 50,
    priceHistoryMonths: 24,
    csvExportEnabled: true,
    csvExportMonthlyQuota: null,
    multiCityLimit: 0, // 0 = toutes les villes, sans restriction
    adsEnabled: false,
    alertFrequency: AlertFrequency.IMMEDIATE,
    supportPriority: 3,
  },
};

export const PLAN_ORDER: PlanCode[] = ["FREE", "START", "STANDARD", "GROWTH"];
