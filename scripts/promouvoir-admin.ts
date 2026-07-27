import { PrismaClient, Role } from "@prisma/client";

/**
 * Promeut un compte au rôle administrateur (fondateur).
 * Usage : npx tsx -r dotenv/config scripts/promouvoir-admin.ts email@exemple.com
 *
 * Un administrateur est exempté de quota et de paiement (voir lib/quota.ts) et
 * accède à la Console fondateur (/console).
 */
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Indiquez l'email du compte à promouvoir.");
    process.exit(1);
  }

  const utilisateur = await prisma.user.findUnique({ where: { email } });
  if (!utilisateur) {
    console.error(
      `Aucun compte avec l'email ${email}. Créez-le d'abord via /inscription.`,
    );
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: { role: Role.ADMIN },
  });

  console.log(`${email} est désormais administrateur (fondateur).`);
}

main()
  .catch((erreur) => {
    console.error(erreur);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
