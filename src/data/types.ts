import type { Severite } from "../lib/severite";

export type TypeEntree = "symptom" | "medication_intake" | "track_something";

interface EntreeBase {
  id: string;
  date: string; // YYYY-MM-DD, clé d'unicité avec `item`
  datetime: string; // ISO, horodatage précis
  note?: string;
  important?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EntreeSymptome extends EntreeBase {
  type: "symptom";
  item: string; // slug du symptôme
  severity: Severite;
  location?: string[];
}

export interface EntreeSuivi extends EntreeBase {
  type: "track_something";
  item: string; // slug de l'élément suivi
  severity?: Severite;
  value?: number | null;
  unit?: string;
}

export interface EntreePriseMedicament extends EntreeBase {
  type: "medication_intake";
  item: string; // = medicationId, pas de contrainte d'unicité par jour
  medicationId: string;
  medicationName: string;
  dose?: string;
}

export type Entree = EntreeSymptome | EntreeSuivi | EntreePriseMedicament;

/**
 * `Omit`/`Partial` appliqués directement à `Entree` s'effondrent sur les clés
 * communes aux 3 variantes (perte de `severity`, `location`, `dose`...). Ces
 * variantes distributives préservent chaque membre de l'union.
 */
export type OmitDistributif<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type PartialDistributif<T> = T extends unknown ? Partial<T> : never;

export interface Medicament {
  id: string;
  nom: string;
  createdAt: string;
}

export interface RessourceNote {
  id: string;
  titre: string;
  url?: string;
  note?: string;
  createdAt: string;
}
