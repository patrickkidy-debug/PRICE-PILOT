import { describe, expect, it } from "vitest";
import { normalizeProduct, normalizeProductName, extractQuantity } from "@/lib/normalize";

describe("normalizeProductName", () => {
  it("produit la même clé pour des variantes de casse/ponctuation/accents", () => {
    const a = normalizeProduct("Riz Parfumé 25 KG");
    const b = normalizeProduct("riz parfumé, 25kg");

    expect(a.normalizedName).toBe(b.normalizedName);
    expect(a.unit).toBe(b.unit);
    expect(a.unitValue).toBe(b.unitValue);
  });

  it("retire les accents et la ponctuation", () => {
    expect(normalizeProductName("Huile Végétale, 1L !")).toBe("huile vegetale");
  });
});

describe("extractQuantity", () => {
  it("extrait la quantité et l'unité", () => {
    expect(extractQuantity("Sucre en poudre 1kg")).toEqual({ unit: "kg", unitValue: 1 });
    expect(extractQuantity("Lait en poudre 900g")).toEqual({ unit: "g", unitValue: 900 });
  });

  it("retourne des valeurs nulles si aucune quantité n'est détectée", () => {
    expect(extractQuantity("Smartphone Samsung Galaxy A15")).toEqual({
      unit: null,
      unitValue: null,
    });
  });
});
