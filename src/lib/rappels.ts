import { dateDuJour } from "./date";
import type { Medicament } from "../data/types";

const CLE_DERNIERE_SAUVEGARDE = "soleil-derniere-sauvegarde";
const CLE_RAPPEL_SAUVEGARDE_MASQUE_JUSQUAU = "soleil-rappel-sauvegarde-masque-jusquau";
const CLE_RAPPEL_PARCOURS_MASQUE_LE = "soleil-rappel-parcours-masque-le";
const CLE_ALERTE_STOCK_MASQUEE_JUSQUAU = "soleil-alerte-stock-masquee-jusquau";
const PREFIXE_RAPPEL_MEDICAMENT_MASQUE_LE = "soleil-rappel-medicament-masque-le-";

const INTERVALLE_RAPPEL_JOURS = 3;

export function marquerSauvegardeExportee(): void {
  localStorage.setItem(CLE_DERNIERE_SAUVEGARDE, new Date().toISOString());
}

/** Nombre de jours écoulés depuis le dernier export JSON, ou `null` si aucun export n'a jamais été fait. */
export function joursDepuisDerniereSauvegarde(): number | null {
  const brut = localStorage.getItem(CLE_DERNIERE_SAUVEGARDE);
  if (!brut) return null;
  const diffMs = Date.now() - new Date(brut).getTime();
  return Math.floor(diffMs / 86_400_000);
}

export function doitRappelerSauvegarde(): boolean {
  const jours = joursDepuisDerniereSauvegarde();
  if (jours === null || jours < INTERVALLE_RAPPEL_JOURS) return false;

  const masqueJusquau = localStorage.getItem(CLE_RAPPEL_SAUVEGARDE_MASQUE_JUSQUAU);
  if (masqueJusquau && new Date() < new Date(masqueJusquau)) return false;

  return true;
}

export function masquerRappelSauvegardePendantQuelquesJours(): void {
  const echeance = new Date();
  echeance.setDate(echeance.getDate() + INTERVALLE_RAPPEL_JOURS);
  localStorage.setItem(CLE_RAPPEL_SAUVEGARDE_MASQUE_JUSQUAU, echeance.toISOString());
}

export function doitRappelerParcoursDuJour(entreesJourVides: boolean): boolean {
  if (!entreesJourVides) return false;
  return localStorage.getItem(CLE_RAPPEL_PARCOURS_MASQUE_LE) !== dateDuJour();
}

export function masquerRappelParcoursAujourdhui(): void {
  localStorage.setItem(CLE_RAPPEL_PARCOURS_MASQUE_LE, dateDuJour());
}

export function doitAlerterStockBas(nombreMedicamentsStockBas: number): boolean {
  if (nombreMedicamentsStockBas === 0) return false;
  const masqueeJusquau = localStorage.getItem(CLE_ALERTE_STOCK_MASQUEE_JUSQUAU);
  if (masqueeJusquau && new Date() < new Date(masqueeJusquau)) return false;
  return true;
}

export function masquerAlerteStockPendantQuelquesJours(): void {
  const echeance = new Date();
  echeance.setDate(echeance.getDate() + INTERVALLE_RAPPEL_JOURS);
  localStorage.setItem(CLE_ALERTE_STOCK_MASQUEE_JUSQUAU, echeance.toISOString());
}

/**
 * Vrai si l'heure de rappel du médicament est passée, qu'aucune prise n'est
 * encore enregistrée aujourd'hui, et que le rappel n'a pas déjà été masqué
 * pour la journée. Vérifié à l'ouverture de l'app — pas une notification
 * système programmée (l'app est 100 % locale, sans serveur pour la déclencher
 * hors ligne).
 */
export function doitRappelerMedicament(
  medicament: Medicament,
  dejaPrisAujourdhui: boolean,
  maintenant = new Date(),
): boolean {
  if (!medicament.heureRappel || medicament.desactive || dejaPrisAujourdhui) return false;
  const [heures, minutes] = medicament.heureRappel.split(":").map(Number);
  const minutesEcoulees = maintenant.getHours() * 60 + maintenant.getMinutes();
  if (minutesEcoulees < heures * 60 + minutes) return false;
  return localStorage.getItem(PREFIXE_RAPPEL_MEDICAMENT_MASQUE_LE + medicament.id) !== dateDuJour();
}

export function medicamentsARappeler(
  medicaments: Medicament[],
  idsDejaPrisAujourdhui: Set<string>,
  maintenant = new Date(),
): Medicament[] {
  return medicaments.filter((m) => doitRappelerMedicament(m, idsDejaPrisAujourdhui.has(m.id), maintenant));
}

export function masquerRappelMedicamentAujourdhui(medicamentId: string): void {
  localStorage.setItem(PREFIXE_RAPPEL_MEDICAMENT_MASQUE_LE + medicamentId, dateDuJour());
}
