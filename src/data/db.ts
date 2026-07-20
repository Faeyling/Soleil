import Dexie, { type Table } from "dexie";
import type { Entree, Medicament, RessourceNote } from "./types";

export class SoleilDatabase extends Dexie {
  entrees!: Table<Entree, string>;
  medicaments!: Table<Medicament, string>;
  ressourcesNotes!: Table<RessourceNote, string>;

  constructor() {
    super("soleil-db");
    this.version(1).stores({
      entrees: "id, type, item, date, [type+item+date], datetime",
      medicaments: "id, nom",
      ressourcesNotes: "id, createdAt",
    });
  }
}

export const db = new SoleilDatabase();
