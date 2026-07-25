import { db } from "../db";
import { maintenantISO } from "../../lib/date";
import type { TrancheAgeBeighton } from "../../content/ressources";

const CLE = "beighton-derniere-evaluation";

export interface EvaluationBeighton {
  composantesCochees: string[];
  tranche: TrancheAgeBeighton;
  evalueLe: string;
}

export async function obtenirDerniereEvaluationBeighton(): Promise<EvaluationBeighton | undefined> {
  const ligne = await db.parametres.get(CLE);
  return ligne?.valeur as EvaluationBeighton | undefined;
}

export async function enregistrerEvaluationBeighton(
  evaluation: Omit<EvaluationBeighton, "evalueLe">,
): Promise<void> {
  await db.parametres.put({ cle: CLE, valeur: { ...evaluation, evalueLe: maintenantISO() } });
}
