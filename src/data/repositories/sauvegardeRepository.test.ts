import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { importerDonnees, estSauvegardeValide, type Sauvegarde } from "./sauvegardeRepository";
import type { EntreeSymptome } from "../types";

beforeEach(async () => {
  await db.entrees.clear();
  await db.medicaments.clear();
  await db.ressourcesNotes.clear();
});

function entreeSymptome(overrides: Partial<EntreeSymptome>): EntreeSymptome {
  return {
    id: "id-" + Math.random(),
    type: "symptom",
    item: "douleur",
    date: "2026-07-20",
    datetime: "2026-07-20T18:00:00.000Z",
    severity: "haut",
    createdAt: "2026-07-20T18:00:00.000Z",
    updatedAt: "2026-07-20T18:00:00.000Z",
    ...overrides,
  };
}

describe("estSauvegardeValide", () => {
  it("accepte une sauvegarde bien formée", () => {
    const sauvegarde: Sauvegarde = {
      app: "soleil",
      version: 1,
      exporteLe: "2026-07-20T00:00:00.000Z",
      entrees: [],
      medicaments: [],
      ressourcesNotes: [],
    };
    expect(estSauvegardeValide(sauvegarde)).toBe(true);
  });

  it("rejette un fichier sans les tableaux attendus", () => {
    expect(estSauvegardeValide({ app: "soleil" })).toBe(false);
    expect(estSauvegardeValide(null)).toBe(false);
    expect(estSauvegardeValide("texte")).toBe(false);
  });
});

describe("importerDonnees", () => {
  it("restaure des entrées valides sans doublon", async () => {
    const sauvegarde: Sauvegarde = {
      app: "soleil",
      version: 1,
      exporteLe: "2026-07-20T00:00:00.000Z",
      entrees: [
        entreeSymptome({ id: "a", item: "douleur", date: "2026-07-19" }),
        entreeSymptome({ id: "b", item: "douleur", date: "2026-07-20" }),
      ],
      medicaments: [],
      ressourcesNotes: [],
    };

    await importerDonnees(sauvegarde);

    expect(await db.entrees.count()).toBe(2);
  });

  it("déduplique deux entrées en conflit sur (type, item, date), en gardant la plus récemment modifiée", async () => {
    const sauvegarde: Sauvegarde = {
      app: "soleil",
      version: 1,
      exporteLe: "2026-07-20T00:00:00.000Z",
      entrees: [
        entreeSymptome({
          id: "ancienne",
          date: "2026-07-20",
          severity: "bas",
          updatedAt: "2026-07-20T10:00:00.000Z",
        }),
        entreeSymptome({
          id: "recente",
          date: "2026-07-20",
          severity: "haut",
          updatedAt: "2026-07-20T22:00:00.000Z",
        }),
      ],
      medicaments: [],
      ressourcesNotes: [],
    };

    await importerDonnees(sauvegarde);

    const entrees = await db.entrees.toArray();
    expect(entrees).toHaveLength(1);
    expect(entrees[0].id).toBe("recente");
  });

  it("ne déduplique pas les prises de médicament (plusieurs par jour autorisées)", async () => {
    const sauvegarde: Sauvegarde = {
      app: "soleil",
      version: 1,
      exporteLe: "2026-07-20T00:00:00.000Z",
      entrees: [
        {
          id: "prise-1",
          type: "medication_intake",
          item: "med-1",
          medicationId: "med-1",
          medicationName: "Ibuprofène",
          date: "2026-07-20",
          datetime: "2026-07-20T08:00:00.000Z",
          createdAt: "2026-07-20T08:00:00.000Z",
          updatedAt: "2026-07-20T08:00:00.000Z",
        },
        {
          id: "prise-2",
          type: "medication_intake",
          item: "med-1",
          medicationId: "med-1",
          medicationName: "Ibuprofène",
          date: "2026-07-20",
          datetime: "2026-07-20T20:00:00.000Z",
          createdAt: "2026-07-20T20:00:00.000Z",
          updatedAt: "2026-07-20T20:00:00.000Z",
        },
      ],
      medicaments: [],
      ressourcesNotes: [],
    };

    await importerDonnees(sauvegarde);

    expect(await db.entrees.count()).toBe(2);
  });

  it("remplace entièrement les données existantes plutôt que de les cumuler", async () => {
    await db.entrees.add(entreeSymptome({ id: "avant-import", item: "fatigue" }));

    const sauvegarde: Sauvegarde = {
      app: "soleil",
      version: 1,
      exporteLe: "2026-07-20T00:00:00.000Z",
      entrees: [entreeSymptome({ id: "apres-import", item: "douleur" })],
      medicaments: [],
      ressourcesNotes: [],
    };

    await importerDonnees(sauvegarde);

    const entrees = await db.entrees.toArray();
    expect(entrees).toHaveLength(1);
    expect(entrees[0].id).toBe("apres-import");
  });
});
