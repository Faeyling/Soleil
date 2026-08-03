import { jsPDF } from "jspdf";
import type { Entree, EntreeSymptome, Medicament, Marqueur } from "../data/types";
import { labelSeverite, ordreSeverite, LABEL_SEVERITE, type Severite } from "./severite";
import { libelleEntree } from "./libelleEntree";
import { labelArticulation, trouverSymptome } from "../content/symptomes";
import { dateDuJour, formatDateLisible, joursEntre, nomMois } from "./date";
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

/** Construit une colonne : le contenu est mis en file d'attente (mesuré) plutôt que dessiné immédiatement, pour permettre de répartir gauche/droite sur les mêmes pages en un second passage. */
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

  // Membres colorés (bras/jambe) : redessine par-dessus la ligne neutre pour les zones classées.
  for (const [zoneId, trace] of Object.entries(TRACES_SILHOUETTE_PDF)) {
    const rang = rangParZone.get(zoneId);
    if (rang === undefined) continue;
    doc.setDrawColor(...GRADIENT_ZONES[rang]);
    doc.setLineWidth(7 * echelle);
    for (let i = 0; i < trace.length - 1; i++) {
      doc.line(versX(trace[i][0]), versY(trace[i][1]), versX(trace[i + 1][0]), versY(trace[i + 1][1]));
    }
  }

  // Points (tête, épaules, mains, hanches, pieds, torse, dos, nuque, sacro-iliaque).
  for (const [zoneId, point] of Object.entries(POSITIONS_SILHOUETTE_PDF)) {
    const rang = rangParZone.get(zoneId);
    const rayon = (zoneId === "torse" || zoneId === "dos" ? 8 : 5.5) * echelle;
    doc.setDrawColor(...(rang !== undefined ? GRADIENT_ZONES[rang] : COULEUR_TRAIT_SILHOUETTE));
    doc.setFillColor(...(rang !== undefined ? GRADIENT_ZONES[rang] : COULEUR_FOND_DOUCE));
    doc.setLineWidth(1.2);
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

/** Regroupe les jours d'une période par mois calendaire (clé "YYYY-MM", dans l'ordre chronologique). */
function moisDeLaPeriode(dateDebut: string, dateFin: string): string[] {
  const vus = new Set<string>();
  const mois: string[] = [];
  for (const jour of joursEntre(dateDebut, dateFin)) {
    const cle = jour.slice(0, 7);
    if (!vus.has(cle)) {
      vus.add(cle);
      mois.push(cle);
    }
  }
  return mois;
}

function libelleMois(cle: string): string {
  const [annee, mois] = cle.split("-").map(Number);
  return `${nomMois(mois - 1)} ${annee}`;
}

/**
 * Pourcentage de jours de la période (et, pour chaque mois couvert, pourcentage
 * de jours de ce mois) où au moins une entrée existe pour cet élément — plus
 * parlant qu'un simple comptage brut d'occurrences pour comparer des périodes
 * de longueurs différentes.
 */
function repartitionParMois(
  dates: Set<string>,
  joursPeriode: string[],
  dateDebut: string,
  dateFin: string,
): { pourcentageGlobal: number; parMois: string[] } {
  const pourcentageGlobal =
    joursPeriode.length > 0 ? Math.round((dates.size / joursPeriode.length) * 100) : 0;
  const parMois = moisDeLaPeriode(dateDebut, dateFin).map((cle) => {
    const joursDuMoisDansPeriode = joursPeriode.filter((j) => j.startsWith(cle));
    const joursAvecEntree = joursDuMoisDansPeriode.filter((j) => dates.has(j)).length;
    const pct =
      joursDuMoisDansPeriode.length > 0
        ? Math.round((joursAvecEntree / joursDuMoisDansPeriode.length) * 100)
        : 0;
    return `${libelleMois(cle)} : ${pct}%`;
  });
  return { pourcentageGlobal, parMois };
}

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
  doc.text("Soleil — Suivi SEDh", margeGauche, y);
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

  // Deux colonnes : gauche = contenu visuel (score, zones, graphique), pour
  // une lecture immédiate ; droite = détail texte (symptômes, médicaments,
  // événements, notes), pour approfondir.
  const espaceEntreColonnes = 20;
  const largeurColonne = (largeurUtile - espaceEntreColonnes) / 2;
  const xGauche = margeGauche;
  const xDroite = margeGauche + largeurColonne + espaceEntreColonnes;

  const gauche = creerColonne(doc, largeurColonne);
  const droite = creerColonne(doc, largeurColonne);

  // --- Colonne gauche : visuel ---

  if (options.inclureBeighton) {
    gauche.titre("Score de Beighton");
    if (!options.evaluationBeighton) {
      gauche.paragraphe(
        "Aucune évaluation enregistrée. Calcule ton score de Beighton depuis Ressources pour qu'il apparaisse ici.",
      );
    } else {
      const { composantesCochees, tranche, evalueLe } = options.evaluationBeighton;
      const score = composantesCochees.length;
      const seuil = seuilPositifBeighton(tranche);
      const positif = score >= seuil;
      const couleurBadge: [number, number, number] = positif ? [235, 152, 110] : [200, 216, 178];
      const largeurTexteBadge = largeurColonne - 68 - 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const lignesBadge = doc.splitTextToSize(
        `${positif ? "Seuil atteint" : "Seuil non atteint"} (>= ${seuil}/9 pour « ${LABEL_TRANCHE_AGE_BEIGHTON[tranche].toLowerCase()} »)\nÉvalué le ${formatDateLisible(evalueLe.slice(0, 10))}`,
        largeurTexteBadge,
      ) as string[];
      const hauteurBadge = Math.max(46, lignesBadge.length * 11 + 20);
      gauche.ajouter(hauteurBadge + 10, (x, yy, largeur) => {
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
    gauche.titre("Zones les plus douloureuses");
    if (topZones.length === 0) {
      gauche.paragraphe("Aucune zone marquée « la plus douloureuse » sur cette période.");
    } else {
      gauche.ajouter(HAUTEUR_SILHOUETTE + 8 + topZones.length * 19 + 4, (x, yy, largeur) => {
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
    gauche.ajouter(
      hauteurGraphique(itemsGraphiqueResolus.length, largeurColonne, marqueursPeriode.length),
      (x, yy, largeur) =>
        dessinerGraphique(doc, entreesPeriode, itemsGraphiqueResolus, x, largeur, yy, joursPeriode, marqueursPeriode),
    );
  }

  // --- Colonne droite : détail ---

  if (options.inclureSymptomes) {
    droite.titre("Symptômes");
    const symptomesEntrees = entreesPeriode.filter((e) => e.type === "symptom");
    if (symptomesEntrees.length === 0) {
      droite.paragraphe("Aucun symptôme enregistré sur cette période.");
    } else {
      const parItem = new Map<string, Entree[]>();
      for (const e of symptomesEntrees) {
        const liste = parItem.get(e.item) ?? [];
        liste.push(e);
        parItem.set(e.item, liste);
      }

      // "Depuis le début du suivi" : indépendant de la période choisie pour le
      // rapport — s'appuie sur toutes les entrées jamais enregistrées, pas
      // seulement `entreesPeriode`.
      const dateDebutSuivi = entrees.reduce<string | undefined>(
        (min, e) => (min === undefined || e.date < min ? e.date : min),
        undefined,
      );
      const joursDepuisDebut = dateDebutSuivi ? joursEntre(dateDebutSuivi, dateDuJour()) : [];
      const parItemToutesEntrees = new Map<string, Entree[]>();
      for (const e of entrees) {
        if (e.type !== "symptom") continue;
        const liste = parItemToutesEntrees.get(e.item) ?? [];
        liste.push(e);
        parItemToutesEntrees.set(e.item, liste);
      }

      const symptomesAvecStats = [...parItem.entries()]
        .map(([item, liste]) => {
          const dates = new Set(liste.map((e) => e.date));
          const { pourcentageGlobal, parMois } = repartitionParMois(
            dates,
            joursPeriode,
            dateDebutEffective,
            options.dateFin,
          );
          const datesToutesEntrees = new Set((parItemToutesEntrees.get(item) ?? []).map((e) => e.date));
          const pourcentageDepuisDebut =
            joursDepuisDebut.length > 0
              ? Math.round((datesToutesEntrees.size / joursDepuisDebut.length) * 100)
              : 0;
          return { item, liste, pourcentageGlobal, parMois, pourcentageDepuisDebut };
        })
        .sort((a, b) => b.pourcentageGlobal - a.pourcentageGlobal);

      for (const { item, liste, pourcentageGlobal, parMois, pourcentageDepuisDebut } of symptomesAvecStats) {
        const label = libelleEntree(liste[0]);
        droite.sousTitre(
          `${label} — signalé ${pourcentageGlobal}% des jours de la période (${pourcentageDepuisDebut}% depuis le début du suivi)`,
        );

        if (trouverSymptome(item)?.typeFormulaire === "eva") {
          const evas = liste
            .filter((e): e is EntreeSymptome => e.type === "symptom")
            .map((e) => e.evaluationEva)
            .filter((v): v is number => v != null);
          const moyenneEvaNum = evas.length > 0 ? evas.reduce((a, b) => a + b, 0) / evas.length : undefined;
          if (moyenneEvaNum !== undefined) {
            const swatch: Swatch = {
              label: `EVA moyen : ${moyenneEvaNum.toFixed(1)}/10`,
              couleur: COULEUR_SEVERITE_PDF[severiteDepuisEva(moyenneEvaNum)],
            };
            const hauteur = hauteurSwatches(doc, droite.largeur, [swatch]);
            droite.ajouter(hauteur, (x, yy, largeur) => dessinerSwatches(doc, x, yy, largeur, [swatch]));
          }
          droite.paragraphe(`Par mois : ${parMois.join(" · ")}`, 9.5, COULEUR_DOUX);
        } else {
          const compte: Record<Severite, number> = { bas: 0, moyen: 0, haut: 0, crise: 0 };
          for (const e of liste) {
            if ("severity" in e && e.severity) compte[e.severity]++;
          }
          const swatches: Swatch[] = (["bas", "moyen", "haut", "crise"] as Severite[])
            .filter((s) => s !== "crise" || compte.crise > 0)
            .map((s) => ({ label: `${labelSeverite(s, item)} ${compte[s]}`, couleur: COULEUR_SEVERITE_PDF[s] }));
          const hauteur = hauteurSwatches(doc, droite.largeur, swatches);
          droite.ajouter(hauteur, (x, yy, largeur) => dessinerSwatches(doc, x, yy, largeur, swatches));
          droite.paragraphe(`Par mois : ${parMois.join(" · ")}`, 9.5, COULEUR_DOUX);
        }
      }
    }
  }

  if (options.inclureMedicaments) {
    droite.titre("Médicaments");
    if (medicaments.length === 0) {
      droite.paragraphe("Aucun médicament enregistré.");
    } else {
      const idsStockBas = new Set(medicamentsStockBas(medicaments).map((m) => m.id));
      for (const m of medicaments) {
        const prises = entreesPeriode.filter(
          (e) => e.type === "medication_intake" && e.medicationId === m.id,
        );
        const doses = [...new Set(prises.map((p) => (p as { dose?: string }).dose).filter(Boolean))];
        droite.sousTitre(m.nom);
        droite.paragraphe(
          `${prises.length} prise${prises.length > 1 ? "s" : ""} sur la période${
            doses.length > 0 ? ` — dose(s) : ${doses.join(", ")}` : ""
          }`,
          9.5,
          COULEUR_DOUX,
        );
        if (idsStockBas.has(m.id)) {
          droite.paragraphe(`Stock bas : ${m.stock} restant(s) — ordonnance à renouveler.`, 9.5, COULEUR_TITRE);
        }
      }
    }
  }

  if (options.inclureEvenements) {
    droite.titre("Événements notables");
    const evenements = entreesPeriode.filter(
      (e) =>
        e.type === "symptom" &&
        ["luxation-articulaire", "subluxation-articulaire", "bleus"].includes(e.item),
    );
    if (evenements.length === 0) {
      droite.paragraphe("Aucun événement notable (luxation, subluxation, ecchymose) sur cette période.");
    } else {
      for (const e of evenements) {
        if (e.type !== "symptom") continue;
        const zones = e.location?.map(labelArticulation).join(", ");
        const niveau = e.severity ? ` (${labelSeverite(e.severity, e.item)})` : "";
        droite.paragraphe(
          `${formatDateLisible(e.date)} — ${libelleEntree(e)}${niveau}${
            zones ? ` — Zone(s) : ${zones}` : ""
          }${e.note ? ` — ${e.note}` : ""}`,
          9.5,
        );
      }
    }
  }

  if (options.inclureNotesImportantes) {
    droite.titre("Notes importantes");
    const notes = entreesPeriode.filter((e) => e.important && e.note);
    if (notes.length === 0) {
      droite.paragraphe("Aucune note marquée comme importante sur cette période.");
    } else {
      for (const e of notes) {
        droite.paragraphe(`${formatDateLisible(e.date)} — ${libelleEntree(e)} : ${e.note}`, 9.5);
      }
    }
  }

  // --- Pagination : les deux colonnes partagent les mêmes pages, chacune avec son propre fil. ---

  const hauteurPage1 = hauteurPage - margeBas - y;
  const hauteurAutresPages = hauteurPage - margeBas - 56;
  const pagesGauche = assignerPages(gauche.blocs, hauteurPage1, hauteurAutresPages);
  const pagesDroite = assignerPages(droite.blocs, hauteurPage1, hauteurAutresPages);
  const totalPages = Math.max(1, ...pagesGauche, ...pagesDroite);

  let yGauche = y;
  let yDroite = y;
  for (let page = 1; page <= totalPages; page++) {
    if (page > 1) {
      doc.addPage();
      yGauche = 56;
      yDroite = 56;
    }
    gauche.blocs.forEach((bloc, i) => {
      if (pagesGauche[i] === page) yGauche = bloc.dessiner(xGauche, yGauche, largeurColonne);
    });
    droite.blocs.forEach((bloc, i) => {
      if (pagesDroite[i] === page) yDroite = bloc.dessiner(xDroite, yDroite, largeurColonne);
    });
  }

  // Le pied de page est toujours dessiné à une position fixe proche du bas
  // (hauteurPage - 30) : on ne saute une page que si le contenu déjà tracé
  // le chevaucherait réellement, pas selon la marge générique du reste du
  // contenu (hauteurPage - margeBas), plus stricte et donc trop pénalisante ici.
  const yFinContenu = Math.max(yGauche, yDroite);
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
