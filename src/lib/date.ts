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

/**
 * ISO combinant une date (YYYY-MM-DD) avec l'heure actuelle — la saisie ne
 * demande plus l'heure, mais un horodatage complet reste nécessaire en
 * interne (tri, graphes).
 */
export function isoDepuisDate(date: string): string {
  const maintenant = new Date();
  const [annee, mois, jour] = date.split("-").map(Number);
  return new Date(
    annee,
    mois - 1,
    jour,
    maintenant.getHours(),
    maintenant.getMinutes(),
    maintenant.getSeconds(),
  ).toISOString();
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
