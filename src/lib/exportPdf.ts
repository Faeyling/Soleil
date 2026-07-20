import { jsPDF } from "jspdf";
import type { Entree, Medicament } from "../data/types";
import { LABEL_SEVERITE, type Severite } from "./severite";
import { libelleEntree } from "./libelleEntree";
import { labelArticulation } from "../content/symptomes";
import { formatDateLisible, formatDateTimeLisible } from "./date";

export interface OptionsExportPDF {
  inclureSymptomes: boolean;
  inclureMedicaments: boolean;
  inclureEvenements: boolean;
  inclureNotesImportantes: boolean;
  dateDebut: string;
  dateFin: string;
}

const COULEUR_TITRE: [number, number, number] = [169, 86, 58];
const COULEUR_TEXTE: [number, number, number] = [58, 46, 38];
const COULEUR_DOUX: [number, number, number] = [107, 90, 78];

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
        const compte: Record<Severite, number> = { bas: 0, moyen: 0, haut: 0 };
        for (const e of liste) {
          if ("severity" in e && e.severity) compte[e.severity]++;
        }
        sousTitre(`${label} — ${liste.length} occurrence${liste.length > 1 ? "s" : ""}`);
        paragraphe(
          `Répartition : Bas ${compte.bas} · Moyen ${compte.moyen} · Haut ${compte.haut}`,
          9.5,
          COULEUR_DOUX,
        );
        void item;
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
          `${formatDateTimeLisible(e.datetime)} — ${libelleEntree(e)} (${LABEL_SEVERITE[e.severity]})${
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
