const CLE_NOM = "soleil-nom-patiente";

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
