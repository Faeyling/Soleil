import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../db";
import {
  ajouterMedicament,
  supprimerMedicament,
  definirStock,
  decrementerStock,
  desactiverMedicament,
  reactiverMedicament,
  deplacerMedicament,
  listerMedicaments,
} from "./medicamentsRepository";
import { creerEntree } from "./entreesRepository";

beforeEach(async () => {
  await db.entrees.clear();
  await db.medicaments.clear();
});

describe("ajouterMedicament", () => {
  it("réutilise un médicament existant plutôt que d'en créer un doublon (insensible à la casse)", async () => {
    const premier = await ajouterMedicament("Ibuprofène");
    const second = await ajouterMedicament("ibuprofène");

    expect(second.id).toBe(premier.id);
    expect(await db.medicaments.count()).toBe(1);
  });

  it("réactive automatiquement un médicament désactivé en enregistrant une nouvelle prise", async () => {
    const medicament = await ajouterMedicament("Ibuprofène");
    await desactiverMedicament(medicament.id);
    expect((await db.medicaments.get(medicament.id))?.desactive).toBe(true);

    const relogue = await ajouterMedicament("Ibuprofène");

    expect(relogue.id).toBe(medicament.id);
    expect(relogue.desactive).toBe(false);
    expect((await db.medicaments.get(medicament.id))?.desactive).toBe(false);
  });
});

describe("desactiverMedicament / reactiverMedicament", () => {
  it("désactive puis réactive un médicament sans toucher à son historique de prises", async () => {
    const medicament = await ajouterMedicament("Ibuprofène");
    await creerEntree({
      type: "medication_intake",
      item: medicament.id,
      medicationId: medicament.id,
      medicationName: medicament.nom,
      date: "2026-07-20",
      datetime: "2026-07-20T08:00:00.000Z",
    });

    await desactiverMedicament(medicament.id);
    expect((await db.medicaments.get(medicament.id))?.desactive).toBe(true);
    expect(await db.entrees.count()).toBe(1);

    await reactiverMedicament(medicament.id);
    expect((await db.medicaments.get(medicament.id))?.desactive).toBe(false);
    expect(await db.entrees.count()).toBe(1);
  });
});

describe("decrementerStock", () => {
  it("décrémente le stock d'une unité à chaque appel", async () => {
    const medicament = await ajouterMedicament("Ibuprofène");
    await definirStock(medicament.id, 3, 1);

    await decrementerStock(medicament.id);
    expect((await db.medicaments.get(medicament.id))?.stock).toBe(2);

    await decrementerStock(medicament.id);
    expect((await db.medicaments.get(medicament.id))?.stock).toBe(1);
  });

  it("ne descend jamais sous zéro", async () => {
    const medicament = await ajouterMedicament("Ibuprofène");
    await definirStock(medicament.id, 0, 1);

    await decrementerStock(medicament.id);

    expect((await db.medicaments.get(medicament.id))?.stock).toBe(0);
  });

  it("ne fait rien si le stock n'est pas suivi pour ce médicament", async () => {
    const medicament = await ajouterMedicament("Ibuprofène");

    await decrementerStock(medicament.id);

    expect((await db.medicaments.get(medicament.id))?.stock).toBeUndefined();
  });
});

describe("supprimerMedicament", () => {
  it("supprime en cascade toutes les prises du médicament", async () => {
    const medicament = await ajouterMedicament("Ibuprofène");
    await creerEntree({
      type: "medication_intake",
      item: medicament.id,
      medicationId: medicament.id,
      medicationName: medicament.nom,
      date: "2026-07-20",
      datetime: "2026-07-20T08:00:00.000Z",
    });
    await creerEntree({
      type: "medication_intake",
      item: medicament.id,
      medicationId: medicament.id,
      medicationName: medicament.nom,
      date: "2026-07-19",
      datetime: "2026-07-19T08:00:00.000Z",
    });

    await supprimerMedicament(medicament.id);

    expect(await db.medicaments.get(medicament.id)).toBeUndefined();
    expect(await db.entrees.count()).toBe(0);
  });

  it("ne supprime pas les entrées d'un autre médicament", async () => {
    const a = await ajouterMedicament("Ibuprofène");
    const b = await ajouterMedicament("Magnésium");
    await creerEntree({
      type: "medication_intake",
      item: a.id,
      medicationId: a.id,
      medicationName: a.nom,
      date: "2026-07-20",
      datetime: "2026-07-20T08:00:00.000Z",
    });
    await creerEntree({
      type: "medication_intake",
      item: b.id,
      medicationId: b.id,
      medicationName: b.nom,
      date: "2026-07-20",
      datetime: "2026-07-20T08:00:00.000Z",
    });

    await supprimerMedicament(a.id);

    expect(await db.entrees.count()).toBe(1);
    const restante = await db.entrees.toArray();
    expect(restante[0].item).toBe(b.id);
  });
});

describe("deplacerMedicament", () => {
  it("échange l'ordre avec le voisin du dessus", async () => {
    const a = await ajouterMedicament("Ibuprofène");
    const b = await ajouterMedicament("Magnésium");

    await deplacerMedicament(b.id, "haut");

    const liste = await listerMedicaments();
    expect(liste.map((m) => m.id)).toEqual([b.id, a.id]);
  });

  it("ne fait rien si le médicament est déjà en dernière position", async () => {
    await ajouterMedicament("Ibuprofène");
    const b = await ajouterMedicament("Magnésium");

    await deplacerMedicament(b.id, "bas");

    const liste = await listerMedicaments();
    expect(liste.map((m) => m.nom)).toEqual(["Ibuprofène", "Magnésium"]);
  });

  it("normalise l'ordre alphabétique des médicaments sans `ordre` (ex. restaurés depuis une ancienne sauvegarde)", async () => {
    await db.medicaments.bulkAdd([
      { id: "m-zolpidem", nom: "Zolpidem", createdAt: "2026-07-20T00:00:00.000Z" },
      { id: "m-aspirine", nom: "Aspirine", createdAt: "2026-07-20T00:00:00.000Z" },
    ]);

    // Sans `ordre` explicite, la liste part de l'ordre alphabétique.
    const avant = await listerMedicaments();
    expect(avant.map((m) => m.nom)).toEqual(["Aspirine", "Zolpidem"]);

    await deplacerMedicament("m-zolpidem", "haut");

    const apres = await listerMedicaments();
    expect(apres.map((m) => m.nom)).toEqual(["Zolpidem", "Aspirine"]);
  });

  it("ignore les médicaments désactivés lors du calcul des voisins", async () => {
    const a = await ajouterMedicament("Aspirine");
    const b = await ajouterMedicament("Ibuprofène");
    const c = await ajouterMedicament("Magnésium");
    await desactiverMedicament(b.id);

    await deplacerMedicament(c.id, "haut");

    const liste = await listerMedicaments();
    expect(liste.filter((m) => !m.desactive).map((m) => m.id)).toEqual([c.id, a.id]);
  });
});
