import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../db";
import {
  creerEntree,
  modifierEntreeAvecUnicite,
  enregistrerOuMettreAJour,
  trouverEntreeDuJour,
} from "./entreesRepository";

beforeEach(async () => {
  await db.entrees.clear();
});

describe("creerEntree", () => {
  it("crée une entrée quand aucune n'existe pour (type, item, date)", async () => {
    const resultat = await creerEntree({
      type: "symptom",
      item: "douleur",
      date: "2026-07-20",
      datetime: "2026-07-20T18:00:00.000Z",
      severity: "haut",
    });

    expect(resultat.creee).toBe(true);
    expect(resultat.entree.id).toBeTruthy();
    expect(await db.entrees.count()).toBe(1);
  });

  it("refuse un doublon pour un symptôme au même (item, date) et renvoie l'entrée existante", async () => {
    const premiere = await creerEntree({
      type: "symptom",
      item: "douleur",
      date: "2026-07-20",
      datetime: "2026-07-20T18:00:00.000Z",
      severity: "haut",
    });

    const deuxieme = await creerEntree({
      type: "symptom",
      item: "douleur",
      date: "2026-07-20",
      datetime: "2026-07-20T20:00:00.000Z",
      severity: "moyen",
    });

    expect(deuxieme.creee).toBe(false);
    expect(deuxieme.entree.id).toBe(premiere.entree.id);
    expect(await db.entrees.count()).toBe(1);
  });

  it("autorise plusieurs prises de médicament le même jour (pas de contrainte d'unicité)", async () => {
    await creerEntree({
      type: "medication_intake",
      item: "med-1",
      medicationId: "med-1",
      medicationName: "Ibuprofène",
      date: "2026-07-20",
      datetime: "2026-07-20T08:00:00.000Z",
    });
    await creerEntree({
      type: "medication_intake",
      item: "med-1",
      medicationId: "med-1",
      medicationName: "Ibuprofène",
      date: "2026-07-20",
      datetime: "2026-07-20T20:00:00.000Z",
    });

    expect(await db.entrees.count()).toBe(2);
  });

  it("n'entre pas en conflit entre deux items différents le même jour", async () => {
    const a = await creerEntree({
      type: "symptom",
      item: "douleur",
      date: "2026-07-20",
      datetime: "2026-07-20T18:00:00.000Z",
      severity: "haut",
    });
    const b = await creerEntree({
      type: "symptom",
      item: "fatigue",
      date: "2026-07-20",
      datetime: "2026-07-20T18:00:00.000Z",
      severity: "moyen",
    });

    expect(a.creee).toBe(true);
    expect(b.creee).toBe(true);
    expect(await db.entrees.count()).toBe(2);
  });
});

describe("modifierEntreeAvecUnicite", () => {
  it("modifie librement une entrée quand la date ne change pas", async () => {
    const { entree } = await creerEntree({
      type: "symptom",
      item: "douleur",
      date: "2026-07-20",
      datetime: "2026-07-20T18:00:00.000Z",
      severity: "haut",
    });

    const resultat = await modifierEntreeAvecUnicite(entree, { severity: "bas" });

    expect(resultat.modifiee).toBe(true);
    const relue = await db.entrees.get(entree.id);
    expect(relue && "severity" in relue ? relue.severity : undefined).toBe("bas");
  });

  it("refuse de déplacer une entrée vers une date où (type, item) existe déjà, et renvoie le conflit", async () => {
    const { entree: entreeJ19 } = await creerEntree({
      type: "symptom",
      item: "douleur",
      date: "2026-07-19",
      datetime: "2026-07-19T18:00:00.000Z",
      severity: "moyen",
    });
    const { entree: entreeJ20 } = await creerEntree({
      type: "symptom",
      item: "douleur",
      date: "2026-07-20",
      datetime: "2026-07-20T18:00:00.000Z",
      severity: "haut",
    });

    // On tente de déplacer l'entrée du 20 vers le 19, qui a déjà une entrée "douleur".
    const resultat = await modifierEntreeAvecUnicite(entreeJ20, { date: "2026-07-19" });

    expect(resultat.modifiee).toBe(false);
    expect(resultat.conflit?.id).toBe(entreeJ19.id);

    // L'entrée du 20 doit être restée inchangée (pas de doublon silencieux au 19).
    const relue = await db.entrees.get(entreeJ20.id);
    expect(relue?.date).toBe("2026-07-20");
    expect(await db.entrees.where("date").equals("2026-07-19").count()).toBe(1);
  });

  it("autorise de déplacer une entrée vers une date libre", async () => {
    const { entree } = await creerEntree({
      type: "symptom",
      item: "douleur",
      date: "2026-07-20",
      datetime: "2026-07-20T18:00:00.000Z",
      severity: "haut",
    });

    const resultat = await modifierEntreeAvecUnicite(entree, { date: "2026-07-21" });

    expect(resultat.modifiee).toBe(true);
    const relue = await db.entrees.get(entree.id);
    expect(relue?.date).toBe("2026-07-21");
  });
});

describe("enregistrerOuMettreAJour", () => {
  it("crée l'entrée du jour si elle n'existe pas", async () => {
    await enregistrerOuMettreAJour({
      type: "track_something",
      item: "humeur",
      date: "2026-07-20",
      datetime: "2026-07-20T21:00:00.000Z",
      severity: "moyen",
    });

    const entree = await trouverEntreeDuJour("track_something", "humeur", "2026-07-20");
    expect(entree && "severity" in entree ? entree.severity : undefined).toBe("moyen");
    expect(await db.entrees.count()).toBe(1);
  });

  it("met à jour l'entrée existante plutôt que d'en créer une seconde (usage : parcours quotidien rouvert)", async () => {
    await enregistrerOuMettreAJour({
      type: "track_something",
      item: "humeur",
      date: "2026-07-20",
      datetime: "2026-07-20T09:00:00.000Z",
      severity: "bas",
    });
    await enregistrerOuMettreAJour({
      type: "track_something",
      item: "humeur",
      date: "2026-07-20",
      datetime: "2026-07-20T21:00:00.000Z",
      severity: "haut",
    });

    expect(await db.entrees.count()).toBe(1);
    const entree = await trouverEntreeDuJour("track_something", "humeur", "2026-07-20");
    expect(entree && "severity" in entree ? entree.severity : undefined).toBe("haut");
  });
});
