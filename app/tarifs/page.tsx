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
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-3xl font-bold text-on-surface">Nos tarifs</h1>
        <p className="mt-2 text-on-surface-variant">
          Choisissez le palier adapté à votre usage. Chaque restriction
          ci-dessous est appliquée techniquement, pas seulement indicative.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-4">
          {ORDRE.map((code) => {
            const plan = PLAN_DEFINITIONS[code];
            const misEnAvant = code === "STANDARD";
            return (
              <div
                key={code}
                className={`rounded-2xl p-6 ${
                  misEnAvant
                    ? "glass-card border-primary/40 shadow-2xl shadow-primary/20"
                    : "glass-card"
                }`}
              >
                {misEnAvant && (
                  <span className="mb-3 inline-block rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-white">
                    Le plus populaire
                  </span>
                )}
                <h2 className="text-xl font-bold text-on-surface">{plan.name}</h2>
                <p className="mt-2 text-3xl font-extrabold text-on-surface">
                  {plan.priceMinor === 0
                    ? "Gratuit"
                    : formatMoney(plan.priceMinor, plan.priceCurrency)}
                  {plan.priceMinor > 0 && (
                    <span className="text-base font-normal text-on-surface-variant">/mois</span>
                  )}
                </p>

                <ul className="mt-6 space-y-2 text-sm text-on-surface-variant">
                  <li>
                    <strong>{plan.searchQuotaMonthly ?? "Illimité"}</strong> recherches / mois
                  </li>
                  <li>
                    Rayon de recherche :{" "}
                    <strong>
                      {plan.searchRadiusKm >= 9999 ? "National" : `${plan.searchRadiusKm} km`}
                    </strong>
                  </li>
                  <li>
                    <strong>{plan.maxCompareItems}</strong> résultats comparés / recherche
                  </li>
                  <li>
                    <strong>{plan.maxWatchlistItems}</strong> produits suivis (alertes)
                  </li>
                  <li>Fréquence des alertes : {LABELS_FREQUENCE[plan.alertFrequency]}</li>
                  <li>
                    Historique des prix :{" "}
                    <strong>
                      {plan.priceHistoryMonths === 0 ? "Aucun" : `${plan.priceHistoryMonths} mois`}
                    </strong>
                  </li>
                  <li>
                    Export CSV :{" "}
                    <strong>
                      {plan.csvExportEnabled
                        ? plan.csvExportMonthlyQuota
                          ? `${plan.csvExportMonthlyQuota}/mois`
                          : "Illimité"
                        : "Non"}
                    </strong>
                  </li>
                  <li>
                    Villes :{" "}
                    <strong>{plan.multiCityLimit === 0 ? "Toutes" : plan.multiCityLimit}</strong>
                  </li>
                  <li>Publicité : {plan.adsEnabled ? "Oui" : "Non"}</li>
                </ul>

                <div className="mt-6">
                  {plan.priceMinor === 0 ? (
                    <Link
                      href="/inscription"
                      className="block rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-on-surface transition-colors hover:bg-white/5"
                    >
                      Commencer
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

        <p className="mt-10 text-xs text-on-surface-variant">
          « Immédiat » reste borné par la cadence du scraping (toutes les
          6 à 12 heures). La distinction entre paliers porte sur la fréquence
          de notification, pas sur la fraîcheur des données sous-jacentes,
          identique pour tous les utilisateurs. Les paiements sont traités par
          PayTech (Orange Money, Wave, Free Money, carte bancaire) ; votre
          palier s&apos;active dès confirmation de la transaction.
        </p>
      </main>
    </>
  );
}
