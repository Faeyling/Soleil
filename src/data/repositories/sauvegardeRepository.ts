import { db } from "../db";
import type { Entree, Medicament, RessourceNote } from "../types";
import { TYPES_UNIQUES } from "./entreesRepository";

const VERSION_SAUVEGARDE = 1;

export interface Sauvegarde {
  app: "soleil";
  version: number;
  exporteLe: string;
  entrees: Entree[];
  medicaments: Medicament[];
  ressourcesNotes: RessourceNote[];
}

export async function exporterDonnees(): Promise<Sauvegarde> {
  const [entrees, medicaments, ressourcesNotes] = await Promise.all([
    db.entrees.toArray(),
    db.medicaments.toArray(),
    db.ressourcesNotes.toArray(),
  ]);
  return {
    app: "soleil",
    version: VERSION_SAUVEGARDE,
    exporteLe: new Date().toISOString(),
    entrees,
    medicaments,
    ressourcesNotes,
  };
}

export function telechargerSauvegardeJSON(sauvegarde: Sauvegarde): void {
  const blob = new Blob([JSON.stringify(sauvegarde, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = sauvegarde.exporteLe.slice(0, 10);
  a.href = url;
  a.download = `soleil-sauvegarde-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function estSauvegardeValide(data: unknown): data is Sauvegarde {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    d.app === "soleil" &&
    Array.isArray(d.entrees) &&
    Array.isArray(d.medicaments) &&
    Array.isArray(d.ressourcesNotes)
  );
}

/**
 * Ne garde qu'une entrée par (type, item, date) pour les types soumis à la
 * règle d'unicité quotidienne — en cas de doublon dans le fichier importé
 * (sauvegarde corrompue ou modifiée à la main), on conserve la plus
 * récemment modifiée plutôt que de restaurer des doublons que l'app ne
 * permet jamais de créer normalement.
 */
function dedupliquerEntrees(entrees: Entree[]): Entree[] {
  const dernierParCle = new Map<string, Entree>();
  const autres: Entree[] = [];

  for (const entree of entrees) {
    if (!TYPES_UNIQUES.includes(entree.type)) {
      autres.push(entree);
      continue;
    }
    const cle = `${entree.type}:${entree.item}:${entree.date}`;
    const existante = dernierParCle.get(cle);
    if (!existante || entree.updatedAt > existante.updatedAt) {
      dernierParCle.set(cle, entree);
    }
  }

  return [...autres, ...dernierParCle.values()];
}

/** Remplace toutes les données locales par le contenu de la sauvegarde fournie. */
export async function importerDonnees(sauvegarde: Sauvegarde): Promise<void> {
  await db.transaction(
    "rw",
    [db.entrees, db.medicaments, db.ressourcesNotes],
    async () => {
      await Promise.all([
        db.entrees.clear(),
        db.medicaments.clear(),
        db.ressourcesNotes.clear(),
      ]);
      await Promise.all([
        db.entrees.bulkAdd(dedupliquerEntrees(sauvegarde.entrees)),
        db.medicaments.bulkAdd(sauvegarde.medicaments),
        db.ressourcesNotes.bulkAdd(sauvegarde.ressourcesNotes),
      ]);
    },
  );
}

export async function supprimerToutesLesDonnees(): Promise<void> {
  await db.transaction(
    "rw",
    [db.entrees, db.medicaments, db.ressourcesNotes],
    async () => {
      await Promise.all([
        db.entrees.clear(),
        db.medicaments.clear(),
        db.ressourcesNotes.clear(),
      ]);
    },
  );
}
