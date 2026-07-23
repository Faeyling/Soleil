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
  /** Absent pour un symptôme en saisie "texte" (ex. "Autre") — la description vit alors dans `note`. */
  severity?: Severite;
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
  /** Dose habituelle, éditable à tout moment depuis la fiche du médicament — préremplit (sans l'imposer) la dose à chaque nouvelle prise enregistrée. */
  doseHabituelle?: string;
  /** Position d'affichage dans "Mes médicaments" — absent pour les médicaments créés avant l'ajout du tri manuel (tri alphabétique de repli, voir medicamentsRepository). */
  ordre?: number;
  /** Nombre de prises restantes, si l'utilisateur suit son stock pour ce médicament. */
  stock?: number;
  /** Seuil en dessous duquel une alerte de stock bas est affichée. */
  seuilAlerte?: number;
  /** Si vrai, le médicament est désactivé : il n'apparaît plus dans la liste active ni pour enregistrer une nouvelle prise, mais reste éditable, réactivable, et ses prises déjà enregistrées restent pleinement consultables. */
  desactive?: boolean;
}

export interface MedecinDef {
  id: string;
  nom: string;
  specialite?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  note?: string;
  createdAt: string;
}

export interface RessourceNote {
  id: string;
  titre: string;
  url?: string;
  note?: string;
  createdAt: string;
}

export interface SymptomeDef {
  id: string;
  label: string;
  icone: string;
  /** Si vrai, le formulaire propose une sélection d'articulations/zones concernées. */
  localisable?: boolean;
  /** Échelle de saisie : "severite" (Bas/Moyen/Haut, par défaut), "ouinon" — ex. luxation/subluxation, un événement plutôt qu'une intensité — ou "texte" — description libre, ex. "Autre". */
  typeFormulaire?: "severite" | "ouinon" | "texte";
  /** Si vrai, le symptôme est désactivé : il n'apparaît plus dans la grille "Signaler un symptôme" ni dans le parcours quotidien, mais reste éditable, réactivable, et ses entrées déjà enregistrées restent pleinement consultables. */
  desactive?: boolean;
  /** Position d'affichage dans la grille — les éléments par défaut gardent leur ordre d'origine, les ajouts arrivent en fin de liste. */
  ordre: number;
}

export type TypeFormulaireSuivi = "severite" | "numerique" | "texte" | "ouinon";

export interface SuiviDef {
  id: string;
  label: string;
  icone: string;
  typeFormulaire: TypeFormulaireSuivi;
  unite?: string;
  placeholder?: string;
  /** Si vrai, l'élément n'apparaît pas dans la grille "Activités" — utilisé pour les entrées créées uniquement par un autre écran (ex. la note de fin du parcours quotidien), qui doivent tout de même rester consultables/éditables/supprimables normalement. */
  masque?: boolean;
  /** Si vrai, l'activité est désactivée : elle n'apparaît plus dans la grille "Activités" ni dans le parcours quotidien, mais reste éditable, réactivable, et ses entrées déjà enregistrées restent pleinement consultables (Historique, corrélations...). */
  desactive?: boolean;
  ordre: number;
}
