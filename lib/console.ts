import { Role, SubscriptionStatus, UsageType } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Données de la console fondateur.
 *
 * Tout est lu en base, sans estimation ni projection. Deux partis pris qui
 * méritent d'être explicites :
 *
 * 1. Le statut `TRIALING` n'est jamais écrit par l'application, et toute
 *    inscription crée un abonnement `ACTIVE` sur le palier Gratuit. Le statut
 *    seul ne distingue donc pas un client d'un curieux : un abonné est ici un
 *    abonnement actif dont le palier coûte plus de zéro. « En essai » désigne
 *    le reste — inscrit, sur le Gratuit et ses 5 recherches mensuelles.
 *
 * 2. Le MRR est regroupé par devise et jamais converti. Additionner des XOF et
 *    des EUR exigerait un taux de change que PricePilot n'a pas.
 */

const LIMITE_LISTE = 200;

export interface LigneAbonne {
  id: string;
  nom: string | null;
  email: string | null;
  palier: string;
  montantMinor: number;
  devise: string;
  depuis: Date;
  echeance: Date | null;
}

export interface LigneEssai {
  id: string;
  nom: string | null;
  email: string | null;
  inscritLe: Date;
  recherchesCeMois: number;
}

export interface DonneesConsole {
  mrrParDevise: { devise: string; montantMinor: number }[];
  arpuMinor: number | null;
  deviseDominante: string | null;
  mrrParPalier: { palier: string; montantMinor: number; devise: string; abonnes: number }[];
  abonnes: LigneAbonne[];
  essais: LigneEssai[];
  totalEssais: number;
  tauxConversion: number | null;
  recherchesCeMois: number;
  nouveauxComptesCeMois: number;
  croissance: { mois: string; comptes: number }[];
  quotaGratuit: number | null;
}

function debutDuMois(decalage = 0): Date {
  const maintenant = new Date();
  return new Date(maintenant.getFullYear(), maintenant.getMonth() - decalage, 1);
}

export async function chargerConsole(): Promise<DonneesConsole> {
  const debutMois = debutDuMois();
  const debutFenetre = debutDuMois(5); // 6 mois glissants, mois courant inclus
  const maintenant = new Date();

  const [abonnementsActifs, recherchesCeMois, planGratuit, comptesRecents] =
    await Promise.all([
      prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          // L'inscription crée un abonnement ACTIVE sur le palier Gratuit :
          // sans ce filtre sur le prix, tout inscrit passerait pour un client.
          plan: { priceMinor: { gt: 0 } },
          // Un abonnement dont la période est passée n'est plus du revenu.
          OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: maintenant } }],
        },
        include: {
          plan: true,
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { startedAt: "desc" },
      }),
      prisma.usageLog.count({
        where: { type: UsageType.SEARCH, createdAt: { gte: debutMois } },
      }),
      prisma.plan.findUnique({ where: { code: "FREE" } }),
      prisma.user.findMany({
        where: { createdAt: { gte: debutFenetre }, role: Role.USER },
        select: { createdAt: true },
      }),
    ]);

  // Le compte fondateur est administrateur : il ne paie pas, il ne doit donc
  // ni gonfler le MRR ni apparaître comme client.
  const payants = abonnementsActifs.filter((a) => a.user.role !== Role.ADMIN);

  const mrr = new Map<string, number>();
  const parPalier = new Map<string, { montantMinor: number; devise: string; abonnes: number }>();
  for (const a of payants) {
    mrr.set(a.plan.priceCurrency, (mrr.get(a.plan.priceCurrency) ?? 0) + a.plan.priceMinor);
    const cle = a.plan.name;
    const courant = parPalier.get(cle) ?? {
      montantMinor: 0,
      devise: a.plan.priceCurrency,
      abonnes: 0,
    };
    courant.montantMinor += a.plan.priceMinor;
    courant.abonnes += 1;
    parPalier.set(cle, courant);
  }

  const mrrParDevise = [...mrr.entries()]
    .map(([devise, montantMinor]) => ({ devise, montantMinor }))
    .sort((a, b) => b.montantMinor - a.montantMinor);

  const deviseDominante = mrrParDevise[0]?.devise ?? null;
  const abonnesDeviseDominante = deviseDominante
    ? payants.filter((a) => a.plan.priceCurrency === deviseDominante).length
    : 0;
  const arpuMinor =
    deviseDominante && abonnesDeviseDominante > 0
      ? Math.round(mrrParDevise[0].montantMinor / abonnesDeviseDominante)
      : null;

  const abonnes: LigneAbonne[] = payants.slice(0, LIMITE_LISTE).map((a) => ({
    id: a.user.id,
    nom: a.user.name,
    email: a.user.email,
    palier: a.plan.name,
    montantMinor: a.plan.priceMinor,
    devise: a.plan.priceCurrency,
    depuis: a.startedAt,
    echeance: a.currentPeriodEnd,
  }));

  // En essai : inscrit, non administrateur, sans abonnement actif en cours.
  const idsPayants = payants.map((a) => a.user.id);
  const filtreEssai = {
    role: Role.USER,
    ...(idsPayants.length > 0 ? { id: { notIn: idsPayants } } : {}),
  };

  const [totalEssais, comptesEssai] = await Promise.all([
    prisma.user.count({ where: filtreEssai }),
    prisma.user.findMany({
      where: filtreEssai,
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: LIMITE_LISTE,
    }),
  ]);

  const usageParUtilisateur = await prisma.usageLog.groupBy({
    by: ["userId"],
    where: {
      type: UsageType.SEARCH,
      createdAt: { gte: debutMois },
      userId: { in: comptesEssai.map((c) => c.id) },
    },
    _count: { _all: true },
  });
  const compteur = new Map(usageParUtilisateur.map((u) => [u.userId, u._count._all]));

  const essais: LigneEssai[] = comptesEssai.map((c) => ({
    id: c.id,
    nom: c.name,
    email: c.email,
    inscritLe: c.createdAt,
    recherchesCeMois: compteur.get(c.id) ?? 0,
  }));

  const base = payants.length + totalEssais;
  const tauxConversion = base > 0 ? payants.length / base : null;

  // Croissance : comptes créés par mois sur 6 mois glissants.
  const seaux = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = debutDuMois(i);
    seaux.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }
  for (const c of comptesRecents) {
    const cle = `${c.createdAt.getFullYear()}-${c.createdAt.getMonth()}`;
    if (seaux.has(cle)) seaux.set(cle, (seaux.get(cle) ?? 0) + 1);
  }
  const croissance = [...seaux.entries()].map(([cle, comptes]) => {
    const [annee, mois] = cle.split("-").map(Number);
    return {
      mois: new Date(annee, mois, 1).toLocaleDateString("fr-FR", { month: "short" }),
      comptes,
    };
  });

  return {
    mrrParDevise,
    arpuMinor,
    deviseDominante,
    mrrParPalier: [...parPalier.entries()]
      .map(([palier, v]) => ({ palier, ...v }))
      .sort((a, b) => b.montantMinor - a.montantMinor),
    abonnes,
    essais,
    totalEssais,
    tauxConversion,
    recherchesCeMois,
    nouveauxComptesCeMois: comptesRecents.filter((c) => c.createdAt >= debutMois).length,
    croissance,
    quotaGratuit: planGratuit?.searchQuotaMonthly ?? null,
  };
}
