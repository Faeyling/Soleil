import { v4 as uuid } from "uuid";
import { db } from "./db";
import { ajouterJours, dateDuJour } from "../lib/date";
import type { Entree, Medicament } from "./types";

const CLE_DEMO_SEMEE = "soleil-demo-seeded";

function horodatage(date: string, heure: string): string {
  return new Date(`${date}T${heure}:00`).toISOString();
}

export async function semerDonneesDemoSiPremierLancement(): Promise<void> {
  if (localStorage.getItem(CLE_DEMO_SEMEE)) return;
  localStorage.setItem(CLE_DEMO_SEMEE, "1");

  const nbEntrees = await db.entrees.count();
  if (nbEntrees > 0) return;

  const j0 = dateDuJour();
  const j1 = ajouterJours(j0, -1);
  const j2 = ajouterJours(j0, -2);
  const j3 = ajouterJours(j0, -3);
  const j5 = ajouterJours(j0, -5);

  const maintenant = new Date().toISOString();

  const ibuprofene: Medicament = { id: uuid(), nom: "Ibuprofène", createdAt: maintenant };
  const magnesium: Medicament = { id: uuid(), nom: "Magnésium", createdAt: maintenant };
  await db.medicaments.bulkAdd([ibuprofene, magnesium]);

  const entrees: Entree[] = [
    {
      id: uuid(),
      type: "symptom",
      item: "douleur",
      severity: "haut",
      location: ["genou-droit", "hanche-droite"],
      date: j0,
      datetime: horodatage(j0, "18:30"),
      note: "Douleur augmentée après la marche en ville.",
      important: true,
      createdAt: maintenant,
      updatedAt: maintenant,
    },
    {
      id: uuid(),
      type: "symptom",
      item: "fatigue",
      severity: "moyen",
      date: j0,
      datetime: horodatage(j0, "09:00"),
      createdAt: maintenant,
      updatedAt: maintenant,
    },
    {
      id: uuid(),
      type: "symptom",
      item: "subluxation-articulaire",
      severity: "moyen",
      location: ["epaule-gauche"],
      date: j1,
      datetime: horodatage(j1, "14:15"),
      note: "En attrapant un objet en hauteur.",
      createdAt: maintenant,
      updatedAt: maintenant,
    },
    {
      id: uuid(),
      type: "symptom",
      item: "vertiges",
      severity: "bas",
      date: j1,
      datetime: horodatage(j1, "08:20"),
      createdAt: maintenant,
      updatedAt: maintenant,
    },
    {
      id: uuid(),
      type: "symptom",
      item: "bleus",
      severity: "bas",
      date: j2,
      datetime: horodatage(j2, "19:00"),
      note: "Petit hématome sur le tibia, cause inconnue.",
      createdAt: maintenant,
      updatedAt: maintenant,
    },
    {
      id: uuid(),
      type: "symptom",
      item: "douleur",
      severity: "moyen",
      location: ["dos"],
      date: j2,
      datetime: horodatage(j2, "20:00"),
      createdAt: maintenant,
      updatedAt: maintenant,
    },
    {
      id: uuid(),
      type: "symptom",
      item: "fatigue",
      severity: "haut",
      date: j3,
      datetime: horodatage(j3, "10:00"),
      createdAt: maintenant,
      updatedAt: maintenant,
    },
    {
      id: uuid(),
      type: "symptom",
      item: "sommeil",
      severity: "moyen",
      date: j5,
      datetime: horodatage(j5, "08:00"),
      createdAt: maintenant,
      updatedAt: maintenant,
    },

    {
      id: uuid(),
      type: "medication_intake",
      item: ibuprofene.id,
      medicationId: ibuprofene.id,
      medicationName: ibuprofene.nom,
      dose: "400mg",
      note: "Pris après le repas du soir",
      date: j0,
      datetime: horodatage(j0, "19:00"),
      createdAt: maintenant,
      updatedAt: maintenant,
    },
    {
      id: uuid(),
      type: "medication_intake",
      item: magnesium.id,
      medicationId: magnesium.id,
      medicationName: magnesium.nom,
      dose: "1 comprimé",
      date: j1,
      datetime: horodatage(j1, "08:00"),
      createdAt: maintenant,
      updatedAt: maintenant,
    },
    {
      id: uuid(),
      type: "medication_intake",
      item: ibuprofene.id,
      medicationId: ibuprofene.id,
      medicationName: ibuprofene.nom,
      dose: "400mg",
      date: j2,
      datetime: horodatage(j2, "20:30"),
      createdAt: maintenant,
      updatedAt: maintenant,
    },

    {
      id: uuid(),
      type: "track_something",
      item: "humeur",
      severity: "moyen",
      date: j0,
      datetime: horodatage(j0, "21:00"),
      createdAt: maintenant,
      updatedAt: maintenant,
    },
    {
      id: uuid(),
      type: "track_something",
      item: "sommeil-suivi",
      severity: "bas",
      date: j0,
      datetime: horodatage(j0, "08:00"),
      note: "Réveillée 3 fois dans la nuit.",
      createdAt: maintenant,
      updatedAt: maintenant,
    },
    {
      id: uuid(),
      type: "track_something",
      item: "stress",
      severity: "moyen",
      date: j1,
      datetime: horodatage(j1, "17:00"),
      createdAt: maintenant,
      updatedAt: maintenant,
    },
    {
      id: uuid(),
      type: "track_something",
      item: "hydratation",
      value: 1.5,
      unit: "L",
      date: j1,
      datetime: horodatage(j1, "22:00"),
      createdAt: maintenant,
      updatedAt: maintenant,
    },
    {
      id: uuid(),
      type: "track_something",
      item: "activite",
      severity: "bas",
      date: j2,
      datetime: horodatage(j2, "11:00"),
      note: "Petite marche de 15 minutes.",
      createdAt: maintenant,
      updatedAt: maintenant,
    },
    {
      id: uuid(),
      type: "track_something",
      item: "poids",
      value: 61.8,
      unit: "kg",
      date: j5,
      datetime: horodatage(j5, "07:30"),
      createdAt: maintenant,
      updatedAt: maintenant,
    },
    {
      id: uuid(),
      type: "track_something",
      item: "journal-jour",
      note: "Journée globalement correcte, un peu de fatigue en fin d'après-midi mais rien d'inhabituel.",
      date: j1,
      datetime: horodatage(j1, "22:30"),
      createdAt: maintenant,
      updatedAt: maintenant,
    },
  ];

  await db.entrees.bulkAdd(entrees);
}
