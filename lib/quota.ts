import { Plan, PlanCode, Role, SubscriptionStatus, UsageType } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Point d'entrée UNIQUE pour toute vérification de restriction de palier.
 * Chaque route API restreinte (recherche, alertes, export CSV) passe par ici.
 * Quand Stripe (ou un autre gateway) sera branché, seule la création/mise à
 * jour de Subscription changera — cette logique d'enforcement reste intacte.
 */

export type QuotaCheckResult =
  | { allowed: true }
  | {
      allowed: false;
      reason: string;
      limit: number;
      current: number;
      planCode: PlanCode;
    };

/** Vrai pour un compte administrateur (fondateur) : aucun quota, aucun paiement. */
export async function estAdministrateur(userId: string): Promise<boolean> {
  const utilisateur = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return utilisateur?.role === Role.ADMIN;
}

/**
 * Résout le palier effectif d'un utilisateur. Un abonnement expiré/annulé
 * (au-delà de currentPeriodEnd) retombe automatiquement sur FREE au moment
 * de la lecture, sans attendre le job de ménage quotidien.
 *
 * Un administrateur reçoit le palier le plus élevé sans abonnement : le
 * fondateur ne paie pas et n'est pas limité.
 */
export async function getUserPlan(userId: string): Promise<Plan> {
  if (await estAdministrateur(userId)) {
    const planAdmin = await prisma.plan.findUnique({ where: { code: PlanCode.GROWTH } });
    if (planAdmin) {
      // Quota mensuel illimité : le plafond anti-abus du palier Growth ne
      // s'applique pas au compte fondateur.
      return { ...planAdmin, name: "Fondateur", searchQuotaMonthly: null };
    }
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  const isExpired =
    subscription?.currentPeriodEnd != null &&
    subscription.currentPeriodEnd.getTime() < Date.now();

  if (subscription && !isExpired) {
    return subscription.plan;
  }

  const freePlan = await prisma.plan.findUnique({ where: { code: PlanCode.FREE } });
  if (!freePlan) {
    throw new Error(
      "Palier FREE introuvable en base — avez-vous lancé `npm run prisma:seed` ?",
    );
  }
  return freePlan;
}

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** Utilisé par la page /compte pour afficher la consommation du mois en cours. */
export async function getMonthlyUsageCount(userId: string, type: UsageType): Promise<number> {
  return prisma.usageLog.count({
    where: { userId, type, createdAt: { gte: startOfCurrentMonth() } },
  });
}

/** Quotas de type "compteur mensuel" : recherches, exports CSV. */
export async function checkMonthlyQuota(
  userId: string,
  type: UsageType,
): Promise<QuotaCheckResult> {
  const plan = await getUserPlan(userId);

  const limit =
    type === UsageType.CSV_EXPORT ? plan.csvExportMonthlyQuota : plan.searchQuotaMonthly;

  if (type === UsageType.CSV_EXPORT && !plan.csvExportEnabled) {
    return {
      allowed: false,
      reason: "L'export CSV n'est pas disponible sur votre palier actuel.",
      limit: 0,
      current: 0,
      planCode: plan.code,
    };
  }

  if (limit == null) {
    return { allowed: true }; // null = illimité (dans la limite technique déjà reflétée dans PLAN_DEFINITIONS)
  }

  const current = await prisma.usageLog.count({
    where: { userId, type, createdAt: { gte: startOfCurrentMonth() } },
  });

  if (current >= limit) {
    return {
      allowed: false,
      reason:
        type === UsageType.SEARCH
          ? `Quota de recherches mensuel atteint (${limit}). Passez à un palier supérieur pour continuer.`
          : `Quota d'exports CSV mensuel atteint (${limit}).`,
      limit,
      current,
      planCode: plan.code,
    };
  }

  return { allowed: true };
}

export async function logUsage(userId: string, type: UsageType): Promise<void> {
  await prisma.usageLog.create({ data: { userId, type } });
}

/** Quotas de type "plafond de ressource" : alertes actives simultanées. */
export async function checkResourceCap(
  userId: string,
  resource: "watchlist",
): Promise<QuotaCheckResult> {
  const plan = await getUserPlan(userId);

  if (resource === "watchlist") {
    const limit = plan.maxWatchlistItems;
    const current = await prisma.priceAlert.count({
      where: { userId, isActive: true },
    });
    if (current >= limit) {
      return {
        allowed: false,
        reason: `Nombre maximal de produits suivis atteint (${limit}) pour votre palier.`,
        limit,
        current,
        planCode: plan.code,
      };
    }
  }

  return { allowed: true };
}
