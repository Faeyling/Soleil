import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { obtenirDerniereEvaluationBeighton, enregistrerEvaluationBeighton } from "./beightonRepository";

beforeEach(async () => {
  await db.parametres.clear();
});

describe("évaluation de Beighton", () => {
  it("est absente par défaut", async () => {
    expect(await obtenirDerniereEvaluationBeighton()).toBeUndefined();
  });

  it("enregistre puis relit la dernière évaluation, horodatée", async () => {
    await enregistrerEvaluationBeighton({ composantesCochees: ["pouce-gauche", "coude-droit"], tranche: "puberte-50-ans" });

    const evaluation = await obtenirDerniereEvaluationBeighton();

    expect(evaluation?.composantesCochees).toEqual(["pouce-gauche", "coude-droit"]);
    expect(evaluation?.tranche).toBe("puberte-50-ans");
    expect(evaluation?.evalueLe).toBeTruthy();
  });

  it("remplace l'évaluation précédente plutôt que de l'accumuler", async () => {
    await enregistrerEvaluationBeighton({ composantesCochees: ["pouce-gauche"], tranche: "puberte-50-ans" });
    await enregistrerEvaluationBeighton({ composantesCochees: ["coude-droit", "coude-gauche"], tranche: "avant-puberte" });

    const evaluation = await obtenirDerniereEvaluationBeighton();

    expect(evaluation?.composantesCochees).toEqual(["coude-droit", "coude-gauche"]);
    expect(evaluation?.tranche).toBe("avant-puberte");
  });
});
