-- Ouverture internationale + prise en charge des petits commerçants.
-- Les colonnes de prix sont RENOMMÉES (et non supprimées/recréées) afin de
-- préserver les prix déjà enregistrés : les montants existants sont en XOF,
-- devise sans sous-unité, donc la valeur en unité mineure est identique.

-- Type de vendeur : enseigne, marchand en ligne, ou commerçant local.
CREATE TYPE "RetailerKind" AS ENUM ('CHAIN', 'ONLINE', 'LOCAL_SHOP');

-- Plan : prix générique (montant + devise) au lieu d'un champ FCFA figé.
ALTER TABLE "Plan" RENAME COLUMN "priceFcfa" TO "priceMinor";
ALTER TABLE "Plan" ADD COLUMN "priceCurrency" TEXT NOT NULL DEFAULT 'XOF';

-- PriceObservation : montant générique, lien produit facultatif (un commerçant
-- de quartier n'a pas de page en ligne), traçabilité du contributeur.
ALTER TABLE "PriceObservation" RENAME COLUMN "priceFcfa" TO "priceMinor";
ALTER TABLE "PriceObservation" ALTER COLUMN "sourceUrl" DROP NOT NULL;
ALTER TABLE "PriceObservation" ADD COLUMN "submittedById" TEXT;
ALTER TABLE "PriceObservation"
  ADD CONSTRAINT "PriceObservation_submittedById_fkey"
  FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- PriceAlert : seuil dans la devise du produit suivi.
ALTER TABLE "PriceAlert" RENAME COLUMN "targetPriceFcfa" TO "targetPriceMinor";
ALTER TABLE "PriceAlert" ADD COLUMN "targetCurrency" TEXT;

-- User : pays par défaut de l'utilisateur.
ALTER TABLE "User" ADD COLUMN "defaultCountryCode" TEXT;

-- Retailer : type de vendeur, pays, et auteur si créé par un contributeur.
ALTER TABLE "Retailer" ADD COLUMN "kind" "RetailerKind" NOT NULL DEFAULT 'CHAIN';
ALTER TABLE "Retailer" ADD COLUMN "countryCode" TEXT;
ALTER TABLE "Retailer" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Retailer"
  ADD CONSTRAINT "Retailer_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Retailer_countryCode_idx" ON "Retailer"("countryCode");

-- Les enseignes déjà en base sont sénégalaises ; Jumia est un marchand en ligne.
UPDATE "Retailer" SET "countryCode" = 'SN';
UPDATE "Retailer" SET "kind" = 'ONLINE' WHERE "slug" = 'jumia';

-- StoreBranch : pays et lien direct vers la boutique.
ALTER TABLE "StoreBranch" ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'SN';
ALTER TABLE "StoreBranch" ADD COLUMN "storeUrl" TEXT;
ALTER TABLE "StoreBranch" ADD COLUMN "createdById" TEXT;
ALTER TABLE "StoreBranch"
  ADD CONSTRAINT "StoreBranch_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "StoreBranch_countryCode_idx" ON "StoreBranch"("countryCode");
