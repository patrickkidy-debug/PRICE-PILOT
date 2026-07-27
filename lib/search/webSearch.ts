import * as cheerio from "cheerio";

/**
 * Recherche web gratuite, avec plusieurs fournisseurs interchangeables.
 *
 * Le fournisseur est choisi automatiquement selon les variables
 * d'environnement présentes :
 *   1. TAVILY_API_KEY        — 1000 recherches/mois offertes, sans carte bancaire.
 *   2. GOOGLE_CSE_KEY + _CX  — 100 recherches/jour offertes, sans carte bancaire.
 *   3. Aucun                 — DuckDuckGo, en dernier recours.
 *
 * ATTENTION : DuckDuckGo bloque activement les requêtes automatisées (il répond
 * HTTP 202 avec une page anti-robot au lieu de résultats). Il ne constitue donc
 * PAS un mode de fonctionnement viable — il est conservé uniquement comme
 * dépannage. Pour que la recherche fonctionne réellement, renseigner une des
 * deux clés ci-dessus ; les deux sont gratuites et ne demandent pas de carte.
 */

export interface ResultatWeb {
  titre: string;
  url: string;
  extrait: string;
}

export type FournisseurRecherche = "tavily" | "google_cse" | "duckduckgo";

export class RechercheIndisponibleError extends Error {
  constructor(
    message: string,
    readonly quotaEpuise: boolean = false,
  ) {
    super(message);
    this.name = "RechercheIndisponibleError";
  }
}

export function fournisseurActif(): FournisseurRecherche {
  if (process.env.TAVILY_API_KEY) return "tavily";
  if (process.env.GOOGLE_CSE_KEY && process.env.GOOGLE_CSE_CX) return "google_cse";
  return "duckduckgo";
}

const TIMEOUT_MS = 12_000;

async function fetchAvecDelai(url: string, init?: RequestInit): Promise<Response> {
  const controleur = new AbortController();
  const minuterie = setTimeout(() => controleur.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controleur.signal });
  } finally {
    clearTimeout(minuterie);
  }
}

async function chercherTavily(requete: string, nb: number): Promise<ResultatWeb[]> {
  const response = await fetchAvecDelai("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({ query: requete, max_results: nb, search_depth: "basic" }),
  });

  if (response.status === 429) {
    throw new RechercheIndisponibleError("Quota de recherche Tavily épuisé.", true);
  }
  if (!response.ok) {
    throw new RechercheIndisponibleError(`Tavily a répondu ${response.status}.`);
  }

  const data = (await response.json()) as {
    results?: { title?: string; url?: string; content?: string }[];
  };
  return (data.results ?? [])
    .filter((r) => r.url)
    .map((r) => ({
      titre: r.title ?? r.url!,
      url: r.url!,
      extrait: (r.content ?? "").slice(0, 500),
    }));
}

async function chercherGoogleCse(requete: string, nb: number): Promise<ResultatWeb[]> {
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", process.env.GOOGLE_CSE_KEY!);
  url.searchParams.set("cx", process.env.GOOGLE_CSE_CX!);
  url.searchParams.set("q", requete);
  url.searchParams.set("num", String(Math.min(nb, 10)));

  const response = await fetchAvecDelai(url.toString());

  // Google renvoie 429 quand les 100 recherches quotidiennes gratuites sont épuisées.
  if (response.status === 429) {
    throw new RechercheIndisponibleError(
      "Quota quotidien de recherche Google épuisé.",
      true,
    );
  }
  if (!response.ok) {
    throw new RechercheIndisponibleError(`Google Search a répondu ${response.status}.`);
  }

  const data = (await response.json()) as {
    items?: { title?: string; link?: string; snippet?: string }[];
  };
  return (data.items ?? [])
    .filter((i) => i.link)
    .map((i) => ({
      titre: i.title ?? i.link!,
      url: i.link!,
      extrait: i.snippet ?? "",
    }));
}

async function chercherDuckDuckGo(requete: string, nb: number): Promise<ResultatWeb[]> {
  const response = await fetchAvecDelai("https://html.duckduckgo.com/html/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      // Sans en-tête de navigateur, la page renvoie une version dégradée.
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    },
    body: new URLSearchParams({ q: requete }).toString(),
  });

  if (response.status === 429 || response.status === 403) {
    throw new RechercheIndisponibleError(
      "DuckDuckGo limite temporairement les recherches.",
      true,
    );
  }
  if (!response.ok) {
    throw new RechercheIndisponibleError(`DuckDuckGo a répondu ${response.status}.`);
  }

  const html = await response.text();

  // DuckDuckGo répond 200/202 avec une page anti-robot au lieu d'une erreur :
  // sans cette détection, la recherche renverrait silencieusement zéro résultat
  // et l'assistant répondrait comme s'il n'avait rien trouvé.
  if (!html.includes("result__a")) {
    throw new RechercheIndisponibleError(
      "DuckDuckGo bloque les recherches automatisées. Renseignez TAVILY_API_KEY ou GOOGLE_CSE_KEY (gratuits) pour activer la recherche web.",
    );
  }

  const $ = cheerio.load(html);
  const resultats: ResultatWeb[] = [];

  $(".result").each((_, element) => {
    if (resultats.length >= nb) return;
    const lien = $(element).find("a.result__a").first();
    const href = lien.attr("href");
    if (!href) return;

    // DuckDuckGo enveloppe les liens dans une redirection //duckduckgo.com/l/?uddg=...
    let url = href.startsWith("//") ? `https:${href}` : href;
    try {
      const cible = new URL(url).searchParams.get("uddg");
      if (cible) url = cible;
    } catch {
      return;
    }

    resultats.push({
      titre: lien.text().trim(),
      url,
      extrait: $(element).find(".result__snippet").text().trim().slice(0, 500),
    });
  });

  return resultats;
}

export async function rechercherSurLeWeb(
  requete: string,
  nbResultats = 6,
): Promise<{ resultats: ResultatWeb[]; fournisseur: FournisseurRecherche }> {
  const fournisseur = fournisseurActif();

  const resultats =
    fournisseur === "tavily"
      ? await chercherTavily(requete, nbResultats)
      : fournisseur === "google_cse"
        ? await chercherGoogleCse(requete, nbResultats)
        : await chercherDuckDuckGo(requete, nbResultats);

  return { resultats, fournisseur };
}
