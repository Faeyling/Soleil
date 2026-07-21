import type { Entree } from "../data/types";

interface EtatToastAnnuler {
  entree: Entree;
  texte: string;
}

const DUREE_AFFICHAGE_MS = 6000;

let etat: EtatToastAnnuler | null = null;
let minuteur: ReturnType<typeof setTimeout> | undefined;
const abonnes = new Set<() => void>();

function notifier(): void {
  for (const f of abonnes) f();
}

/** Affiche le toast "Annuler" pour une entrée qui vient d'être supprimée. */
export function proposerAnnulation(entree: Entree, texte: string): void {
  if (minuteur) clearTimeout(minuteur);
  etat = { entree, texte };
  notifier();
  minuteur = setTimeout(() => {
    etat = null;
    notifier();
  }, DUREE_AFFICHAGE_MS);
}

export function effacerToastAnnulation(): void {
  if (minuteur) clearTimeout(minuteur);
  etat = null;
  notifier();
}

export function sAbonnerToastAnnulation(f: () => void): () => void {
  abonnes.add(f);
  return () => abonnes.delete(f);
}

export function obtenirEtatToastAnnulation(): EtatToastAnnuler | null {
  return etat;
}
