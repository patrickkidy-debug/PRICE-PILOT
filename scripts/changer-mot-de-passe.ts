import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Change le mot de passe d'un compte.
 * Usage : npx tsx -r dotenv/config scripts/changer-mot-de-passe.ts email nouveau-mot-de-passe
 *
 * Le mot de passe n'est jamais stocké en clair : seule son empreinte bcrypt
 * est enregistrée, comme à l'inscription.
 */
const prisma = new PrismaClient();

async function main() {
  const [email, motDePasse] = process.argv.slice(2);

  if (!email || !motDePasse) {
    console.error("Usage : ... changer-mot-de-passe.ts <email> <mot-de-passe>");
    process.exit(1);
  }

  if (motDePasse.length < 8) {
    console.error("Le mot de passe doit contenir au moins 8 caractères.");
    process.exit(1);
  }

  const existant = await prisma.user.findUnique({ where: { email } });
  if (!existant) {
    console.error(`Aucun compte avec l'email ${email}.`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: { passwordHash: await bcrypt.hash(motDePasse, 10) },
  });

  console.log(`Mot de passe mis à jour pour ${email}.`);
}

main()
  .catch((erreur) => {
    console.error(erreur);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
