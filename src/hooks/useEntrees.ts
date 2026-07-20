import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import type { Entree, TypeEntree } from "../data/types";
import { CHARGEMENT, type OuChargement } from "./chargement";

/**
 * Renvoie `CHARGEMENT` tant que la requête Dexie n'a pas résolu une première
 * fois, pour permettre de distinguer "en cours de chargement" de "vide" côté
 * appelant (ex. écran d'accueil : ne pas afficher l'état "aucune entrée"
 * avant d'être sûr qu'il n'y a vraiment aucune entrée).
 */
export function useToutesLesEntrees(): OuChargement<Entree[]> {
  return useLiveQuery(
    async () => {
      const entrees = await db.entrees.orderBy("datetime").toArray();
      return entrees.reverse();
    },
    [],
    CHARGEMENT,
  );
}

export function useEntreesParType(type: TypeEntree): Entree[] {
  return (
    useLiveQuery(async () => {
      const entrees = await db.entrees.where("type").equals(type).sortBy("datetime");
      return entrees.reverse();
    }, [type]) ?? []
  );
}

export function useEntreesDuJour(date: string): Entree[] {
  return (
    useLiveQuery(() => db.entrees.where("date").equals(date).toArray(), [date]) ?? []
  );
}

export function useEntreesEntreDates(dateDebut: string, dateFin: string): Entree[] {
  return (
    useLiveQuery(
      () => db.entrees.where("date").between(dateDebut, dateFin, true, true).toArray(),
      [dateDebut, dateFin],
    ) ?? []
  );
}

export function useEntree(id: string | undefined): OuChargement<Entree | undefined> {
  return useLiveQuery(() => (id ? db.entrees.get(id) : undefined), [id], CHARGEMENT);
}

/** Historique des prises d'un médicament (`item` vaut `medicationId` pour ce type). */
export function usePrisesMedicament(medicamentId: string | undefined) {
  return (
    useLiveQuery(async () => {
      if (!medicamentId) return [];
      const prises = await db.entrees.where("item").equals(medicamentId).sortBy("datetime");
      return prises.filter((e) => e.type === "medication_intake").reverse();
    }, [medicamentId]) ?? []
  );
}
