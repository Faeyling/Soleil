import { jsPDF } from "jspdf";
import type { Entree, Medicament } from "../data/types";
import { labelSeverite, ordreSeverite, LABEL_SEVERITE, type Severite } from "./severite";
import { libelleEntree } from "./libelleEntree";
import { labelArticulation } from "../content/symptomes";
import { formatDateLisible, formatDateTimeLisible, joursEntre } from "./date";

export interface OptionsExportPDF {
  inclureSymptomes: boolean;
  inclureMedicaments: boolean;
  inclureEvenements: boolean;
  inclureNotesImportantes: boolean;
  /** Inclut un graphique d'évolution — voir `itemsGraphiques` pour choisir les courbes affichées. */
  inclureGraphiques: boolean;
  /** Clés `"type:item"` des éléments à tracer sur le graphique (ex. "symptom:douleur"). */
  itemsGraphiques: string[];
  dateDebut: string;
  dateFin: string;
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

  return yLegende + 24;
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
  doc.text(
    `Période couverte : du ${formatDateLisible(options.dateDebut)} au ${formatDateLisible(options.dateFin)}`,
    margeGauche,
    y,
  );
  y += 14;
  doc.text(`Rapport généré le ${formatDateLisible(new Date().toISOString().slice(0, 10))}`, margeGauche, y);
  y += 26;

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
      for (const [item, liste] of parItem) {
        const label = libelleEntree(liste[0]);
        const compte: Record<Severite, number> = { bas: 0, moyen: 0, haut: 0, crise: 0 };
        for (const e of liste) {
          if ("severity" in e && e.severity) compte[e.severity]++;
        }
        sousTitre(`${label} — ${liste.length} occurrence${liste.length > 1 ? "s" : ""}`);
        paragraphe(
          `Répartition : ${labelSeverite("bas", item)} ${compte.bas} · ${labelSeverite("moyen", item)} ${compte.moyen} · ${labelSeverite("haut", item)} ${compte.haut}${
            compte.crise > 0 ? ` · ${labelSeverite("crise", item)} ${compte.crise}` : ""
          }`,
          9.5,
          COULEUR_DOUX,
        );
      }
    }
  }

  if (options.inclureMedicaments) {
    titre("Médicaments");
    if (medicaments.length === 0) {
      paragraphe("Aucun médicament enregistré.");
    } else {
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
        paragraphe(
          `${formatDateTimeLisible(e.datetime)} — ${libelleEntree(e)} (${labelSeverite(e.severity, e.item)})${
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
        paragraphe(`${formatDateTimeLisible(e.datetime)} — ${libelleEntree(e)} : ${e.note}`, 9.5);
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
