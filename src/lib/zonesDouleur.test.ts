import { describe, expect, it } from "vitest";
import { cyclerZoneDouleur, MAX_ZONES_PLUS_DOULOUREUSES } from "./zonesDouleur";

describe("cyclerZoneDouleur", () => {
  it("1er appui : sélectionne la zone", () => {
    const suivant = cyclerZoneDouleur("dos", { zonesSelectionnees: [], zonesPlusDouloureuses: [] });
    expect(suivant.zonesSelectionnees).toEqual(["dos"]);
    expect(suivant.zonesPlusDouloureuses).toEqual([]);
  });

  it("2e appui : marque la zone comme la plus douloureuse", () => {
    const suivant = cyclerZoneDouleur("dos", { zonesSelectionnees: ["dos"], zonesPlusDouloureuses: [] });
    expect(suivant.zonesSelectionnees).toEqual(["dos"]);
    expect(suivant.zonesPlusDouloureuses).toEqual(["dos"]);
  });

  it("3e appui : désélectionne complètement la zone", () => {
    const suivant = cyclerZoneDouleur("dos", { zonesSelectionnees: ["dos"], zonesPlusDouloureuses: ["dos"] });
    expect(suivant.zonesSelectionnees).toEqual([]);
    expect(suivant.zonesPlusDouloureuses).toEqual([]);
  });

  it("4e appui : revient au même état qu'un 1er appui", () => {
    let etat = { zonesSelectionnees: [] as string[], zonesPlusDouloureuses: [] as string[] };
    etat = cyclerZoneDouleur("dos", etat);
    etat = cyclerZoneDouleur("dos", etat);
    etat = cyclerZoneDouleur("dos", etat);
    etat = cyclerZoneDouleur("dos", etat);
    expect(etat).toEqual({ zonesSelectionnees: ["dos"], zonesPlusDouloureuses: [] });
  });

  it("plafonne à MAX_ZONES_PLUS_DOULOUREUSES : un 3e appui vers 'plus douloureuse' reste sans effet", () => {
    expect(MAX_ZONES_PLUS_DOULOUREUSES).toBe(2);
    const etatAvant = {
      zonesSelectionnees: ["dos", "ventre", "genou-droit"],
      zonesPlusDouloureuses: ["dos", "ventre"],
    };
    const suivant = cyclerZoneDouleur("genou-droit", etatAvant);
    expect(suivant).toEqual(etatAvant);
  });

  it("libère la limite une fois une zone désélectionnée", () => {
    let etat = {
      zonesSelectionnees: ["dos", "ventre"],
      zonesPlusDouloureuses: ["dos", "ventre"],
    };
    // Désélectionne "dos" (il était à l'état "plus douloureuse", donc 1 appui = retour à 0)
    etat = cyclerZoneDouleur("dos", etat);
    expect(etat.zonesPlusDouloureuses).toEqual(["ventre"]);

    // "genou-droit" peut maintenant devenir "plus douloureuse"
    etat = cyclerZoneDouleur("genou-droit", etat);
    etat = cyclerZoneDouleur("genou-droit", etat);
    expect(etat.zonesPlusDouloureuses).toEqual(["ventre", "genou-droit"]);
  });

  it("ne modifie pas les autres zones sélectionnées", () => {
    const suivant = cyclerZoneDouleur("dos", {
      zonesSelectionnees: ["ventre", "dos"],
      zonesPlusDouloureuses: [],
    });
    expect(suivant.zonesSelectionnees).toEqual(["ventre", "dos"]);
  });
});
