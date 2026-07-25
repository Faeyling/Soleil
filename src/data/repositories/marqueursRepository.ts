import { v4 as uuid } from "uuid";
import { db } from "../db";
import { maintenantISO } from "../../lib/date";
import type { Marqueur } from "../types";

export async function listerMarqueurs(): Promise<Marqueur[]> {
  return db.marqueurs.orderBy("date").toArray();
}

export async function ajouterMarqueur(donnees: Omit<Marqueur, "id" | "createdAt">): Promise<Marqueur> {
  const marqueur: Marqueur = { ...donnees, id: uuid(), createdAt: maintenantISO() };
  await db.marqueurs.add(marqueur);
  return marqueur;
}

export async function supprimerMarqueur(id: string): Promise<void> {
  await db.marqueurs.delete(id);
}
