import type { Severite } from "./severite";

export const EVA_MIN = 0;
export const EVA_MAX = 10;

/**
 * Convertit une note EVA (0-10, Échelle Visuelle Analogique de la douleur) en
 * niveau de sévérité, pour réutiliser telle quelle toute l'infra existante
 * (couleurs, graphiques, corrélations, badges) fondée sur les 4 niveaux —
 * seuils alignés sur l'interprétation clinique usuelle de l'EVA (léger 1-3,
 * modéré 4-6, sévère 7+, avec un palier "Crise" pour la douleur la plus intense).
 */
export function severiteDepuisEva(eva: number): Severite {
  if (eva <= 2) return "bas";
  if (eva <= 5) return "moyen";
  if (eva <= 7) return "haut";
  return "crise";
}
