import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { BoutonAbonnement } from "@/components/tarifs/BoutonAbonnement";
import { auth } from "@/lib/auth";
import { PLAN_DEFINITIONS } from "@/lib/plans";
import { formatMoney } from "@/lib/money";

const ORDRE = ["FREE", "START", "STANDARD", "GROWTH"] as const;

const LABELS_FREQUENCE: Record<string, string> = {
  NONE: "Aucune",
  DAILY_DIGEST: "Résumé quotidien",
  IMMEDIATE: "Immédiat (post-scraping)",
};

export default async function TarifsPage() {
  const session = await auth();
  const connecte = Boolean(session?.user);

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white">
      <Header />
      <main className="mx-auto max-w-container px-4 sm:px-8 md:px-16 py-12 sm:py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-4">
            <span className="material-symbols-outlined text-[18px] text-primary">sell</span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Grille tarifaire claire</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Nos forfaits & tarifs</h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Choisissez le palier adapté à votre usage. Chaque restriction
            ci-dessous est appliquée techniquement, pas seulement indicative.
          </p>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {ORDRE.map((code) => {
            const plan = PLAN_DEFINITIONS[code];
            const misEnAvant = code === "STANDARD";
            return (
              <div
                key={code}
                className={`glass-card flex flex-col rounded-3xl p-6 sm:p-8 border transition-all ${
                  misEnAvant
                    ? "relative z-10 border-primary bg-surface-container-high/90 shadow-2xl shadow-primary/25 scale-[1.02]"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                {misEnAvant && (
                  <span className="mb-4 self-start rounded-full bg-primary px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white shadow-md">
                    Le plus populaire
                  </span>
                )}
                <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                <p className="mt-3 text-3xl sm:text-4xl font-black text-white">
                  {plan.priceMinor === 0
                    ? "Gratuit"
                    : formatMoney(plan.priceMinor, plan.priceCurrency)}
                  {plan.priceMinor > 0 && (
                    <span className="text-sm font-normal text-slate-400">/mois</span>
                  )}
                </p>

                <ul className="mt-6 flex-grow space-y-3 text-sm text-slate-200 border-t border-white/10 pt-6">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                    <span><strong>{plan.searchQuotaMonthly ?? "Illimité"}</strong> recherches / mois</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">near_me</span>
                    <span>Rayon : <strong>{plan.searchRadiusKm >= 9999 ? "National" : `${plan.searchRadiusKm} km`}</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">compare</span>
                    <span><strong>{plan.maxCompareItems}</strong> résultats comparés</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">notifications</span>
                    <span><strong>{plan.maxWatchlistItems}</strong> produits suivis</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="material-symbols-outlined text-[18px] text-amber-400">schedule</span>
                    <span>Alertes : {LABELS_FREQUENCE[plan.alertFrequency]}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">history</span>
                    <span>Historique : <strong>{plan.priceHistoryMonths === 0 ? "Aucun" : `${plan.priceHistoryMonths} mois`}</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">download</span>
                    <span>Export CSV : <strong>{plan.csvExportEnabled ? (plan.csvExportMonthlyQuota ? `${plan.csvExportMonthlyQuota}/mois` : "Illimité") : "Non"}</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">location_city</span>
                    <span>Villes : <strong>{plan.multiCityLimit === 0 ? "Toutes" : plan.multiCityLimit}</strong></span>
                  </li>
                  <li className="flex items-center gap-2 text-xs">
                    <span className={`material-symbols-outlined text-[18px] ${plan.adsEnabled ? "text-slate-500" : "text-primary"}`}>
                      {plan.adsEnabled ? "block" : "verified"}
                    </span>
                    <span>Publicité : {plan.adsEnabled ? "Oui" : "Non"}</span>
                  </li>
                </ul>

                <div className="mt-8">
                  {plan.priceMinor === 0 ? (
                    <Link
                      href="/inscription"
                      className="block w-full rounded-xl border border-white/20 px-4 py-3.5 text-center text-sm font-bold text-white transition-colors hover:bg-white/10"
                    >
                      Commencer gratuitement
                    </Link>
                  ) : (
                    <BoutonAbonnement
                      planCode={code as "START" | "STANDARD" | "GROWTH"}
                      libelle="Choisir ce palier"
                      misEnAvant={misEnAvant}
                      connecte={connecte}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 rounded-2xl border border-white/10 bg-surface-container-high/60 p-6 text-xs text-slate-300 leading-relaxed">
          <p>
            « Immédiat » reste borné par la cadence du scraping (toutes les
            6 à 12 heures). La distinction entre paliers porte sur la fréquence
            de notification, pas sur la fraîcheur des données sous-jacentes,
            identique pour tous les utilisateurs. Les paiements sont traités par
            PayTech (Orange Money, Wave, Free Money, carte bancaire) ; votre
            palier s&apos;active dès confirmation de la transaction.
          </p>
        </div>
      </main>
    </div>
  );
}
