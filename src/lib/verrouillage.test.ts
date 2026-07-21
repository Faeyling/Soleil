import { beforeEach, describe, expect, it } from "vitest";
import {
  codeEstDefini,
  definirCode,
  verifierCode,
  supprimerCode,
  estDeverrouille,
  marquerSessionDeverrouillee,
  verrouillerMaintenant,
} from "./verrouillage";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("verrouillage par code", () => {
  it("est déverrouillé par défaut quand aucun code n'est défini", () => {
    expect(codeEstDefini()).toBe(false);
    expect(estDeverrouille()).toBe(true);
  });

  it("se verrouille dès qu'un code est défini, jusqu'à saisie correcte", async () => {
    await definirCode("1234");
    expect(codeEstDefini()).toBe(true);
    expect(estDeverrouille()).toBe(false);

    expect(await verifierCode("0000")).toBe(false);
    expect(await verifierCode("1234")).toBe(true);

    marquerSessionDeverrouillee();
    expect(estDeverrouille()).toBe(true);
  });

  it("se reverrouille immédiatement sur demande, sans attendre la fin de session", async () => {
    await definirCode("1234");
    marquerSessionDeverrouillee();
    expect(estDeverrouille()).toBe(true);

    verrouillerMaintenant();
    expect(estDeverrouille()).toBe(false);
  });

  it("supprime le code et déverrouille définitivement", async () => {
    await definirCode("1234");
    marquerSessionDeverrouillee();

    supprimerCode();

    expect(codeEstDefini()).toBe(false);
    expect(estDeverrouille()).toBe(true);
  });

  it("ne stocke jamais le code en clair", async () => {
    await definirCode("1234");
    const brut = localStorage.getItem("soleil-code-hash") ?? "";
    expect(brut).not.toContain("1234");
    expect(brut.length).toBeGreaterThan(20);
  });
});
