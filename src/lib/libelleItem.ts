import type { Medicament } from "../data/types";
import { trouverSuivi } from "../content/autresSuivis";
import { trouverSymptome } from "../content/symptomes";

/** Icône + libellé d'un symptôme, suivi ou médicament, à partir de son id. */
export function libelle(id: string, medicaments: Medicament[]): { label: string; icone: string } {
  const suivi = trouverSuivi(id);
  if (suivi) return { label: suivi.label, icone: suivi.icone };
  const symptome = trouverSymptome(id);
  if (symptome) return { label: symptome.label, icone: symptome.icone };
  const medicament = medicaments.find((m) => m.id === id);
  if (medicament) return { label: medicament.nom, icone: "💊" };
  return { label: id, icone: "•" };
}
