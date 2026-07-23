import { useSyncExternalStore } from "react";
import type { SymptomeDef } from "../data/types";

export type { SymptomeDef };

// Contenu de départ, semé en base une seule fois au premier lancement (voir
// data/repositories/contenuRepository.ts) — modifiable ensuite par la
// personne qui utilise l'app, voir GererSymptomesPage.
export const SYMPTOMES_PAR_DEFAUT: SymptomeDef[] = [
  { id: "douleur-vesicale", label: "Douleur vésicale / difficulté à uriner", icone: "💧", ordre: 0 },
  { id: "tension-arterielle", label: "Tension artérielle", icone: "🩺", ordre: 1 },
  { id: "bleus", label: "Bleus / ecchymoses", icone: "🟣", ordre: 2 },
  { id: "constipation", label: "Constipation", icone: "🌀", ordre: 3 },
  { id: "diarrhee", label: "Diarrhée", icone: "🚽", ordre: 4 },
  { id: "vertiges", label: "Vertiges", icone: "💫", ordre: 5 },
  { id: "fatigue", label: "Fatigue", icone: "🪫", ordre: 6 },
  { id: "troubles-digestifs", label: "Troubles digestifs / gastro-intestinaux", icone: "🤢", ordre: 7 },
  { id: "frequence-cardiaque", label: "Fréquence cardiaque", icone: "❤️", ordre: 8 },
  { id: "urticaire", label: "Urticaire", icone: "🔴", ordre: 9 },
  { id: "demangeaisons", label: "Démangeaisons", icone: "✋", ordre: 10 },
  {
    id: "luxation-articulaire",
    label: "Luxation articulaire",
    icone: "🦴",
    localisable: true,
    typeFormulaire: "ouinon",
    ordre: 11,
  },
  {
    id: "subluxation-articulaire",
    label: "Subluxation articulaire",
    icone: "🦴",
    localisable: true,
    typeFormulaire: "ouinon",
    ordre: 12,
  },
  { id: "nausees", label: "Nausées", icone: "🤮", ordre: 13 },
  { id: "douleur", label: "Douleur", icone: "⚡", localisable: true, ordre: 14 },
  { id: "sommeil", label: "Sommeil", icone: "🌙", ordre: 15 },
  { id: "vomissements", label: "Vomissements", icone: "🤢", ordre: 16 },
  { id: "autre-symptome", label: "Autre", icone: "➕", typeFormulaire: "texte", ordre: 17 },
];

// Store externe (façon useSyncExternalStore) tenu à jour par un liveQuery sur
// la table `symptomes` — voir data/contenuInit.ts. Permet à `trouverSymptome`
// de rester une fonction synchrone utilisable partout (export PDF/CSV, code
// hors composant), tout en offrant `useSymptomes()` pour les listes réactives.
let symptomes: SymptomeDef[] = SYMPTOMES_PAR_DEFAUT;
const abonnes = new Set<() => void>();

export function definirSymptomes(liste: SymptomeDef[]): void {
  symptomes = [...liste].sort((a, b) => a.ordre - b.ordre);
  for (const f of abonnes) f();
}

function sAbonner(f: () => void): () => void {
  abonnes.add(f);
  return () => abonnes.delete(f);
}

function obtenirEtat(): SymptomeDef[] {
  return symptomes;
}

export function useSymptomes(): SymptomeDef[] {
  return useSyncExternalStore(sAbonner, obtenirEtat);
}

export function trouverSymptome(id: string): SymptomeDef | undefined {
  return symptomes.find((s) => s.id === id);
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
  { id: "ventre", label: "Ventre" },
  { id: "cotes-gauche", label: "Côtes gauche" },
  { id: "cotes-droite", label: "Côtes droite" },
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
