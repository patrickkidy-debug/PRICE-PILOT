/**
 * Les montants sont stockés en base dans la plus petite unité de leur devise
 * (`priceMinor` + `currency`) : centimes pour EUR/USD, franc entier pour XOF
 * qui n'a pas de sous-unité. Ce module est le seul endroit qui connaît cette
 * conversion — le reste du code manipule toujours (montant, devise).
 */

const DEFAULT_LOCALE = "fr-FR";

/** Nombre de décimales d'une devise, déduit d'Intl (0 pour XOF, 2 pour EUR/USD, 3 pour BHD...). */
export function currencyDecimals(currency: string): number {
  try {
    return (
      new Intl.NumberFormat(DEFAULT_LOCALE, { style: "currency", currency })
        .resolvedOptions().maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

export function minorToMajor(amountMinor: number, currency: string): number {
  return amountMinor / 10 ** currencyDecimals(currency);
}

export function majorToMinor(amountMajor: number, currency: string): number {
  return Math.round(amountMajor * 10 ** currencyDecimals(currency));
}

export function formatMoney(
  amountMinor: number,
  currency: string,
  locale: string = DEFAULT_LOCALE,
): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
      minorToMajor(amountMinor, currency),
    );
  } catch {
    return `${minorToMajor(amountMinor, currency)} ${currency}`;
  }
}

/**
 * Comparer des prix de devises différentes exigerait un taux de change à jour,
 * que PricePilot n'a pas. On regroupe donc les résultats par devise et on ne
 * classe que ce qui est comparable — jamais de conversion inventée.
 */
export function sontComparables(a: string, b: string): boolean {
  return a === b;
}
