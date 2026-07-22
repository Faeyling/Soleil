import { v4 as uuid } from "uuid";
import { db } from "../db";
import { maintenantISO } from "../../lib/date";
import type { Medicament } from "../types";

export async function listerMedicaments(): Promise<Medicament[]> {
  return db.medicaments.orderBy("nom").toArray();
}

export async function obtenirMedicament(id: string): Promise<Medicament | undefined> {
  return db.medicaments.get(id);
}

export async function ajouterMedicament(nom: string): Promise<Medicament> {
  const nomPropre = nom.trim();
  const existant = await db.medicaments
    .filter((m) => m.nom.toLowerCase() === nomPropre.toLowerCase())
    .first();
  if (existant) {
    // Enregistrer une nouvelle prise pour un médicament désactivé le
    // réactive implicitement — sinon la prise fraîchement enregistrée
    // référencerait un médicament resté invisible dans "Mes médicaments".
    if (existant.desactive) {
      await db.medicaments.update(existant.id, { desactive: false });
      return { ...existant, desactive: false };
    }
    return existant;
  }

  const medicament: Medicament = {
    id: uuid(),
    nom: nomPropre,
    createdAt: maintenantISO(),
  };
  await db.medicaments.add(medicament);
  return medicament;
}

export async function renommerMedicament(id: string, nom: string): Promise<void> {
  await db.medicaments.update(id, { nom: nom.trim() });
}

export async function definirStock(
  id: string,
  stock: number | undefined,
  seuilAlerte: number | undefined,
): Promise<void> {
  await db.medicaments.update(id, { stock, seuilAlerte });
}

/** Décrémente le stock d'une unité à chaque prise enregistrée, sans jamais passer sous zéro. */
export async function decrementerStock(id: string): Promise<void> {
  const medicament = await db.medicaments.get(id);
  if (!medicament || medicament.stock == null) return;
  await db.medicaments.update(id, { stock: Math.max(0, medicament.stock - 1) });
}

export async function supprimerMedicament(id: string): Promise<void> {
  await db.medicaments.delete(id);
  // `item` vaut `medicationId` pour les entrées de type medication_intake.
  const prises = await db.entrees
    .where("item")
    .equals(id)
    .filter((e) => e.type === "medication_intake")
    .primaryKeys();
  await db.entrees.bulkDelete(prises);
}

/** Désactive un médicament : disparaît de la liste active et du parcours quotidien, mais reste éditable, réactivable, et son historique de prises reste intact. */
export async function desactiverMedicament(id: string): Promise<void> {
  await db.medicaments.update(id, { desactive: true });
}

export async function reactiverMedicament(id: string): Promise<void> {
  await db.medicaments.update(id, { desactive: false });
}
