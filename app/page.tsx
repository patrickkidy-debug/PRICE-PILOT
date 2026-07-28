import Link from "next/link";
import { auth } from "@/lib/auth";
import { PLAN_DEFINITIONS } from "@/lib/plans";
import { formatMoney } from "@/lib/money";
import { Header } from "@/components/layout/Header";

const ETAPES = [
  {
    icone: "edit_note",
    couleur: "text-primary",
    titre: "Décrivez",
    texte: "Dites simplement ce que vous cherchez, en langage naturel.",
  },
  {
    icone: "travel_explore",
    couleur: "text-amber-500",
    titre: "L'IA cherche sur le web",
    texte:
      "PricePilot interroge les sites marchands en temps réel et lit les vraies pages produit.",
  },
  {
    icone: "compare_arrows",
    couleur: "text-orange-400",
    titre: "Comparez",
    texte:
      "Les offres trouvées sont mises côte à côte, avec le lien vers chaque vendeur.",
  },
  {
    icone: "shopping_cart_checkout",
    couleur: "text-primary",
    titre: "Achetez",
    texte: "Un clic sur la meilleure offre vous emmène directement chez le vendeur.",
  },
];

const PALIERS = ["START", "STANDARD", "GROWTH"] as const;

export default async function AccueilPage() {
  const session = await auth();
  const connecte = Boolean(session?.user);

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white">
      {/* Header global responsive */}
      <Header />

      {/* Hero Section */}
      <section className="relative flex min-h-[calc(100vh-5rem)] items-center overflow-hidden py-12 md:py-20">
        <div className="aurora animate-pulse-glow absolute inset-0" />
        <div className="grid-overlay absolute inset-0" />

        <div className="relative z-10 mx-auto grid w-full max-w-container gap-12 px-4 sm:px-8 md:grid-cols-2 md:px-16 lg:gap-16">
          <div className="flex animate-fade-up flex-col justify-center space-y-6 sm:space-y-8 text-center md:text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mx-auto md:mx-0 shadow-sm">
              <span className="material-symbols-outlined text-[18px] text-primary">
                travel_explore
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Recherche web en temps réel
              </span>
            </div>

            <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Dites ce que
              <br />
              vous cherchez.
              <br />
              <span className="text-gradient">On trouve le bon plan.</span>
            </h1>

            <p className="max-w-xl text-base sm:text-lg leading-relaxed text-slate-300 mx-auto md:mx-0">
              PricePilot part chercher les prix réels sur les sites marchands,
              lit les vraies pages produit et vous ramène la meilleure offre —
              avec le lien pour acheter. Votre pays est détecté automatiquement.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <Link
                href={connecte ? "/assistant" : "/inscription"}
                className="primary-glow w-full sm:w-auto text-center rounded-xl bg-primary px-8 py-4 text-base font-bold text-white transition-all hover:bg-primary-hover hover:scale-105 active:scale-95 shadow-lg shadow-primary/25"
              >
                {connecte ? "Lancer une recherche" : "Commencer gratuitement"}
              </Link>
              <a
                href="#fonctionnement"
                className="glass w-full sm:w-auto text-center rounded-xl px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                Comment ça marche
              </a>
            </div>
          </div>

          {/* Aperçu interactif (Hero card) */}
          <div className="relative flex items-center justify-center mt-6 md:mt-0">
            <div className="glass-card animate-float w-full max-w-md rounded-3xl p-6 border border-white/15 shadow-2xl shadow-primary/10">
              <div className="mb-4 flex items-center gap-2.5 border-b border-white/10 pb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <span className="material-symbols-outlined text-xl">psychology</span>
                </div>
                <span className="text-sm font-bold text-white">PricePilot AI</span>
                <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  en ligne
                </span>
              </div>

              <div className="space-y-4 text-sm">
                <div className="ml-auto w-fit max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-white font-medium shadow-md">
                  Je cherche un iPhone 16 Pro pas cher
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
                  <span className="material-symbols-outlined text-[16px]">
                    travel_explore
                  </span>
                  Recherche web en direct…
                </div>
                <div className="w-fit max-w-[95%] space-y-2 rounded-2xl bg-surface-container-high p-4 text-white border border-white/10">
                  <p className="font-bold text-primary flex items-center gap-2">
                    <span className="text-lg">🏆</span> Meilleur plan trouvé
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Comparaison des offres en cours chez plusieurs vendeurs, avec
                    le lien direct vers chaque page produit.
                  </p>
                </div>
              </div>
            </div>

            {/* Badges flottants sur écran moyen et large */}
            <div className="glass-card absolute -right-2 top-4 hidden sm:flex animate-float rounded-2xl p-4 border border-white/15 shadow-xl [animation-delay:1s]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <span className="material-symbols-outlined text-[20px]">
                    link
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-primary">Sources citées</div>
                  <div className="text-xs text-slate-300">Chaque prix est sourcé</div>
                </div>
              </div>
            </div>

            <div className="glass-card absolute -left-4 bottom-6 hidden sm:flex animate-float rounded-2xl p-4 border border-white/15 shadow-xl [animation-delay:2s]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                  <span className="material-symbols-outlined text-[20px]">
                    my_location
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-400">Localisation auto</div>
                  <div className="text-xs text-slate-300">Sans rien demander</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Fonctionnement */}
      <section id="fonctionnement" className="border-t border-white/10 bg-surface-container-lowest/50 py-20 sm:py-28">
        <div className="mx-auto max-w-container px-4 sm:px-8 md:px-16">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Une vraie recherche, pas un catalogue figé
            </h2>
            <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-300">
              L&apos;assistant interroge le web au moment où vous posez la
              question, puis cite les pages qu&apos;il a réellement consultées.
            </p>
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {ETAPES.map((etape, i) => (
              <div
                key={etape.titre}
                className="glass-card glass-card-hover group relative flex flex-col items-center text-center p-8 rounded-3xl border border-white/10 hover:border-primary/40"
              >
                <div
                  className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/5 transition-transform group-hover:scale-110 shadow-lg ${etape.couleur}`}
                >
                  <span className="material-symbols-outlined text-[32px]">{etape.icone}</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">
                  {i + 1}. {etape.titre}
                </h3>
                <p className="text-sm leading-relaxed text-slate-300">{etape.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Atouts (Bento Grid) */}
      <section id="atouts" className="mx-auto max-w-container px-4 sm:px-8 py-20 sm:py-28 md:px-16">
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          <div className="glass-card glass-card-hover relative flex min-h-[300px] flex-col justify-end overflow-hidden rounded-3xl p-8 sm:p-10 md:col-span-2 border border-white/10">
            <span className="material-symbols-outlined absolute right-6 top-6 text-[100px] text-primary/10 select-none">
              travel_explore
            </span>
            <div className="relative z-10">
              <h3 className="mb-4 text-2xl sm:text-3xl font-extrabold text-white">
                Recherche web en direct
              </h3>
              <p className="max-w-md text-base sm:text-lg text-slate-300">
                Pas de base de données figée : l&apos;IA va lire les sites
                marchands au moment de votre question, et vous donne le lien
                exact de la page produit qu&apos;elle a trouvée.
              </p>
            </div>
          </div>

          <div className="glass-card glass-card-hover flex flex-col justify-between gap-6 rounded-3xl p-8 sm:p-10 border border-white/10">
            <span className="material-symbols-outlined text-[44px] text-amber-400">
              format_quote
            </span>
            <div>
              <h3 className="mb-3 text-xl font-bold text-white">Chaque prix est sourcé</h3>
              <p className="text-slate-300 text-sm sm:text-base">
                Les réponses citent les pages consultées. Aucun prix inventé,
                jamais.
              </p>
            </div>
          </div>

          <div className="glass-card glass-card-hover flex flex-col justify-between gap-6 rounded-3xl p-8 sm:p-10 border border-white/10">
            <span className="material-symbols-outlined text-[44px] text-primary">
              my_location
            </span>
            <div>
              <h3 className="mb-3 text-xl font-bold text-white">
                Localisation automatique
              </h3>
              <p className="text-slate-300 text-sm sm:text-base">
                Votre pays est détecté tout seul. Les résultats sont adaptés à
                votre marché sans rien configurer.
              </p>
            </div>
          </div>

          <div className="glass-card glass-card-hover relative flex min-h-[300px] flex-col justify-end overflow-hidden rounded-3xl p-8 sm:p-10 md:col-span-2 border border-white/10">
            <div className="absolute right-8 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-primary/15 blur-[70px]" />
            <div className="relative z-10">
              <h3 className="mb-4 text-2xl sm:text-3xl font-extrabold text-white">
                Aussi les commerçants du quartier
              </h3>
              <p className="max-w-lg text-base sm:text-lg text-slate-300">
                Les boutiques sans site web n&apos;apparaissent nulle part en
                ligne. Sur PricePilot, n&apos;importe qui peut signaler leurs
                prix — et l&apos;assistant les prend en compte à côté des
                grandes enseignes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Tarifs */}
      <section id="tarifs" className="border-t border-white/10 bg-surface-container-low/60 py-20 sm:py-28">
        <div className="mx-auto max-w-container px-4 sm:px-8 md:px-16">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Des forfaits simples
            </h2>
            <p className="text-base sm:text-lg text-slate-300">
              Commencez gratuitement. Chaque limite est appliquée réellement,
              pas seulement annoncée.
            </p>
          </div>

          <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
            {PALIERS.map((code) => {
              const plan = PLAN_DEFINITIONS[code];
              const populaire = code === "STANDARD";
              return (
                <div
                  key={code}
                  className={`glass-card flex flex-col rounded-3xl p-8 sm:p-10 border transition-all ${
                    populaire
                      ? "relative z-10 border-primary bg-surface-container-high/90 shadow-2xl shadow-primary/25 md:scale-105"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  {populaire && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white shadow-md">
                      Le plus populaire
                    </div>
                  )}
                  <div className="mb-4 text-xs font-bold uppercase tracking-wider text-primary">
                    {plan.name}
                  </div>
                  <div className="mb-8 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-white">
                      {formatMoney(plan.priceMinor, plan.priceCurrency)}
                    </span>
                    <span className="text-slate-400 text-sm">/ mois</span>
                  </div>
                  <ul className="mb-8 flex-grow space-y-3.5 text-sm text-slate-200">
                    <li className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-primary">
                        check_circle
                      </span>
                      {plan.searchQuotaMonthly ?? "Illimité"} recherches / mois
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-primary">
                        check_circle
                      </span>
                      {plan.maxCompareItems} offres comparées par recherche
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-primary">
                        check_circle
                      </span>
                      {plan.maxWatchlistItems} produits suivis
                    </li>
                    <li className="flex items-center gap-3">
                      <span
                        className={`material-symbols-outlined text-[20px] ${
                          plan.adsEnabled ? "text-slate-500" : "text-primary"
                        }`}
                      >
                        {plan.adsEnabled ? "block" : "check_circle"}
                      </span>
                      {plan.adsEnabled ? "Avec publicité" : "Sans publicité"}
                    </li>
                  </ul>
                  <Link
                    href="/inscription"
                    className={`w-full rounded-xl py-3.5 text-center text-sm font-bold transition-all active:scale-95 ${
                      populaire
                        ? "primary-glow bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/30"
                        : "border border-white/20 text-white hover:bg-white/10"
                    }`}
                  >
                    Choisir {plan.name}
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="mt-12 text-center text-xs sm:text-sm text-slate-400">
            Un palier Gratuit est disponible à l&apos;inscription. Le paiement en
            ligne n&apos;est pas encore actif : tout nouveau compte démarre sur
            le palier Gratuit.{" "}
            <Link href="/tarifs" className="text-primary underline hover:text-primary-hover font-semibold">
              Voir le détail des limites
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#08090d] py-12">
        <div className="mx-auto flex max-w-container flex-col items-center justify-between gap-6 px-4 sm:px-8 md:flex-row md:px-16">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
                <span className="material-symbols-outlined text-base font-bold">flight_takeoff</span>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Price<span className="text-primary">Pilot</span>
              </span>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              Votre copilote d&apos;achat, alimenté par la recherche web.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-300">
            <Link href="/tarifs" className="transition-colors hover:text-primary">
              Tarifs
            </Link>
            <Link href="/connexion" className="transition-colors hover:text-primary">
              Connexion
            </Link>
            <Link href="/inscription" className="transition-colors hover:text-primary">
              Créer un compte
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
