import { NextResponse } from "next/server";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { getUserPlan } from "@/lib/quota";
import { isAssistantConfigured } from "@/lib/ai/client";
import { runAssistantTurn } from "@/lib/ai/assistant";
import { detecterLocalisation } from "@/lib/geolocation";

const assistantSchema = z.object({
  texte: z.string().min(1, "Le message ne peut pas être vide."),
  /** Fuseau horaire du navigateur — sert à déduire le pays sans rien demander. */
  timezone: z.string().optional(),
  // Historique renvoyé tel quel par une réponse précédente de cette API :
  // opaque côté client, à ne pas modifier avant de le renvoyer.
  historique: z.array(z.unknown()).default([]),
});

// Une recherche enchaîne plusieurs allers-retours : on laisse au serveur le
// temps d'aller au bout plutôt que de couper la réponse en cours de route.
export const maxDuration = 120;

export async function POST(request: Request) {
  if (!isAssistantConfigured()) {
    return NextResponse.json(
      {
        error:
          "L'assistant IA n'est pas encore configuré : ajoutez ANTHROPIC_API_KEY dans .env.",
      },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = assistantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide." },
      { status: 400 },
    );
  }

  const { texte, timezone, historique } = parsed.data;
  const localisation = detecterLocalisation(request.headers, timezone);
  const plan = await getUserPlan(session.user.id);


  try {
    const messages: Anthropic.MessageParam[] = [
      ...(historique as Anthropic.MessageParam[]),
      { role: "user", content: texte },
    ];

    const resultat = await runAssistantTurn(messages, {
      userId: session.user.id,
      plan,
      localisation,
    });

    return NextResponse.json({
      reponse: resultat.reponse,
      sources: resultat.sources,
      recherchesWeb: resultat.recherchesWeb,
      historique: resultat.messages,
      quotaGratuitEpuise: resultat.quotaGratuitEpuise,
      quotaAtteint: resultat.quotaAtteint,
      rechercheIndisponible: resultat.rechercheIndisponible,
      localisation: { pays: localisation.countryCode, ville: localisation.city },
    });
  } catch (error) {
    console.error("Erreur assistant IA:", error);
    return NextResponse.json(
      { error: "L'assistant IA est momentanément indisponible." },
      { status: 502 },
    );
  }
}
