import Dexie, { type Table } from "dexie";
import type { Entree, Medicament, RessourceNote, SymptomeDef, SuiviDef, MedecinDef, Marqueur } from "./types";

export interface Parametre {
  cle: string;
  valeur: unknown;
}

export class SoleilDatabase extends Dexie {
  entrees!: Table<Entree, string>;
  medicaments!: Table<Medicament, string>;
  ressourcesNotes!: Table<RessourceNote, string>;
  parametres!: Table<Parametre, string>;
  symptomes!: Table<SymptomeDef, string>;
  autresSuivis!: Table<SuiviDef, string>;
  medecins!: Table<MedecinDef, string>;
  marqueurs!: Table<Marqueur, string>;

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
    // La liste des symptômes et des "autres suivis" devient éditable : elle
    // vit désormais en base, semée une seule fois avec le contenu par défaut
    // au premier lancement (voir contenuRepository.ts) plutôt que d'être un
    // tableau figé dans le code.
    this.version(3).stores({
      symptomes: "id, ordre",
      autresSuivis: "id, ordre",
    });
    // Carnet d'adresses des médecins (Ressources), indépendant du contenu
    // éditable ci-dessus.
    this.version(4).stores({
      medecins: "id, createdAt",
    });
    // Repères datés (ex. début d'un traitement) affichés sur le graphique
    // d'évolution — en app et dans le rapport PDF.
    this.version(5).stores({
      marqueurs: "id, date",
    });
  }
}

export const db = new SoleilDatabase();
