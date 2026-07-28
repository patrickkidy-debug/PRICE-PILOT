import { createHmac, timingSafeEqual } from "crypto";

/**
 * Intégration Moneroo (moneroo.io) — agrégateur de paiement africain couvrant
 * mobile money (Orange Money, Wave, MTN, Moov...) et carte bancaire.
 *
 * Variables d'environnement (tableau de bord Moneroo > Développeurs > Clés) :
 *   MONEROO_SECRET_KEY   — clé secrète, jamais exposée au navigateur
 *   MONEROO_WEBHOOK_SECRET — secret de signature des notifications
 *   NEXT_PUBLIC_SITE_URL — URL publique, pour le retour après paiement
 */

const API = "https://api.moneroo.io/v1";

export function paiementConfigure(): boolean {
  return Boolean(process.env.MONEROO_SECRET_KEY);
}

function urlDuSite(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SITE_URL absent : Moneroo en a besoin pour le retour.");
  }
  return url.replace(/\/$/, "");
}

/** Erreur renvoyée par Moneroo, dont le message est sûr à afficher. */
export class MonerooError extends Error {
  constructor(readonly messageUtilisateur: string) {
    super(messageUtilisateur);
    this.name = "MonerooError";
  }
}

export interface DemandePaiement {
  montant: number;
  devise: string;
  description: string;
  client: { email: string; prenom: string; nom: string };
  /** Renvoyé tel quel par le webhook — sert à retrouver l'abonné. */
  metadonnees: Record<string, string>;
}

export interface ReponsePaiement {
  id: string;
  urlPaiement: string;
}

export async function creerPaiement(demande: DemandePaiement): Promise<ReponsePaiement> {
  if (!paiementConfigure()) {
    throw new Error("MONEROO_SECRET_KEY absent.");
  }

  const reponse = await fetch(`${API}/payments/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MONEROO_SECRET_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      amount: demande.montant,
      currency: demande.devise,
      description: demande.description,
      customer: {
        email: demande.client.email,
        first_name: demande.client.prenom,
        last_name: demande.client.nom,
      },
      return_url: `${urlDuSite()}/paiement/succes`,
      metadata: demande.metadonnees,
    }),
  });

  const data = (await reponse.json()) as {
    message?: string;
    data?: { id?: string; checkout_url?: string };
    errors?: unknown;
  };

  if (!reponse.ok || !data.data?.id || !data.data.checkout_url) {
    throw new MonerooError(
      typeof data.message === "string" && data.message
        ? data.message
        : `Moneroo a répondu ${reponse.status}.`,
    );
  }

  return { id: data.data.id, urlPaiement: data.data.checkout_url };
}

export interface PaiementVerifie {
  statut: string;
  reussi: boolean;
  metadonnees: Record<string, string>;
  montant?: number;
  devise?: string;
}

/**
 * Interroge Moneroo pour connaître l'état réel d'un paiement.
 *
 * C'est cette vérification qui fait foi, jamais le retour du navigateur :
 * l'utilisateur peut ouvrir la page de succès sans avoir payé.
 */
export async function verifierPaiement(id: string): Promise<PaiementVerifie> {
  const reponse = await fetch(`${API}/payments/${encodeURIComponent(id)}/verify`, {
    headers: {
      Authorization: `Bearer ${process.env.MONEROO_SECRET_KEY}`,
      Accept: "application/json",
    },
  });

  const data = (await reponse.json()) as {
    data?: {
      status?: string;
      amount?: number;
      currency?: string;
      metadata?: Record<string, string>;
    };
  };

  if (!reponse.ok || !data.data) {
    throw new MonerooError("Impossible de vérifier ce paiement auprès de Moneroo.");
  }

  const statut = (data.data.status ?? "").toLowerCase();
  return {
    statut,
    reussi: statut === "success" || statut === "completed",
    metadonnees: data.data.metadata ?? {},
    montant: data.data.amount,
    devise: data.data.currency,
  };
}

/** Vérifie la signature HMAC-SHA256 d'une notification Moneroo. */
export function notificationAuthentique(corpsBrut: string, signature: string | null): boolean {
  const secret = process.env.MONEROO_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const attendu = createHmac("sha256", secret).update(corpsBrut).digest("hex");
  const a = Buffer.from(attendu);
  const b = Buffer.from(signature);
  // timingSafeEqual exige des longueurs identiques.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
