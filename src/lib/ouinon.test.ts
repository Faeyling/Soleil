import { describe, expect, it } from "vitest";
import { versSeverite, depuisSeverite } from "./ouinon";

describe("versSeverite", () => {
  it("mappe oui vers bas et non vers haut", () => {
    expect(versSeverite("oui")).toBe("bas");
    expect(versSeverite("non")).toBe("haut");
  });
});

describe("depuisSeverite", () => {
  it("fait l'aller-retour avec versSeverite", () => {
    expect(depuisSeverite("bas")).toBe("oui");
    expect(depuisSeverite("haut")).toBe("non");
  });

  it("retourne undefined pour moyen/crise/undefined", () => {
    expect(depuisSeverite("moyen")).toBeUndefined();
    expect(depuisSeverite("crise")).toBeUndefined();
    expect(depuisSeverite(undefined)).toBeUndefined();
  });
});
