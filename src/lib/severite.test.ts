import { describe, expect, it } from "vitest";
import { severitesDisponibles, ordreSeverite, couleurSeverite, labelSeverite, descriptionSeverite } from "./severite";
import { definirSuivis, AUTRES_SUIVIS_PAR_DEFAUT } from "../content/autresSuivis";

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
    expect(couleurSeverite("crise")).not.toBe(couleurSeverite("haut"));
    expect(couleurSeverite("crise")).toBe("var(--severite-crise)");
  });

  it("ne dépend plus de l'item (plus d'inversion pour le sommeil)", () => {
    expect(couleurSeverite("bas")).toBe("var(--severite-bas)");
    expect(couleurSeverite("haut")).toBe("var(--severite-haut)");
  });
});

describe("labelSeverite", () => {
  it("utilise le libellé générique par défaut", () => {
    expect(labelSeverite("haut")).toBe("Haut");
    expect(labelSeverite("haut", "fatigue")).toBe("Haut");
  });

  it("remplace « Haut » par « Sévère » pour le sommeil", () => {
    expect(labelSeverite("haut", "sommeil")).toBe("Sévère");
    expect(labelSeverite("haut", "sommeil-suivi")).toBe("Sévère");
    expect(labelSeverite("bas", "sommeil")).toBe("Bas");
  });
});

describe("descriptionSeverite", () => {
  it("fournit un texte d'aide pour le sommeil, rien pour les autres items", () => {
    expect(descriptionSeverite("sommeil")).toContain("réparateur");
    expect(descriptionSeverite("fatigue")).toBeUndefined();
    expect(descriptionSeverite()).toBeUndefined();
  });
});

describe("labelSeverite pour un suivi à échelle Oui/Non", () => {
  it("affiche Oui/Non plutôt que Bas/Haut pour un item typeFormulaire=ouinon", () => {
    definirSuivis([
      ...AUTRES_SUIVIS_PAR_DEFAUT,
      { id: "piscine", label: "Piscine", icone: "🏊", typeFormulaire: "ouinon", ordre: 99 },
    ]);
    try {
      expect(labelSeverite("bas", "piscine")).toBe("Oui");
      expect(labelSeverite("haut", "piscine")).toBe("Non");
    } finally {
      definirSuivis(AUTRES_SUIVIS_PAR_DEFAUT);
    }
  });
});
