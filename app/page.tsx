import Link from "next/link";
import { auth } from "@/lib/auth";
import { PLAN_DEFINITIONS } from "@/lib/plans";
import { formatMoney } from "@/lib/money";

const ETAPES = [
  {
    icone: "edit_note",
    couleur: "text-primary",
    titre: "Décrivez",
    texte: "Dites simplement ce que vous cherchez, en langage naturel.",
  },
  {
    icone: "travel_explore",
    couleur: "text-secondary",
    titre: "L'IA cherche sur le web",
    texte:
      "PricePilot interroge les sites marchands en temps réel et lit les vraies pages produit.",
  },
  {
    icone: "compare_arrows",
    couleur: "text-tertiary",
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
    <div className="min-h-screen">
      {/* Barre de navigation */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-surface/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-20 max-w-container items-center justify-between px-6 md:px-16">
          <Link href="/" className="text-2xl font-bold tracking-tighter text-primary">
            PricePilot
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#fonctionnement" className="text-sm text-on-surface-variant transition-colors hover:text-primary">
              Fonctionnement
            </a>
            <a href="#atouts" className="text-sm text-on-surface-variant transition-colors hover:text-primary">
              Atouts
            </a>
            <a href="#tarifs" className="text-sm text-on-surface-variant transition-colors hover:text-primary">
              Tarifs
            </a>
          </div>
          <div className="flex items-center gap-3">
            {connecte ? (
              <Link
                href="/assistant"
                className="primary-glow rounded-lg bg-primary-container px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95"
              >
                Ouvrir l&apos;app
              </Link>
            ) : (
              <>
                <Link
                  href="/connexion"
                  className="px-4 py-2 text-sm text-on-surface-variant transition-colors hover:text-primary"
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  className="primary-glow rounded-lg bg-primary-container px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95"
                >
                  Commencer
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-20">
        <div className="aurora animate-pulse-glow absolute inset-0" />
        <div className="grid-overlay absolute inset-0" />

        <div className="relative z-10 mx-auto grid w-full max-w-container gap-16 px-6 md:grid-cols-2 md:px-16">
          <div className="flex animate-fade-up flex-col justify-center space-y-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">
                travel_explore
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Recherche web en temps réel
              </span>
            </div>

            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tighter text-on-surface md:text-7xl">
              Dites ce que
              <br />
              vous cherchez.
              <br />
              <span className="text-gradient">On trouve le bon plan.</span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-on-surface-variant">
              PricePilot part chercher les prix réels sur les sites marchands,
              lit les vraies pages produit et vous ramène la meilleure offre —
              avec le lien pour acheter. Votre pays est détecté automatiquement.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href={connecte ? "/assistant" : "/inscription"}
                className="primary-glow rounded-xl bg-primary-container px-8 py-4 text-base font-semibold text-white transition-transform hover:scale-105 active:scale-95"
              >
                {connecte ? "Lancer une recherche" : "Commencer gratuitement"}
              </Link>
              <a
                href="#fonctionnement"
                className="glass rounded-xl px-8 py-4 text-base font-semibold text-on-surface transition-colors hover:bg-white/5"
              >
                Comment ça marche
              </a>
            </div>
          </div>

          {/* Aperçu d'une conversation — illustration statique du produit */}
          <div className="relative hidden items-center justify-center md:flex">
            <div className="glass-card animate-float w-full max-w-md rounded-3xl p-6">
              <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-4">
                <span className="material-symbols-outlined text-primary">psychology</span>
                <span className="text-sm font-semibold text-on-surface">PricePilot AI</span>
                <span className="ml-auto flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  en ligne
                </span>
              </div>
              <div className="space-y-4 text-sm">
                <div className="ml-auto w-fit max-w-[85%] rounded-2xl bg-primary-container px-4 py-2 text-white">
                  Je cherche un iPhone 16 Pro pas cher
                </div>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-secondary">
                    travel_explore
                  </span>
                  Recherche sur le web…
                </div>
                <div className="w-fit max-w-[90%] space-y-2 rounded-2xl bg-surface-container-high px-4 py-3 text-on-surface">
                  <p className="font-semibold">🏆 Meilleur plan trouvé</p>
                  <p className="text-on-surface-variant">
                    Comparaison des offres en cours chez plusieurs vendeurs, avec
                    le lien direct vers chaque page produit.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card absolute -right-2 top-6 animate-float rounded-2xl p-4 [animation-delay:1s]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20">
                  <span className="material-symbols-outlined text-[20px] text-secondary">
                    link
                  </span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-secondary">Sources citées</div>
                  <div className="text-xs text-on-surface-variant">Chaque prix est sourcé</div>
                </div>
              </div>
            </div>

            <div className="glass-card absolute -left-4 bottom-10 animate-float rounded-2xl p-4 [animation-delay:2s]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    my_location
                  </span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-primary">Localisation auto</div>
                  <div className="text-xs text-on-surface-variant">Sans rien demander</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="fonctionnement" className="border-t border-white/5 bg-surface-container-lowest/50 py-28">
        <div className="mx-auto max-w-container px-6 md:px-16">
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
              Une vraie recherche, pas un catalogue figé
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-on-surface-variant">
              L&apos;assistant interroge le web au moment où vous posez la
              question, puis cite les pages qu&apos;il a réellement consultées.
            </p>
          </div>

          <div className="relative flex flex-col items-start justify-between gap-12 md:flex-row">
            <div className="timeline-line absolute left-0 top-8 hidden h-[2px] w-full md:block" />
            {ETAPES.map((etape, i) => (
              <div
                key={etape.titre}
                className="group relative flex flex-1 flex-col items-center text-center"
              >
                <div
                  className={`z-10 mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-outline-variant bg-surface-container-high transition-transform group-hover:scale-110 ${etape.couleur}`}
                >
                  <span className="material-symbols-outlined text-[32px]">{etape.icone}</span>
                </div>
                <h3 className="mb-3 text-xl font-semibold text-on-surface">
                  {i + 1}. {etape.titre}
                </h3>
                <p className="px-2 text-on-surface-variant">{etape.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Atouts — grille bento */}
      <section id="atouts" className="mx-auto max-w-container px-6 py-28 md:px-16">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass-card glass-card-hover relative flex min-h-[340px] flex-col justify-end overflow-hidden rounded-[2rem] p-10 md:col-span-2">
            <span className="material-symbols-outlined absolute right-8 top-8 text-[120px] opacity-10">
              travel_explore
            </span>
            <div className="relative z-10">
              <h3 className="mb-4 text-3xl font-bold text-on-surface">
                Recherche web en direct
              </h3>
              <p className="max-w-md text-lg text-on-surface-variant">
                Pas de base de données figée : l&apos;IA va lire les sites
                marchands au moment de votre question, et vous donne le lien
                exact de la page produit qu&apos;elle a trouvée.
              </p>
            </div>
          </div>

          <div className="glass-card glass-card-hover flex flex-col justify-between gap-8 rounded-[2rem] p-10">
            <span className="material-symbols-outlined text-[48px] text-secondary">
              format_quote
            </span>
            <div>
              <h3 className="mb-3 text-xl font-semibold text-on-surface">Chaque prix est sourcé</h3>
              <p className="text-on-surface-variant">
                Les réponses citent les pages consultées. Aucun prix inventé,
                jamais.
              </p>
            </div>
          </div>

          <div className="glass-card glass-card-hover flex flex-col justify-between gap-8 rounded-[2rem] p-10">
            <span className="material-symbols-outlined text-[48px] text-tertiary">
              my_location
            </span>
            <div>
              <h3 className="mb-3 text-xl font-semibold text-on-surface">
                Localisation automatique
              </h3>
              <p className="text-on-surface-variant">
                Votre pays est détecté tout seul. Les résultats sont adaptés à
                votre marché sans rien configurer.
              </p>
            </div>
          </div>

          <div className="glass-card glass-card-hover relative flex min-h-[340px] flex-col justify-end overflow-hidden rounded-[2rem] p-10 md:col-span-2">
            <div className="absolute right-12 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-primary/10 blur-[80px]" />
            <div className="relative z-10">
              <h3 className="mb-4 text-3xl font-bold text-on-surface">
                Aussi les commerçants du quartier
              </h3>
              <p className="max-w-lg text-lg text-on-surface-variant">
                Les boutiques sans site web n&apos;apparaissent nulle part en
                ligne. Sur PricePilot, n&apos;importe qui peut signaler leurs
                prix — et l&apos;assistant les prend en compte à côté des
                grandes enseignes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="border-t border-white/5 bg-surface-container-low py-28">
        <div className="mx-auto max-w-container px-6 md:px-16">
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
              Des forfaits simples
            </h2>
            <p className="text-lg text-on-surface-variant">
              Commencez gratuitement. Chaque limite est appliquée réellement,
              pas seulement annoncée.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {PALIERS.map((code) => {
              const plan = PLAN_DEFINITIONS[code];
              const populaire = code === "STANDARD";
              return (
                <div
                  key={code}
                  className={`glass-card flex flex-col rounded-3xl p-10 ${
                    populaire ? "relative z-10 border-primary/40 shadow-2xl shadow-primary/20 md:scale-105" : ""
                  }`}
                >
                  {populaire && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-container px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                      Le plus populaire
                    </div>
                  )}
                  <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary">
                    {plan.name}
                  </div>
                  <div className="mb-8 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-on-surface">
                      {formatMoney(plan.priceMinor, plan.priceCurrency)}
                    </span>
                    <span className="text-on-surface-variant">/ mois</span>
                  </div>
                  <ul className="mb-10 flex-grow space-y-3 text-sm text-on-surface-variant">
                    <li className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        check_circle
                      </span>
                      {plan.searchQuotaMonthly ?? "Illimité"} recherches / mois
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        check_circle
                      </span>
                      {plan.maxCompareItems} offres comparées par recherche
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        check_circle
                      </span>
                      {plan.maxWatchlistItems} produits suivis
                    </li>
                    <li className="flex items-center gap-3">
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          plan.adsEnabled ? "text-outline" : "text-primary"
                        }`}
                      >
                        {plan.adsEnabled ? "block" : "check_circle"}
                      </span>
                      {plan.adsEnabled ? "Avec publicité" : "Sans publicité"}
                    </li>
                  </ul>
                  <Link
                    href="/inscription"
                    className={`rounded-xl py-4 text-center text-sm font-semibold transition-all active:scale-95 ${
                      populaire
                        ? "primary-glow bg-primary-container text-white"
                        : "border border-outline-variant text-on-surface hover:bg-white/5"
                    }`}
                  >
                    Choisir {plan.name}
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="mt-12 text-center text-xs text-on-surface-variant">
            Un palier Gratuit est disponible à l&apos;inscription. Le paiement en
            ligne n&apos;est pas encore actif : tout nouveau compte démarre sur
            le palier Gratuit.{" "}
            <Link href="/tarifs" className="underline">
              Voir le détail des limites
            </Link>
          </p>
        </div>
      </section>

      {/* Pied de page */}
      <footer className="border-t border-outline-variant bg-surface-container-lowest py-14">
        <div className="mx-auto flex max-w-container flex-col items-center justify-between gap-6 px-6 md:flex-row md:px-16">
          <div className="text-center md:text-left">
            <div className="text-gradient text-2xl font-bold">PricePilot</div>
            <p className="mt-1 text-sm text-on-surface-variant">
              Votre copilote d&apos;achat, alimenté par la recherche web.
            </p>
          </div>
          <div className="flex gap-8 text-sm text-on-surface-variant">
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
