"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SourceCitee {
  url: string;
  titre: string;
}

interface MessageAffiche {
  role: "user" | "assistant";
  texte: string;
  sources?: SourceCitee[];
  recherchesWeb?: number;
  rechercheIndisponible?: string | null;
}

const SUGGESTIONS = [
  "Un iPhone 16 Pro au meilleur prix",
  "Une machine à laver moins de 300 000",
  "Un PC portable pour du montage vidéo",
  "Du riz 25kg le moins cher près de chez moi",
];

export function AssistantChat() {
  const [messages, setMessages] = useState<MessageAffiche[]>([]);
  const [historique, setHistorique] = useState<unknown[]>([]);
  const [saisie, setSaisie] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [lieuDetecte, setLieuDetecte] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement>(null);

  async function envoyer(texte: string) {
    if (!texte.trim() || chargement) return;

    setSaisie("");
    setErreur(null);
    setMessages((prev) => [...prev, { role: "user", texte }]);
    setChargement(true);
    requestAnimationFrame(() => finRef.current?.scrollIntoView({ behavior: "smooth" }));

    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texte,
        // Le fuseau du navigateur suffit à déduire le pays : aucune permission
        // demandée, aucun sélecteur à remplir.
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        historique,
      }),
    });

    const data = await response.json();
    setChargement(false);

    if (!response.ok) {
      setErreur(data.error ?? "Une erreur est survenue.");
      return;
    }

    setHistorique(data.historique ?? []);
    if (data.localisation?.pays) {
      setLieuDetecte(
        [data.localisation.ville, data.localisation.pays].filter(Boolean).join(", "),
      );
    }
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        texte: data.reponse,
        sources: data.sources ?? [],
        recherchesWeb: data.recherchesWeb ?? 0,
        rechercheIndisponible: data.rechercheIndisponible ?? null,
      },
    ]);
    requestAnimationFrame(() => finRef.current?.scrollIntoView({ behavior: "smooth" }));
  }

  const vide = messages.length === 0;

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col">
      <div className="flex-1 space-y-6 py-8">
        {vide && (
          <div className="mx-auto max-w-2xl py-12 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <span className="material-symbols-outlined text-[32px] text-primary">
                psychology
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">
              Que voulez-vous acheter ?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-on-surface-variant">
              Décrivez votre besoin. Je cherche les prix réels sur le web, je
              compare, et je vous donne le lien pour acheter.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => envoyer(s)}
                  className="glass-card rounded-full px-4 py-2 text-sm text-on-surface-variant transition-colors hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl bg-primary-container px-5 py-3 text-white">
                {m.texte}
              </div>
            </div>
          ) : (
            <div key={i} className="glass-card rounded-2xl p-6">
              {(m.recherchesWeb ?? 0) > 0 && (
                <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-secondary">
                    travel_explore
                  </span>
                  {m.recherchesWeb} recherche{(m.recherchesWeb ?? 0) > 1 ? "s" : ""} web
                  effectuée{(m.recherchesWeb ?? 0) > 1 ? "s" : ""}
                </div>
              )}

              {m.rechercheIndisponible && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-error/30 bg-error-container/20 p-3 text-sm text-error">
                  <span className="material-symbols-outlined mt-0.5 text-[18px]">
                    warning
                  </span>
                  <span>
                    Recherche web indisponible : {m.rechercheIndisponible} La
                    réponse ci-dessous n&apos;est donc appuyée sur aucun prix
                    réel.
                  </span>
                </div>
              )}

              <div className="reponse-ia text-on-surface">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.texte}</ReactMarkdown>
              </div>

              {m.sources && m.sources.length > 0 && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Sources consultées
                  </p>
                  <ul className="space-y-1.5">
                    {m.sources.map((s) => (
                      <li key={s.url}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2 text-sm text-secondary hover:underline"
                        >
                          <span className="material-symbols-outlined mt-0.5 text-[14px]">
                            open_in_new
                          </span>
                          <span className="min-w-0 flex-1 truncate">{s.titre}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ),
        )}

        {chargement && (
          <div className="glass-card flex items-center gap-3 rounded-2xl p-6 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-[20px] text-primary">
              progress_activity
            </span>
            Recherche des prix sur le web… cela peut prendre une minute.
          </div>
        )}

        {erreur && (
          <div className="rounded-2xl border border-error/30 bg-error-container/20 p-4 text-sm text-error">
            {erreur}
          </div>
        )}

        <div ref={finRef} />
      </div>

      {/* Barre de saisie */}
      <div className="sticky bottom-0 -mx-6 border-t border-white/10 bg-surface/80 px-6 py-4 backdrop-blur-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            envoyer(saisie);
          }}
          className="glass-card mx-auto flex max-w-3xl items-center gap-3 rounded-2xl p-2"
        >
          <span className="material-symbols-outlined pl-3 text-primary">psychology</span>
          <input
            type="text"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            placeholder="Ex : un iPhone 16 Pro, une TV 55 pouces, du riz 25kg..."
            className="flex-1 border-none bg-transparent py-3 text-on-surface placeholder:text-outline focus:outline-none focus:ring-0"
          />
          <button
            type="submit"
            aria-label="Envoyer"
            disabled={chargement || !saisie.trim()}
            className="primary-glow flex h-11 w-11 items-center justify-center rounded-xl bg-primary-container text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          >
            <span className="material-symbols-outlined">arrow_upward</span>
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-on-surface-variant">
          {lieuDetecte ? (
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">my_location</span>
              Résultats localisés pour {lieuDetecte}
            </span>
          ) : (
            "Votre localisation est détectée automatiquement pour adapter les résultats."
          )}
        </p>
      </div>
    </div>
  );
}
