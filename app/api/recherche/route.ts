import { NextResponse } from "next/server";
import { z } from "zod";
import { UsageType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { checkMonthlyQuota, getUserPlan, logUsage } from "@/lib/quota";
import { rechercherProduits } from "@/lib/search";
import { PAYS_PAR_DEFAUT } from "@/lib/countries";

const rechercheSchema = z.object({
  query: z.string().min(2, "Décrivez le produit recherché (2 caractères minimum)."),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  countryCode: z.string().length(2).default(PAYS_PAR_DEFAUT),
  tri: z.enum(["moins_cher", "qualite_prix"]).default("moins_cher"),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = rechercheSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide." },
      { status: 400 },
    );
  }

  const userId = session.user.id;

  const quota = await checkMonthlyQuota(userId, UsageType.SEARCH);
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: quota.reason,
        quota: { limit: quota.limit, current: quota.current, planCode: quota.planCode },
      },
      { status: 403 },
    );
  }

  const plan = await getUserPlan(userId);
  const { query, lat, lng, countryCode, tri } = parsed.data;

  const resultats = await rechercherProduits({ query, lat, lng, countryCode, tri, plan });

  await logUsage(userId, UsageType.SEARCH);

  return NextResponse.json({ resultats, plan: { code: plan.code, name: plan.name } });
}
