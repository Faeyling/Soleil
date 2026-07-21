import { trouverSuivi } from "../content/autresSuivis";

export type Severite = "bas" | "moyen" | "haut" | "crise";

export const SEVERITES: Severite[] = ["bas", "moyen", "haut"];

export const LABEL_SEVERITE: Record<Severite, string> = {
  bas: "Bas",
  moyen: "Moyen",
  haut: "Haut",
  crise: "Crise",
};

/**
 * Libellés spécifiques à certains items, qui remplacent LABEL_SEVERITE pour
 * ce niveau précis — ex. le sommeil utilise "Sévère" plutôt que "Haut" pour
 * décrire une nuit non réparatrice.
 */
const LABELS_PERSONNALISES: Record<string, Partial<Record<Severite, string>>> = {
  sommeil: { haut: "Sévère" },
  "sommeil-suivi": { haut: "Sévère" },
};

/**
 * Texte d'aide affiché sous le sélecteur pour certains items, pour lever
 * toute ambiguïté sur ce que représente chaque niveau.
 */
const DESCRIPTIONS_PERSONNALISEES: Record<string, string> = {
  sommeil: "Bas = sommeil réparateur · Moyen = sommeil acceptable · Sévère = sommeil non réparateur / pas dormi.",
  "sommeil-suivi": "Bas = sommeil réparateur · Moyen = sommeil acceptable · Sévère = sommeil non réparateur / pas dormi.",
};

/** Un suivi à échelle "Oui/Non" plutôt que "Bas/Moyen/Haut" (voir lib/ouinon.ts). */
export function estOuiNon(itemId: string): boolean {
  return trouverSuivi(itemId)?.typeFormulaire === "ouinon";
}

/**
 * Libellé d'un niveau de sévérité, tenant compte du libellé personnalisé de
 * l'item (ex. sommeil), ou de "Oui"/"Non" pour les activités à échelle
 * Oui/Non (voir lib/ouinon.ts — Oui est stocké comme "bas", Non comme "haut").
 */
export function labelSeverite(severite: Severite, itemId?: string): string {
  if (itemId && estOuiNon(itemId)) {
    if (severite === "bas") return "Oui";
    if (severite === "haut") return "Non";
  }
  return (itemId && LABELS_PERSONNALISES[itemId]?.[severite]) || LABEL_SEVERITE[severite];
}

/** Texte d'aide optionnel à afficher sous le sélecteur pour cet item. */
export function descriptionSeverite(itemId?: string): string | undefined {
  return itemId ? DESCRIPTIONS_PERSONNALISEES[itemId] : undefined;
}

/** Vert (léger) → ambre → rouge (sévère) → magenta (crise) : "Haut"/"Sévère"/"Crise" = mauvaise nouvelle, pour tous les items. */
const COULEUR_SEVERITE: Record<Severite, string> = {
  bas: "var(--severite-bas)",
  moyen: "var(--severite-moyen)",
  haut: "var(--severite-haut)",
  crise: "var(--severite-crise)",
};

/**
 * Items dont l'échelle de sévérité propose un 4e niveau "Crise", au-delà de
 * "Haut" — pour l'instant réservé à la Douleur.
 */
export const ITEMS_AVEC_CRISE: ReadonlySet<string> = new Set(["douleur"]);

/** Options de sévérité à proposer pour un item donné (ajoute "Crise" si applicable). */
export function severitesDisponibles(itemId?: string): Severite[] {
  return itemId && ITEMS_AVEC_CRISE.has(itemId) ? [...SEVERITES, "crise"] : SEVERITES;
}

export function couleurSeverite(severite: Severite): string {
  return COULEUR_SEVERITE[severite];
}

export function ordreSeverite(s: Severite): number {
  if (s === "bas") return 1;
  if (s === "moyen") return 2;
  if (s === "haut") return 3;
  return 4;
}
