import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { PlanCode, Prisma } from "@prisma/client";

const inscriptionSchema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = inscriptionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  const passwordHash = await bcrypt.hash(password, 10);

  // Une seule requête au lieu de trois. La base étant distante (~800 ms par
  // aller-retour), chaque requête évitée se voit directement à l'inscription :
  //  - l'email déjà pris est détecté par la contrainte d'unicité (P2002) au
  //    lieu d'un findUnique préalable ;
  //  - le palier Gratuit est rattaché par son code unique via `connect`, ce qui
  //    évite d'aller le chercher d'abord.
  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        subscriptions: {
          create: { plan: { connect: { code: PlanCode.FREE } } },
        },
      },
      select: { id: true, email: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (erreur) {
    if (erreur instanceof Prisma.PrismaClientKnownRequestError) {
      if (erreur.code === "P2002") {
        return NextResponse.json(
          { error: "Un compte existe déjà avec cet email." },
          { status: 409 },
        );
      }
      // P2025 : le palier Gratuit n'existe pas — la base n'a pas été semée.
      if (erreur.code === "P2025") {
        return NextResponse.json(
          { error: "Configuration serveur incomplète (paliers non initialisés)." },
          { status: 500 },
        );
      }
    }
    throw erreur;
  }
}
