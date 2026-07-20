import { db } from "../db";
import type { Entree, Medicament, RessourceNote } from "../types";

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
        db.entrees.bulkAdd(sauvegarde.entrees),
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
