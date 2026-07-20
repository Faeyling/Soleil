import type { Entree } from "../data/types";
import { trouverSymptome } from "../content/symptomes";
import { trouverSuivi } from "../content/autresSuivis";

export const ID_NOTE_JOURNEE = "journal-jour";

export function libelleEntree(entree: Entree): string {
  if (entree.type === "symptom") {
    return trouverSymptome(entree.item)?.label ?? entree.item;
  }
  if (entree.type === "track_something") {
    if (entree.item === ID_NOTE_JOURNEE) return "Note du jour";
    return trouverSuivi(entree.item)?.label ?? entree.item;
  }
  return entree.medicationName;
}

export function iconeEntree(entree: Entree): string {
  if (entree.type === "symptom") {
    return trouverSymptome(entree.item)?.icone ?? "🩹";
  }
  if (entree.type === "track_something") {
    if (entree.item === ID_NOTE_JOURNEE) return "📔";
    return trouverSuivi(entree.item)?.icone ?? "📈";
  }
  return "💊";
}

export function sousTitreEntree(entree: Entree): string | undefined {
  if (entree.type === "medication_intake") {
    return entree.dose ? `Dose : ${entree.dose}` : undefined;
  }
  if (entree.type === "track_something" && entree.value != null) {
    return `${entree.value}${entree.unit ? ` ${entree.unit}` : ""}`;
  }
  return undefined;
}
