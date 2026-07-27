import { describe, expect, it } from "vitest";
import { detecterLocalisation, paysDepuisFuseau } from "@/lib/geolocation";

describe("paysDepuisFuseau", () => {
  it("déduit le pays du fuseau horaire", () => {
    expect(paysDepuisFuseau("Africa/Dakar")).toBe("SN");
    expect(paysDepuisFuseau("Europe/Paris")).toBe("FR");
    expect(paysDepuisFuseau("America/New_York")).toBe("US");
  });

  it("ne devine pas un pays pour un fuseau inconnu", () => {
    expect(paysDepuisFuseau("Antarctica/Troll")).toBeNull();
    expect(paysDepuisFuseau(null)).toBeNull();
  });
});

describe("detecterLocalisation", () => {
  it("privilégie l'en-tête de l'hébergeur sur le fuseau client", () => {
    const headers = new Headers({
      "x-vercel-ip-country": "ci",
      "x-vercel-ip-city": "Abidjan",
    });
    const loc = detecterLocalisation(headers, "Europe/Paris");
    expect(loc.countryCode).toBe("CI");
    expect(loc.city).toBe("Abidjan");
  });

  it("retombe sur le fuseau du navigateur sans en-tête (cas du développement local)", () => {
    const loc = detecterLocalisation(new Headers(), "Africa/Dakar");
    expect(loc.countryCode).toBe("SN");
    expect(loc.timezone).toBe("Africa/Dakar");
  });

  it("décode les villes accentuées transmises encodées", () => {
    const headers = new Headers({
      "x-vercel-ip-country": "FR",
      "x-vercel-ip-city": "Montr%C3%A9al",
    });
    expect(detecterLocalisation(headers).city).toBe("Montréal");
  });

  it("n'invente aucun pays quand aucune source ne permet de conclure", () => {
    const loc = detecterLocalisation(new Headers());
    expect(loc.countryCode).toBeNull();
  });
});
