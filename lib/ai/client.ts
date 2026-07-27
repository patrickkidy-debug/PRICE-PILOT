import Anthropic from "@anthropic-ai/sdk";

/**
 * PricePilot utilise Claude (console.anthropic.com) pour le raisonnement, et
 * Tavily pour la recherche web (voir lib/search/webSearch.ts).
 *
 * Ce découplage est délibéré : l'outil de recherche web intégré d'Anthropic
 * coûte 10 $ par tranche de 1000 recherches, alors que le palier gratuit de
 * Tavily couvre 1000 recherches par mois. On ne paie donc que les tokens.
 *
 * L'assistant reste optionnel : sans clé, le reste de l'application fonctionne
 * normalement et /assistant renvoie une erreur claire.
 */
export function isAssistantConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let clientCache: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY absent — l'assistant IA n'est pas encore configuré.",
    );
  }
  if (!clientCache) {
    clientCache = new Anthropic();
  }
  return clientCache;
}
