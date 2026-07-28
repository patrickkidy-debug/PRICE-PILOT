"use client";

import { useState } from "react";

interface Props {
  id: string;
  valeur: string;
  onChange: (valeur: string) => void;
  placeholder?: string;
  longueurMinimale?: number;
  /** Aide l'autocomplétion du navigateur : "new-password" à l'inscription. */
  autoComplete?: string;
}

/**
 * Champ de mot de passe avec bouton pour l'afficher en clair.
 *
 * Utile surtout à la création d'un compte : un mot de passe saisi à l'aveugle
 * et mal tapé bloque l'utilisateur à la connexion suivante, sans qu'il
 * comprenne pourquoi.
 */
export function ChampMotDePasse({
  id,
  valeur,
  onChange,
  placeholder,
  longueurMinimale,
  autoComplete = "current-password",
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative mt-1.5">
      <input
        id={id}
        type={visible ? "text" : "password"}
        required
        minLength={longueurMinimale}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 pr-12 text-white placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        // `tabIndex={-1}` garde la tabulation naturelle du formulaire :
        // du mot de passe vers le bouton d'envoi, pas vers cette bascule.
        tabIndex={-1}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
      >
        <span className="material-symbols-outlined text-[20px]">
          {visible ? "visibility_off" : "visibility"}
        </span>
      </button>
    </div>
  );
}
