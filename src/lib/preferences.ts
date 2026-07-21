const CLE_SYMPTOMES_QUOTIDIENS = "soleil-symptomes-quotidiens";
const CLE_SUIVIS_QUOTIDIENS = "soleil-suivis-quotidiens";

const DEFAUT_SYMPTOMES_QUOTIDIENS = ["douleur", "fatigue", "vertiges", "sommeil"];
const DEFAUT_SUIVIS_QUOTIDIENS = ["sommeil-suivi", "activite", "stress", "hydratation"];

function getListePersistee(cle: string, defaut: string[]): string[] {
  try {
    const brut = localStorage.getItem(cle);
    if (!brut) return defaut;
    const parse = JSON.parse(brut);
    return Array.isArray(parse) && parse.length > 0 ? parse : defaut;
  } catch {
    return defaut;
  }
}

function setListePersistee(cle: string, ids: string[]): void {
  localStorage.setItem(cle, JSON.stringify(ids));
}

export function getSymptomesQuotidiens(): string[] {
  return getListePersistee(CLE_SYMPTOMES_QUOTIDIENS, DEFAUT_SYMPTOMES_QUOTIDIENS);
}

export function setSymptomesQuotidiens(ids: string[]): void {
  setListePersistee(CLE_SYMPTOMES_QUOTIDIENS, ids);
}

export function getSuivisQuotidiens(): string[] {
  return getListePersistee(CLE_SUIVIS_QUOTIDIENS, DEFAUT_SUIVIS_QUOTIDIENS);
}

export function setSuivisQuotidiens(ids: string[]): void {
  setListePersistee(CLE_SUIVIS_QUOTIDIENS, ids);
}
