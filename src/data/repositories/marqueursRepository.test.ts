import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { listerMarqueurs, ajouterMarqueur, supprimerMarqueur } from "./marqueursRepository";

beforeEach(async () => {
  await db.marqueurs.clear();
});

describe("ajouterMarqueur / listerMarqueurs", () => {
  it("ajoute un marqueur et le retrouve trié par date", async () => {
    await ajouterMarqueur({ label: "Début kiné hebdo", date: "2026-07-20" });
    await ajouterMarqueur({ label: "Début Ibuprofène 400mg", date: "2026-07-10" });

    const liste = await listerMarqueurs();

    expect(liste.map((m) => m.label)).toEqual(["Début Ibuprofène 400mg", "Début kiné hebdo"]);
  });
});

describe("supprimerMarqueur", () => {
  it("supprime un marqueur", async () => {
    const marqueur = await ajouterMarqueur({ label: "Début kiné hebdo", date: "2026-07-20" });

    await supprimerMarqueur(marqueur.id);

    expect(await db.marqueurs.get(marqueur.id)).toBeUndefined();
  });
});
