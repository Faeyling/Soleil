export type Severite = "bas" | "moyen" | "haut" | "crise";

export const SEVERITES: Severite[] = ["bas", "moyen", "haut"];

export const LABEL_SEVERITE: Record<Severite, string> = {
  bas: "Bas",
  moyen: "Moyen",
  haut: "Haut",
  crise: "Crise",
};

/** Vert (léger) → ambre → rouge (sévère) → magenta (crise) : convention générale, "Haut"/"Crise" = mauvaise nouvelle. */
const COULEUR_SEVERITE_NORMALE: Record<Severite, string> = {
  bas: "var(--severite-bas)",
  moyen: "var(--severite-moyen)",
  haut: "var(--severite-haut)",
  crise: "var(--severite-crise)",
};

/**
 * Même échelle, bas/haut inversés : pour les éléments suivis comme une
 * qualité plutôt qu'une sévérité (ex. sommeil — "Haut" = sommeil réparateur =
 * bonne nouvelle, donc vert ; "Bas" = peu/mal dormi = rouge). "Crise" n'existe
 * pas pour ces items (voir `ITEMS_AVEC_CRISE`), la valeur n'est là que pour
 * satisfaire le typage exhaustif du Record.
 */
const COULEUR_SEVERITE_INVERSEE: Record<Severite, string> = {
  bas: "var(--severite-haut)",
  moyen: "var(--severite-moyen)",
  haut: "var(--severite-bas)",
  crise: "var(--severite-crise)",
};

/**
 * Items dont l'échelle Bas/Moyen/Haut représente une qualité ("plus haut =
 * mieux") plutôt qu'une sévérité ("plus haut = pire") — leur code couleur
 * Bas/Haut est donc inversé par rapport à la convention générale.
 */
export const ITEMS_ECHELLE_INVERSEE: ReadonlySet<string> = new Set(["sommeil", "sommeil-suivi"]);

/**
 * Items dont l'échelle de sévérité propose un 4e niveau "Crise", au-delà de
 * "Haut" — pour l'instant réservé à la Douleur.
 */
export const ITEMS_AVEC_CRISE: ReadonlySet<string> = new Set(["douleur"]);

/** Options de sévérité à proposer pour un item donné (ajoute "Crise" si applicable). */
export function severitesDisponibles(itemId?: string): Severite[] {
  return itemId && ITEMS_AVEC_CRISE.has(itemId) ? [...SEVERITES, "crise"] : SEVERITES;
}

/** Couleur d'une sévérité, tenant compte de l'inversion pour certains items (ex. sommeil). */
export function couleurSeverite(severite: Severite, itemId?: string): string {
  const table =
    itemId && ITEMS_ECHELLE_INVERSEE.has(itemId) ? COULEUR_SEVERITE_INVERSEE : COULEUR_SEVERITE_NORMALE;
  return table[severite];
}

export function ordreSeverite(s: Severite): number {
  if (s === "bas") return 1;
  if (s === "moyen") return 2;
  if (s === "haut") return 3;
  return 4;
}
