import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../db";
import {
  initialiserContenuSiVide,
  ajouterSymptome,
  modifierSymptome,
  supprimerSymptome,
  ajouterSuivi,
  modifierSuivi,
  supprimerSuivi,
} from "./contenuRepository";
import { SYMPTOMES_PAR_DEFAUT } from "../../content/symptomes";
import { AUTRES_SUIVIS_PAR_DEFAUT } from "../../content/autresSuivis";

beforeEach(async () => {
  await db.symptomes.clear();
  await db.autresSuivis.clear();
});

describe("initialiserContenuSiVide", () => {
  it("sème le contenu par défaut quand les tables sont vides", async () => {
    await initialiserContenuSiVide();

    expect(await db.symptomes.count()).toBe(SYMPTOMES_PAR_DEFAUT.length);
    expect(await db.autresSuivis.count()).toBe(AUTRES_SUIVIS_PAR_DEFAUT.length);
  });

  it("ne resème pas si du contenu existe déjà (pas de doublon)", async () => {
    await initialiserContenuSiVide();
    await ajouterSymptome({ icone: "🩹", label: "Personnalisé" });
    await initialiserContenuSiVide();

    expect(await db.symptomes.count()).toBe(SYMPTOMES_PAR_DEFAUT.length + 1);
  });
});

describe("ajouterSymptome / modifierSymptome / supprimerSymptome", () => {
  it("ajoute un symptôme en fin de liste (ordre croissant)", async () => {
    await initialiserContenuSiVide();
    const symptome = await ajouterSymptome({ icone: "🩹", label: "Migraine" });

    expect(symptome.ordre).toBe(SYMPTOMES_PAR_DEFAUT.length);
    expect(await db.symptomes.get(symptome.id)).toMatchObject({ label: "Migraine" });
  });

  it("modifie un symptôme existant", async () => {
    const symptome = await ajouterSymptome({ icone: "🩹", label: "Migraine" });
    await modifierSymptome(symptome.id, { label: "Migraine ophtalmique" });

    expect((await db.symptomes.get(symptome.id))?.label).toBe("Migraine ophtalmique");
  });

  it("supprime un symptôme", async () => {
    const symptome = await ajouterSymptome({ icone: "🩹", label: "Migraine" });
    await supprimerSymptome(symptome.id);

    expect(await db.symptomes.get(symptome.id)).toBeUndefined();
  });
});

describe("ajouterSuivi / modifierSuivi / supprimerSuivi", () => {
  it("ajoute un suivi en fin de liste (ordre croissant)", async () => {
    await initialiserContenuSiVide();
    const suivi = await ajouterSuivi({ icone: "🏊", label: "Piscine", typeFormulaire: "severite" });

    expect(suivi.ordre).toBe(AUTRES_SUIVIS_PAR_DEFAUT.length);
  });

  it("modifie un suivi existant", async () => {
    const suivi = await ajouterSuivi({ icone: "🏊", label: "Piscine", typeFormulaire: "severite" });
    await modifierSuivi(suivi.id, { typeFormulaire: "numerique", unite: "min" });

    const relu = await db.autresSuivis.get(suivi.id);
    expect(relu?.typeFormulaire).toBe("numerique");
    expect(relu?.unite).toBe("min");
  });

  it("supprime un suivi", async () => {
    const suivi = await ajouterSuivi({ icone: "🏊", label: "Piscine", typeFormulaire: "severite" });
    await supprimerSuivi(suivi.id);

    expect(await db.autresSuivis.get(suivi.id)).toBeUndefined();
  });
});
