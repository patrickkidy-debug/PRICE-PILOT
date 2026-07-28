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
  "Une machine à laver moins de 300 000 FCFA",
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
    <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-[#0d0e12] text-white">
      <div className="flex-1 space-y-6 py-6 sm:py-8">
        {vide && (
          <div className="mx-auto max-w-2xl py-8 sm:py-12 text-center px-4">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-[36px] text-primary">
                psychology
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Que voulez-vous acheter ?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm sm:text-base text-slate-300">
              Décrivez votre besoin. Je cherche les prix réels sur le web, je
              compare, et je vous donne le lien direct pour acheter.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2 sm:gap-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => envoyer(s)}
                  className="glass-card rounded-full px-4 py-2 text-xs sm:text-sm text-slate-200 border border-white/10 transition-all hover:border-primary hover:text-primary hover:scale-105 active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end px-2 sm:px-0">
              <div className="max-w-[85%] rounded-2xl bg-primary px-5 py-3 text-white font-medium shadow-md shadow-primary/20">
                {m.texte}
              </div>
            </div>
          ) : (
            <div key={i} className="glass-card rounded-2xl p-4 sm:p-6 border border-white/15">
              {(m.recherchesWeb ?? 0) > 0 && (
                <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3 text-xs text-amber-400 font-semibold">
                  <span className="material-symbols-outlined text-[18px]">
                    travel_explore
                  </span>
                  {m.recherchesWeb} recherche{(m.recherchesWeb ?? 0) > 1 ? "s" : ""} web
                  effectuée{(m.recherchesWeb ?? 0) > 1 ? "s" : ""} en temps réel
                </div>
              )}

              {m.rechercheIndisponible && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-300">
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

              <div className="reponse-ia text-white">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img: ({ src, alt }) =>
                      typeof src === "string" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src}
                          alt={alt ?? "Produit"}
                          loading="lazy"
                          className="my-3 max-h-48 rounded-xl border border-white/15 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : null,
                  }}
                >
                  {m.texte}
                </ReactMarkdown>
              </div>
            </div>
          ),
        )}

        {chargement && (
          <div className="glass-card flex items-center gap-3 rounded-2xl p-5 text-slate-300 border border-white/10">
            <span className="material-symbols-outlined animate-spin text-[22px] text-primary">
              progress_activity
            </span>
            <span className="text-sm font-medium">Recherche des prix réels sur le web… cela peut prendre une minute.</span>
          </div>
        )}

        {erreur && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
            {erreur}
          </div>
        )}

        <div ref={finRef} />
      </div>

      {/* Barre de saisie réactive */}
      <div className="sticky bottom-0 -mx-4 sm:-mx-6 border-t border-white/10 bg-[#0d0e12]/90 px-4 sm:px-6 py-4 backdrop-blur-2xl z-20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            envoyer(saisie);
          }}
          className="glass-card mx-auto flex max-w-3xl items-center gap-2 sm:gap-3 rounded-2xl p-2 border border-white/15 shadow-xl shadow-primary/10"
        >
          <span className="material-symbols-outlined pl-3 text-primary hidden sm:inline">psychology</span>
          <input
            type="text"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            placeholder="Ex : iPhone 16 Pro, TV 55 pouces, riz 25kg..."
            className="flex-1 border-none bg-transparent py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder:text-slate-400 focus:outline-none focus:ring-0"
          />
          <button
            type="submit"
            aria-label="Envoyer"
            disabled={chargement || !saisie.trim()}
            className="primary-glow flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-all hover:bg-primary-hover hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 shadow-md shadow-primary/30"
          >
            <span className="material-symbols-outlined font-bold">arrow_upward</span>
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-slate-400">
          {lieuDetecte ? (
            <span className="inline-flex items-center gap-1 text-primary font-medium">
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
