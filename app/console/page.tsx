import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { estAdministrateur } from "@/lib/quota";
import { chargerConsole } from "@/lib/console";
import { formatMoney } from "@/lib/money";
import { Header } from "@/components/layout/Header";

export const dynamic = "force-dynamic";

const dateCourte = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

/**
 * Console fondateur — réservée aux comptes ADMIN.
 * N'affiche que des chiffres réellement présents en base : pas de métrique
 * inventée ni de projection.
 */
export default async function ConsolePage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  if (!(await estAdministrateur(session.user.id))) redirect("/assistant");

  const d = await chargerConsole();
  const mrrPrincipal = d.mrrParDevise[0] ?? null;
  const maxCroissance = Math.max(1, ...d.croissance.map((c) => c.comptes));

  const indicateurs = [
    {
      icone: "payments",
      libelle: "MRR",
      valeur: mrrPrincipal
        ? formatMoney(mrrPrincipal.montantMinor, mrrPrincipal.devise)
        : "0",
      detail:
        d.mrrParDevise.length > 1
          ? `+ ${d.mrrParDevise.length - 1} autre(s) devise(s)`
          : "revenu mensuel récurrent",
    },
    {
      icone: "verified_user",
      libelle: "Abonnés actifs",
      valeur: d.abonnes.length,
      detail:
        d.arpuMinor != null && d.deviseDominante
          ? `${formatMoney(d.arpuMinor, d.deviseDominante)} par abonné`
          : "aucun abonnement payant",
    },
    {
      icone: "hourglass_top",
      libelle: "Comptes en essai",
      valeur: d.totalEssais,
      detail:
        d.quotaGratuit != null
          ? `palier Gratuit, ${d.quotaGratuit} recherches/mois`
          : "palier Gratuit",
    },
    {
      icone: "trending_up",
      libelle: "Conversion",
      valeur:
        d.tauxConversion != null ? `${(d.tauxConversion * 100).toFixed(1)} %` : "—",
      detail: "essai → abonné payant",
    },
  ];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">shield_person</span>
          <h1 className="text-2xl font-bold text-on-surface">Console fondateur</h1>
        </div>
        <p className="mt-1 text-on-surface-variant">
          Réservée à votre compte. Chiffres lus directement en base, sans
          estimation. Votre compte administrateur est exclu du MRR et des
          listes : il ne paie pas.
        </p>

        {/* Indicateurs clés */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {indicateurs.map((i) => (
            <div key={i.libelle} className="glass-card rounded-2xl p-5">
              <div className="mb-3 w-fit rounded-xl bg-primary/15 p-2 text-primary">
                <span className="material-symbols-outlined">{i.icone}</span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                {i.libelle}
              </p>
              <p className="mt-1 text-2xl font-bold text-on-surface">{i.valeur}</p>
              <p className="mt-1 text-xs text-on-surface-variant">{i.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Répartition du MRR par palier */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-on-surface">MRR par palier</h2>
            {d.mrrParPalier.length === 0 ? (
              <p className="mt-4 text-sm text-on-surface-variant">
                Aucun abonnement payant pour le moment.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {d.mrrParPalier.map((p) => {
                  const part = mrrPrincipal
                    ? (p.montantMinor / mrrPrincipal.montantMinor) * 100
                    : 0;
                  return (
                    <li key={p.palier}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="font-medium text-on-surface">{p.palier}</span>
                        <span className="text-on-surface-variant">
                          {formatMoney(p.montantMinor, p.devise)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.max(4, part)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {p.abonnes} abonné{p.abonnes > 1 ? "s" : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Croissance des inscriptions */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-on-surface">Inscriptions</h2>
            <p className="mt-1 text-xs text-on-surface-variant">6 derniers mois</p>
            {/* Les colonnes portent `h-full` : sans hauteur de référence, la
                hauteur en pourcentage des barres ne se résoudrait pas. */}
            <div className="mt-5 flex h-28 items-end gap-2">
              {d.croissance.map((c, index) => (
                <div
                  key={index}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                >
                  <span className="text-xs font-semibold text-on-surface">{c.comptes}</span>
                  <div
                    className="w-full rounded-t-md bg-primary/70"
                    style={{
                      height: `${(c.comptes / maxCroissance) * 80}%`,
                      minHeight: "3px",
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              {d.croissance.map((c, index) => (
                <span
                  key={index}
                  className="flex-1 text-center text-[10px] uppercase text-on-surface-variant"
                >
                  {c.mois}
                </span>
              ))}
            </div>
          </div>

          {/* Activité */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-on-surface">Activité du mois</h2>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-xs uppercase tracking-wider text-on-surface-variant">
                  Recherches
                </dt>
                <dd className="text-2xl font-bold text-on-surface">{d.recherchesCeMois}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-on-surface-variant">
                  Nouveaux comptes
                </dt>
                <dd className="text-2xl font-bold text-on-surface">
                  {d.nouveauxComptesCeMois}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Abonnés payants */}
        <section className="glass-card mt-6 rounded-2xl p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-on-surface">Abonnés actifs</h2>
            <span className="text-sm text-on-surface-variant">{d.abonnes.length}</span>
          </div>

          {d.abonnes.length === 0 ? (
            <p className="mt-4 text-sm text-on-surface-variant">
              Personne n&apos;a encore souscrit. Les comptes en essai ci-dessous
              sont vos prospects.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-on-surface-variant">
                  <tr className="border-b border-white/10">
                    <th className="pb-3 pr-4 font-semibold">Nom</th>
                    <th className="pb-3 pr-4 font-semibold">Email</th>
                    <th className="pb-3 pr-4 font-semibold">Palier</th>
                    <th className="pb-3 pr-4 font-semibold">Montant</th>
                    <th className="pb-3 pr-4 font-semibold">Depuis</th>
                    <th className="pb-3 font-semibold">Échéance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {d.abonnes.map((a) => (
                    <tr key={a.id}>
                      <td className="py-3 pr-4 font-medium text-on-surface">
                        {a.nom ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-on-surface-variant">{a.email ?? "—"}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                          {a.palier}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-on-surface">
                        {formatMoney(a.montantMinor, a.devise)}
                      </td>
                      <td className="py-3 pr-4 text-on-surface-variant">
                        {dateCourte(a.depuis)}
                      </td>
                      <td className="py-3 text-on-surface-variant">
                        {a.echeance ? dateCourte(a.echeance) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Comptes en essai */}
        <section className="glass-card mt-6 rounded-2xl p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-on-surface">Comptes en essai</h2>
            <span className="text-sm text-on-surface-variant">
              {d.essais.length < d.totalEssais
                ? `${d.essais.length} sur ${d.totalEssais}`
                : d.totalEssais}
            </span>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">
            Inscrits sur le palier Gratuit, sans abonnement payant. Une barre
            pleine signale un compte qui a consommé son quota : c&apos;est le
            moment de le relancer.
          </p>

          {d.essais.length === 0 ? (
            <p className="mt-4 text-sm text-on-surface-variant">Aucun compte en essai.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-on-surface-variant">
                  <tr className="border-b border-white/10">
                    <th className="pb-3 pr-4 font-semibold">Nom</th>
                    <th className="pb-3 pr-4 font-semibold">Email</th>
                    <th className="pb-3 pr-4 font-semibold">Inscrit le</th>
                    <th className="pb-3 font-semibold">Recherches ce mois</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {d.essais.map((e) => {
                    const quota = d.quotaGratuit;
                    const epuise = quota != null && e.recherchesCeMois >= quota;
                    return (
                      <tr key={e.id}>
                        <td className="py-3 pr-4 font-medium text-on-surface">
                          {e.nom ?? "—"}
                        </td>
                        <td className="py-3 pr-4 text-on-surface-variant">{e.email ?? "—"}</td>
                        <td className="py-3 pr-4 text-on-surface-variant">
                          {dateCourte(e.inscritLe)}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                              <div
                                className={`h-full rounded-full ${epuise ? "bg-amber-400" : "bg-primary"}`}
                                style={{
                                  width: quota
                                    ? `${Math.min(100, (e.recherchesCeMois / quota) * 100)}%`
                                    : "0%",
                                }}
                              />
                            </div>
                            <span
                              className={epuise ? "font-semibold text-amber-400" : "text-on-surface-variant"}
                            >
                              {e.recherchesCeMois}
                              {quota != null ? ` / ${quota}` : ""}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
