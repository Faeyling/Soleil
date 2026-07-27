import { jsPDF } from "jspdf";
import type { Entree, EntreeSymptome, Medicament, Marqueur } from "../data/types";
import { labelSeverite, ordreSeverite, LABEL_SEVERITE, type Severite } from "./severite";
import { libelleEntree } from "./libelleEntree";
import { labelArticulation, trouverSymptome } from "../content/symptomes";
import { formatDateLisible, joursEntre, nomMois } from "./date";
import type { EvaluationBeighton } from "../data/repositories/beightonRepository";
import { LABEL_TRANCHE_AGE_BEIGHTON, seuilPositifBeighton } from "../content/ressources";
import { medicamentsStockBas } from "./stock";
import { calculerAge } from "./profilPatiente";

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

/** Palette fixe pour les courbes du PDF — indépendante du thème CSS de l'appli (non disponible dans un module hors composant). */
const PALETTE_GRAPHIQUE: [number, number, number][] = [
  [193, 83, 43], // terracotta
  [98, 55, 140], // rose/mauve foncé
  [178, 91, 15], // ocre
  [97, 126, 54], // sauge
  [168, 99, 55], // caramel
  [47, 62, 82], // marine
];

/** Dessine un graphique d'évolution (courbes de sévérité par jour) directement en vecteur jsPDF, et retourne la position Y après le graphique. */
function dessinerGraphique(
  doc: jsPDF,
  entreesPeriode: Entree[],
  itemsGraphiques: string[],
  margeGauche: number,
  largeurUtile: number,
  yDepart: number,
  dateDebut: string,
  dateFin: string,
  marqueurs: Marqueur[],
): number {
  const items = itemsGraphiques
    .map((cle) => {
      const [type, ...reste] = cle.split(":");
      const itemId = reste.join(":");
      const entree = entreesPeriode.find((e) => e.type === type && e.item === itemId);
      return entree ? { type, itemId, label: libelleEntree(entree) } : undefined;
    })
    .filter((x): x is { type: string; itemId: string; label: string } => x !== undefined);

  const jours = joursEntre(dateDebut, dateFin);
  if (items.length === 0 || jours.length < 2) return yDepart;

  let y = yDepart;
  const hauteurGraphe = 120;
  const margeAxe = 40;
  const largeurGraphe = largeurUtile - margeAxe;
  const hauteurTotale = hauteurGraphe + 40 + Math.ceil(items.length / 3) * 14 + 30;

  if (y + hauteurTotale > doc.internal.pageSize.getHeight() - 48) {
    doc.addPage();
    y = 56;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...COULEUR_TITRE);
  doc.text("Évolution dans le temps", margeGauche, y);
  y += 10;
  doc.setDrawColor(...COULEUR_TITRE);
  doc.setLineWidth(1);
  doc.line(margeGauche, y, margeGauche + largeurUtile, y);
  y += 24;

  const xGraphe = margeGauche + margeAxe;
  const yBas = y + hauteurGraphe;

  const NOMS_NIVEAUX: Severite[] = ["bas", "moyen", "haut", "crise"];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COULEUR_DOUX);
  doc.setDrawColor(220, 205, 185);
  doc.setLineWidth(0.5);
  for (let niveau = 1; niveau <= 4; niveau++) {
    const yLigne = yBas - ((niveau - 1) / 3) * hauteurGraphe;
    doc.line(xGraphe, yLigne, xGraphe + largeurGraphe, yLigne);
    doc.text(LABEL_SEVERITE[NOMS_NIVEAUX[niveau - 1]], margeGauche, yLigne + 3);
  }

  const xPourJour = (index: number) =>
    xGraphe + (jours.length === 1 ? 0 : (index / (jours.length - 1)) * largeurGraphe);
  const yPourNiveau = (niveau: number) => yBas - ((niveau - 1) / 3) * hauteurGraphe;

  // Pas d'étiquette texte sur la ligne elle-même : un marqueur proche d'un
  // bord du graphique verrait son texte tronqué. Le nom et la date de
  // chaque marqueur sont listés sous le graphique à la place (voir plus bas).
  const marqueursAffiches = marqueurs.filter((m) => jours.includes(m.date));
  if (marqueursAffiches.length > 0) {
    doc.setDrawColor(140, 110, 90);
    doc.setLineWidth(0.8);
    doc.setLineDashPattern([2, 2], 0);
    for (const marqueur of marqueursAffiches) {
      const x = xPourJour(jours.indexOf(marqueur.date));
      doc.line(x, y, x, yBas);
    }
    doc.setLineDashPattern([], 0);
  }

  items.forEach((item, indexItem) => {
    const couleur = PALETTE_GRAPHIQUE[indexItem % PALETTE_GRAPHIQUE.length];
    doc.setDrawColor(...couleur);
    doc.setFillColor(...couleur);
    doc.setLineWidth(1.3);

    let dernierPoint: { x: number; y: number } | undefined;
    jours.forEach((jour, indexJour) => {
      const entree = entreesPeriode.find(
        (e) => e.type === item.type && e.item === item.itemId && e.date === jour,
      );
      if (!entree || !("severity" in entree) || !entree.severity) {
        dernierPoint = undefined;
        return;
      }
      const x = xPourJour(indexJour);
      const yPoint = yPourNiveau(ordreSeverite(entree.severity));
      if (dernierPoint) doc.line(dernierPoint.x, dernierPoint.y, x, yPoint);
      doc.circle(x, yPoint, 1.6, "F");
      dernierPoint = { x, y: yPoint };
    });
  });

  doc.setFontSize(8);
  doc.setTextColor(...COULEUR_DOUX);
  doc.text(formatDateLisible(jours[0]), xGraphe, yBas + 14);
  doc.text(formatDateLisible(jours[jours.length - 1]), xGraphe + largeurGraphe, yBas + 14, { align: "right" });

  y = yBas + 30;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  let xLegende = margeGauche;
  let yLegende = y;
  const largeurColonne = largeurUtile / 3;
  items.forEach((item, index) => {
    if (index > 0 && index % 3 === 0) {
      yLegende += 14;
      xLegende = margeGauche;
    }
    const couleur = PALETTE_GRAPHIQUE[index % PALETTE_GRAPHIQUE.length];
    doc.setFillColor(...couleur);
    doc.circle(xLegende + 3, yLegende - 3, 3, "F");
    doc.setTextColor(...COULEUR_TEXTE);
    doc.text(item.label, xLegende + 10, yLegende);
    xLegende += largeurColonne;
  });

  y = yLegende + 20;

  if (marqueursAffiches.length > 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(...COULEUR_DOUX);
    const texteMarqueurs =
      "Marqueurs (lignes verticales) : " +
      marqueursAffiches.map((m) => `${m.label} (${formatDateLisible(m.date)})`).join(" · ");
    const lignes = doc.splitTextToSize(texteMarqueurs, largeurUtile);
    doc.text(lignes, margeGauche, y);
    y += lignes.length * 11 + 6;
  }

  return y + 4;
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
  let y = 56;
  const largeurPage = doc.internal.pageSize.getWidth();
  const largeurUtile = largeurPage - margeGauche * 2;

  const entreesPeriode = entrees.filter(
    (e) => e.date >= options.dateDebut && e.date <= options.dateFin,
  );

  const sautDePageSiNecessaire = (hauteurRequise: number) => {
    if (y + hauteurRequise > doc.internal.pageSize.getHeight() - 48) {
      doc.addPage();
      y = 56;
    }
  };

  const titre = (texte: string) => {
    sautDePageSiNecessaire(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...COULEUR_TITRE);
    doc.text(texte, margeGauche, y);
    y += 10;
    doc.setDrawColor(...COULEUR_TITRE);
    doc.setLineWidth(1);
    doc.line(margeGauche, y, margeGauche + largeurUtile, y);
    y += 20;
  };

  const sousTitre = (texte: string) => {
    sautDePageSiNecessaire(22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...COULEUR_TEXTE);
    doc.text(texte, margeGauche, y);
    y += 16;
  };

  const paragraphe = (texte: string, taille = 10, couleur = COULEUR_TEXTE) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(taille);
    doc.setTextColor(...couleur);
    const lignes = doc.splitTextToSize(texte, largeurUtile);
    sautDePageSiNecessaire(lignes.length * (taille + 3) + 4);
    doc.text(lignes, margeGauche, y);
    y += lignes.length * (taille + 3) + 6;
  };

  // En-tête du document
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...COULEUR_TITRE);
  doc.text("Soleil — Rapport de suivi SEDh", margeGauche, y);
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
    `Période couverte : du ${formatDateLisible(options.dateDebut)} au ${formatDateLisible(options.dateFin)}`,
    margeGauche,
    y,
  );
  y += 14;
  doc.text(`Rapport généré le ${formatDateLisible(new Date().toISOString().slice(0, 10))}`, margeGauche, y);
  y += 26;

  if (options.inclureBeighton) {
    titre("Score de Beighton");
    if (!options.evaluationBeighton) {
      paragraphe(
        "Aucune évaluation enregistrée. Calcule ton score de Beighton depuis Ressources pour qu'il apparaisse ici.",
      );
    } else {
      const { composantesCochees, tranche, evalueLe } = options.evaluationBeighton;
      const score = composantesCochees.length;
      const seuil = seuilPositifBeighton(tranche);
      const positif = score >= seuil;
      paragraphe(
        `Score : ${score} / 9 — ${positif ? "seuil atteint" : "seuil non atteint"} (>= ${seuil}/9 pour « ${LABEL_TRANCHE_AGE_BEIGHTON[tranche].toLowerCase()} »). Évalué le ${formatDateLisible(evalueLe.slice(0, 10))}. Critère 1 sur 3 de la classification diagnostique du SEDh — voir Ressources.`,
      );
    }
  }

  if (options.inclureGraphiques && options.itemsGraphiques.length > 0) {
    y = dessinerGraphique(
      doc,
      entreesPeriode,
      options.itemsGraphiques,
      margeGauche,
      largeurUtile,
      y,
      options.dateDebut,
      options.dateFin,
      (options.marqueurs ?? []).filter((m) => m.date >= options.dateDebut && m.date <= options.dateFin),
    );
  }

  if (options.inclureSymptomes) {
    titre("Symptômes");
    const symptomesEntrees = entreesPeriode.filter((e) => e.type === "symptom");
    if (symptomesEntrees.length === 0) {
      paragraphe("Aucun symptôme enregistré sur cette période.");
    } else {
      const parItem = new Map<string, Entree[]>();
      for (const e of symptomesEntrees) {
        const liste = parItem.get(e.item) ?? [];
        liste.push(e);
        parItem.set(e.item, liste);
      }
      const joursPeriode = joursEntre(options.dateDebut, options.dateFin);
      const symptomesAvecStats = [...parItem.entries()]
        .map(([item, liste]) => {
          const dates = new Set(liste.map((e) => e.date));
          const { pourcentageGlobal, parMois } = repartitionParMois(
            dates,
            joursPeriode,
            options.dateDebut,
            options.dateFin,
          );
          return { item, liste, pourcentageGlobal, parMois };
        })
        .sort((a, b) => b.pourcentageGlobal - a.pourcentageGlobal);

      for (const { item, liste, pourcentageGlobal, parMois } of symptomesAvecStats) {
        const label = libelleEntree(liste[0]);
        sousTitre(`${label} — signalé ${pourcentageGlobal}% des jours de la période`);

        if (trouverSymptome(item)?.typeFormulaire === "eva") {
          const evas = liste
            .filter((e): e is EntreeSymptome => e.type === "symptom")
            .map((e) => e.evaluationEva)
            .filter((v): v is number => v != null);
          const moyenneEva = evas.length > 0 ? (evas.reduce((a, b) => a + b, 0) / evas.length).toFixed(1) : undefined;
          paragraphe(
            `${moyenneEva !== undefined ? `EVA moyen : ${moyenneEva}/10 — ` : ""}Par mois : ${parMois.join(" · ")}`,
            9.5,
            COULEUR_DOUX,
          );
        } else {
          const compte: Record<Severite, number> = { bas: 0, moyen: 0, haut: 0, crise: 0 };
          for (const e of liste) {
            if ("severity" in e && e.severity) compte[e.severity]++;
          }
          paragraphe(
            `Répartition : ${labelSeverite("bas", item)} ${compte.bas} · ${labelSeverite("moyen", item)} ${compte.moyen} · ${labelSeverite("haut", item)} ${compte.haut}${
              compte.crise > 0 ? ` · ${labelSeverite("crise", item)} ${compte.crise}` : ""
            }\nPar mois : ${parMois.join(" · ")}`,
            9.5,
            COULEUR_DOUX,
          );
        }
      }
    }
  }

  if (options.inclureMedicaments) {
    titre("Médicaments");
    if (medicaments.length === 0) {
      paragraphe("Aucun médicament enregistré.");
    } else {
      const idsStockBas = new Set(medicamentsStockBas(medicaments).map((m) => m.id));
      for (const m of medicaments) {
        const prises = entreesPeriode.filter(
          (e) => e.type === "medication_intake" && e.medicationId === m.id,
        );
        const doses = [...new Set(prises.map((p) => (p as { dose?: string }).dose).filter(Boolean))];
        sousTitre(m.nom);
        paragraphe(
          `${prises.length} prise${prises.length > 1 ? "s" : ""} sur la période${
            doses.length > 0 ? ` — dose(s) : ${doses.join(", ")}` : ""
          }`,
          9.5,
          COULEUR_DOUX,
        );
        if (idsStockBas.has(m.id)) {
          paragraphe(`Stock bas : ${m.stock} restant(s) — ordonnance à renouveler.`, 9.5, COULEUR_TITRE);
        }
      }
    }
  }

  if (options.inclureEvenements) {
    titre("Événements notables");
    const evenements = entreesPeriode.filter(
      (e) =>
        e.type === "symptom" &&
        ["luxation-articulaire", "subluxation-articulaire", "bleus"].includes(e.item),
    );
    if (evenements.length === 0) {
      paragraphe("Aucun événement notable (luxation, subluxation, ecchymose) sur cette période.");
    } else {
      for (const e of evenements) {
        if (e.type !== "symptom") continue;
        const zones = e.location?.map(labelArticulation).join(", ");
        const niveau = e.severity ? ` (${labelSeverite(e.severity, e.item)})` : "";
        paragraphe(
          `${formatDateLisible(e.date)} — ${libelleEntree(e)}${niveau}${
            zones ? ` — Zone(s) : ${zones}` : ""
          }${e.note ? ` — ${e.note}` : ""}`,
          9.5,
        );
      }
    }
  }

  if (options.inclureNotesImportantes) {
    titre("Notes importantes");
    const notes = entreesPeriode.filter((e) => e.important && e.note);
    if (notes.length === 0) {
      paragraphe("Aucune note marquée comme importante sur cette période.");
    } else {
      for (const e of notes) {
        paragraphe(`${formatDateLisible(e.date)} — ${libelleEntree(e)} : ${e.note}`, 9.5);
      }
    }
  }

  sautDePageSiNecessaire(30);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...COULEUR_DOUX);
  doc.text(
    "Document généré localement par l'application Soleil, à usage informatif pour accompagner un suivi médical.",
    margeGauche,
    doc.internal.pageSize.getHeight() - 30,
  );

  return doc;
}
