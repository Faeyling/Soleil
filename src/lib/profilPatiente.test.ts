import { beforeEach, describe, expect, it } from "vitest";
import { getNomPatiente, setNomPatiente } from "./profilPatiente";

beforeEach(() => {
  localStorage.clear();
});

describe("nom de la patiente", () => {
  it("est vide par défaut", () => {
    expect(getNomPatiente()).toBe("");
  });

  it("mémorise un nom", () => {
    setNomPatiente("Jeanne Dupont");
    expect(getNomPatiente()).toBe("Jeanne Dupont");
  });

  it("nettoie les espaces superflus", () => {
    setNomPatiente("  Jeanne Dupont  ");
    expect(getNomPatiente()).toBe("Jeanne Dupont");
  });

  it("efface la préférence quand le nom est vidé", () => {
    setNomPatiente("Jeanne Dupont");
    setNomPatiente("");
    expect(getNomPatiente()).toBe("");
  });
});
