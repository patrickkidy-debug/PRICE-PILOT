import { NextResponse } from "next/server";
import { PlanCode, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { notificationAuthentique, verifierPaiement } from "@/lib/paiement/moneroo";

/**
 * Notification serveur à serveur de Moneroo.
 *
 * C'est elle qui active l'abonnement, jamais la page de retour : un
 * utilisateur peut ouvrir /paiement/succes sans avoir payé. La signature est
 * vérifiée, puis le paiement est reconfirmé auprès de Moneroo — on ne se fie
 * pas au statut annoncé dans le corps de la requête.
 */
export async function POST(request: Request) {
  const corpsBrut = await request.text();

  if (!notificationAuthentique(corpsBrut, request.headers.get("x-moneroo-signature"))) {
    return NextResponse.json({ error: "Signature invalide." }, { status: 403 });
  }

  let idPaiement: string | undefined;
  try {
    const corps = JSON.parse(corpsBrut) as { data?: { id?: string }; id?: string };
    idPaiement = corps.data?.id ?? corps.id;
  } catch {
    return NextResponse.json({ error: "Corps illisible." }, { status: 400 });
  }

  if (!idPaiement) {
    return NextResponse.json({ error: "Identifiant de paiement absent." }, { status: 400 });
  }

  const paiement = await verifierPaiement(idPaiement);
  if (!paiement.reussi) {
    return NextResponse.json({ recu: true, ignore: paiement.statut });
  }

  const { app, userId, planCode } = paiement.metadonnees;

  // Un compte Moneroo peut encaisser pour plusieurs produits : ils partagent
  // le même secret, donc la signature seule ne distingue pas l'origine.
  if (app !== "pricepilot") {
    return NextResponse.json({ recu: true, ignore: "autre application" });
  }

  if (!userId || !planCode) {
    return NextResponse.json({ error: "Métadonnées incomplètes." }, { status: 400 });
  }

  const plan = await prisma.plan.findUnique({ where: { code: planCode as PlanCode } });
  if (!plan) {
    return NextResponse.json({ error: "Palier inconnu." }, { status: 400 });
  }

  // Une même notification peut être renvoyée plusieurs fois.
  const existant = await prisma.subscription.findFirst({
    where: { userId, externalSubscriptionId: idPaiement },
  });
  if (existant) {
    return NextResponse.json({ recu: true, deja_traite: true });
  }

  const finDePeriode = new Date();
  finDePeriode.setMonth(finDePeriode.getMonth() + 1);

  await prisma.$transaction([
    prisma.subscription.updateMany({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      data: { status: SubscriptionStatus.CANCELED },
    }),
    prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: finDePeriode,
        externalSubscriptionId: idPaiement,
      },
    }),
  ]);

  return NextResponse.json({ recu: true });
}
