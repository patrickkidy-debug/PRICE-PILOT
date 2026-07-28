import { NextResponse } from "next/server";
import { z } from "zod";
import { PlanCode, SubscriptionStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifierTransaction, paiementConfigure } from "@/lib/paiement/kkiapay";
import { minorToMajor } from "@/lib/money";

const schema = z.object({
  transactionId: z.string().min(1),
  plan: z.enum(["START", "STANDARD", "GROWTH"]),
});

/**
 * Active l'abonnement APRÈS vérification de la transaction auprès de KkiaPay.
 *
 * Le navigateur ne transmet qu'un identifiant : tout le reste (statut réel,
 * montant encaissé) est lu directement chez KkiaPay. Sans cela, il suffirait
 * d'appeler cette route avec un identifiant quelconque pour s'offrir un
 * abonnement.
 */
export async function POST(request: Request) {
  if (!paiementConfigure()) {
    return NextResponse.json(
      { error: "Le paiement n'est pas encore configuré." },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { transactionId, plan: planCode } = parsed.data;

  const plan = await prisma.plan.findUnique({ where: { code: planCode as PlanCode } });
  if (!plan || plan.priceMinor <= 0) {
    return NextResponse.json({ error: "Palier introuvable." }, { status: 404 });
  }

  // Une transaction ne peut activer qu'un seul abonnement, une seule fois.
  const dejaUtilisee = await prisma.subscription.findFirst({
    where: { externalSubscriptionId: transactionId },
  });
  if (dejaUtilisee) {
    return NextResponse.json({ error: "Transaction déjà utilisée." }, { status: 409 });
  }

  let transaction;
  try {
    transaction = await verifierTransaction(transactionId);
  } catch (erreur) {
    console.error("Vérification KkiaPay impossible:", erreur);
    return NextResponse.json(
      { error: "Impossible de vérifier le paiement. Contactez le support." },
      { status: 502 },
    );
  }

  if (!transaction.reussie) {
    return NextResponse.json(
      { error: `Paiement non abouti (${transaction.statut}).` },
      { status: 402 },
    );
  }

  // Le montant encaissé doit correspondre au palier demandé : sinon, payer
  // 100 F suffirait à réclamer le palier le plus cher.
  const attendu = minorToMajor(plan.priceMinor, plan.priceCurrency);
  if (transaction.montant == null || transaction.montant < attendu) {
    console.warn(
      `Montant insuffisant pour ${planCode} : ${transaction.montant} au lieu de ${attendu}`,
    );
    return NextResponse.json(
      { error: "Le montant payé ne correspond pas au palier choisi." },
      { status: 402 },
    );
  }

  const finDePeriode = new Date();
  finDePeriode.setMonth(finDePeriode.getMonth() + 1);

  await prisma.$transaction([
    prisma.subscription.updateMany({
      where: { userId: session.user.id, status: SubscriptionStatus.ACTIVE },
      data: { status: SubscriptionStatus.CANCELED },
    }),
    prisma.subscription.create({
      data: {
        userId: session.user.id,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: finDePeriode,
        externalSubscriptionId: transactionId,
      },
    }),
  ]);

  return NextResponse.json({ actif: true, palier: plan.name });
}
