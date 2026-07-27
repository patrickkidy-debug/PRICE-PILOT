import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { PlanCode } from "@prisma/client";

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

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const freePlan = await prisma.plan.findUnique({ where: { code: PlanCode.FREE } });
  if (!freePlan) {
    return NextResponse.json(
      { error: "Configuration serveur incomplète (paliers non initialisés)." },
      { status: 500 },
    );
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      subscriptions: {
        create: { planId: freePlan.id },
      },
    },
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
