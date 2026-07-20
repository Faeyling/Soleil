import { v4 as uuid } from "uuid";
import { db } from "../db";
import { maintenantISO } from "../../lib/date";
import type { Entree, TypeEntree, OmitDistributif, PartialDistributif } from "../types";

type NouvelleEntree = OmitDistributif<Entree, "id" | "createdAt" | "updatedAt">;
type ChangementsEntree = PartialDistributif<OmitDistributif<Entree, "id" | "type" | "createdAt">>;

/** Types soumis à la règle "une entrée max par élément et par jour". */
const TYPES_UNIQUES: TypeEntree[] = ["symptom", "track_something"];

export async function trouverEntreeDuJour(
  type: TypeEntree,
  item: string,
  date: string,
): Promise<Entree | undefined> {
  return db.entrees.where({ type, item, date }).first();
}

export interface ResultatCreation {
  creee: boolean;
  entree: Entree;
}

/**
 * Crée une entrée, sauf si une entrée existe déjà pour (type, item, date)
 * et que ce type est soumis à la contrainte d'unicité quotidienne — dans ce
 * cas, l'entrée existante est renvoyée pour rediriger vers son édition.
 */
export async function creerEntree(donnees: NouvelleEntree): Promise<ResultatCreation> {
  if (TYPES_UNIQUES.includes(donnees.type)) {
    const existante = await trouverEntreeDuJour(
      donnees.type,
      donnees.item,
      donnees.date,
    );
    if (existante) {
      return { creee: false, entree: existante };
    }
  }

  const maintenant = maintenantISO();
  const entree = {
    ...donnees,
    id: uuid(),
    createdAt: maintenant,
    updatedAt: maintenant,
  } as Entree;

  await db.entrees.add(entree);
  return { creee: true, entree };
}

export async function modifierEntree(id: string, changements: ChangementsEntree): Promise<void> {
  await db.entrees.update(id, {
    ...changements,
    updatedAt: maintenantISO(),
  });
}

export async function supprimerEntree(id: string): Promise<void> {
  await db.entrees.delete(id);
}

export async function obtenirEntree(id: string): Promise<Entree | undefined> {
  return db.entrees.get(id);
}

export async function listerToutesLesEntrees(): Promise<Entree[]> {
  return db.entrees.orderBy("datetime").reverse().toArray();
}

export async function listerEntreesParType(type: TypeEntree): Promise<Entree[]> {
  const entrees = await db.entrees.where("type").equals(type).sortBy("datetime");
  return entrees.reverse();
}

export async function listerEntreesParDate(date: string): Promise<Entree[]> {
  return db.entrees.where("date").equals(date).toArray();
}

export async function listerEntreesEntreDates(
  dateDebut: string,
  dateFin: string,
): Promise<Entree[]> {
  return db.entrees.where("date").between(dateDebut, dateFin, true, true).toArray();
}

/**
 * Crée l'entrée du jour pour (type, item), ou met à jour l'entrée existante
 * si elle existe déjà — utilisé par le parcours quotidien, qui ne doit jamais
 * créer de doublon.
 */
export async function enregistrerOuMettreAJour(donnees: NouvelleEntree): Promise<void> {
  const resultat = await creerEntree(donnees);
  if (!resultat.creee) {
    await modifierEntree(resultat.entree.id, donnees as ChangementsEntree);
  }
}

export async function viderToutesLesEntrees(): Promise<void> {
  await db.entrees.clear();
}
