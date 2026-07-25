import { dateDuJour } from "./date";

const CLE_NOM = "soleil-nom-patiente";
const CLE_DATE_NAISSANCE = "soleil-date-naissance-patiente";

/** Nom affiché en en-tête du rapport PDF, pour l'identifier facilement. Reste local à l'appareil (comme le reste des réglages), jamais transmis nulle part par l'app. */
export function getNomPatiente(): string {
  return localStorage.getItem(CLE_NOM) ?? "";
}

export function setNomPatiente(nom: string): void {
  const propre = nom.trim();
  if (propre) {
    localStorage.setItem(CLE_NOM, propre);
  } else {
    localStorage.removeItem(CLE_NOM);
  }
}

/** Date de naissance (YYYY-MM-DD), utilisée pour calculer l'âge affiché en en-tête du rapport PDF. */
export function getDateNaissance(): string {
  return localStorage.getItem(CLE_DATE_NAISSANCE) ?? "";
}

export function setDateNaissance(date: string): void {
  if (date) {
    localStorage.setItem(CLE_DATE_NAISSANCE, date);
  } else {
    localStorage.removeItem(CLE_DATE_NAISSANCE);
  }
}

/** Âge en années révolues à la date de référence (aujourd'hui par défaut), calculé à partir de la date de naissance plutôt que stocké, pour rester juste au fil du temps. */
export function calculerAge(dateNaissance: string, dateReference: string = dateDuJour()): number {
  const [anneeNaissance, moisNaissance, jourNaissance] = dateNaissance.split("-").map(Number);
  const [anneeRef, moisRef, jourRef] = dateReference.split("-").map(Number);
  let age = anneeRef - anneeNaissance;
  if (moisRef - moisNaissance < 0 || (moisRef - moisNaissance === 0 && jourRef - jourNaissance < 0)) {
    age--;
  }
  return age;
}
