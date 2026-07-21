import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  marquerSauvegardeExportee,
  joursDepuisDerniereSauvegarde,
  doitRappelerSauvegarde,
  masquerRappelSauvegardePendantQuelquesJours,
  doitRappelerParcoursDuJour,
  masquerRappelParcoursAujourdhui,
} from "./rappels";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("rappel de sauvegarde", () => {
  it("ne rappelle rien tant qu'aucun export n'a été fait ET que l'app est récente (pas de date de référence)", () => {
    expect(joursDepuisDerniereSauvegarde()).toBeNull();
    expect(doitRappelerSauvegarde()).toBe(false);
  });

  it("ne rappelle pas avant 3 jours depuis le dernier export", () => {
    marquerSauvegardeExportee();
    expect(doitRappelerSauvegarde()).toBe(false);
  });

  it("rappelle après 3 jours ou plus depuis le dernier export", () => {
    const ilYA4Jours = new Date();
    ilYA4Jours.setDate(ilYA4Jours.getDate() - 4);
    vi.setSystemTime(ilYA4Jours);
    marquerSauvegardeExportee();
    vi.useRealTimers();

    expect(joursDepuisDerniereSauvegarde()).toBeGreaterThanOrEqual(3);
    expect(doitRappelerSauvegarde()).toBe(true);
  });

  it("respecte le masquage temporaire après un \"plus tard\"", () => {
    const ilYA5Jours = new Date();
    ilYA5Jours.setDate(ilYA5Jours.getDate() - 5);
    vi.setSystemTime(ilYA5Jours);
    marquerSauvegardeExportee();
    vi.useRealTimers();

    expect(doitRappelerSauvegarde()).toBe(true);
    masquerRappelSauvegardePendantQuelquesJours();
    expect(doitRappelerSauvegarde()).toBe(false);
  });
});

describe("rappel du parcours quotidien", () => {
  it("ne rappelle rien si des entrées existent déjà aujourd'hui", () => {
    expect(doitRappelerParcoursDuJour(false)).toBe(false);
  });

  it("rappelle si aucune entrée n'existe aujourd'hui", () => {
    expect(doitRappelerParcoursDuJour(true)).toBe(true);
  });

  it("ne rappelle plus une fois masqué pour aujourd'hui", () => {
    expect(doitRappelerParcoursDuJour(true)).toBe(true);
    masquerRappelParcoursAujourdhui();
    expect(doitRappelerParcoursDuJour(true)).toBe(false);
  });
});
