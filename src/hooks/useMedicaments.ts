import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import type { Medicament } from "../data/types";

export function useMedicaments(): Medicament[] {
  return useLiveQuery(() => db.medicaments.orderBy("nom").toArray(), []) ?? [];
}

export function useMedicament(id: string | undefined): Medicament | undefined {
  return useLiveQuery(() => (id ? db.medicaments.get(id) : undefined), [id]);
}
