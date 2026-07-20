export type Severite = "bas" | "moyen" | "haut";

export const SEVERITES: Severite[] = ["bas", "moyen", "haut"];

export const LABEL_SEVERITE: Record<Severite, string> = {
  bas: "Bas",
  moyen: "Moyen",
  haut: "Haut",
};

export const COULEUR_SEVERITE: Record<Severite, string> = {
  bas: "var(--severite-bas)",
  moyen: "var(--severite-moyen)",
  haut: "var(--severite-haut)",
};

export function ordreSeverite(s: Severite): number {
  return s === "bas" ? 1 : s === "moyen" ? 2 : 3;
}
