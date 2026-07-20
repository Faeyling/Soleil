export type TypeFormulaireSuivi = "severite" | "numerique" | "texte";

export interface SuiviDef {
  id: string;
  label: string;
  icone: string;
  typeFormulaire: TypeFormulaireSuivi;
  unite?: string;
  placeholder?: string;
  /** Si vrai, l'élément n'apparaît pas dans la grille "Suivre autre chose" — utilisé pour les entrées créées uniquement par un autre écran (ex. la note de fin du parcours quotidien), qui doivent tout de même rester consultables/éditables/supprimables normalement. */
  masque?: boolean;
}

// Ordre alphabétique, tel que spécifié.
export const AUTRES_SUIVIS: SuiviDef[] = [
  { id: "activite", label: "Activité / exercice", icone: "🚶‍♀️", typeFormulaire: "severite" },
  { id: "selles", label: "Selles", icone: "🌀", typeFormulaire: "severite" },
  { id: "energie", label: "Énergie", icone: "⚡", typeFormulaire: "severite" },
  {
    id: "alimentation",
    label: "Alimentation & boissons",
    icone: "🍽️",
    typeFormulaire: "texte",
    placeholder: "Ex. petit-déjeuner léger, beaucoup d'eau...",
  },
  {
    id: "hydratation",
    label: "Hydratation",
    icone: "🥤",
    typeFormulaire: "numerique",
    unite: "L",
    placeholder: "Ex. 1.5",
  },
  { id: "cycle-menstruel", label: "Cycle menstruel", icone: "🌸", typeFormulaire: "texte", placeholder: "Ex. règles, jour 2..." },
  { id: "humeur", label: "Humeur", icone: "🙂", typeFormulaire: "severite" },
  { id: "episode-douleur", label: "Épisode de douleur", icone: "⚡", typeFormulaire: "severite" },
  { id: "sommeil-suivi", label: "Sommeil", icone: "🌙", typeFormulaire: "severite" },
  { id: "stress", label: "Stress", icone: "🌪️", typeFormulaire: "severite" },
  {
    id: "declencheurs",
    label: "Déclencheurs",
    icone: "🔍",
    typeFormulaire: "texte",
    placeholder: "Ex. station debout prolongée, chaleur...",
  },
  {
    id: "constantes-vitales",
    label: "Constantes vitales",
    icone: "📋",
    typeFormulaire: "texte",
    placeholder: "Ex. TA 110/70, FC 78, temp. 36.8°C",
  },
  { id: "poids", label: "Poids", icone: "⚖️", typeFormulaire: "numerique", unite: "kg", placeholder: "Ex. 62.5" },
  { id: "autre-suivi", label: "Autre", icone: "➕", typeFormulaire: "texte" },
  {
    id: "journal-jour",
    label: "Note du jour",
    icone: "📔",
    typeFormulaire: "texte",
    placeholder: "Comment s'est passée ta journée ?",
    masque: true,
  },
];

export function trouverSuivi(id: string): SuiviDef | undefined {
  return AUTRES_SUIVIS.find((s) => s.id === id);
}
