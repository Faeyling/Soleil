import { useSyncExternalStore } from "react";
import type { SuiviDef, TypeFormulaireSuivi } from "../data/types";

export type { SuiviDef, TypeFormulaireSuivi };

// Contenu de départ, semé en base une seule fois au premier lancement (voir
// data/repositories/contenuRepository.ts) — modifiable ensuite par la
// personne qui utilise l'app, voir GererSuivisPage.
export const AUTRES_SUIVIS_PAR_DEFAUT: SuiviDef[] = [
  { id: "activite", label: "Activité / exercice", icone: "🚶‍♀️", typeFormulaire: "severite", ordre: 0 },
  { id: "danse", label: "Danse", icone: "💃", typeFormulaire: "severite", ordre: 1 },
  { id: "kine", label: "Kinésithérapie", icone: "🧑‍⚕️", typeFormulaire: "severite", ordre: 2 },
  { id: "travail", label: "Travail", icone: "💼", typeFormulaire: "severite", ordre: 3 },
  { id: "selles", label: "Selles", icone: "🌀", typeFormulaire: "severite", ordre: 4 },
  { id: "energie", label: "Énergie", icone: "⚡", typeFormulaire: "severite", ordre: 5 },
  {
    id: "alimentation",
    label: "Alimentation & boissons",
    icone: "🍽️",
    typeFormulaire: "texte",
    placeholder: "Ex. petit-déjeuner léger, beaucoup d'eau...",
    ordre: 6,
  },
  {
    id: "hydratation",
    label: "Hydratation",
    icone: "🥤",
    typeFormulaire: "numerique",
    unite: "L",
    placeholder: "Ex. 1.5",
    ordre: 7,
  },
  {
    id: "cycle-menstruel",
    label: "Cycle menstruel",
    icone: "🌸",
    typeFormulaire: "texte",
    placeholder: "Ex. règles, jour 2...",
    ordre: 8,
  },
  { id: "humeur", label: "Humeur", icone: "🙂", typeFormulaire: "severite", ordre: 9 },
  { id: "episode-douleur", label: "Épisode de douleur", icone: "⚡", typeFormulaire: "severite", ordre: 10 },
  { id: "sommeil-suivi", label: "Sommeil", icone: "🌙", typeFormulaire: "severite", ordre: 11 },
  { id: "stress", label: "Stress", icone: "🌪️", typeFormulaire: "severite", ordre: 12 },
  {
    id: "declencheurs",
    label: "Déclencheurs",
    icone: "🔍",
    typeFormulaire: "texte",
    placeholder: "Ex. station debout prolongée, chaleur...",
    ordre: 13,
  },
  {
    id: "constantes-vitales",
    label: "Constantes vitales",
    icone: "📋",
    typeFormulaire: "texte",
    placeholder: "Ex. TA 110/70, FC 78, temp. 36.8°C",
    ordre: 14,
  },
  { id: "poids", label: "Poids", icone: "⚖️", typeFormulaire: "numerique", unite: "kg", placeholder: "Ex. 62.5", ordre: 15 },
  { id: "autre-suivi", label: "Autre", icone: "➕", typeFormulaire: "texte", ordre: 16 },
  {
    id: "journal-jour",
    label: "Note du jour",
    icone: "📔",
    typeFormulaire: "texte",
    placeholder: "Comment s'est passée ta journée ?",
    masque: true,
    ordre: 17,
  },
];

// Voir le commentaire équivalent dans content/symptomes.ts.
let suivis: SuiviDef[] = AUTRES_SUIVIS_PAR_DEFAUT;
const abonnes = new Set<() => void>();

export function definirSuivis(liste: SuiviDef[]): void {
  suivis = [...liste].sort((a, b) => a.ordre - b.ordre);
  for (const f of abonnes) f();
}

function sAbonner(f: () => void): () => void {
  abonnes.add(f);
  return () => abonnes.delete(f);
}

function obtenirEtat(): SuiviDef[] {
  return suivis;
}

export function useSuivis(): SuiviDef[] {
  return useSyncExternalStore(sAbonner, obtenirEtat);
}

export function trouverSuivi(id: string): SuiviDef | undefined {
  return suivis.find((s) => s.id === id);
}
