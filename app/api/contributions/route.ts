import { NextResponse } from "next/server";
import { z } from "zod";
import { ObservationSource, ProductCategory, RetailerKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { normalizeProduct } from "@/lib/normalize";
import { majorToMinor } from "@/lib/money";
import { deviseDuPays, trouverPays } from "@/lib/countries";

const contributionSchema = z.object({
  produit: z.string().min(2, "Indiquez le nom du produit."),
  categorie: z.nativeEnum(ProductCategory).default(ProductCategory.AUTRE),
  prix: z.number().positive("Le prix doit être supérieur à zéro."),
  nomBoutique: z.string().min(2, "Indiquez le nom de la boutique."),
  typeBoutique: z.nativeEnum(RetailerKind).default(RetailerKind.LOCAL_SHOP),
  adresse: z.string().optional(),
  ville: z.string().min(1, "Indiquez la ville."),
  countryCode: z.string().length(2),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  lienBoutique: z.string().url("Le lien doit être une URL valide.").optional().or(z.literal("")),
});

function slugifier(texte: string): string {
  // \p{Diacritic} retire les accents décomposés par NFD (é -> e + accent),
  // sinon l'accent deviendrait un tiret dans le slug.
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = contributionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide." },
      { status: 400 },
    );
  }

  const data = parsed.data;
  if (!trouverPays(data.countryCode)) {
    return NextResponse.json({ error: "Pays non pris en charge." }, { status: 400 });
  }

  const userId = session.user.id;
  const currency = deviseDuPays(data.countryCode);
  const { normalizedName, unit, unitValue } = normalizeProduct(data.produit);

  // Réutilise le produit existant s'il correspond exactement (même clé de
  // normalisation), sinon en crée un — même règle qu'à l'ingestion par scraper,
  // pour ne pas fusionner deux produits différents par erreur.
  const produitExistant = await prisma.product.findFirst({
    where: { normalizedName, unit, unitValue },
  });
  const produit =
    produitExistant ??
    (await prisma.product.create({
      data: {
        name: data.produit,
        normalizedName,
        unit,
        unitValue,
        category: data.categorie,
      },
    }));

  // Une boutique est identifiée par (nom + ville + pays) : un contributeur qui
  // signale un second prix dans la même boutique ne la recrée pas.
  const slug = slugifier(`${data.nomBoutique}-${data.ville}-${data.countryCode}`);
  const enseigneExistante = await prisma.retailer.findUnique({ where: { slug } });
  const enseigne =
    enseigneExistante ??
    (await prisma.retailer.create({
      data: {
        name: data.nomBoutique,
        slug,
        kind: data.typeBoutique,
        countryCode: data.countryCode,
        websiteUrl: data.lienBoutique || null,
        createdById: userId,
      },
    }));

  let branchId: string | null = null;
  if (data.typeBoutique !== RetailerKind.ONLINE) {
    const succursaleExistante = await prisma.storeBranch.findFirst({
      where: { retailerId: enseigne.id, city: data.ville },
    });
    const succursale =
      succursaleExistante ??
      (await prisma.storeBranch.create({
        data: {
          retailerId: enseigne.id,
          name: data.nomBoutique,
          address: data.adresse || null,
          city: data.ville,
          countryCode: data.countryCode,
          lat: data.lat ?? null,
          lng: data.lng ?? null,
          storeUrl: data.lienBoutique || null,
          createdById: userId,
        },
      }));
    branchId = succursale.id;
  }

  await prisma.priceObservation.create({
    data: {
      productId: produit.id,
      retailerId: enseigne.id,
      branchId,
      priceMinor: majorToMinor(data.prix, currency),
      currency,
      source: ObservationSource.USER_SUBMITTED,
      rawTitle: data.produit,
      sourceUrl: data.lienBoutique || null,
      submittedById: userId,
      scrapedAt: new Date(),
    },
  });

  return NextResponse.json({ productId: produit.id }, { status: 201 });
}
