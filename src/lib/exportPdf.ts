import { jsPDF } from "jspdf";
import type { Entree, EntreeSymptome, Medicament, Marqueur } from "../data/types";
import { labelSeverite, ordreSeverite, LABEL_SEVERITE, type Severite } from "./severite";
import { libelleEntree } from "./libelleEntree";
import { labelArticulation, trouverSymptome } from "../content/symptomes";
import { formatDateLisible, joursEntre } from "./date";
import type { EvaluationBeighton } from "../data/repositories/beightonRepository";
import { LABEL_TRANCHE_AGE_BEIGHTON, seuilPositifBeighton } from "../content/ressources";
import { medicamentsStockBas } from "./stock";
import { calculerAge } from "./profilPatiente";
import { severiteDepuisEva } from "./eva";

export interface OptionsExportPDF {
  inclureSymptomes: boolean;
  inclureMedicaments: boolean;
  inclureEvenements: boolean;
  inclureNotesImportantes: boolean;
  /** Inclut un graphique d'évolution — voir `itemsGraphiques` pour choisir les courbes affichées. */
  inclureGraphiques: boolean;
  /** Clés `"type:item"` des éléments à tracer sur le graphique (ex. "symptom:douleur"). */
  itemsGraphiques: string[];
  /** Dernier score de Beighton enregistré (Ressources), s'il existe. */
  inclureBeighton: boolean;
  dateDebut: string;
  dateFin: string;
  /** Affiché en en-tête du rapport pour l'identifier facilement (Profil). */
  nomPatiente?: string;
  /** Date de naissance (YYYY-MM-DD) — affichée en en-tête avec l'âge calculé, si renseignée (Profil). */
  dateNaissance?: string;
  evaluationBeighton?: EvaluationBeighton;
  /** Repères datés (ex. début d'un traitement) affichés comme lignes verticales sur le graphique. */
  marqueurs?: Marqueur[];
}

const COULEUR_TITRE: [number, number, number] = [169, 86, 58];
const COULEUR_TEXTE: [number, number, number] = [58, 46, 38];
const COULEUR_DOUX: [number, number, number] = [107, 90, 78];
const COULEUR_FOND_DOUCE: [number, number, number] = [244, 235, 224];
const COULEUR_TRAIT_SILHOUETTE: [number, number, number] = [214, 199, 181];

/** Palette fixe pour les courbes du PDF — indépendante du thème CSS de l'appli (non disponible dans un module hors composant). */
const PALETTE_GRAPHIQUE: [number, number, number][] = [
  [193, 83, 43], // terracotta
  [98, 55, 140], // rose/mauve foncé
  [178, 91, 15], // ocre
  [97, 126, 54], // sauge
  [168, 99, 55], // caramel
  [47, 62, 82], // marine
];

/** Dégradé du plus fréquent (rang 1, rouge soutenu) au moins fréquent (rang 6, pêche pâle) pour les 6 zones les plus douloureuses. */
const GRADIENT_ZONES: [number, number, number][] = [
  [163, 44, 34],
  [193, 68, 43],
  [214, 100, 60],
  [230, 140, 95],
  [240, 175, 140],
  [247, 205, 180],
];

/** Mêmes teintes que l'appli (--color-severite-*, thème clair) — indépendantes du thème CSS, non disponible hors composant. */
const COULEUR_SEVERITE_PDF: Record<Severite, [number, number, number]> = {
  bas: [165, 195, 117],
  moyen: [242, 166, 99],
  haut: [182, 0, 0],
  crise: [132, 184, 217],
};

interface Swatch {
  label: string;
  couleur: [number, number, number];
}

/** Calcule la position (relative) de chaque pastille colorée + étiquette, en repassant à la ligne quand la largeur disponible est dépassée — partagé entre la mesure (pagination) et le tracé pour rester cohérent. */
function disposerSwatches(doc: jsPDF, largeur: number, items: Swatch[]): { item: Swatch; x: number; y: number }[] {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const rayon = 3.5;
  const hauteurLigne = 15;
  let xx = 0;
  let yy = 0;
  const positions: { item: Swatch; x: number; y: number }[] = [];
  for (const item of items) {
    const largeurItem = rayon * 2 + 4 + doc.getTextWidth(item.label) + 14;
    if (xx > 0 && xx + largeurItem > largeur) {
      xx = 0;
      yy += hauteurLigne;
    }
    positions.push({ item, x: xx, y: yy });
    xx += largeurItem;
  }
  return positions;
}

function hauteurSwatches(doc: jsPDF, largeur: number, items: Swatch[]): number {
  const positions = disposerSwatches(doc, largeur, items);
  const maxY = positions.length > 0 ? Math.max(...positions.map((p) => p.y)) : 0;
  return maxY + 15 + 4;
}

/** Pastille colorée (sévérité) + étiquette, en ligne(s) — plus parlant qu'un simple décompte texte pour repérer d'un coup d'œil les niveaux préoccupants. */
function dessinerSwatches(doc: jsPDF, x: number, y: number, largeur: number, items: Swatch[]): number {
  const positions = disposerSwatches(doc, largeur, items);
  const rayon = 3.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  for (const { item, x: dx, y: dy } of positions) {
    doc.setFillColor(...item.couleur);
    doc.circle(x + dx + rayon, y + dy - 3, rayon, "F");
    doc.setTextColor(...COULEUR_TEXTE);
    doc.text(item.label, x + dx + rayon * 2 + 4, y + dy);
  }
  const maxY = positions.length > 0 ? Math.max(...positions.map((p) => p.y)) : 0;
  return y + maxY + 15;
}

/**
 * Bloc de contenu positionnable dans une colonne : `hauteur` sert à la
 * pagination (calculée à l'avance, avant de savoir sur quelle page le bloc
 * tombera), `dessiner` fait le tracé réel une fois la page connue et renvoie
 * la position Y suivante.
 */
interface Bloc {
  hauteur: number;
  dessiner: (x: number, y: number, largeur: number) => number;
}

interface Colonne {
  largeur: number;
  blocs: Bloc[];
  titre(texte: string): void;
  sousTitre(texte: string): void;
  paragraphe(texte: string, taille?: number, couleur?: [number, number, number]): void;
  ajouter(hauteur: number, dessiner: Bloc["dessiner"]): void;
}

/** Construit une colonne : le contenu est mis en file d'attente (mesuré) plutôt que dessiné immédiatement, pour calculer la pagination avant de savoir où chaque bloc tombera. */
function creerColonne(doc: jsPDF, largeur: number): Colonne {
  const blocs: Bloc[] = [];
  const ajouter: Colonne["ajouter"] = (hauteur, dessiner) => {
    blocs.push({ hauteur, dessiner });
  };

  const titre: Colonne["titre"] = (texte) => {
    ajouter(30, (x, y, l) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(...COULEUR_TITRE);
      doc.text(texte, x, y);
      const yLigne = y + 10;
      doc.setDrawColor(...COULEUR_TITRE);
      doc.setLineWidth(1);
      doc.line(x, yLigne, x + l, yLigne);
      return yLigne + 20;
    });
  };

  const sousTitre: Colonne["sousTitre"] = (texte) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    const lignes = doc.splitTextToSize(texte, largeur);
    ajouter(lignes.length * 14 + 6, (x, y) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(...COULEUR_TEXTE);
      doc.text(lignes, x, y);
      return y + lignes.length * 14 + 6;
    });
  };

  const paragraphe: Colonne["paragraphe"] = (texte, taille = 10, couleur = COULEUR_TEXTE) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(taille);
    const lignes = doc.splitTextToSize(texte, largeur);
    ajouter(lignes.length * (taille + 3) + 6, (x, y) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(taille);
      doc.setTextColor(...couleur);
      doc.text(lignes, x, y);
      return y + lignes.length * (taille + 3) + 6;
    });
  };

  return { largeur, blocs, titre, sousTitre, paragraphe, ajouter };
}

/** Attribue à chaque bloc un numéro de page : la 1re page dispose de moins de hauteur (en-tête déjà écrit au-dessus), les suivantes repartent du haut. */
function assignerPages(blocs: Bloc[], hauteurPage1: number, hauteurAutresPages: number): number[] {
  const pages: number[] = [];
  let page = 1;
  let hauteurUtilisee = 0;
  for (const bloc of blocs) {
    const budget = page === 1 ? hauteurPage1 : hauteurAutresPages;
    if (hauteurUtilisee > 0 && hauteurUtilisee + bloc.hauteur > budget) {
      page += 1;
      hauteurUtilisee = 0;
    }
    pages.push(page);
    hauteurUtilisee += bloc.hauteur;
  }
  return pages;
}

/** Dessine le graphique d'évolution (courbes de sévérité par jour) dans l'espace fourni, et renvoie la position Y après le graphique — sans gérer lui-même les sauts de page (délégué à `assignerPages`). */
function dessinerGraphique(
  doc: jsPDF,
  entreesPeriode: Entree[],
  items: { type: string; itemId: string; label: string }[],
  x: number,
  largeur: number,
  yDepart: number,
  jours: string[],
  marqueurs: Marqueur[],
): number {
  let y = yDepart;
  const hauteurGraphe = 110;
  const margeAxe = 34;
  const largeurGraphe = largeur - margeAxe;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COULEUR_TITRE);
  doc.text("Évolution dans le temps", x, y);
  y += 8;
  doc.setDrawColor(...COULEUR_TITRE);
  doc.setLineWidth(1);
  doc.line(x, y, x + largeur, y);
  y += 20;

  const xGraphe = x + margeAxe;
  const yBas = y + hauteurGraphe;

  const NOMS_NIVEAUX: Severite[] = ["bas", "moyen", "haut", "crise"];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COULEUR_DOUX);
  doc.setDrawColor(220, 205, 185);
  doc.setLineWidth(0.5);
  for (let niveau = 1; niveau <= 4; niveau++) {
    const yLigne = yBas - ((niveau - 1) / 3) * hauteurGraphe;
    doc.line(xGraphe, yLigne, xGraphe + largeurGraphe, yLigne);
    doc.text(LABEL_SEVERITE[NOMS_NIVEAUX[niveau - 1]], x, yLigne + 3);
  }

  const xPourJour = (index: number) =>
    xGraphe + (jours.length === 1 ? 0 : (index / (jours.length - 1)) * largeurGraphe);
  const yPourNiveau = (niveau: number) => yBas - ((niveau - 1) / 3) * hauteurGraphe;

  const marqueursAffiches = marqueurs.filter((m) => jours.includes(m.date));
  if (marqueursAffiches.length > 0) {
    doc.setDrawColor(140, 110, 90);
    doc.setLineWidth(0.8);
    doc.setLineDashPattern([2, 2], 0);
    for (const marqueur of marqueursAffiches) {
      const xM = xPourJour(jours.indexOf(marqueur.date));
      doc.line(xM, y, xM, yBas);
    }
    doc.setLineDashPattern([], 0);
  }

  items.forEach((item, indexItem) => {
    const couleur = PALETTE_GRAPHIQUE[indexItem % PALETTE_GRAPHIQUE.length];
    doc.setDrawColor(...couleur);
    doc.setFillColor(...couleur);
    doc.setLineWidth(1.2);

    let dernierPoint: { x: number; y: number } | undefined;
    jours.forEach((jour, indexJour) => {
      const entree = entreesPeriode.find(
        (e) => e.type === item.type && e.item === item.itemId && e.date === jour,
      );
      if (!entree || !("severity" in entree) || !entree.severity) {
        dernierPoint = undefined;
        return;
      }
      const xP = xPourJour(indexJour);
      const yPoint = yPourNiveau(ordreSeverite(entree.severity));
      if (dernierPoint) doc.line(dernierPoint.x, dernierPoint.y, xP, yPoint);
      doc.circle(xP, yPoint, 1.4, "F");
      dernierPoint = { x: xP, y: yPoint };
    });
  });

  doc.setFontSize(7.5);
  doc.setTextColor(...COULEUR_DOUX);
  doc.text(formatDateLisible(jours[0]), xGraphe, yBas + 12);
  doc.text(formatDateLisible(jours[jours.length - 1]), xGraphe + largeurGraphe, yBas + 12, { align: "right" });

  y = yBas + 26;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const colonnesLegende = Math.max(1, Math.floor(largeur / 90));
  let xLegende = x;
  let yLegende = y;
  const largeurColonneLegende = largeur / colonnesLegende;
  items.forEach((item, index) => {
    if (index > 0 && index % colonnesLegende === 0) {
      yLegende += 13;
      xLegende = x;
    }
    const couleur = PALETTE_GRAPHIQUE[index % PALETTE_GRAPHIQUE.length];
    doc.setFillColor(...couleur);
    doc.circle(xLegende + 3, yLegende - 3, 3, "F");
    doc.setTextColor(...COULEUR_TEXTE);
    doc.text(item.label, xLegende + 10, yLegende);
    xLegende += largeurColonneLegende;
  });

  y = yLegende + 18;

  if (marqueursAffiches.length > 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(...COULEUR_DOUX);
    const texteMarqueurs =
      "Marqueurs : " + marqueursAffiches.map((m) => `${m.label} (${formatDateLisible(m.date)})`).join(" · ");
    const lignes = doc.splitTextToSize(texteMarqueurs, largeur);
    doc.text(lignes, x, y);
    y += lignes.length * 10 + 4;
  }

  return y + 4;
}

/** Estime la hauteur qu'occupera `dessinerGraphique` — doit rester cohérente avec son tracé réel ci-dessus. */
function hauteurGraphique(nbItems: number, largeur: number, nbMarqueurs: number): number {
  const colonnesLegende = Math.max(1, Math.floor(largeur / 90));
  return 110 + 28 + 26 + Math.ceil(nbItems / colonnesLegende) * 13 + 18 + (nbMarqueurs > 0 ? 18 : 0) + 8;
}

/**
 * Repères (coordonnées locales, échelle ~1 unité = 1pt) de la mini-silhouette
 * combinée face/dos du rapport — contrairement au schéma interactif de
 * l'app (2 vues séparées), tout tient sur un seul dessin compact ; les
 * zones normalement visibles de dos (nuque, dos, sacro-iliaque) sont donc
 * approximées le long de l'axe central plutôt que positionnées anatomiquement.
 */
const POSITIONS_SILHOUETTE_PDF: Record<string, { x: number; y: number }> = {
  "tete-machoire": { x: 50, y: 14 },
  nuque: { x: 50, y: 27 },
  "epaule-droite": { x: 30, y: 34 },
  "epaule-gauche": { x: 70, y: 34 },
  dos: { x: 50, y: 55 },
  torse: { x: 50, y: 72 },
  "main-droite": { x: 10, y: 100 },
  "main-gauche": { x: 90, y: 100 },
  "sacro-iliaque": { x: 50, y: 92 },
  "hanche-droite": { x: 38, y: 95 },
  "hanche-gauche": { x: 62, y: 95 },
  "pied-droit": { x: 38, y: 182 },
  "pied-gauche": { x: 62, y: 182 },
};

const TRACES_SILHOUETTE_PDF: Record<string, [number, number][]> = {
  "bras-droit": [[30, 34], [21, 64], [14, 96]],
  "bras-gauche": [[70, 34], [79, 64], [86, 96]],
  "jambe-droite": [[38, 95], [39, 135], [40, 170]],
  "jambe-gauche": [[62, 95], [61, 135], [60, 170]],
};

const LARGEUR_SILHOUETTE = 100;
const HAUTEUR_SILHOUETTE = 192;

/** Contour plus saturé (assombri) que le remplissage, pour que la zone colorée se détache nettement de la silhouette neutre. */
function assombrir(couleur: [number, number, number], facteur: number): [number, number, number] {
  return [couleur[0] * (1 - facteur), couleur[1] * (1 - facteur), couleur[2] * (1 - facteur)];
}

/** Dessine la mini-silhouette avec les zones les plus fréquentes coloriées selon leur rang, centrée dans l'espace fourni, et renvoie la position Y suivante. */
function dessinerSilhouetteMini(
  doc: jsPDF,
  x: number,
  y: number,
  largeur: number,
  topZones: { zoneId: string; rang: number }[],
): number {
  const echelle = Math.min(1, largeur / LARGEUR_SILHOUETTE);
  const xC = x + (largeur - LARGEUR_SILHOUETTE * echelle) / 2;
  const versX = (lx: number) => xC + lx * echelle;
  const versY = (ly: number) => y + ly * echelle;
  const rangParZone = new Map(topZones.map((z) => [z.zoneId, z.rang]));

  // Silhouette de base (repère neutre) : torse + membres, sans les détails du bonhomme complet de l'app — juste assez pour situer les zones colorées.
  doc.setDrawColor(...COULEUR_TRAIT_SILHOUETTE);
  doc.setFillColor(...COULEUR_FOND_DOUCE);
  doc.setLineWidth(1);
  doc.circle(versX(50), versY(14), 10 * echelle, "FD");
  doc.roundedRect(versX(32), versY(30), 36 * echelle, 65 * echelle, 6 * echelle, 6 * echelle, "FD");
  for (const trace of Object.values(TRACES_SILHOUETTE_PDF)) {
    doc.setLineWidth(6 * echelle);
    for (let i = 0; i < trace.length - 1; i++) {
      doc.line(versX(trace[i][0]), versY(trace[i][1]), versX(trace[i + 1][0]), versY(trace[i + 1][1]));
    }
  }
  doc.setLineWidth(9 * echelle);
  doc.line(versX(38), versY(95), versX(39), versY(135));
  doc.line(versX(39), versY(135), versX(40), versY(170));
  doc.line(versX(62), versY(95), versX(61), versY(135));
  doc.line(versX(61), versY(135), versX(60), versY(170));

  // Membres colorés (bras/jambe) : redessine par-dessus la ligne neutre pour les zones classées —
  // un trait large et plus sombre (contour) suivi d'un trait plus étroit et saturé (remplissage)
  // simule un contour net autour de toute la zone, plutôt qu'un simple filet fin.
  for (const [zoneId, trace] of Object.entries(TRACES_SILHOUETTE_PDF)) {
    const rang = rangParZone.get(zoneId);
    if (rang === undefined) continue;
    const couleur = GRADIENT_ZONES[rang];
    doc.setDrawColor(...assombrir(couleur, 0.35));
    doc.setLineWidth(9 * echelle);
    for (let i = 0; i < trace.length - 1; i++) {
      doc.line(versX(trace[i][0]), versY(trace[i][1]), versX(trace[i + 1][0]), versY(trace[i + 1][1]));
    }
    doc.setDrawColor(...couleur);
    doc.setLineWidth(7 * echelle);
    for (let i = 0; i < trace.length - 1; i++) {
      doc.line(versX(trace[i][0]), versY(trace[i][1]), versX(trace[i + 1][0]), versY(trace[i + 1][1]));
    }
  }

  // Points (tête, épaules, mains, hanches, pieds, torse, dos, nuque, sacro-iliaque).
  for (const [zoneId, point] of Object.entries(POSITIONS_SILHOUETTE_PDF)) {
    const rang = rangParZone.get(zoneId);
    const rayon = (zoneId === "torse" || zoneId === "dos" ? 8 : 5.5) * echelle;
    const couleur = rang !== undefined ? GRADIENT_ZONES[rang] : undefined;
    doc.setDrawColor(...(couleur ? assombrir(couleur, 0.35) : COULEUR_TRAIT_SILHOUETTE));
    doc.setFillColor(...(couleur ?? COULEUR_FOND_DOUCE));
    doc.setLineWidth(couleur ? 2 : 1.2);
    doc.circle(versX(point.x), versY(point.y), rayon, "FD");
  }

  return y + HAUTEUR_SILHOUETTE * echelle + 8;
}

/** Barres classées (label + barre de fréquence colorée + %) sous la silhouette, pour le détail chiffré exact. */
function dessinerBarresZones(
  doc: jsPDF,
  x: number,
  y: number,
  largeur: number,
  topZones: { zoneId: string; pct: number; rang: number }[],
): number {
  const largeurLabel = Math.min(95, largeur * 0.4);
  const largeurBarreMax = largeur - largeurLabel - 32;
  let yy = y;
  for (const zone of topZones) {
    const couleur = GRADIENT_ZONES[zone.rang];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COULEUR_TEXTE);
    doc.text(labelArticulation(zone.zoneId), x, yy + 6.5, { maxWidth: largeurLabel - 4 });
    doc.setFillColor(...COULEUR_FOND_DOUCE);
    doc.roundedRect(x + largeurLabel, yy, largeurBarreMax, 8, 2, 2, "F");
    doc.setFillColor(...couleur);
    doc.roundedRect(x + largeurLabel, yy, Math.max(4, (zone.pct / 100) * largeurBarreMax), 8, 2, 2, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(...COULEUR_DOUX);
    doc.text(`${zone.pct}%`, x + largeurLabel + largeurBarreMax + 6, yy + 7);
    yy += 19;
  }
  return yy + 4;
}

/** Fréquence des zones marquées "les plus douloureuses de la journée" sur la période (top 6, triées par occurrence décroissante). */
function zonesPlusDouloureusesFrequentes(
  entreesPeriode: Entree[],
  joursPeriode: string[],
): { zoneId: string; count: number; pct: number; rang: number }[] {
  const compte = new Map<string, number>();
  for (const e of entreesPeriode) {
    if (e.type !== "symptom") continue;
    for (const zone of e.zonesPlusDouloureuses ?? []) {
      compte.set(zone, (compte.get(zone) ?? 0) + 1);
    }
  }
  const total = joursPeriode.length || 1;
  return [...compte.entries()]
    .map(([zoneId, count]) => ({ zoneId, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((z, i) => ({ ...z, rang: i }));
}

/**
 * Le rapport répond à des questions précises plutôt que d'exposer toutes
 * les statistiques calculables :
 *  - Ça arrive souvent ? → pourcentageJours
 *  - À quel point c'est grave quand c'est grave ? → pourcentageJoursForts
 *    (jours "haut"/"crise", quel que soit le type de saisie — l'EVA dérive
 *    déjà une sévérité automatiquement, donc ce calcul reste uniforme)
 *  - Ça s'aggrave, s'améliore, ou stable ? → calculerTendance (1re moitié
 *    de la période comparée à la 2e — plus lisible qu'une liste mois par
 *    mois qu'il faudrait décoder à la main). Suit la proportion de jours
 *    "forts" quand il y en a eu au moins un sur la période — un symptôme
 *    déjà signalé tous les jours ne peut plus devenir "plus fréquent", donc
 *    la fréquence brute ne dirait jamais qu'il s'aggrave alors que sa
 *    sévérité peut grimper ; sans jour fort du tout, retombe sur la
 *    fréquence, seul signal disponible pour un symptôme resté léger.
 */
function pourcentageJours(dates: Set<string>, joursPeriode: string[]): number {
  return joursPeriode.length > 0 ? Math.round((dates.size / joursPeriode.length) * 100) : 0;
}

function datesJoursForts(liste: Entree[]): Set<string> {
  return new Set(
    liste.filter((e) => "severity" in e && (e.severity === "haut" || e.severity === "crise")).map((e) => e.date),
  );
}

type Tendance = "hausse" | "stable" | "baisse";

/** Écart minimal de 15 points entre les deux moitiés pour ignorer le bruit sur de petits effectifs. */
function calculerTendance(dates: Set<string>, datesFortes: Set<string>, joursPeriode: string[]): Tendance {
  if (joursPeriode.length < 4) return "stable";
  const ensembleSuivi = datesFortes.size > 0 ? datesFortes : dates;
  const milieu = Math.floor(joursPeriode.length / 2);
  const pct = (jours: string[]) =>
    jours.length > 0 ? (jours.filter((j) => ensembleSuivi.has(j)).length / jours.length) * 100 : 0;
  const delta = pct(joursPeriode.slice(milieu)) - pct(joursPeriode.slice(0, milieu));
  if (delta >= 15) return "hausse";
  if (delta <= -15) return "baisse";
  return "stable";
}

const TENDANCE_INFO: Record<Tendance, { label: string; couleur: [number, number, number] }> = {
  hausse: { label: "en hausse", couleur: COULEUR_SEVERITE_PDF.haut },
  stable: { label: "stable", couleur: COULEUR_DOUX },
  baisse: { label: "en baisse", couleur: COULEUR_SEVERITE_PDF.bas },
};

export function genererRapportPDF(
  entrees: Entree[],
  medicaments: Medicament[],
  options: OptionsExportPDF,
): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margeGauche = 48;
  const margeBas = 48;
  let y = 56;
  const largeurPage = doc.internal.pageSize.getWidth();
  const hauteurPage = doc.internal.pageSize.getHeight();
  const largeurUtile = largeurPage - margeGauche * 2;

  const entreesPeriode = entrees.filter(
    (e) => e.date >= options.dateDebut && e.date <= options.dateFin,
  );

  // La période "Tout" démarre à une date arbitraire lointaine (voir
  // dateDebutPeriode) — sans ce recadrage, les statistiques en % et le
  // détail par mois seraient dilués sur des milliers de jours sans aucune
  // donnée (ex. avant même la création de l'app), rendant les pourcentages
  // trompeurs et gonflant le rapport de dizaines de pages vides.
  const premiereDateAvecDonnees = entreesPeriode.reduce<string | undefined>(
    (min, e) => (min === undefined || e.date < min ? e.date : min),
    undefined,
  );
  const dateDebutEffective =
    premiereDateAvecDonnees && premiereDateAvecDonnees > options.dateDebut
      ? premiereDateAvecDonnees
      : options.dateDebut;

  // En-tête du document (pleine largeur, page 1 uniquement).
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...COULEUR_TITRE);
  doc.text("Soleil — Suivi", margeGauche, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...COULEUR_DOUX);
  if (options.nomPatiente?.trim()) {
    doc.text(options.nomPatiente.trim(), margeGauche, y);
    y += 14;
  }
  if (options.dateNaissance?.trim()) {
    const age = calculerAge(options.dateNaissance.trim());
    doc.text(`Né(e) le ${formatDateLisible(options.dateNaissance.trim())} (${age} ans)`, margeGauche, y);
    y += 14;
  }
  doc.text(
    `Période couverte : du ${formatDateLisible(dateDebutEffective)} au ${formatDateLisible(options.dateFin)}`,
    margeGauche,
    y,
  );
  y += 14;
  doc.text(`Rapport généré le ${formatDateLisible(new Date().toISOString().slice(0, 10))}`, margeGauche, y);
  y += 26;

  // Une seule colonne pleine largeur, dans l'ordre : visuel (score, zones,
  // graphique) puis détail (symptômes, médicaments, événements, notes).
  const colonne = creerColonne(doc, largeurUtile);

  if (options.inclureBeighton) {
    colonne.titre("Score de Beighton");
    if (!options.evaluationBeighton) {
      colonne.paragraphe(
        "Aucune évaluation enregistrée. Calcule ton score de Beighton depuis Ressources pour qu'il apparaisse ici.",
      );
    } else {
      const { composantesCochees, tranche, evalueLe } = options.evaluationBeighton;
      const score = composantesCochees.length;
      const seuil = seuilPositifBeighton(tranche);
      const positif = score >= seuil;
      const couleurBadge: [number, number, number] = positif ? [235, 152, 110] : [200, 216, 178];
      const largeurTexteBadge = largeurUtile - 68 - 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const lignesBadge = doc.splitTextToSize(
        `${positif ? "Seuil atteint" : "Seuil non atteint"} (>= ${seuil}/9 pour « ${LABEL_TRANCHE_AGE_BEIGHTON[tranche].toLowerCase()} »)\nÉvalué le ${formatDateLisible(evalueLe.slice(0, 10))}`,
        largeurTexteBadge,
      ) as string[];
      const hauteurBadge = Math.max(46, lignesBadge.length * 11 + 20);
      colonne.ajouter(hauteurBadge + 10, (x, yy, largeur) => {
        doc.setFillColor(...couleurBadge);
        doc.roundedRect(x, yy, largeur, hauteurBadge, 8, 8, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(19);
        doc.setTextColor(...COULEUR_TEXTE);
        doc.text(`${score}/9`, x + 14, yy + hauteurBadge / 2 + 6);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.text(lignesBadge, x + 68, yy + 16);
        return yy + hauteurBadge + 10;
      });
    }
  }

  const joursPeriode = joursEntre(dateDebutEffective, options.dateFin);
  if (options.inclureSymptomes) {
    const topZones = zonesPlusDouloureusesFrequentes(entreesPeriode, joursPeriode);
    colonne.titre("Zones les plus douloureuses");
    if (topZones.length === 0) {
      colonne.paragraphe("Aucune zone marquée « la plus douloureuse » sur cette période.");
    } else {
      colonne.ajouter(HAUTEUR_SILHOUETTE + 8 + topZones.length * 19 + 4, (x, yy, largeur) => {
        const yApresSilhouette = dessinerSilhouetteMini(doc, x, yy, largeur, topZones);
        return dessinerBarresZones(doc, x, yApresSilhouette, largeur, topZones);
      });
    }
  }

  const itemsGraphiqueResolus = options.itemsGraphiques
    .map((cle) => {
      const [type, ...reste] = cle.split(":");
      const itemId = reste.join(":");
      const entree = entreesPeriode.find((e) => e.type === type && e.item === itemId);
      return entree ? { type, itemId, label: libelleEntree(entree) } : undefined;
    })
    .filter((x): x is { type: string; itemId: string; label: string } => x !== undefined);
  const marqueursPeriode = (options.marqueurs ?? []).filter(
    (m) => m.date >= dateDebutEffective && m.date <= options.dateFin,
  );
  if (options.inclureGraphiques && itemsGraphiqueResolus.length > 0 && joursPeriode.length >= 2) {
    colonne.ajouter(
      hauteurGraphique(itemsGraphiqueResolus.length, largeurUtile, marqueursPeriode.length),
      (x, yy, largeur) =>
        dessinerGraphique(doc, entreesPeriode, itemsGraphiqueResolus, x, largeur, yy, joursPeriode, marqueursPeriode),
    );
  }

  if (options.inclureSymptomes) {
    colonne.titre("Symptômes");
    const symptomesEntrees = entreesPeriode.filter((e) => e.type === "symptom");
    if (symptomesEntrees.length === 0) {
      colonne.paragraphe("Aucun symptôme enregistré sur cette période.");
    } else {
      const parItem = new Map<string, Entree[]>();
      for (const e of symptomesEntrees) {
        const liste = parItem.get(e.item) ?? [];
        liste.push(e);
        parItem.set(e.item, liste);
      }

      const symptomesAvecStats = [...parItem.entries()]
        .map(([item, liste]) => {
          const dates = new Set(liste.map((e) => e.date));
          const datesFortes = datesJoursForts(liste);
          return {
            item,
            liste,
            pourcentageGlobal: pourcentageJours(dates, joursPeriode),
            pourcentageJoursForts: pourcentageJours(datesFortes, joursPeriode),
            tendance: calculerTendance(dates, datesFortes, joursPeriode),
          };
        })
        // Priorité aux symptômes qui deviennent sévères le plus souvent, pas
        // seulement les plus fréquents : un symptôme rare mais qui tourne
        // régulièrement à la crise mérite d'être vu avant un symptôme fréquent
        // mais toujours léger.
        .sort((a, b) => b.pourcentageJoursForts - a.pourcentageJoursForts || b.pourcentageGlobal - a.pourcentageGlobal);

      for (const { item, liste, pourcentageGlobal, pourcentageJoursForts: pctForts, tendance } of symptomesAvecStats) {
        const label = libelleEntree(liste[0]);
        colonne.sousTitre(label);

        const infoTendance = TENDANCE_INFO[tendance];
        const swatches: Swatch[] = [
          { label: `${pourcentageGlobal}% des jours`, couleur: COULEUR_DOUX },
          { label: infoTendance.label, couleur: infoTendance.couleur },
          {
            label: `${pctForts}% jours forts`,
            couleur: pctForts > 0 ? COULEUR_SEVERITE_PDF.haut : COULEUR_SEVERITE_PDF.bas,
          },
        ];

        if (trouverSymptome(item)?.typeFormulaire === "eva") {
          const evas = liste
            .filter((e): e is EntreeSymptome => e.type === "symptom")
            .map((e) => e.evaluationEva)
            .filter((v): v is number => v != null);
          const moyenneEvaNum = evas.length > 0 ? evas.reduce((a, b) => a + b, 0) / evas.length : undefined;
          if (moyenneEvaNum !== undefined) {
            swatches.push({
              label: `Impact moyen ${moyenneEvaNum.toFixed(1)}/10`,
              couleur: COULEUR_SEVERITE_PDF[severiteDepuisEva(moyenneEvaNum)],
            });
          }
        }

        const hauteur = hauteurSwatches(doc, colonne.largeur, swatches);
        colonne.ajouter(hauteur, (x, yy, largeur) => dessinerSwatches(doc, x, yy, largeur, swatches));
      }
    }
  }

  if (options.inclureMedicaments) {
    colonne.titre("Médicaments");
    if (medicaments.length === 0) {
      colonne.paragraphe("Aucun médicament enregistré.");
    } else {
      const idsStockBas = new Set(medicamentsStockBas(medicaments).map((m) => m.id));
      for (const m of medicaments) {
        const prises = entreesPeriode.filter(
          (e) => e.type === "medication_intake" && e.medicationId === m.id,
        );
        const doses = [...new Set(prises.map((p) => (p as { dose?: string }).dose).filter(Boolean))];
        colonne.sousTitre(m.nom);
        colonne.paragraphe(
          `${prises.length} prise${prises.length > 1 ? "s" : ""} sur la période${
            doses.length > 0 ? ` — dose(s) : ${doses.join(", ")}` : ""
          }`,
          9.5,
          COULEUR_DOUX,
        );
        if (idsStockBas.has(m.id)) {
          colonne.paragraphe(`Stock bas : ${m.stock} restant(s) — ordonnance à renouveler.`, 9.5, COULEUR_TITRE);
        }
      }
    }
  }

  if (options.inclureEvenements) {
    colonne.titre("Événements notables");
    const evenements = entreesPeriode.filter(
      (e) =>
        e.type === "symptom" &&
        ["luxation-articulaire", "subluxation-articulaire", "bleus"].includes(e.item),
    );
    if (evenements.length === 0) {
      colonne.paragraphe("Aucun événement notable (luxation, subluxation, ecchymose) sur cette période.");
    } else {
      for (const e of evenements) {
        if (e.type !== "symptom") continue;
        const zones = e.location?.map(labelArticulation).join(", ");
        const niveau = e.severity ? ` (${labelSeverite(e.severity, e.item)})` : "";
        colonne.paragraphe(
          `${formatDateLisible(e.date)} — ${libelleEntree(e)}${niveau}${
            zones ? ` — Zone(s) : ${zones}` : ""
          }${e.note ? ` — ${e.note}` : ""}`,
          9.5,
        );
      }
    }
  }

  if (options.inclureNotesImportantes) {
    colonne.titre("Notes importantes");
    const notes = entreesPeriode.filter((e) => e.important && e.note);
    if (notes.length === 0) {
      colonne.paragraphe("Aucune note marquée comme importante sur cette période.");
    } else {
      for (const e of notes) {
        colonne.paragraphe(`${formatDateLisible(e.date)} — ${libelleEntree(e)} : ${e.note}`, 9.5);
      }
    }
  }

  // --- Pagination ---

  const hauteurPage1 = hauteurPage - margeBas - y;
  const hauteurAutresPages = hauteurPage - margeBas - 56;
  const pages = assignerPages(colonne.blocs, hauteurPage1, hauteurAutresPages);
  const totalPages = Math.max(1, ...pages);

  let yCourant = y;
  for (let page = 1; page <= totalPages; page++) {
    if (page > 1) {
      doc.addPage();
      yCourant = 56;
    }
    colonne.blocs.forEach((bloc, i) => {
      if (pages[i] === page) yCourant = bloc.dessiner(margeGauche, yCourant, largeurUtile);
    });
  }

  // Le pied de page est toujours dessiné à une position fixe proche du bas
  // (hauteurPage - 30) : on ne saute une page que si le contenu déjà tracé
  // le chevaucherait réellement, pas selon la marge générique du reste du
  // contenu (hauteurPage - margeBas), plus stricte et donc trop pénalisante ici.
  const yFinContenu = yCourant;
  const yPositionFooter = hauteurPage - 30;
  if (yFinContenu + 16 > yPositionFooter) {
    doc.addPage();
  }
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...COULEUR_DOUX);
  doc.text(
    "Document généré localement par l'application Soleil, à usage informatif pour accompagner un suivi médical.",
    margeGauche,
    yPositionFooter,
  );

  return doc;
}
