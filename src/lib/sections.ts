export type SectionId = "symptomes" | "medicaments" | "suivis";

export interface SectionTheme {
  id: SectionId;
  label: string;
  couleur: string;
  couleurFonce: string;
  couleurClaire: string;
  icone: string;
}

export const SECTIONS: Record<SectionId, SectionTheme> = {
  symptomes: {
    id: "symptomes",
    label: "Symptômes",
    couleur: "var(--color-terracotta)",
    couleurFonce: "var(--color-terracotta-fonce)",
    couleurClaire: "var(--color-terracotta-clair)",
    icone: "🩹",
  },
  medicaments: {
    id: "medicaments",
    label: "Médicaments",
    couleur: "var(--color-ardoise)",
    couleurFonce: "var(--color-ardoise-fonce)",
    couleurClaire: "var(--color-ardoise-clair)",
    icone: "💊",
  },
  suivis: {
    id: "suivis",
    label: "Autres suivis",
    couleur: "var(--color-ocre)",
    couleurFonce: "var(--color-ocre-fonce)",
    couleurClaire: "var(--color-ocre-clair)",
    icone: "📈",
  },
};
