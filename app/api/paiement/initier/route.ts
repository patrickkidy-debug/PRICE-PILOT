import { NextResponse } from "next/server";
import { z } from "zod";
import { PlanCode } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { estAdministrateur } from "@/lib/quota";
import { PayTechError, creerPaiement, paiementConfigure } from "@/lib/paiement/paytech";
import { minorToMajor } from "@/lib/money";

const schema = z.object({
  plan: z.enum(["START", "STANDARD", "GROWTH"]),
});

export async function POST(request: Request) {
  if (!paiementConfigure()) {
    return NextResponse.json(
      { error: "Le paiement n'est pas encore configuré (clés PayTech manquantes)." },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  // Le compte fondateur n'a rien à payer.
  if (await estAdministrateur(session.user.id)) {
    return NextResponse.json(
      { error: "Votre compte administrateur donne déjà un accès complet." },
      { status: 400 },
    );
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Palier invalide." }, { status: 400 });
  }

  const plan = await prisma.plan.findUnique({
    where: { code: parsed.data.plan as PlanCode },
  });
  if (!plan || plan.priceMinor <= 0) {
    return NextResponse.json({ error: "Palier introuvable." }, { status: 404 });
  }

  // Référence unique : PayTech refuse deux paiements avec la même référence.
  const refCommande = `pp-${session.user.id.slice(-8)}-${plan.code}-${Date.now()}`;

  try {
    const { token, urlRedirection } = await creerPaiement({
      refCommande,
      nomArticle: `PricePilot ${plan.name} — 1 mois`,
      montant: minorToMajor(plan.priceMinor, plan.priceCurrency),
      devise: plan.priceCurrency,
      // `app` identifie PricePilot : le compte PayTech peut servir plusieurs
      // produits, et l'IPN rejette toute notification qui ne vient pas d'ici.
      champPersonnalise: { app: "pricepilot", userId: session.user.id, planCode: plan.code },
    });

    return NextResponse.json({ token, urlRedirection, refCommande });
  } catch (erreur) {
    console.error("Erreur PayTech:", erreur);

    // PayTech décrit précisément ce qui bloque (compte non activé, URL
    // invalide) : on transmet son message plutôt qu'une erreur générique qui
    // laisserait chercher.
    if (erreur instanceof PayTechError) {
      return NextResponse.json(
        {
          error: erreur.compteNonActive
            ? "Les paiements ne sont pas encore activés. Le compte marchand PayTech doit être validé par leur support avant de pouvoir encaisser."
            : `Paiement refusé par PayTech : ${erreur.messageUtilisateur}`,
          compteNonActive: erreur.compteNonActive,
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Impossible de démarrer le paiement. Réessayez dans un instant." },
      { status: 502 },
    );
  }
}
