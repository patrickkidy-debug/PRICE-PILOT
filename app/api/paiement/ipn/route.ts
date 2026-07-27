import { NextResponse } from "next/server";
import { PlanCode, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { notificationAuthentique, type NotificationIpn } from "@/lib/paiement/paytech";

/**
 * Notification serveur à serveur de PayTech (IPN).
 *
 * C'est ELLE qui active l'abonnement, jamais la page de succès : un utilisateur
 * peut ouvrir /paiement/succes sans avoir payé, alors que l'IPN est signée et
 * envoyée par PayTech lui-même.
 */
export async function POST(request: Request) {
  // PayTech envoie du form-urlencoded ; on accepte aussi le JSON par sécurité.
  const typeContenu = request.headers.get("content-type") ?? "";
  const ipn: NotificationIpn = typeContenu.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries() as Iterable<[string, string]>);

  if (!notificationAuthentique(ipn)) {
    console.warn("IPN PayTech rejetée : signature invalide.", ipn.ref_command);
    return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }

  // Seul un paiement effectivement encaissé active l'abonnement.
  if (ipn.type_event !== "sale_complete") {
    return NextResponse.json({ recu: true, ignore: ipn.type_event });
  }

  let userId: string | undefined;
  let planCode: string | undefined;
  try {
    const champs = JSON.parse(ipn.custom_field ?? "{}") as Record<string, string>;
    userId = champs.userId;
    planCode = champs.planCode;
  } catch {
    // custom_field illisible : on ne devine pas à qui attribuer le paiement.
  }

  if (!userId || !planCode) {
    console.error("IPN PayTech sans custom_field exploitable:", ipn.ref_command);
    return NextResponse.json({ error: "Données de commande manquantes." }, { status: 400 });
  }

  const plan = await prisma.plan.findUnique({ where: { code: planCode as PlanCode } });
  if (!plan) {
    return NextResponse.json({ error: "Palier inconnu." }, { status: 400 });
  }

  const finDePeriode = new Date();
  finDePeriode.setMonth(finDePeriode.getMonth() + 1);

  // Une même notification peut être renvoyée plusieurs fois : on se cale sur la
  // référence de commande pour ne pas créer d'abonnement en double.
  const existant = await prisma.subscription.findFirst({
    where: { userId, externalSubscriptionId: ipn.ref_command },
  });

  if (existant) {
    return NextResponse.json({ recu: true, deja_traite: true });
  }

  await prisma.$transaction([
    // L'abonnement précédent laisse la place au nouveau.
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
        externalSubscriptionId: ipn.ref_command,
        externalCustomerId: ipn.client_phone ?? null,
      },
    }),
  ]);

  return NextResponse.json({ recu: true });
}
