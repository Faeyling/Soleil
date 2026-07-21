export type Severite = "bas" | "moyen" | "haut";

export const SEVERITES: Severite[] = ["bas", "moyen", "haut"];

export const LABEL_SEVERITE: Record<Severite, string> = {
  bas: "Bas",
  moyen: "Moyen",
  haut: "Haut",
};

/** Vert (léger) → ambre → rouge (sévère) : convention générale, "Haut" = mauvaise nouvelle. */
const COULEUR_SEVERITE_NORMALE: Record<Severite, string> = {
  bas: "var(--severite-bas)",
  moyen: "var(--severite-moyen)",
  haut: "var(--severite-haut)",
};

/**
 * Même trio, bas/haut inversés : pour les éléments suivis comme une qualité
 * plutôt qu'une sévérité (ex. sommeil — "Haut" = sommeil réparateur = bonne
 * nouvelle, donc vert ; "Bas" = peu/mal dormi = rouge).
 */
const COULEUR_SEVERITE_INVERSEE: Record<Severite, string> = {
  bas: "var(--severite-haut)",
  moyen: "var(--severite-moyen)",
  haut: "var(--severite-bas)",
};

/**
 * Items dont l'échelle Bas/Moyen/Haut représente une qualité ("plus haut =
 * mieux") plutôt qu'une sévérité ("plus haut = pire") — leur code couleur
 * Bas/Haut est donc inversé par rapport à la convention générale.
 */
export const ITEMS_ECHELLE_INVERSEE: ReadonlySet<string> = new Set(["sommeil", "sommeil-suivi"]);

/** Couleur d'une sévérité, tenant compte de l'inversion pour certains items (ex. sommeil). */
export function couleurSeverite(severite: Severite, itemId?: string): string {
  const table =
    itemId && ITEMS_ECHELLE_INVERSEE.has(itemId) ? COULEUR_SEVERITE_INVERSEE : COULEUR_SEVERITE_NORMALE;
  return table[severite];
}

export function ordreSeverite(s: Severite): number {
  return s === "bas" ? 1 : s === "moyen" ? 2 : 3;
}
