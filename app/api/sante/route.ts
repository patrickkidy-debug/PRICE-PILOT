import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Diagnostic de configuration — indique CE QUI MANQUE sans jamais révéler la
 * moindre valeur. Sert à comprendre une erreur en production sans accès aux
 * journaux de l'hébergeur.
 */
export const dynamic = "force-dynamic";

const REQUISES = [
  { nom: "AUTH_SECRET", role: "signature des sessions — sans elle, la connexion renvoie « Server error »" },
  { nom: "DATABASE_URL", role: "base de données (connexion applicative)" },
  { nom: "DIRECT_URL", role: "base de données (migrations)" },
  { nom: "NEXTAUTH_URL", role: "URL publique du site, attendue par Auth.js" },
];

const OPTIONNELLES = [
  { nom: "ANTHROPIC_API_KEY", role: "assistant IA" },
  { nom: "TAVILY_API_KEY", role: "recherche web" },
  { nom: "NEXT_PUBLIC_SITE_URL", role: "redirections de paiement" },
  { nom: "PAYTECH_API_KEY", role: "paiement" },
  { nom: "PAYTECH_API_SECRET", role: "paiement" },
];

export async function GET() {
  const etat = (liste: typeof REQUISES) =>
    liste.map((v) => ({
      variable: v.nom,
      definie: Boolean(process.env[v.nom]),
      role: v.role,
    }));

  const requises = etat(REQUISES);
  const manquantes = requises.filter((v) => !v.definie).map((v) => v.variable);

  let baseDeDonnees: string;
  try {
    const debut = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    baseDeDonnees = `accessible (${Date.now() - debut} ms)`;
  } catch (erreur) {
    baseDeDonnees = `INACCESSIBLE : ${
      erreur instanceof Error ? erreur.message.split("\n")[0].slice(0, 160) : "erreur inconnue"
    }`;
  }

  return NextResponse.json(
    {
      pret: manquantes.length === 0 && baseDeDonnees.startsWith("accessible"),
      variablesManquantes: manquantes,
      requises,
      optionnelles: etat(OPTIONNELLES),
      baseDeDonnees,
    },
    { status: manquantes.length === 0 ? 200 : 503 },
  );
}
