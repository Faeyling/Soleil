import { beforeEach, describe, expect, it } from "vitest";
import { getThemePreference, setThemePreference, initTheme } from "./theme";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("préférence de thème", () => {
  it("vaut \"systeme\" par défaut", () => {
    expect(getThemePreference()).toBe("systeme");
  });

  it("mémorise un choix explicite clair/sombre", () => {
    setThemePreference("sombre");
    expect(getThemePreference()).toBe("sombre");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    setThemePreference("clair");
    expect(getThemePreference()).toBe("clair");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("revient au système quand on choisit \"systeme\" explicitement", () => {
    setThemePreference("sombre");
    setThemePreference("systeme");
    expect(getThemePreference()).toBe("systeme");
  });

  it("initTheme() pose un attribut data-theme cohérent sur <html>", () => {
    initTheme();
    const valeur = document.documentElement.getAttribute("data-theme");
    expect(["light", "dark"]).toContain(valeur);
  });
});
