import Anthropic from "@anthropic-ai/sdk";
import { Plan, UsageType } from "@prisma/client";
import { getAnthropicClient } from "@/lib/ai/client";
import { PRICEPILOT_SYSTEM_PROMPT } from "@/lib/ai/systemPrompt";
import { checkMonthlyQuota, logUsage } from "@/lib/quota";
import { rechercherProduits } from "@/lib/search";
import {
  RechercheIndisponibleError,
  rechercherSurLeWeb,
  type ResultatWeb,
} from "@/lib/search/webSearch";
import type { LocalisationDetectee } from "@/lib/geolocation";
import { trouverPays } from "@/lib/countries";

/**
 * Modèle Claude utilisé pour raisonner et rédiger la comparaison.
 * Coût indicatif : claude-opus-5 est facturé 5 $ / 25 $ par million de tokens.
 * Pour diviser la facture par cinq, remplacer par "claude-haiku-4-5"
 * (1 $ / 5 $ par million) — c'est la seule ligne à changer.
 */
const MODEL = "claude-opus-5";
const MAX_TOURS = 6;
const MAX_RECHERCHES_WEB = 5;

export interface SourceCitee {
  url: string;
  titre: string;
}

export interface AssistantContext {
  userId: string;
  plan: Plan;
  localisation: LocalisationDetectee;
  lat: number | null;
  lng: number | null;
}

export interface AssistantTurnResult {
  messages: Anthropic.MessageParam[];
  reponse: string;
  sources: SourceCitee[];
  recherchesWeb: number;
  quotaGratuitEpuise: boolean;
  /** Renseigné quand le moteur de recherche est inaccessible (blocage, panne). */
  rechercheIndisponible: string | null;
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

const OUTIL_BASE_LOCALE: Anthropic.Tool = {
  name: "rechercher_base_pricepilot",
  description:
    "Recherche dans la base PricePilot : prix signalés par la communauté, notamment ceux de petits commerçants et boutiques de quartier sans présence en ligne, introuvables par recherche web. À utiliser EN PLUS de rechercher_web pour les produits du quotidien.",
  input_schema: {
    type: "object",
    properties: {
      requete: { type: "string", description: "Description du produit recherché." },
    },
    required: ["requete"],
  },
};

async function executerRechercheLocale(input: unknown, ctx: AssistantContext) {
  const args = (input ?? {}) as { requete?: unknown };
  const requete = typeof args.requete === "string" ? args.requete : "";
  if (!requete || ctx.lat == null || ctx.lng == null || !ctx.localisation.countryCode) {
    return { resultats: [], note: "Base locale non interrogeable (position inconnue)." };
  }

  const resultats = await rechercherProduits({
    query: requete,
    tri: "moins_cher",
    lat: ctx.lat,
    lng: ctx.lng,
    countryCode: ctx.localisation.countryCode,
    plan: ctx.plan,
  });
  return { resultats };
}

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
      tools: [OUTIL_RECHERCHE_WEB, OUTIL_BASE_LOCALE],
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
      };
    }

    const appels = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    const resultats: Anthropic.ToolResultBlockParam[] = [];
    for (const appel of appels) {
      let charge: unknown;
      let enErreur = false;

      if (appel.name === "rechercher_web") {
        if (recherchesWeb >= MAX_RECHERCHES_WEB) {
          charge = { erreur: "Nombre maximal de recherches atteint pour ce message." };
          enErreur = true;
        } else {
          const args = (appel.input ?? {}) as { requete?: unknown };
          const requete = typeof args.requete === "string" ? args.requete : "";
          try {
            const { resultats: pages } = await rechercherSurLeWeb(requete);
            recherchesWeb += 1;
            enregistrerSources(pages, sources);
            charge = { resultats: pages };
          } catch (erreur) {
            if (erreur instanceof RechercheIndisponibleError && erreur.quotaEpuise) {
              return {
                messages: history,
                reponse:
                  "Le quota gratuit de recherches web est épuisé pour le moment. Réessayez un peu plus tard — aucun frais ne vous sera facturé.",
                sources,
                recherchesWeb,
                quotaGratuitEpuise: true,
                rechercheIndisponible: null,
              };
            }
            derniereErreurRecherche =
              erreur instanceof Error ? erreur.message : "Recherche web indisponible.";
            charge = { erreur: derniereErreurRecherche };
            enErreur = true;
          }
        }
      } else {
        charge = await executerRechercheLocale(appel.input, ctx);
      }

      resultats.push({
        type: "tool_result",
        tool_use_id: appel.id,
        content: JSON.stringify(charge),
        is_error: enErreur,
      });
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
  };
}

function enregistrerSources(resultats: ResultatWeb[], sources: SourceCitee[]): void {
  for (const r of resultats) {
    if (!sources.some((s) => s.url === r.url)) {
      sources.push({ url: r.url, titre: r.titre });
    }
  }
}
