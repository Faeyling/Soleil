import { v4 as uuid } from "uuid";
import { db } from "../db";
import { maintenantISO } from "../../lib/date";
import type { MedecinDef } from "../types";

export async function listerMedecins(): Promise<MedecinDef[]> {
  const medecins = await db.medecins.orderBy("createdAt").toArray();
  return medecins.reverse();
}

export async function ajouterMedecin(donnees: Omit<MedecinDef, "id" | "createdAt">): Promise<MedecinDef> {
  const medecin: MedecinDef = { ...donnees, id: uuid(), createdAt: maintenantISO() };
  await db.medecins.add(medecin);
  return medecin;
}

export async function modifierMedecin(
  id: string,
  changements: Partial<Omit<MedecinDef, "id" | "createdAt">>,
): Promise<void> {
  await db.medecins.update(id, changements);
}

export async function supprimerMedecin(id: string): Promise<void> {
  await db.medecins.delete(id);
}
