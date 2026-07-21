import { describe, expect, it } from "vitest";
import { severitesDisponibles, ordreSeverite, couleurSeverite } from "./severite";

describe("severitesDisponibles", () => {
  it("propose seulement Bas/Moyen/Haut pour la plupart des items", () => {
    expect(severitesDisponibles("fatigue")).toEqual(["bas", "moyen", "haut"]);
    expect(severitesDisponibles()).toEqual(["bas", "moyen", "haut"]);
  });

  it("ajoute Crise uniquement pour la Douleur", () => {
    expect(severitesDisponibles("douleur")).toEqual(["bas", "moyen", "haut", "crise"]);
  });
});

describe("ordreSeverite", () => {
  it("place Crise au-dessus de Haut", () => {
    expect(ordreSeverite("crise")).toBeGreaterThan(ordreSeverite("haut"));
    expect(ordreSeverite("haut")).toBeGreaterThan(ordreSeverite("moyen"));
    expect(ordreSeverite("moyen")).toBeGreaterThan(ordreSeverite("bas"));
  });
});

describe("couleurSeverite", () => {
  it("donne une couleur dédiée à Crise, distincte de Haut", () => {
    expect(couleurSeverite("crise", "douleur")).not.toBe(couleurSeverite("haut", "douleur"));
    expect(couleurSeverite("crise")).toBe("var(--severite-crise)");
  });
});
