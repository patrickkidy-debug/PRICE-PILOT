/**
 * Pixel Meta (Facebook / Instagram) — mesure des conversions publicitaires.
 *
 * L'identifiant d'un pixel n'est pas un secret : il apparaît en clair dans le
 * code source de la page, visible par n'importe quel visiteur. Il est donc
 * écrit en dur ici, ce qui évite une variable d'environnement de plus à
 * configurer sur Netlify. La variable reste possible pour brancher un autre
 * pixel (compte de test, seconde marque) sans toucher au code.
 */
export const ID_PIXEL =
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ?? "1340688864444846";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Envoie un évènement standard au pixel.
 * Sans effet si le pixel n'est pas encore chargé ou a été bloqué par le
 * navigateur : la mesure ne doit jamais casser un parcours d'achat.
 */
export function evenementPixel(nom: string, parametres?: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", nom, parametres);
}
