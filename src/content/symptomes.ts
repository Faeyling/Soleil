import { useSyncExternalStore } from "react";
import type { SymptomeDef, CategorieSymptome } from "../data/types";

export type { SymptomeDef, CategorieSymptome };

// Contenu de départ, semé en base une seule fois au premier lancement (voir
// data/repositories/contenuRepository.ts) — modifiable ensuite par la
// personne qui utilise l'app, voir GererSymptomesPage.
export const SYMPTOMES_PAR_DEFAUT: SymptomeDef[] = [
  { id: "douleur-vesicale", label: "Douleur vésicale / difficulté à uriner", icone: "💧", categorie: "urinaire", ordre: 0 },
  { id: "tension-arterielle", label: "Tension artérielle", icone: "🩺", categorie: "dysautonomie", ordre: 1 },
  { id: "bleus", label: "Bleus / ecchymoses", icone: "🟣", categorie: "cutane", ordre: 2 },
  { id: "constipation", label: "Constipation", icone: "🌀", categorie: "digestif", ordre: 3 },
  { id: "diarrhee", label: "Diarrhée", icone: "🚽", categorie: "digestif", ordre: 4 },
  { id: "vertiges", label: "Vertiges", icone: "💫", categorie: "dysautonomie", ordre: 5 },
  { id: "fatigue", label: "Fatigue", icone: "🪫", categorie: "dysautonomie", ordre: 6 },
  {
    id: "troubles-digestifs",
    label: "Troubles digestifs / gastro-intestinaux",
    icone: "🤢",
    categorie: "digestif",
    ordre: 7,
  },
  { id: "frequence-cardiaque", label: "Fréquence cardiaque", icone: "❤️", categorie: "dysautonomie", ordre: 8 },
  { id: "urticaire", label: "Urticaire", icone: "🔴", categorie: "cutane", ordre: 9 },
  { id: "demangeaisons", label: "Démangeaisons", icone: "✋", categorie: "cutane", ordre: 10 },
  {
    id: "luxation-articulaire",
    label: "Luxation articulaire",
    icone: "🦴",
    localisable: true,
    typeFormulaire: "ouinon",
    categorie: "musculo-squelettique",
    ordre: 11,
  },
  {
    id: "subluxation-articulaire",
    label: "Subluxation articulaire",
    icone: "🦴",
    localisable: true,
    typeFormulaire: "ouinon",
    categorie: "musculo-squelettique",
    ordre: 12,
  },
  { id: "nausees", label: "Nausées", icone: "🤮", categorie: "digestif", ordre: 13 },
  {
    id: "douleur",
    label: "Douleur",
    icone: "⚡",
    localisable: true,
    typeFormulaire: "eva",
    categorie: "musculo-squelettique",
    ordre: 14,
  },
  { id: "sommeil", label: "Sommeil", icone: "🌙", categorie: "sommeil", ordre: 15 },
  { id: "vomissements", label: "Vomissements", icone: "🤢", categorie: "digestif", ordre: 16 },
  { id: "autre-symptome", label: "Autre", icone: "➕", typeFormulaire: "texte", categorie: "autre", ordre: 17 },
];

export const ORDRE_CATEGORIES_SYMPTOME: CategorieSymptome[] = [
  "musculo-squelettique",
  "dysautonomie",
  "digestif",
  "cutane",
  "urinaire",
  "sommeil",
  "autre",
];

export const LABEL_CATEGORIE_SYMPTOME: Record<CategorieSymptome, string> = {
  "musculo-squelettique": "Musculo-squelettique",
  dysautonomie: "Dysautonomie",
  digestif: "Digestif",
  cutane: "Peau & réactions",
  urinaire: "Urinaire",
  sommeil: "Sommeil",
  autre: "Autre",
};

/** Catégorie effective d'un symptôme, "Autre" par défaut si non renseignée (ex. symptôme personnalisé non catégorisé). */
export function categorieSymptome(s: SymptomeDef): CategorieSymptome {
  return s.categorie ?? "autre";
}

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
  { id: "tete-machoire", label: "Tête et mâchoire" },
  { id: "nuque", label: "Nuque" },
  { id: "dos", label: "Dos" },
  { id: "torse", label: "Torse / ventre" },
  { id: "epaule-gauche", label: "Épaule gauche" },
  { id: "epaule-droite", label: "Épaule droite" },
  { id: "bras-gauche", label: "Bras gauche" },
  { id: "bras-droit", label: "Bras droit" },
  { id: "main-gauche", label: "Main gauche" },
  { id: "main-droite", label: "Main droite" },
  { id: "sacro-iliaque", label: "Sacro-iliaque" },
  { id: "hanche-gauche", label: "Hanche gauche" },
  { id: "hanche-droite", label: "Hanche droite" },
  { id: "jambe-gauche", label: "Jambe gauche" },
  { id: "jambe-droite", label: "Jambe droite" },
  { id: "pied-gauche", label: "Pied gauche" },
  { id: "pied-droit", label: "Pied droit" },
  { id: "autre-zone", label: "Autre zone" },
];

export function labelArticulation(id: string): string {
  return ARTICULATIONS.find((a) => a.id === id)?.label ?? id;
}
