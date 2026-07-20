import { v4 as uuid } from "uuid";
import { db } from "../db";
import { maintenantISO } from "../../lib/date";
import type { Entree, TypeEntree, OmitDistributif, PartialDistributif } from "../types";

type NouvelleEntree = OmitDistributif<Entree, "id" | "createdAt" | "updatedAt">;
type ChangementsEntree = PartialDistributif<OmitDistributif<Entree, "id" | "type" | "createdAt">>;

/** Types soumis à la règle "une entrée max par élément et par jour". */
export const TYPES_UNIQUES: TypeEntree[] = ["symptom", "track_something"];

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
 *
 * La vérification et l'écriture sont regroupées dans une seule transaction
 * `rw` : IndexedDB sérialise les transactions `readwrite` qui se chevauchent
 * sur la même table, ce qui empêche deux appels concurrents (ex. double-tap
 * sur "Enregistrer") de tous les deux passer le contrôle d'unicité avant que
 * l'un des deux n'ait écrit.
 */
export async function creerEntree(donnees: NouvelleEntree): Promise<ResultatCreation> {
  return db.transaction("rw", db.entrees, async () => {
    if (TYPES_UNIQUES.includes(donnees.type)) {
      const existante = await trouverEntreeDuJour(donnees.type, donnees.item, donnees.date);
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
  });
}

export async function modifierEntree(id: string, changements: ChangementsEntree): Promise<void> {
  await db.entrees.update(id, {
    ...changements,
    updatedAt: maintenantISO(),
  });
}

export interface ResultatModification {
  modifiee: boolean;
  /** Présente uniquement si `modifiee` est faux : l'entrée en conflit à (type, item, nouvelle date). */
  conflit?: Entree;
}

/**
 * Modifie une entrée en respectant la règle d'unicité quotidienne : si les
 * changements déplacent l'entrée vers une date où (type, item) a déjà une
 * autre entrée, la modification est refusée et l'entrée en conflit est
 * renvoyée pour que l'appelant puisse rediriger vers son édition, au lieu de
 * silencieusement créer un doublon.
 */
export async function modifierEntreeAvecUnicite(
  entreeActuelle: Entree,
  changements: ChangementsEntree,
): Promise<ResultatModification> {
  return db.transaction("rw", db.entrees, async () => {
    const nouvelleDate = (changements as { date?: string }).date ?? entreeActuelle.date;

    if (TYPES_UNIQUES.includes(entreeActuelle.type) && nouvelleDate !== entreeActuelle.date) {
      const conflit = await trouverEntreeDuJour(entreeActuelle.type, entreeActuelle.item, nouvelleDate);
      if (conflit && conflit.id !== entreeActuelle.id) {
        return { modifiee: false, conflit };
      }
    }

    await db.entrees.update(entreeActuelle.id, {
      ...changements,
      updatedAt: maintenantISO(),
    });
    return { modifiee: true };
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
