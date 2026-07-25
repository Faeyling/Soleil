import { beforeEach, describe, expect, it } from "vitest";
import { getTailleTextePreference, setTailleTextePreference, initTailleTexte } from "./tailleTexte";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-taille-texte");
});

describe("préférence de taille de texte", () => {
  it("vaut \"normale\" par défaut", () => {
    expect(getTailleTextePreference()).toBe("normale");
  });

  it("mémorise le choix \"grande\" et pose l'attribut sur <html>", () => {
    setTailleTextePreference("grande");
    expect(getTailleTextePreference()).toBe("grande");
    expect(document.documentElement.getAttribute("data-taille-texte")).toBe("grande");
  });

  it("revient à la normale et retire la préférence enregistrée", () => {
    setTailleTextePreference("grande");
    setTailleTextePreference("normale");
    expect(getTailleTextePreference()).toBe("normale");
    expect(document.documentElement.getAttribute("data-taille-texte")).toBe("normale");
  });

  it("initTailleTexte() applique la préférence déjà enregistrée", () => {
    setTailleTextePreference("grande");
    document.documentElement.removeAttribute("data-taille-texte");

    initTailleTexte();

    expect(document.documentElement.getAttribute("data-taille-texte")).toBe("grande");
  });
});
