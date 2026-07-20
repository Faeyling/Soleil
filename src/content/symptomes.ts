export interface SymptomeDef {
  id: string;
  label: string;
  icone: string;
  /** Si vrai, le formulaire propose une sélection d'articulations/zones concernées. */
  localisable?: boolean;
}

// Ordre alphabétique, tel que spécifié.
export const SYMPTOMES: SymptomeDef[] = [
  { id: "douleur-vesicale", label: "Douleur vésicale / difficulté à uriner", icone: "💧" },
  { id: "tension-arterielle", label: "Tension artérielle", icone: "🩺" },
  { id: "bleus", label: "Bleus / ecchymoses", icone: "🟣" },
  { id: "constipation", label: "Constipation", icone: "🌀" },
  { id: "diarrhee", label: "Diarrhée", icone: "🚽" },
  { id: "vertiges", label: "Vertiges", icone: "💫" },
  { id: "fatigue", label: "Fatigue", icone: "🪫" },
  { id: "troubles-digestifs", label: "Troubles digestifs / gastro-intestinaux", icone: "🤢" },
  { id: "frequence-cardiaque", label: "Fréquence cardiaque", icone: "❤️" },
  { id: "urticaire", label: "Urticaire", icone: "🔴" },
  { id: "demangeaisons", label: "Démangeaisons", icone: "✋" },
  { id: "luxation-articulaire", label: "Luxation articulaire", icone: "🦴", localisable: true },
  { id: "subluxation-articulaire", label: "Subluxation articulaire", icone: "🦴", localisable: true },
  { id: "nausees", label: "Nausées", icone: "🤮" },
  { id: "douleur", label: "Douleur", icone: "⚡", localisable: true },
  { id: "sommeil", label: "Sommeil", icone: "🌙" },
  { id: "vomissements", label: "Vomissements", icone: "🤢" },
  { id: "autre-symptome", label: "Autre", icone: "➕" },
];

export function trouverSymptome(id: string): SymptomeDef | undefined {
  return SYMPTOMES.find((s) => s.id === id);
}

export const ARTICULATIONS: { id: string; label: string }[] = [
  { id: "machoire", label: "Mâchoire" },
  { id: "nuque-cervicales", label: "Nuque / cervicales" },
  { id: "epaule-gauche", label: "Épaule gauche" },
  { id: "epaule-droite", label: "Épaule droite" },
  { id: "coude-gauche", label: "Coude gauche" },
  { id: "coude-droit", label: "Coude droit" },
  { id: "poignet-gauche", label: "Poignet gauche" },
  { id: "poignet-droit", label: "Poignet droit" },
  { id: "doigts-gauche", label: "Doigts (main gauche)" },
  { id: "doigts-droit", label: "Doigts (main droite)" },
  { id: "dos", label: "Dos" },
  { id: "hanche-gauche", label: "Hanche gauche" },
  { id: "hanche-droite", label: "Hanche droite" },
  { id: "genou-gauche", label: "Genou gauche" },
  { id: "genou-droit", label: "Genou droit" },
  { id: "cheville-gauche", label: "Cheville gauche" },
  { id: "cheville-droite", label: "Cheville droite" },
  { id: "pied-orteils-gauche", label: "Pied / orteils gauche" },
  { id: "pied-orteils-droit", label: "Pied / orteils droit" },
  { id: "autre-zone", label: "Autre zone" },
];

export function labelArticulation(id: string): string {
  return ARTICULATIONS.find((a) => a.id === id)?.label ?? id;
}
