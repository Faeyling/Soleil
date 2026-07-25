import { beforeEach, describe, expect, it } from "vitest";
import { getNomPatiente, setNomPatiente, getDateNaissance, setDateNaissance, calculerAge } from "./profilPatiente";

beforeEach(() => {
  localStorage.clear();
});

describe("nom de la patiente", () => {
  it("est vide par défaut", () => {
    expect(getNomPatiente()).toBe("");
  });

  it("mémorise un nom", () => {
    setNomPatiente("Jeanne Dupont");
    expect(getNomPatiente()).toBe("Jeanne Dupont");
  });

  it("nettoie les espaces superflus", () => {
    setNomPatiente("  Jeanne Dupont  ");
    expect(getNomPatiente()).toBe("Jeanne Dupont");
  });

  it("efface la préférence quand le nom est vidé", () => {
    setNomPatiente("Jeanne Dupont");
    setNomPatiente("");
    expect(getNomPatiente()).toBe("");
  });
});

describe("date de naissance de la patiente", () => {
  it("est vide par défaut", () => {
    expect(getDateNaissance()).toBe("");
  });

  it("mémorise une date", () => {
    setDateNaissance("1995-03-14");
    expect(getDateNaissance()).toBe("1995-03-14");
  });

  it("efface la préférence quand la date est vidée", () => {
    setDateNaissance("1995-03-14");
    setDateNaissance("");
    expect(getDateNaissance()).toBe("");
  });
});

describe("calculerAge", () => {
  it("calcule l'âge révolu par rapport à une date de référence", () => {
    expect(calculerAge("1995-03-14", "2026-07-25")).toBe(31);
  });

  it("ne compte pas l'anniversaire du jour comme déjà passé l'an dernier", () => {
    expect(calculerAge("1995-07-25", "2026-07-25")).toBe(31);
  });

  it("n'incrémente pas l'âge avant l'anniversaire de l'année", () => {
    expect(calculerAge("1995-08-01", "2026-07-25")).toBe(30);
  });
});
