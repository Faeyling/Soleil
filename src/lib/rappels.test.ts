import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  marquerSauvegardeExportee,
  joursDepuisDerniereSauvegarde,
  doitRappelerSauvegarde,
  masquerRappelSauvegardePendantQuelquesJours,
  doitRappelerParcoursDuJour,
  masquerRappelParcoursAujourdhui,
  doitAlerterStockBas,
  masquerAlerteStockPendantQuelquesJours,
  doitRappelerMedicament,
  medicamentsARappeler,
  masquerRappelMedicamentAujourdhui,
} from "./rappels";
import type { Medicament } from "../data/types";

function medicament(overrides: Partial<Medicament> = {}): Medicament {
  return { id: "m1", nom: "Ibuprofène", createdAt: "2026-07-20T00:00:00.000Z", ...overrides };
}

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

describe("alerte de stock bas", () => {
  it("n'alerte pas s'il n'y a aucun médicament en stock bas", () => {
    expect(doitAlerterStockBas(0)).toBe(false);
  });

  it("alerte s'il y a au moins un médicament en stock bas", () => {
    expect(doitAlerterStockBas(2)).toBe(true);
  });

  it("respecte le masquage temporaire après un \"plus tard\"", () => {
    expect(doitAlerterStockBas(1)).toBe(true);
    masquerAlerteStockPendantQuelquesJours();
    expect(doitAlerterStockBas(1)).toBe(false);
  });
});

describe("rappel de prise de médicament", () => {
  const midi = new Date("2026-07-20T12:00:00");

  it("ne rappelle rien sans heure de rappel configurée", () => {
    expect(doitRappelerMedicament(medicament(), false, midi)).toBe(false);
  });

  it("ne rappelle rien avant l'heure configurée", () => {
    const m = medicament({ heureRappel: "14:00" });
    expect(doitRappelerMedicament(m, false, midi)).toBe(false);
  });

  it("rappelle une fois l'heure configurée passée, si aucune prise aujourd'hui", () => {
    const m = medicament({ heureRappel: "08:00" });
    expect(doitRappelerMedicament(m, false, midi)).toBe(true);
  });

  it("ne rappelle rien si une prise est déjà enregistrée aujourd'hui", () => {
    const m = medicament({ heureRappel: "08:00" });
    expect(doitRappelerMedicament(m, true, midi)).toBe(false);
  });

  it("ne rappelle rien pour un médicament désactivé", () => {
    const m = medicament({ heureRappel: "08:00", desactive: true });
    expect(doitRappelerMedicament(m, false, midi)).toBe(false);
  });

  it("ne rappelle plus une fois masqué pour aujourd'hui", () => {
    const m = medicament({ heureRappel: "08:00" });
    expect(doitRappelerMedicament(m, false, midi)).toBe(true);
    masquerRappelMedicamentAujourdhui(m.id);
    expect(doitRappelerMedicament(m, false, midi)).toBe(false);
  });

  it("medicamentsARappeler ne garde que les médicaments dus", () => {
    const du = medicament({ id: "du", heureRappel: "08:00" });
    const pasEncore = medicament({ id: "pas-encore", heureRappel: "18:00" });
    const dejaPris = medicament({ id: "deja-pris", heureRappel: "08:00" });

    const resultat = medicamentsARappeler([du, pasEncore, dejaPris], new Set(["deja-pris"]), midi);

    expect(resultat.map((m) => m.id)).toEqual(["du"]);
  });
});
