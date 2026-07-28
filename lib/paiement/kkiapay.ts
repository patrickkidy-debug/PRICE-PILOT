/**
 * Intégration KkiaPay (kkiapay.me) — agrégateur ouest-africain couvrant
 * mobile money (MTN, Moov, Orange, Wave) et carte bancaire.
 *
 * Le paiement se fait dans un widget côté navigateur, ouvert avec la clé
 * PUBLIQUE. Le navigateur ne fait que remonter un identifiant de transaction :
 * il ne décide de rien. C'est le serveur qui interroge ensuite KkiaPay avec
 * les clés privées pour savoir si la transaction a réellement été payée.
 *
 * Variables d'environnement (tableau de bord KkiaPay > Développeurs) :
 *   NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY — clé publique, destinée au navigateur
 *   KKIAPAY_PRIVATE_KEY            — clé privée, serveur uniquement
 *   KKIAPAY_SECRET_KEY             — secret, serveur uniquement
 *   KKIAPAY_SANDBOX = "true" pour tester sans mouvement d'argent
 */

const ENDPOINT_VERIFICATION = "https://api.kkiapay.me/api/v1/transactions/status";

export function paiementConfigure(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY &&
      process.env.KKIAPAY_PRIVATE_KEY &&
      process.env.KKIAPAY_SECRET_KEY,
  );
}

export function modeBacASable(): boolean {
  return process.env.KKIAPAY_SANDBOX === "true";
}

export interface TransactionVerifiee {
  statut: string;
  reussie: boolean;
  /** Montant réellement encaissé, dans l'unité principale (XOF entier). */
  montant: number | null;
  donnees: Record<string, string>;
}

/**
 * Interroge KkiaPay sur l'état réel d'une transaction.
 * Ne jamais activer un abonnement sans passer par ici : le navigateur peut
 * annoncer n'importe quoi.
 */
export async function verifierTransaction(
  transactionId: string,
): Promise<TransactionVerifiee> {
  const reponse = await fetch(ENDPOINT_VERIFICATION, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY!,
      "x-private-key": process.env.KKIAPAY_PRIVATE_KEY!,
      "x-secret-key": process.env.KKIAPAY_SECRET_KEY!,
    },
    body: JSON.stringify({ transactionId }),
  });

  const data = (await reponse.json()) as {
    status?: string;
    amount?: number;
    data?: string | Record<string, string>;
  };

  const statut = (data.status ?? "INCONNU").toUpperCase();

  // `data` est renvoyé tel qu'il a été transmis au widget : selon les cas,
  // une chaîne JSON ou déjà un objet.
  let donnees: Record<string, string> = {};
  if (typeof data.data === "string") {
    try {
      donnees = JSON.parse(data.data);
    } catch {
      donnees = {};
    }
  } else if (data.data && typeof data.data === "object") {
    donnees = data.data;
  }

  return {
    statut,
    reussie: statut === "SUCCESS",
    montant: typeof data.amount === "number" ? data.amount : null,
    donnees,
  };
}
