import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../db";
import {
  creerEntree,
  modifierEntreeAvecUnicite,
  enregistrerOuMettreAJour,
  trouverEntreeDuJour,
  supprimerEntree,
  restaurerEntree,
  migrerZonesDouleurFusionnees,
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

describe("restaurerEntree", () => {
  it("ré-insère une entrée supprimée avec son id d'origine, pour le \"Annuler\"", async () => {
    const { entree } = await creerEntree({
      type: "symptom",
      item: "douleur",
      date: "2026-07-20",
      datetime: "2026-07-20T18:00:00.000Z",
      severity: "haut",
    });

    await supprimerEntree(entree.id);
    expect(await db.entrees.count()).toBe(0);

    await restaurerEntree(entree);

    expect(await db.entrees.count()).toBe(1);
    const relue = await db.entrees.get(entree.id);
    expect(relue?.id).toBe(entree.id);
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

describe("migrerZonesDouleurFusionnees", () => {
  it("remplace les anciennes zones articulaires par les nouvelles grandes régions", async () => {
    const { entree } = await creerEntree({
      type: "symptom",
      item: "douleur",
      date: "2026-07-20",
      datetime: "2026-07-20T18:00:00.000Z",
      evaluationEva: 5,
      location: ["coude-droit", "poignet-droit", "genou-gauche"],
      zonesPlusDouloureuses: ["poignet-droit"],
    });

    await migrerZonesDouleurFusionnees();

    const relue = await db.entrees.get(entree.id);
    expect(relue && "location" in relue ? relue.location : undefined).toEqual(
      expect.arrayContaining(["bras-droit", "main-droite", "jambe-gauche"]),
    );
    expect(relue && "location" in relue ? relue.location : undefined).toHaveLength(3);
    expect(relue && "zonesPlusDouloureuses" in relue ? relue.zonesPlusDouloureuses : undefined).toEqual([
      "main-droite",
    ]);
  });

  it("dédoublonne quand plusieurs anciennes zones fusionnent vers la même nouvelle zone", async () => {
    const { entree } = await creerEntree({
      type: "symptom",
      item: "douleur",
      date: "2026-07-20",
      datetime: "2026-07-20T18:00:00.000Z",
      evaluationEva: 5,
      location: ["coude-gauche", "avant-bras-gauche", "poignet-gauche"],
    });

    await migrerZonesDouleurFusionnees();

    const relue = await db.entrees.get(entree.id);
    expect(relue && "location" in relue ? relue.location : undefined).toEqual(["bras-gauche", "main-gauche"]);
  });

  it("laisse intactes les zones déjà dans le nouveau schéma", async () => {
    const { entree } = await creerEntree({
      type: "symptom",
      item: "douleur",
      date: "2026-07-20",
      datetime: "2026-07-20T18:00:00.000Z",
      evaluationEva: 5,
      location: ["torse", "dos", "hanche-droite"],
    });

    await migrerZonesDouleurFusionnees();

    const relue = await db.entrees.get(entree.id);
    expect(relue && "location" in relue ? relue.location : undefined).toEqual(["torse", "dos", "hanche-droite"]);
  });

  it("fusionne ventre, côtes et sacro-iliaque gauche/droite vers leurs zones élargies", async () => {
    const { entree } = await creerEntree({
      type: "symptom",
      item: "douleur",
      date: "2026-07-20",
      datetime: "2026-07-20T18:00:00.000Z",
      evaluationEva: 5,
      location: ["ventre", "cotes-gauche", "sacro-iliaque-gauche", "sacro-iliaque-droite"],
    });

    await migrerZonesDouleurFusionnees();

    const relue = await db.entrees.get(entree.id);
    expect(relue && "location" in relue ? relue.location : undefined).toEqual(["torse", "sacro-iliaque"]);
  });

  it("est idempotente : rejouer la migration ne change plus rien", async () => {
    await creerEntree({
      type: "symptom",
      item: "douleur",
      date: "2026-07-20",
      datetime: "2026-07-20T18:00:00.000Z",
      evaluationEva: 5,
      location: ["coude-droit"],
    });

    await migrerZonesDouleurFusionnees();
    await migrerZonesDouleurFusionnees();

    const entree = await trouverEntreeDuJour("symptom", "douleur", "2026-07-20");
    expect(entree && "location" in entree ? entree.location : undefined).toEqual(["bras-droit"]);
  });
});
