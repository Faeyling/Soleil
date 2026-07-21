import type { Severite } from "./severite";

/**
 * Les activités "Oui / Non" réutilisent le champ `severity` existant (donc
 * toute l'infra déjà en place — pastilles, graphiques, corrélations, export
 * — fonctionne sans rien y changer) : Oui → "bas" (vert, affirmatif),
 * Non → "haut" (rouge, absence de l'activité).
 */
export function versSeverite(reponse: "oui" | "non"): Severite {
  return reponse === "oui" ? "bas" : "haut";
}

export function depuisSeverite(s: Severite | undefined): "oui" | "non" | undefined {
  if (s === "bas") return "oui";
  if (s === "haut") return "non";
  return undefined;
}
