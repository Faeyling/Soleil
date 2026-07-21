import { v4 as uuid } from "uuid";
import { db } from "../db";
import type { SymptomeDef, SuiviDef } from "../types";
import { SYMPTOMES_PAR_DEFAUT } from "../../content/symptomes";
import { AUTRES_SUIVIS_PAR_DEFAUT } from "../../content/autresSuivis";

/** Sème le contenu par défaut une seule fois, si les tables sont vides (premier lancement). */
export async function initialiserContenuSiVide(): Promise<void> {
  const [nbSymptomes, nbSuivis] = await Promise.all([db.symptomes.count(), db.autresSuivis.count()]);
  if (nbSymptomes === 0) await db.symptomes.bulkAdd(SYMPTOMES_PAR_DEFAUT);
  if (nbSuivis === 0) await db.autresSuivis.bulkAdd(AUTRES_SUIVIS_PAR_DEFAUT);
}

async function prochainOrdre(table: typeof db.symptomes | typeof db.autresSuivis): Promise<number> {
  const tous = await table.toArray();
  return tous.reduce((max, item) => Math.max(max, item.ordre), -1) + 1;
}

export async function ajouterSymptome(donnees: Omit<SymptomeDef, "id" | "ordre">): Promise<SymptomeDef> {
  const symptome: SymptomeDef = { ...donnees, id: uuid(), ordre: await prochainOrdre(db.symptomes) };
  await db.symptomes.add(symptome);
  return symptome;
}

export async function modifierSymptome(id: string, changements: Partial<Omit<SymptomeDef, "id">>): Promise<void> {
  await db.symptomes.update(id, changements);
}

export async function supprimerSymptome(id: string): Promise<void> {
  await db.symptomes.delete(id);
}

export async function ajouterSuivi(donnees: Omit<SuiviDef, "id" | "ordre">): Promise<SuiviDef> {
  const suivi: SuiviDef = { ...donnees, id: uuid(), ordre: await prochainOrdre(db.autresSuivis) };
  await db.autresSuivis.add(suivi);
  return suivi;
}

export async function modifierSuivi(id: string, changements: Partial<Omit<SuiviDef, "id">>): Promise<void> {
  await db.autresSuivis.update(id, changements);
}

export async function supprimerSuivi(id: string): Promise<void> {
  await db.autresSuivis.delete(id);
}
