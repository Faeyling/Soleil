import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculerCorrelation } from "./correlations";
import type { Entree } from "../data/types";

function entree(partiel: Partial<Entree> & Pick<Entree, "type" | "item" | "date">): Entree {
  return {
    id: `${partiel.item}-${partiel.date}-${Math.random()}`,
    datetime: `${partiel.date}T12:00:00.000Z`,
    createdAt: `${partiel.date}T12:00:00.000Z`,
    updatedAt: `${partiel.date}T12:00:00.000Z`,
    ...partiel,
  } as Entree;
}

describe("calculerCorrelation", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2026-07-21T10:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("compare la sévérité moyenne jour même et lendemain, avec vs sans l'activité", () => {
    const entrees: Entree[] = [
      entree({ type: "track_something", item: "kine", date: "2026-07-05" }),
      entree({ type: "track_something", item: "kine", date: "2026-07-10" }),
      entree({ type: "symptom", item: "douleur", date: "2026-07-05", severity: "haut" }),
      entree({ type: "symptom", item: "douleur", date: "2026-07-06", severity: "moyen" }),
      entree({ type: "symptom", item: "douleur", date: "2026-07-10", severity: "haut" }),
      entree({ type: "symptom", item: "douleur", date: "2026-07-11", severity: "haut" }),
      entree({ type: "symptom", item: "douleur", date: "2026-07-15", severity: "bas" }),
      entree({ type: "symptom", item: "douleur", date: "2026-07-16", severity: "bas" }),
    ];

    const resultat = calculerCorrelation(entrees, "kine", "douleur", "2026-07-01");

    expect(resultat.nombreJoursAvecActivite).toBe(2);
    expect(resultat.moyenneJourMemeAvec).toBe(3);
    expect(resultat.moyenneJourMemeSans).toBeCloseTo(1.75);
    expect(resultat.moyenneLendemainAvec).toBeCloseTo(2.5);
    // Inclut aussi les jours sans kiné dont le lendemain a une entrée douleur
    // (ex. 04/07 → 05/07, 09/07 → 10/07), pas seulement les jours "sans" qui
    // ont eux-mêmes une entrée : [3, 3, 1, 1].
    expect(resultat.moyenneLendemainSans).toBeCloseTo(2);
  });

  it("renvoie null quand il n'y a pas de données pour un groupe", () => {
    const entrees: Entree[] = [
      entree({ type: "symptom", item: "douleur", date: "2026-07-05", severity: "haut" }),
    ];

    const resultat = calculerCorrelation(entrees, "kine", "douleur", "2026-07-01");

    expect(resultat.nombreJoursAvecActivite).toBe(0);
    expect(resultat.moyenneJourMemeAvec).toBeNull();
    expect(resultat.moyenneLendemainAvec).toBeNull();
  });
});
