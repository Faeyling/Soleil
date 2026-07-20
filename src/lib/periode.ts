import { ajouterJours, dateDuJour } from "./date";

export type Periode = "7" | "30" | "90" | "tout";

export const PERIODES: { id: Periode; label: string }[] = [
  { id: "7", label: "7 jours" },
  { id: "30", label: "30 jours" },
  { id: "90", label: "3 mois" },
  { id: "tout", label: "Tout" },
];

export function dateDebutPeriode(periode: Periode): string {
  if (periode === "tout") return "2000-01-01";
  return ajouterJours(dateDuJour(), -(Number(periode) - 1));
}
