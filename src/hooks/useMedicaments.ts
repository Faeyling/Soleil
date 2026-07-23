import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import type { Medicament } from "../data/types";
import { CHARGEMENT, type OuChargement } from "./chargement";

export function useMedicaments(): Medicament[] {
  return (
    useLiveQuery(async () => {
      const tous = await db.medicaments.toArray();
      return [...tous].sort(
        (a, b) =>
          (a.ordre ?? Number.MAX_SAFE_INTEGER) - (b.ordre ?? Number.MAX_SAFE_INTEGER) || a.nom.localeCompare(b.nom, "fr"),
      );
    }, []) ?? []
  );
}

export function useMedicament(id: string | undefined): OuChargement<Medicament | undefined> {
  return useLiveQuery(() => (id ? db.medicaments.get(id) : undefined), [id], CHARGEMENT);
}
