import { createHash, createHmac, timingSafeEqual } from "crypto";

/**
 * Intégration PayTech (paytech.sn) — agrégateur de paiement sénégalais
 * couvrant Orange Money, Wave, Free Money et carte bancaire.
 *
 * Clés à définir dans l'environnement (tableau de bord PayTech > API) :
 *   PAYTECH_API_KEY, PAYTECH_API_SECRET
 *   PAYTECH_ENV = "prod" (production réelle) ou "test"
 *   NEXT_PUBLIC_SITE_URL = URL publique du site, pour les redirections et l'IPN.
 */

const ENDPOINT = "https://paytech.sn/api/payment/request-payment";

export function paiementConfigure(): boolean {
  return Boolean(process.env.PAYTECH_API_KEY && process.env.PAYTECH_API_SECRET);
}

/** "prod" facture réellement le client ; "test" simule sans mouvement d'argent. */
export function environnementPayTech(): "prod" | "test" {
  return process.env.PAYTECH_ENV === "test" ? "test" : "prod";
}

function urlDuSite(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL absent : PayTech en a besoin pour les redirections et l'IPN.",
    );
  }
  return url.replace(/\/$/, "");
}

export interface DemandePaiement {
  /** Référence unique de la commande, régénérée à chaque tentative. */
  refCommande: string;
  nomArticle: string;
  /** Montant dans l'unité principale de la devise (ex: 1800 pour 1800 FCFA). */
  montant: number;
  devise: string;
  /** Données renvoyées telles quelles par l'IPN — sert à retrouver l'abonné. */
  champPersonnalise: Record<string, string>;
}

export interface ReponsePaiement {
  token: string;
  urlRedirection: string;
}

/**
 * Erreur renvoyée par PayTech elle-même. `messageUtilisateur` est sûr à
 * afficher : il vient de PayTech et décrit une action concrète (activer le
 * compte, corriger une URL), pas un détail technique interne.
 */
export class PayTechError extends Error {
  constructor(
    readonly messageUtilisateur: string,
    readonly compteNonActive: boolean,
  ) {
    super(messageUtilisateur);
    this.name = "PayTechError";
  }
}

export async function creerPaiement(demande: DemandePaiement): Promise<ReponsePaiement> {
  if (!paiementConfigure()) {
    throw new Error("PAYTECH_API_KEY / PAYTECH_API_SECRET absents.");
  }

  const site = urlDuSite();
  // PayTech refuse une URL d'IPN non HTTPS. En développement local (http://),
  // on l'omet : la page de paiement s'ouvre quand même pour tester le parcours,
  // mais l'abonnement ne s'activera pas — seule l'IPN peut l'activer.
  const ipnUtilisable = site.startsWith("https://");

  const reponse = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      API_KEY: process.env.PAYTECH_API_KEY!,
      API_SECRET: process.env.PAYTECH_API_SECRET!,
    },
    body: JSON.stringify({
      item_name: demande.nomArticle,
      item_price: demande.montant,
      currency: demande.devise,
      ref_command: demande.refCommande,
      command_name: demande.nomArticle,
      env: environnementPayTech(),
      ...(ipnUtilisable ? { ipn_url: `${site}/api/paiement/ipn` } : {}),
      success_url: `${site}/paiement/succes`,
      cancel_url: `${site}/paiement/annule`,
      custom_field: JSON.stringify(demande.champPersonnalise),
    }),
  });

  const data = (await reponse.json()) as {
    success?: number;
    token?: string;
    redirect_url?: string;
    redirectUrl?: string;
    error?: unknown;
  };

  const redirection = data.redirect_url ?? data.redirectUrl;
  if (!reponse.ok || data.success !== 1 || !data.token || !redirection) {
    const messages = Array.isArray(data.error)
      ? data.error.map(String)
      : [JSON.stringify(data.error ?? data)];
    const texte = messages.join(" ");
    throw new PayTechError(
      texte,
      /activer votre compte|production/i.test(texte),
    );
  }

  return { token: data.token, urlRedirection: redirection };
}

export interface NotificationIpn {
  type_event?: string;
  ref_command?: string;
  item_price?: string | number;
  payment_method?: string;
  client_phone?: string;
  custom_field?: string;
  api_key_sha256?: string;
  api_secret_sha256?: string;
  hmac_compute?: string;
}

function comparaisonConstante(a: string, b: string): boolean {
  const tamponA = Buffer.from(a);
  const tamponB = Buffer.from(b);
  // timingSafeEqual exige des longueurs identiques.
  if (tamponA.length !== tamponB.length) return false;
  return timingSafeEqual(tamponA, tamponB);
}

/**
 * Vérifie qu'une notification vient bien de PayTech.
 *
 * Sans cette vérification, n'importe qui pourrait appeler l'URL d'IPN et
 * s'offrir un abonnement. On valide d'abord le HMAC (méthode recommandée),
 * avec repli sur les empreintes SHA-256 des clés.
 */
export function notificationAuthentique(ipn: NotificationIpn): boolean {
  const apiKey = process.env.PAYTECH_API_KEY;
  const apiSecret = process.env.PAYTECH_API_SECRET;
  if (!apiKey || !apiSecret) return false;

  if (ipn.hmac_compute && ipn.ref_command && ipn.item_price != null) {
    const message = `${ipn.item_price}|${ipn.ref_command}|${apiKey}`;
    const attendu = createHmac("sha256", apiSecret).update(message).digest("hex");
    if (comparaisonConstante(attendu, ipn.hmac_compute)) return true;
  }

  if (ipn.api_key_sha256 && ipn.api_secret_sha256) {
    const cleAttendue = createHash("sha256").update(apiKey).digest("hex");
    const secretAttendu = createHash("sha256").update(apiSecret).digest("hex");
    return (
      comparaisonConstante(cleAttendue, ipn.api_key_sha256) &&
      comparaisonConstante(secretAttendu, ipn.api_secret_sha256)
    );
  }

  return false;
}
