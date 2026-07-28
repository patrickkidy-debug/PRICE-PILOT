import Anthropic from "@anthropic-ai/sdk";
import { Plan, UsageType } from "@prisma/client";
import { getAnthropicClient } from "@/lib/ai/client";
import { PRICEPILOT_SYSTEM_PROMPT } from "@/lib/ai/systemPrompt";
import { checkMonthlyQuota, logUsage } from "@/lib/quota";
import {
  RechercheIndisponibleError,
  rechercherSurLeWeb,
  type ResultatWeb,
} from "@/lib/search/webSearch";
import type { LocalisationDetectee } from "@/lib/geolocation";
import { trouverPays } from "@/lib/countries";

/**
 * Modèle Claude utilisé pour raisonner et rédiger la comparaison.
 *
 * Haiku 4.5 est retenu pour la vitesse : mesuré sur une même synthèse,
 * claude-opus-5 met 22 s là où Haiku met 3,8 s — près de six fois plus rapide,
 * et cinq fois moins cher (1 $ / 5 $ contre 5 $ / 25 $ par million de tokens).
 * Comme la boucle enchaîne plusieurs appels, l'écart se multiplie d'autant.
 * Repasser à "claude-opus-5" ici si l'on privilégie la finesse d'analyse à la
 * réactivité.
 */
const MODEL = "claude-haiku-4-5";
const MAX_TOURS = 4;
const MAX_RECHERCHES_WEB = 4;

export interface SourceCitee {
  url: string;
  titre: string;
}

export interface AssistantContext {
  userId: string;
  plan: Plan;
  localisation: LocalisationDetectee;
}

export interface AssistantTurnResult {
  messages: Anthropic.MessageParam[];
  reponse: string;
  sources: SourceCitee[];
  recherchesWeb: number;
  quotaGratuitEpuise: boolean;
  /** Renseigné quand le moteur de recherche est inaccessible (blocage, panne). */
  rechercheIndisponible: string | null;
  /**
   * Vrai quand l'utilisateur a consommé le quota de recherches de son palier.
   * L'interface s'en sert pour l'amener au paiement plutôt que de lui afficher
   * un simple refus.
   */
  quotaAtteint: boolean;
}

const OUTIL_RECHERCHE_WEB: Anthropic.Tool = {
  name: "rechercher_web",
  description:
    "Recherche sur le web les prix réels d'un produit chez les vendeurs. Renvoie des pages avec leur titre, leur URL et un extrait. Lance plusieurs recherches en parallèle dans un même tour pour couvrir plusieurs vendeurs.",
  input_schema: {
    type: "object",
    properties: {
      requete: {
        type: "string",
        description:
          "Requête de recherche, en incluant le pays ou la ville quand c'est pertinent. Ex: \"iPhone 16 Pro prix Sénégal\".",
      },
    },
    required: ["requete"],
  },
};

function contexteLocalisation(localisation: LocalisationDetectee): string {
  const pays = localisation.countryCode
    ? (trouverPays(localisation.countryCode)?.nom ?? localisation.countryCode)
    : null;
  if (!pays && !localisation.city) {
    return "Localisation de l'utilisateur : inconnue. Demande-lui son pays seulement si c'est indispensable.";
  }
  return `Localisation détectée de l'utilisateur : ${[localisation.city, pays]
    .filter(Boolean)
    .join(", ")}. Cible les vendeurs de ce marché et n'interroge jamais l'utilisateur sur sa localisation.`;
}

/**
 * Boucle agentique manuelle : l'API étant sans état, on renvoie l'historique
 * complet à chaque requête, et le client le conserve entre deux messages.
 */
export async function runAssistantTurn(
  messages: Anthropic.MessageParam[],
  ctx: AssistantContext,
): Promise<AssistantTurnResult> {
  const quota = await checkMonthlyQuota(ctx.userId, UsageType.SEARCH);
  if (!quota.allowed) {
    return {
      messages,
      reponse: quota.reason,
      sources: [],
      recherchesWeb: 0,
      quotaGratuitEpuise: false,
      rechercheIndisponible: null,
      quotaAtteint: true,
    };
  }

  const client = getAnthropicClient();
  const history = [...messages];
  const sources: SourceCitee[] = [];
  let recherchesWeb = 0;
  let quotaConsomme = false;
  let derniereErreurRecherche: string | null = null;

  for (let tour = 0; tour < MAX_TOURS; tour++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: [
        {
          type: "text",
          // Le prompt est identique à chaque requête : le marquer comme
          // cacheable évite de le refacturer plein tarif à chaque tour.
          text: PRICEPILOT_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
        { type: "text", text: contexteLocalisation(ctx.localisation) },
      ],
      tools: [OUTIL_RECHERCHE_WEB],
      messages: history,
    });

    history.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "refusal") {
      return {
        messages: history,
        reponse:
          "Je ne peux pas traiter cette demande. Reformulez votre recherche de produit.",
        sources,
        recherchesWeb,
        quotaGratuitEpuise: false,
        rechercheIndisponible: null,
        quotaAtteint: false,
      };
    }

    if (response.stop_reason !== "tool_use") {
      const texte = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      return {
        messages: history,
        reponse: texte || "Je n'ai pas trouvé de réponse à cette demande.",
        sources,
        recherchesWeb,
        quotaGratuitEpuise: false,
        rechercheIndisponible: recherchesWeb === 0 ? derniereErreurRecherche : null,
        quotaAtteint: false,
      };
    }

    const appels = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    // Les recherches d'un même tour partent EN PARALLÈLE : exécutées l'une
    // après l'autre, trois recherches coûtaient trois fois 1,5 s.
    const budgetRestant = MAX_RECHERCHES_WEB - recherchesWeb;
    let quotaWebEpuise = false;

    const resultats: Anthropic.ToolResultBlockParam[] = await Promise.all(
      appels.map(async (appel, index): Promise<Anthropic.ToolResultBlockParam> => {
        const echec = (message: string): Anthropic.ToolResultBlockParam => ({
          type: "tool_result",
          tool_use_id: appel.id,
          content: JSON.stringify({ erreur: message }),
          is_error: true,
        });

        if (appel.name !== "rechercher_web") {
          return echec(`Outil inconnu : ${appel.name}`);
        }
        if (index >= budgetRestant) {
          return echec("Nombre maximal de recherches atteint pour ce message.");
        }

        const args = (appel.input ?? {}) as { requete?: unknown };
        const requete = typeof args.requete === "string" ? args.requete : "";

        try {
          const { resultats: pages } = await rechercherSurLeWeb(requete);
          recherchesWeb += 1;
          enregistrerSources(pages, sources);
          return {
            type: "tool_result",
            tool_use_id: appel.id,
            content: JSON.stringify({ resultats: pages }),
          };
        } catch (erreur) {
          if (erreur instanceof RechercheIndisponibleError && erreur.quotaEpuise) {
            quotaWebEpuise = true;
          }
          derniereErreurRecherche =
            erreur instanceof Error ? erreur.message : "Recherche web indisponible.";
          return echec(derniereErreurRecherche);
        }
      }),
    );

    if (quotaWebEpuise) {
      return {
        messages: history,
        reponse:
          "Le quota gratuit de recherches web est épuisé pour le moment. Réessayez un peu plus tard — aucun frais ne vous sera facturé.",
        sources,
        recherchesWeb,
        quotaGratuitEpuise: true,
        rechercheIndisponible: null,
        quotaAtteint: false,
      };
    }

    if (!quotaConsomme) {
      await logUsage(ctx.userId, UsageType.SEARCH);
      quotaConsomme = true;
    }

    history.push({ role: "user", content: resultats });
  }

  return {
    messages: history,
    reponse:
      "La recherche a pris trop d'étapes. Reformulez votre demande de façon plus précise.",
    sources,
    recherchesWeb,
    quotaGratuitEpuise: false,
    rechercheIndisponible: recherchesWeb === 0 ? derniereErreurRecherche : null,
    quotaAtteint: false,
  };
}

function enregistrerSources(resultats: ResultatWeb[], sources: SourceCitee[]): void {
  for (const r of resultats) {
    if (!sources.some((s) => s.url === r.url)) {
      sources.push({ url: r.url, titre: r.titre });
    }
  }
}
