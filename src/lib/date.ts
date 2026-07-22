export function dateDuJour(): string {
  return toDateStr(new Date());
}

export function toDateStr(d: Date): string {
  const annee = d.getFullYear();
  const mois = String(d.getMonth() + 1).padStart(2, "0");
  const jour = String(d.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
}

export function maintenantISO(): string {
  return new Date().toISOString();
}

const MOIS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

const JOURS_FR = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

const JOURS_COURTS_FR = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

export function nomMois(mois: number): string {
  return MOIS_FR[mois];
}

export function nomJour(d: Date): string {
  return JOURS_FR[d.getDay()];
}

export function joursCourts(): string[] {
  return JOURS_COURTS_FR;
}

export function formatDateLisible(dateStr: string): string {
  const [a, m, j] = dateStr.split("-").map(Number);
  const d = new Date(a, m - 1, j);
  return `${d.getDate()} ${nomMois(d.getMonth())} ${d.getFullYear()}`;
}

export function formatHeure(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTimeLisible(iso: string): string {
  const d = new Date(iso);
  return `${formatDateLisible(toDateStr(d))} à ${formatHeure(iso)}`;
}

export function datetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function isoDepuisDatetimeLocal(value: string): string {
  return new Date(value).toISOString();
}

/**
 * Extrait la date (YYYY-MM-DD) directement depuis la valeur d'un input
 * `datetime-local`, qui est déjà exprimée en heure locale — contrairement à
 * `isoDepuisDatetimeLocal(value).slice(0, 10)`, qui donnerait la date UTC et
 * peut se tromper de jour en soirée/nuit pour un fuseau horaire ≠ UTC.
 */
export function dateDepuisDatetimeLocal(value: string): string {
  return value.slice(0, 10);
}

export function premierJourMois(annee: number, mois: number): Date {
  return new Date(annee, mois, 1);
}

export function nbJoursMois(annee: number, mois: number): number {
  return new Date(annee, mois + 1, 0).getDate();
}

/** Décalage (0=lundi ... 6=dimanche) du premier jour du mois, pour une grille commençant le lundi. */
export function decalageLundi(annee: number, mois: number): number {
  const jourSemaine = premierJourMois(annee, mois).getDay(); // 0=dimanche
  return (jourSemaine + 6) % 7;
}

export function ajouterJours(dateStr: string, n: number): string {
  const [a, m, j] = dateStr.split("-").map(Number);
  const d = new Date(a, m - 1, j);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

export function derniers7Jours(): string[] {
  const jours: string[] = [];
  for (let i = 6; i >= 0; i--) {
    jours.push(ajouterJours(dateDuJour(), -i));
  }
  return jours;
}

export function joursDepuis(nbJours: number): string[] {
  const jours: string[] = [];
  for (let i = nbJours - 1; i >= 0; i--) {
    jours.push(ajouterJours(dateDuJour(), -i));
  }
  return jours;
}

/** Liste des jours (YYYY-MM-DD) de `debut` à `fin` inclus, dans l'ordre chronologique. */
export function joursEntre(debut: string, fin: string): string[] {
  const jours: string[] = [];
  let jour = debut;
  while (jour <= fin) {
    jours.push(jour);
    jour = ajouterJours(jour, 1);
  }
  return jours;
}
