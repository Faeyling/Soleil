export interface RubriqueRessource {
  titre: string;
  texte: string;
}

export const RUBRIQUES_RESSOURCES: RubriqueRessource[] = [
  {
    titre: "Diagnostic en évolution",
    texte:
      "Les critères diagnostiques du SEDh (2017) sont en cours de révision par l'Ehlers-Danlos Society dans le cadre du projet « Road to 2026 ». Une nouvelle classification est attendue en décembre 2026, avec pour objectif de réduire les délais de diagnostic, souvent très longs aujourd'hui.",
  },
  {
    titre: "Recherche génétique",
    texte:
      "La plus grande étude génétique jamais menée sur le SEDh (étude HEDGE, environ 1000 participant·es séquencé·es) a confirmé début 2026 qu'il n'existe pas un gène unique responsable, mais probablement plusieurs variants rares agissant en combinaison. Un gène candidat (KLK15) n'a pas été confirmé comme cause universelle.",
  },
  {
    titre: "Piste de biomarqueur",
    texte:
      "Des travaux récents (2025) explorent un possible biomarqueur sanguin commun au SEDh et aux troubles du spectre de l'hypermobilité (HSD), basé sur un profil de fragmentation de la matrice extracellulaire. Cette piste pourrait à terme faciliter le diagnostic.",
  },
  {
    titre: "Comorbidités étudiées",
    texte:
      "Des études portent sur les liens entre SEDh et troubles cardiovasculaires (dilatation de la racine aortique, tachycardie posturale / POTS), ainsi que sur les délais et erreurs de diagnostic fréquents rencontrés par les personnes concernées.",
  },
];

export interface LienExterne {
  titre: string;
  url: string;
}

export const LIENS_EXTERNES: LienExterne[] = [
  { titre: "The Ehlers-Danlos Society", url: "https://www.ehlers-danlos.com/" },
  { titre: "Road to 2026 — révision des critères diagnostiques", url: "https://www.ehlers-danlos.com/road-to-2026/" },
];

export const AVERTISSEMENT_RESSOURCES =
  "Ce contenu est fourni à titre informatif uniquement, il ne constitue pas un avis médical et ne remplace pas une consultation avec un professionnel de santé. Il est mis à jour périodiquement mais peut ne pas refléter les toutes dernières publications scientifiques.";
