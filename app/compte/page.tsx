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
    <div className="min-h-screen bg-[#0d0e12] text-white">
      <Header />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Bienvenue, {session.user.name ?? "vous"}
        </h1>
        <p className="mt-2 text-slate-300 text-base">
          Aperçu de votre abonnement et de votre usage ce mois-ci.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/15 shadow-xl shadow-primary/10">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-primary/20 p-3 text-primary">
                <span className="material-symbols-outlined text-2xl">workspace_premium</span>
              </div>
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Palier actuel
            </p>
            <h2 className="text-3xl font-black text-primary mt-1">{plan.name}</h2>
            <a
              href="/tarifs"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white primary-glow transition-all hover:bg-primary-hover active:scale-95 shadow-md shadow-primary/25"
            >
              Changer de palier
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </a>
          </div>

          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/15 shadow-xl shadow-primary/10">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-amber-500/20 p-3 text-amber-400">
                <span className="material-symbols-outlined text-2xl">search</span>
              </div>
              <span className="text-xs font-semibold text-slate-400">Ce mois-ci</span>
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Recherches utilisées
            </p>
            <h2 className="text-3xl font-black text-white mt-1">
              {recherchesUtilisees} <span className="text-base font-normal text-slate-400">/ {quota ?? "Illimité"}</span>
            </h2>
            {quota != null && (
              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 shadow-sm shadow-primary"
                  style={{ width: `${pourcentage}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="glass-card mt-8 rounded-3xl p-6 sm:p-8 border border-white/15">
          <div className="flex items-center gap-2 text-amber-400">
            <span className="material-symbols-outlined text-[22px]">schedule</span>
            <p className="text-sm font-bold uppercase tracking-wider">Bientôt disponible</p>
          </div>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            Alertes de prix et produits suivis arrivent dans une prochaine mise
            à jour — pas de données à afficher pour l&apos;instant.
          </p>
        </div>
      </main>
    </div>
  );
}
