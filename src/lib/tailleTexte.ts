export type TailleTexte = "normale" | "grande";

const CLE_TAILLE = "soleil-taille-texte";

export function getTailleTextePreference(): TailleTexte {
  return localStorage.getItem(CLE_TAILLE) === "grande" ? "grande" : "normale";
}

function appliquer(taille: TailleTexte): void {
  document.documentElement.setAttribute("data-taille-texte", taille);
}

export function setTailleTextePreference(taille: TailleTexte): void {
  if (taille === "normale") {
    localStorage.removeItem(CLE_TAILLE);
  } else {
    localStorage.setItem(CLE_TAILLE, taille);
  }
  appliquer(taille);
}

/** À appeler une fois au démarrage : applique la préférence de taille de texte déjà enregistrée. */
export function initTailleTexte(): void {
  appliquer(getTailleTextePreference());
}
