import { describe, expect, it } from "vitest";
import { genererCSV } from "./exportCsv";
import type { Entree } from "../data/types";

describe("genererCSV", () => {
  it("génère une ligne d'en-têtes suivie d'une ligne par entrée", () => {
    const entrees: Entree[] = [
      {
        id: "1",
        type: "symptom",
        item: "douleur",
        date: "2026-07-20",
        datetime: "2026-07-20T18:30:00.000Z",
        severity: "haut",
        location: ["genou-droit"],
        important: true,
        createdAt: "2026-07-20T18:30:00.000Z",
        updatedAt: "2026-07-20T18:30:00.000Z",
      },
    ];

    const csv = genererCSV(entrees);
    const lignes = csv.split("\n");

    expect(lignes).toHaveLength(2);
    expect(lignes[0]).toContain("Type");
    expect(lignes[1]).toContain("Symptôme");
    expect(lignes[1]).toContain("Douleur");
    expect(lignes[1]).toContain("Haut");
    expect(lignes[1]).toContain("Genou droit");
    expect(lignes[1]).toContain("Oui");
  });

  it("échappe les notes contenant une virgule ou des guillemets", () => {
    const entrees: Entree[] = [
      {
        id: "1",
        type: "track_something",
        item: "humeur",
        date: "2026-07-20",
        datetime: "2026-07-20T21:00:00.000Z",
        severity: "moyen",
        note: 'Fatigue, un peu de "brouillard" mental',
        createdAt: "2026-07-20T21:00:00.000Z",
        updatedAt: "2026-07-20T21:00:00.000Z",
      },
    ];

    const csv = genererCSV(entrees);
    expect(csv).toContain('"Fatigue, un peu de ""brouillard"" mental"');
  });
});
