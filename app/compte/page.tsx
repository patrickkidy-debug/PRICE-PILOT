import { redirect } from "next/navigation";
import { UsageType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { getUserPlan, getMonthlyUsageCount } from "@/lib/quota";
import { Header } from "@/components/layout/Header";

export default async function ComptePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/connexion");
  }

  const plan = await getUserPlan(session.user.id);
  const recherchesUtilisees = await getMonthlyUsageCount(session.user.id, UsageType.SEARCH);
  const quota = plan.searchQuotaMonthly;
  const pourcentage = quota ? Math.min(100, Math.round((recherchesUtilisees / quota) * 100)) : 0;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold text-on-surface">
          Bienvenue, {session.user.name ?? "vous"}
        </h1>
        <p className="mt-1 text-on-surface-variant">
          Aperçu de votre abonnement et de votre usage ce mois-ci.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <span className="material-symbols-outlined">workspace_premium</span>
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Palier actuel
            </p>
            <h2 className="text-2xl font-bold text-primary">{plan.name}</h2>
            <a
              href="/tarifs"
              className="mt-4 inline-flex items-center gap-1 rounded-xl bg-primary-container px-4 py-2 text-sm font-semibold text-white primary-glow transition-all active:scale-95"
            >
              Changer de palier
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-secondary-container/10 p-2.5 text-secondary">
                <span className="material-symbols-outlined">search</span>
              </div>
              <span className="text-xs font-medium text-on-surface-variant">Ce mois-ci</span>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Recherches utilisées
            </p>
            <h2 className="text-2xl font-bold text-on-surface">
              {recherchesUtilisees} <span className="text-base font-normal text-on-surface-variant">/ {quota ?? "Illimité"}</span>
            </h2>
            {quota != null && (
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-container">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pourcentage}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="glass-card mt-6 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">schedule</span>
            <p className="text-sm font-semibold uppercase tracking-wider">Bientôt disponible</p>
          </div>
          <p className="mt-2 text-on-surface-variant">
            Alertes de prix et produits suivis arrivent dans une prochaine mise
            à jour — pas de données à afficher pour l&apos;instant.
          </p>
        </div>
      </main>
    </>
  );
}
