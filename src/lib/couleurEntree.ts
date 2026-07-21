import type { Entree } from "../data/types";
import { couleurSeverite } from "./severite";
import { SECTIONS } from "./sections";

export function couleurEntree(entree: Entree): string {
  if ("severity" in entree && entree.severity) {
    return couleurSeverite(entree.severity, entree.item);
  }
  if (entree.type === "medication_intake") {
    return SECTIONS.medicaments.couleur;
  }
  return SECTIONS.suivis.couleur;
}

export function sectionEntree(entree: Entree): keyof typeof SECTIONS {
  if (entree.type === "symptom") return "symptomes";
  if (entree.type === "medication_intake") return "medicaments";
  return "suivis";
}
