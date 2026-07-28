import { redirect } from "next/navigation";
import { UsageType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { estAdministrateur } from "@/lib/quota";
import { Header } from "@/components/layout/Header";

/**
 * Console fondateur — réservée aux comptes ADMIN.
 * N'affiche que des chiffres réellement présents en base : pas de métrique
 * inventée ni de projection.
 */
export default async function ConsolePage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  if (!(await estAdministrateur(session.user.id))) redirect("/assistant");

  const debutDuMois = new Date();
  debutDuMois.setDate(1);
  debutDuMois.setHours(0, 0, 0, 0);

  const [
    utilisateurs,
    nouveauxCeMois,
    recherchesCeMois,

    abonnementsActifs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: debutDuMois } } }),
    prisma.usageLog.count({
      where: { type: UsageType.SEARCH, createdAt: { gte: debutDuMois } },
    }),

    prisma.subscription.count({ where: { status: "ACTIVE" } }),
  ]);

  const indicateurs = [
    { icone: "group", libelle: "Comptes", valeur: utilisateurs, detail: `${nouveauxCeMois} ce mois-ci` },
    { icone: "search", libelle: "Recherches ce mois", valeur: recherchesCeMois, detail: "toutes sources" },
  ];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-tertiary">shield_person</span>
          <h1 className="text-2xl font-bold text-on-surface">Console fondateur</h1>
        </div>
        <p className="mt-1 text-on-surface-variant">
          Réservée à votre compte. Chiffres lus directement en base, sans
          estimation.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {indicateurs.map((i) => (
            <div key={i.libelle} className="glass-card rounded-2xl p-5">
              <div className="mb-3 w-fit rounded-xl bg-primary/15 p-2 text-primary">
                <span className="material-symbols-outlined">{i.icone}</span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                {i.libelle}
              </p>
              <p className="text-2xl font-bold text-on-surface">{i.valeur}</p>
              <p className="mt-1 text-xs text-on-surface-variant">{i.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="mb-4 text-lg font-semibold text-on-surface">Abonnements</h2>
            <p className="text-3xl font-bold text-on-surface">{abonnementsActifs}</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              abonnements actifs en base.
            </p>
            <p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-on-surface-variant">
              Votre compte est administrateur : recherches illimitées, aucun
              paiement requis.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
