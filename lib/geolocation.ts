/**
 * Détection automatique de la localisation de l'utilisateur — aucun sélecteur
 * manuel de pays ou de ville.
 *
 * Deux sources, dans cet ordre :
 *  1. Les en-têtes de géolocalisation de la plateforme d'hébergement (Vercel,
 *     Cloudflare). Fiables et disponibles en production, absentes en local.
 *  2. Le fuseau horaire du navigateur, envoyé par le client. Fonctionne partout
 *     (y compris en développement) et ne demande aucune permission.
 *
 * Si aucune source ne permet de conclure, on n'invente pas un pays : les
 * fonctions renvoient `null` et l'appelant traite la recherche comme mondiale.
 */

export interface LocalisationDetectee {
  countryCode: string | null;
  city: string | null;
  region: string | null;
  timezone: string | null;
}

/**
 * Fuseaux IANA les plus courants vers leur code pays ISO 3166-1 alpha-2.
 * Sert uniquement de repli quand l'hébergeur ne fournit pas d'en-tête pays.
 */
const FUSEAU_VERS_PAYS: Record<string, string> = {
  // Afrique de l'Ouest et centrale
  "Africa/Dakar": "SN",
  "Africa/Abidjan": "CI",
  "Africa/Bamako": "ML",
  "Africa/Conakry": "GN",
  "Africa/Ouagadougou": "BF",
  "Africa/Lome": "TG",
  "Africa/Porto-Novo": "BJ",
  "Africa/Niamey": "NE",
  "Africa/Nouakchott": "MR",
  "Africa/Bissau": "GW",
  "Africa/Banjul": "GM",
  "Africa/Freetown": "SL",
  "Africa/Monrovia": "LR",
  "Africa/Accra": "GH",
  "Africa/Lagos": "NG",
  "Africa/Douala": "CM",
  "Africa/Libreville": "GA",
  "Africa/Kinshasa": "CD",
  // Afrique du Nord, de l'Est et australe
  "Africa/Casablanca": "MA",
  "Africa/Algiers": "DZ",
  "Africa/Tunis": "TN",
  "Africa/Cairo": "EG",
  "Africa/Nairobi": "KE",
  "Africa/Johannesburg": "ZA",
  // Europe
  "Europe/Paris": "FR",
  "Europe/Brussels": "BE",
  "Europe/Luxembourg": "LU",
  "Europe/Zurich": "CH",
  "Europe/London": "GB",
  "Europe/Dublin": "IE",
  "Europe/Madrid": "ES",
  "Europe/Lisbon": "PT",
  "Europe/Rome": "IT",
  "Europe/Berlin": "DE",
  "Europe/Amsterdam": "NL",
  "Europe/Vienna": "AT",
  "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO",
  "Europe/Copenhagen": "DK",
  "Europe/Helsinki": "FI",
  "Europe/Warsaw": "PL",
  "Europe/Prague": "CZ",
  "Europe/Athens": "GR",
  "Europe/Bucharest": "RO",
  "Europe/Istanbul": "TR",
  // Amériques
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Phoenix": "US",
  "America/Los_Angeles": "US",
  "America/Anchorage": "US",
  "Pacific/Honolulu": "US",
  "America/Toronto": "CA",
  "America/Montreal": "CA",
  "America/Vancouver": "CA",
  "America/Edmonton": "CA",
  "America/Halifax": "CA",
  "America/Mexico_City": "MX",
  "America/Sao_Paulo": "BR",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Bogota": "CO",
  "America/Lima": "PE",
  "America/Santiago": "CL",
  // Moyen-Orient et Asie
  "Asia/Dubai": "AE",
  "Asia/Riyadh": "SA",
  "Asia/Qatar": "QA",
  "Asia/Beirut": "LB",
  "Asia/Jerusalem": "IL",
  "Asia/Karachi": "PK",
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Dhaka": "BD",
  "Asia/Bangkok": "TH",
  "Asia/Ho_Chi_Minh": "VN",
  "Asia/Jakarta": "ID",
  "Asia/Singapore": "SG",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Manila": "PH",
  "Asia/Hong_Kong": "HK",
  "Asia/Shanghai": "CN",
  "Asia/Tokyo": "JP",
  "Asia/Seoul": "KR",
  // Océanie
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Perth": "AU",
  "Pacific/Auckland": "NZ",
};

export function paysDepuisFuseau(timezone: string | null | undefined): string | null {
  if (!timezone) return null;
  return FUSEAU_VERS_PAYS[timezone] ?? null;
}

/** Décode un en-tête HTTP potentiellement encodé en pourcents (villes accentuées). */
function decoder(valeur: string | null): string | null {
  if (!valeur) return null;
  try {
    return decodeURIComponent(valeur);
  } catch {
    return valeur;
  }
}

/**
 * Localisation issue de la requête : en-têtes de l'hébergeur si disponibles,
 * sinon le fuseau horaire transmis par le client.
 */
export function detecterLocalisation(
  headers: Headers,
  fuseauClient?: string | null,
): LocalisationDetectee {
  const paysEntete =
    headers.get("x-vercel-ip-country") ??
    headers.get("cf-ipcountry") ??
    headers.get("x-country-code");

  const timezone =
    headers.get("x-vercel-ip-timezone") ?? fuseauClient ?? null;

  const countryCode =
    (paysEntete && paysEntete.length === 2 ? paysEntete.toUpperCase() : null) ??
    paysDepuisFuseau(timezone);

  return {
    countryCode,
    city: decoder(headers.get("x-vercel-ip-city")),
    region: decoder(headers.get("x-vercel-ip-country-region")),
    timezone,
  };
}
