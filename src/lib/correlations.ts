import type { Entree } from "../data/types";
import { ajouterJours, dateDuJour, joursDepuis } from "./date";
import { ordreSeverite } from "./severite";

export interface ResultatCorrelation {
  nombreJoursAvecActivite: number;
  moyenneJourMemeAvec: number | null;
  moyenneJourMemeSans: number | null;
  moyenneLendemainAvec: number | null;
  moyenneLendemainSans: number | null;
}

function moyenne(valeurs: number[]): number | null {
  if (valeurs.length === 0) return null;
  return valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
}

/**
 * Compare la sévérité moyenne d'un élément suivi (`itemCible`) les jours où
 * une activité (`itemActivite`) a été enregistrée par rapport aux jours sans
 * — le jour même, et le lendemain (utile pour repérer un malaise post-effort,
 * fréquent dans le SEDh : la kiné ou une journée de travail chargée peuvent
 * "coûter" surtout le jour d'après).
 */
export function calculerCorrelation(
  entrees: Entree[],
  itemActivite: string,
  itemCible: string,
  dateDebut: string,
): ResultatCorrelation {
  const severitesParJour = new Map<string, number[]>();
  const joursAvecActivite = new Set<string>();

  for (const e of entrees) {
    if (e.date < dateDebut) continue;
    if (e.item === itemActivite) joursAvecActivite.add(e.date);
    if (e.item === itemCible && "severity" in e && e.severity) {
      const liste = severitesParJour.get(e.date) ?? [];
      liste.push(ordreSeverite(e.severity));
      severitesParJour.set(e.date, liste);
    }
  }

  const severiteDuJour = (date: string): number | undefined => {
    const liste = severitesParJour.get(date);
    if (!liste || liste.length === 0) return undefined;
    return liste.reduce((a, b) => a + b, 0) / liste.length;
  };

  const nbJours = Math.max(
    1,
    Math.round((new Date(dateDuJour()).getTime() - new Date(dateDebut).getTime()) / 86400000) + 1,
  );
  const jours = joursDepuis(nbJours);

  const joursMemeAvec: number[] = [];
  const joursMemeSans: number[] = [];
  const lendemainAvec: number[] = [];
  const lendemainSans: number[] = [];

  for (const jour of jours) {
    const avecActivite = joursAvecActivite.has(jour);

    const sev = severiteDuJour(jour);
    if (sev !== undefined) (avecActivite ? joursMemeAvec : joursMemeSans).push(sev);

    const sevLendemain = severiteDuJour(ajouterJours(jour, 1));
    if (sevLendemain !== undefined) (avecActivite ? lendemainAvec : lendemainSans).push(sevLendemain);
  }

  return {
    nombreJoursAvecActivite: joursAvecActivite.size,
    moyenneJourMemeAvec: moyenne(joursMemeAvec),
    moyenneJourMemeSans: moyenne(joursMemeSans),
    moyenneLendemainAvec: moyenne(lendemainAvec),
    moyenneLendemainSans: moyenne(lendemainSans),
  };
}

export const FENETRE_JOURS_COMPARAISON_MARQUEUR = 14;

export interface ResultatComparaisonMarqueur {
  moyenneAvant: number | null;
  moyenneApres: number | null;
  nombreEntreesAvant: number;
  nombreEntreesApres: number;
}

/**
 * Compare la sévérité moyenne d'un élément suivi (`itemCible`) sur les 14
 * jours avant et après un marqueur daté (ex. "Début Ibuprofène 400mg") — utile
 * pour objectiver l'effet d'un traitement dans le rapport pour le médecin.
 * Le jour du marqueur lui-même compte comme le premier jour "après".
 */
export function calculerComparaisonMarqueur(
  entrees: Entree[],
  itemCible: string,
  dateMarqueur: string,
  fenetreJours = FENETRE_JOURS_COMPARAISON_MARQUEUR,
): ResultatComparaisonMarqueur {
  const debutAvant = ajouterJours(dateMarqueur, -fenetreJours);
  const finApres = ajouterJours(dateMarqueur, fenetreJours - 1);

  const avant: number[] = [];
  const apres: number[] = [];

  for (const e of entrees) {
    if (e.item !== itemCible || !("severity" in e) || !e.severity) continue;
    const niveau = ordreSeverite(e.severity);
    if (e.date >= debutAvant && e.date < dateMarqueur) avant.push(niveau);
    else if (e.date >= dateMarqueur && e.date <= finApres) apres.push(niveau);
  }

  return {
    moyenneAvant: moyenne(avant),
    moyenneApres: moyenne(apres),
    nombreEntreesAvant: avant.length,
    nombreEntreesApres: apres.length,
  };
}
