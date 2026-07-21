import Dexie, { type Table } from "dexie";
import type { Entree, Medicament, RessourceNote } from "./types";

export interface Parametre {
  cle: string;
  valeur: unknown;
}

export class SoleilDatabase extends Dexie {
  entrees!: Table<Entree, string>;
  medicaments!: Table<Medicament, string>;
  ressourcesNotes!: Table<RessourceNote, string>;
  parametres!: Table<Parametre, string>;

  constructor() {
    super("soleil-db");
    this.version(1).stores({
      entrees: "id, type, item, date, [type+item+date], datetime",
      medicaments: "id, nom",
      ressourcesNotes: "id, createdAt",
    });
    // Table additive (clé-valeur) — stocke par ex. le handle de fichier de la
    // sauvegarde automatique. Aucune migration nécessaire : les tables
    // existantes ne changent pas de structure.
    this.version(2).stores({
      parametres: "cle",
    });
  }
}

export const db = new SoleilDatabase();
