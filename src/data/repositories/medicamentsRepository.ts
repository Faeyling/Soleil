import { v4 as uuid } from "uuid";
import { db } from "../db";
import { maintenantISO } from "../../lib/date";
import type { Medicament } from "../types";

/** Trie par `ordre` explicite si présent, sinon alphabétiquement (médicaments créés avant l'ajout du tri manuel). */
function trierParOrdre(medicaments: Medicament[]): Medicament[] {
  return [...medicaments].sort(
    (a, b) => (a.ordre ?? Number.MAX_SAFE_INTEGER) - (b.ordre ?? Number.MAX_SAFE_INTEGER) || a.nom.localeCompare(b.nom, "fr"),
  );
}

export async function listerMedicaments(): Promise<Medicament[]> {
  return trierParOrdre(await db.medicaments.toArray());
}

export async function obtenirMedicament(id: string): Promise<Medicament | undefined> {
  return db.medicaments.get(id);
}

export async function ajouterMedicament(nom: string, doseHabituelle?: string): Promise<Medicament> {
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

  const tous = await db.medicaments.toArray();
  const prochainOrdre = tous.reduce((max, m) => Math.max(max, m.ordre ?? -1), -1) + 1;

  const medicament: Medicament = {
    id: uuid(),
    nom: nomPropre,
    doseHabituelle: doseHabituelle?.trim() || undefined,
    ordre: prochainOrdre,
    createdAt: maintenantISO(),
  };
  await db.medicaments.add(medicament);
  return medicament;
}

/**
 * Échange la position d'un médicament actif avec son voisin. Normalise au
 * passage en `ordre` séquentiel les médicaments actifs qui n'en ont pas
 * encore (créés avant l'ajout du tri manuel, triés alphabétiquement).
 */
export async function deplacerMedicament(id: string, direction: "haut" | "bas"): Promise<void> {
  const actifs = trierParOrdre((await db.medicaments.toArray()).filter((m) => !m.desactive));
  actifs.forEach((m, i) => {
    m.ordre = i;
  });
  const index = actifs.findIndex((m) => m.id === id);
  if (index === -1) return;
  const cible = direction === "haut" ? index - 1 : index + 1;
  if (cible >= 0 && cible < actifs.length) {
    [actifs[index].ordre, actifs[cible].ordre] = [actifs[cible].ordre, actifs[index].ordre];
  }
  await db.medicaments.bulkPut(actifs);
}

export async function renommerMedicament(id: string, nom: string): Promise<void> {
  await db.medicaments.update(id, { nom: nom.trim() });
}

/** Dose habituelle éditable à tout moment depuis la fiche du médicament, indépendamment de toute prise. */
export async function definirDoseHabituelle(id: string, doseHabituelle: string): Promise<void> {
  await db.medicaments.update(id, { doseHabituelle: doseHabituelle.trim() || undefined });
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
