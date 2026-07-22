import type { Entree } from "../data/types";
import { libelleEntree } from "./libelleEntree";
import { labelSeverite } from "./severite";
import { labelArticulation } from "../content/symptomes";
import { dateDuJour } from "./date";

const ENTETES = [
  "Type",
  "Élément",
  "Date",
  "Heure",
  "Sévérité",
  "Valeur",
  "Unité",
  "Zone(s)",
  "Dose",
  "Note",
  "Importante",
];

// Point-virgule plutôt que virgule : Excel en locale française (celle de la
// quasi-totalité du public visé par Soleil) n'ouvre correctement un .csv en
// colonnes, par simple double-clic, qu'avec ce séparateur — la virgule y
// est déjà le séparateur décimal. Reste un CSV valide pour tous les autres
// tableurs (LibreOffice, Google Sheets, Numbers), qui détectent le délimiteur.
const SEPARATEUR = ";";

function echapperCellule(valeur: string): string {
  if (/["\n,;]/.test(valeur)) {
    return `"${valeur.replace(/"/g, '""')}"`;
  }
  return valeur;
}

const LABEL_TYPE: Record<Entree["type"], string> = {
  symptom: "Symptôme",
  medication_intake: "Médicament",
  track_something: "Autre suivi",
};

export function genererCSV(entrees: Entree[]): string {
  const lignes = [ENTETES.join(SEPARATEUR)];

  for (const e of entrees) {
    const [date, heure] = e.datetime.split("T");
    const cellules = [
      LABEL_TYPE[e.type],
      libelleEntree(e),
      date,
      (heure ?? "").slice(0, 5),
      "severity" in e && e.severity ? labelSeverite(e.severity, e.item) : "",
      "value" in e && e.value != null ? String(e.value) : "",
      "unit" in e && e.unit ? e.unit : "",
      "location" in e && e.location ? e.location.map(labelArticulation).join(" / ") : "",
      "dose" in e && e.dose ? e.dose : "",
      e.note ?? "",
      e.important ? "Oui" : "",
    ];
    lignes.push(cellules.map(echapperCellule).join(SEPARATEUR));
  }

  return lignes.join("\n");
}

export function telechargerCSV(entrees: Entree[]): void {
  // BOM UTF-8 pour qu'Excel détecte correctement l'encodage des accents.
  const contenu = "﻿" + genererCSV(entrees);
  const blob = new Blob([contenu], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `soleil-donnees-${dateDuJour()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
