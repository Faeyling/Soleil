import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { listerMarqueurs, ajouterMarqueur, modifierMarqueur, supprimerMarqueur } from "./marqueursRepository";

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

describe("modifierMarqueur", () => {
  it("modifie le nom et la date d'un marqueur existant", async () => {
    const marqueur = await ajouterMarqueur({ label: "Début kiné hebdo", date: "2026-07-20" });

    await modifierMarqueur(marqueur.id, { label: "Début kiné bihebdo", date: "2026-07-22" });

    const relu = await db.marqueurs.get(marqueur.id);
    expect(relu?.label).toBe("Début kiné bihebdo");
    expect(relu?.date).toBe("2026-07-22");
  });
});

describe("supprimerMarqueur", () => {
  it("supprime un marqueur", async () => {
    const marqueur = await ajouterMarqueur({ label: "Début kiné hebdo", date: "2026-07-20" });

    await supprimerMarqueur(marqueur.id);

    expect(await db.marqueurs.get(marqueur.id)).toBeUndefined();
  });
});
