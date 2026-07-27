import { PrismaClient, ProductCategory, RetailerKind } from "@prisma/client";
import { PLAN_DEFINITIONS } from "../lib/plans";
import { normalizeProduct } from "../lib/normalize";

const prisma = new PrismaClient();

/**
 * Données de démonstration pour le développement local.
 * L'architecture est multi-pays (voir lib/countries.ts) mais le catalogue
 * réellement alimenté reste le Sénégal ; les autres pays se remplissent par
 * les contributions communautaires (/contribuer) en attendant leurs scrapers.
 */

async function seedPlans() {
  for (const [code, def] of Object.entries(PLAN_DEFINITIONS)) {
    await prisma.plan.upsert({
      where: { code: code as keyof typeof PLAN_DEFINITIONS },
      update: def,
      create: { code: code as keyof typeof PLAN_DEFINITIONS, ...def },
    });
  }
  console.log("✓ Paliers (Plan) créés/mis à jour");
}

async function seedRetailersAndBranches() {
  const jumia = await prisma.retailer.upsert({
    where: { slug: "jumia" },
    update: { kind: RetailerKind.ONLINE, countryCode: "SN" },
    create: {
      name: "Jumia Sénégal",
      slug: "jumia",
      kind: RetailerKind.ONLINE,
      countryCode: "SN",
      websiteUrl: "https://www.jumia.sn",
    },
  });

  const auchan = await prisma.retailer.upsert({
    where: { slug: "auchan" },
    update: { kind: RetailerKind.CHAIN, countryCode: "SN" },
    create: {
      name: "Auchan Sénégal",
      slug: "auchan",
      kind: RetailerKind.CHAIN,
      countryCode: "SN",
      websiteUrl: "https://www.auchan.sn",
    },
  });

  const kirene = await prisma.retailer.upsert({
    where: { slug: "kirene" },
    update: { kind: RetailerKind.CHAIN, countryCode: "SN" },
    create: {
      name: "Kirene",
      slug: "kirene",
      kind: RetailerKind.CHAIN,
      countryCode: "SN",
      websiteUrl: "https://www.kirene.sn",
    },
  });

  // Exemple de petit commerçant : même statut que les grandes enseignes dans
  // le moteur de recherche, seule la provenance de la donnée diffère.
  const boutiqueQuartier = await prisma.retailer.upsert({
    where: { slug: "boutique-mame-diarra-dakar-sn" },
    update: {},
    create: {
      name: "Boutique Mame Diarra",
      slug: "boutique-mame-diarra-dakar-sn",
      kind: RetailerKind.LOCAL_SHOP,
      countryCode: "SN",
    },
  });

  const branches = [
    { retailer: auchan, name: "Auchan Mermoz", city: "Dakar", address: "Mermoz, Dakar", lat: 14.7167, lng: -17.4757 },
    { retailer: auchan, name: "Auchan Sacré-Cœur", city: "Dakar", address: "Sacré-Cœur 3, Dakar", lat: 14.7167, lng: -17.4633 },
    { retailer: auchan, name: "Auchan Ouakam", city: "Dakar", address: "Ouakam, Dakar", lat: 14.7256, lng: -17.4914 },
    { retailer: kirene, name: "Kirene Plateau", city: "Dakar", address: "Plateau, Dakar", lat: 14.6928, lng: -17.4467 },
    { retailer: boutiqueQuartier, name: "Boutique Mame Diarra", city: "Dakar", address: "Marché Sandaga, Dakar", lat: 14.6739, lng: -17.4386 },
  ];

  const createdBranches = [];
  for (const b of branches) {
    const id = `${b.retailer.slug}-${b.name}`.replace(/\s+/g, "-").toLowerCase();
    const branch = await prisma.storeBranch.upsert({
      where: { id },
      update: { countryCode: "SN" },
      create: {
        id,
        retailerId: b.retailer.id,
        name: b.name,
        city: b.city,
        countryCode: "SN",
        address: b.address,
        lat: b.lat,
        lng: b.lng,
      },
    });
    createdBranches.push(branch);
  }

  console.log("✓ Enseignes (Retailer) et succursales (StoreBranch) créées");
  return { jumia, auchan, kirene, boutiqueQuartier, createdBranches };
}

async function seedProductsAndPrices(
  retailers: Awaited<ReturnType<typeof seedRetailersAndBranches>>,
) {
  const { jumia, auchan, kirene, boutiqueQuartier, createdBranches } = retailers;
  const [auchanMermoz, auchanSacreCoeur, auchanOuakam, kirenePlateau, boutiqueSandaga] =
    createdBranches;

  const demoProducts = [
    {
      name: "Riz parfumé 25kg",
      category: ProductCategory.ALIMENTATION,
      offers: [
        { retailer: auchan, branch: auchanMermoz, priceMinor: 14500, rawTitle: "Riz parfumé sac 25kg" },
        { retailer: auchan, branch: auchanSacreCoeur, priceMinor: 14900, rawTitle: "Riz parfumé sac 25kg" },
        { retailer: kirene, branch: kirenePlateau, priceMinor: 13990, rawTitle: "Riz parfumé 25 KG" },
        { retailer: jumia, branch: null, priceMinor: 15200, rawTitle: "Riz parfumé 25kg - livraison Dakar" },
        { retailer: boutiqueQuartier, branch: boutiqueSandaga, priceMinor: 13500, rawTitle: "Riz parfumé 25kg", communautaire: true },
      ],
    },
    {
      name: "Huile végétale 1L",
      category: ProductCategory.ALIMENTATION,
      offers: [
        { retailer: auchan, branch: auchanMermoz, priceMinor: 1350, rawTitle: "Huile végétale 1 L" },
        { retailer: auchan, branch: auchanOuakam, priceMinor: 1290, rawTitle: "Huile végétale 1L" },
        { retailer: kirene, branch: kirenePlateau, priceMinor: 1400, rawTitle: "Huile végétale, 1 litre" },
        { retailer: boutiqueQuartier, branch: boutiqueSandaga, priceMinor: 1250, rawTitle: "Huile végétale 1L", communautaire: true },
      ],
    },
    {
      name: "Sucre en poudre 1kg",
      category: ProductCategory.ALIMENTATION,
      offers: [
        { retailer: auchan, branch: auchanSacreCoeur, priceMinor: 750, rawTitle: "Sucre en poudre 1kg" },
        { retailer: jumia, branch: null, priceMinor: 800, rawTitle: "Sucre en poudre - 1 KG" },
      ],
    },
    {
      name: "Lait en poudre 900g",
      category: ProductCategory.ALIMENTATION,
      offers: [
        { retailer: auchan, branch: auchanMermoz, priceMinor: 4200, rawTitle: "Lait en poudre 900 g" },
        { retailer: auchan, branch: auchanOuakam, priceMinor: 4350, rawTitle: "Lait en poudre 900g" },
        { retailer: jumia, branch: null, priceMinor: 4100, rawTitle: "Lait en poudre boîte 900g" },
      ],
    },
    {
      name: "Smartphone Samsung Galaxy A15",
      category: ProductCategory.ELECTRONIQUE,
      offers: [
        { retailer: jumia, branch: null, priceMinor: 129000, rawTitle: "Samsung Galaxy A15 128Go" },
        { retailer: auchan, branch: auchanSacreCoeur, priceMinor: 134900, rawTitle: "Samsung Galaxy A15 128 Go" },
      ],
    },
  ];

  for (const demo of demoProducts) {
    const { normalizedName, unit, unitValue } = normalizeProduct(demo.name);

    const product = await prisma.product.upsert({
      where: { id: normalizedName.replace(/\s+/g, "-") },
      update: {},
      create: {
        id: normalizedName.replace(/\s+/g, "-"),
        name: demo.name,
        normalizedName,
        unit,
        unitValue,
        category: demo.category,
      },
    });

    // PriceObservation est conçu comme un historique append-only (voir schema.prisma) ;
    // on nettoie uniquement les données de démo pour que le seed reste rejouable en local.
    await prisma.priceObservation.deleteMany({ where: { productId: product.id } });

    for (const offer of demo.offers) {
      const communautaire = "communautaire" in offer && offer.communautaire === true;
      await prisma.priceObservation.create({
        data: {
          productId: product.id,
          retailerId: offer.retailer.id,
          branchId: offer.branch?.id ?? null,
          priceMinor: offer.priceMinor,
          currency: "XOF",
          rawTitle: offer.rawTitle,
          source: communautaire ? "USER_SUBMITTED" : "SCRAPER",
          // Un petit commerçant n'a pas de page produit en ligne : le lien est
          // alors construit depuis sa position (voir lib/search.ts).
          sourceUrl: communautaire ? null : offer.retailer.websiteUrl,
          scrapedAt: new Date(),
        },
      });
    }
  }

  console.log("✓ Produits (Product) et observations de prix (PriceObservation) créés");
}

async function main() {
  await seedPlans();
  const retailers = await seedRetailersAndBranches();
  await seedProductsAndPrices(retailers);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
