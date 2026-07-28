import { NextResponse } from "next/server";
import { z } from "zod";
import { PlanCode } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { estAdministrateur } from "@/lib/quota";
import { MonerooError, creerPaiement, paiementConfigure } from "@/lib/paiement/moneroo";
import { minorToMajor } from "@/lib/money";

const schema = z.object({ plan: z.enum(["START", "STANDARD", "GROWTH"]) });

export async function POST(request: Request) {
  if (!paiementConfigure()) {
    return NextResponse.json(
      { error: "Le paiement n'est pas encore configuré (clé Moneroo manquante)." },
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

  const plan = await prisma.plan.findUnique({ where: { code: parsed.data.plan as PlanCode } });
  if (!plan || plan.priceMinor <= 0) {
    return NextResponse.json({ error: "Palier introuvable." }, { status: 404 });
  }

  const nomComplet = (session.user.name ?? "Client PricePilot").trim().split(/\s+/);

  try {
    const { id, urlPaiement } = await creerPaiement({
      montant: minorToMajor(plan.priceMinor, plan.priceCurrency),
      devise: plan.priceCurrency,
      description: `PricePilot ${plan.name} — 1 mois`,
      client: {
        email: session.user.email ?? "client@pricepilot.app",
        prenom: nomComplet[0] || "Client",
        nom: nomComplet.slice(1).join(" ") || "PricePilot",
      },
      // `app` identifie PricePilot : un compte Moneroo peut servir plusieurs
      // produits, et le webhook rejette ce qui ne vient pas d'ici.
      metadonnees: { app: "pricepilot", userId: session.user.id, planCode: plan.code },
    });

    return NextResponse.json({ id, urlRedirection: urlPaiement });
  } catch (erreur) {
    console.error("Erreur Moneroo:", erreur);
    if (erreur instanceof MonerooError) {
      return NextResponse.json(
        { error: `Paiement refusé : ${erreur.messageUtilisateur}` },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "Impossible de démarrer le paiement. Réessayez dans un instant." },
      { status: 502 },
    );
  }
}
