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
  /** Association anglophone ou francophone, affiché dans l'interface pour t'aider à choisir. */
  langue: "en" | "fr";
}

export const LIENS_EXTERNES: LienExterne[] = [
  { titre: "The Ehlers-Danlos Society", url: "https://www.ehlers-danlos.com/", langue: "en" },
  {
    titre: "Road to 2026 — révision des critères diagnostiques",
    url: "https://www.ehlers-danlos.com/road-to-2026/",
    langue: "en",
  },
  {
    titre: "AFSED — Association Française des Syndromes d'Ehlers-Danlos",
    url: "https://www.afsed.com/",
    langue: "fr",
  },
];

export const AVERTISSEMENT_RESSOURCES =
  "Ce contenu est fourni à titre informatif uniquement, il ne constitue pas un avis médical et ne remplace pas une consultation avec un professionnel de santé. Il est mis à jour périodiquement mais peut ne pas refléter les toutes dernières publications scientifiques.";

export interface ComposanteBeighton {
  id: string;
  label: string;
}

/** Les 9 manœuvres du score de Beighton, la méthode standard d'évaluation de l'hypermobilité articulaire généralisée. */
export const COMPOSANTES_BEIGHTON: ComposanteBeighton[] = [
  { id: "pouce-gauche", label: "Pouce gauche ramené passivement contre la face interne de l'avant-bras" },
  { id: "pouce-droit", label: "Pouce droit ramené passivement contre la face interne de l'avant-bras" },
  { id: "auriculaire-gauche", label: "Auriculaire gauche : extension passive au-delà de 90°" },
  { id: "auriculaire-droit", label: "Auriculaire droit : extension passive au-delà de 90°" },
  { id: "coude-gauche", label: "Coude gauche : hyperextension au-delà de 10°" },
  { id: "coude-droit", label: "Coude droit : hyperextension au-delà de 10°" },
  { id: "genou-gauche", label: "Genou gauche : hyperextension au-delà de 10°" },
  { id: "genou-droit", label: "Genou droit : hyperextension au-delà de 10°" },
  { id: "mains-au-sol", label: "Mains posées à plat au sol, jambes tendues, sans plier les genoux" },
];

export type TrancheAgeBeighton = "avant-puberte" | "puberte-50-ans" | "plus-de-50-ans";

export const LABEL_TRANCHE_AGE_BEIGHTON: Record<TrancheAgeBeighton, string> = {
  "avant-puberte": "Avant la puberté",
  "puberte-50-ans": "De la puberté à 50 ans",
  "plus-de-50-ans": "Après 50 ans",
};

/** Seuil à partir duquel le score de Beighton est considéré positif, selon l'âge — critère 1 de la classification hEDS 2017. */
export function seuilPositifBeighton(tranche: TrancheAgeBeighton): number {
  if (tranche === "avant-puberte") return 6;
  if (tranche === "puberte-50-ans") return 5;
  return 4;
}

/** Introduction affichée avant les 3 critères diagnostiques du SEDh (classification internationale 2017). */
export const INTRO_CRITERES_HEDS =
  "Le SEDh (type hypermobile) est aujourd'hui un diagnostic clinique : il n'existe pas de test génétique qui le confirme. Selon la classification internationale de 2017, les 3 critères suivants doivent TOUS être remplis. Seul·e un·e professionnel·le de santé peut poser ce diagnostic — cette page t'aide à comprendre la démarche, elle ne la remplace pas.";

export const CRITERES_DIAGNOSTIC_HEDS: RubriqueRessource[] = [
  {
    titre: "Critère 1 — Hypermobilité articulaire généralisée",
    texte:
      "Un score de Beighton supérieur ou égal à un seuil qui dépend de l'âge : 6/9 ou plus avant la puberté, 5/9 ou plus de la puberté à 50 ans, 4/9 ou plus après 50 ans (voir le calculateur ci-dessous).",
  },
  {
    titre: "Critère 2 — Au moins 2 des 3 familles de signes suivantes",
    texte:
      "A. Au moins 5 signes systémiques parmi une liste de 12 évocateurs d'un trouble du tissu conjonctif (peau douce ou veloutée, vergetures inexpliquées, hyperlaxité cutanée légère, cicatrices atrophiques, prolapsus pelvien ou rectal, hernies, arachnodactylie, envergure des bras supérieure à la taille, prolapsus de la valve mitrale, entre autres). B. Un antécédent familial au premier degré (parent, fratrie, enfant) répondant lui-même aux critères du SEDh. C. Des complications musculosquelettiques : douleurs dans au moins 2 membres depuis plus de 3 mois, douleur musculosquelettique quotidienne depuis plus de 3 mois, ou luxations/subluxations récidivantes.",
  },
  {
    titre: "Critère 3 — Exclusions",
    texte:
      "L'absence de fragilité cutanée inhabituelle (qui orienterait vers un autre type de SED), l'exclusion d'autres maladies du tissu conjonctif héréditaires ou acquises, et l'exclusion de diagnostics alternatifs pouvant expliquer l'hypermobilité (troubles neuromusculaires, maladies auto-immunes, entre autres).",
  },
];
