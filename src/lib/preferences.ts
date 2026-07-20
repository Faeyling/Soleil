const CLE_SYMPTOMES_QUOTIDIENS = "soleil-symptomes-quotidiens";

const DEFAUT_SYMPTOMES_QUOTIDIENS = ["douleur", "fatigue", "vertiges", "sommeil"];

export function getSymptomesQuotidiens(): string[] {
  try {
    const brut = localStorage.getItem(CLE_SYMPTOMES_QUOTIDIENS);
    if (!brut) return DEFAUT_SYMPTOMES_QUOTIDIENS;
    const parse = JSON.parse(brut);
    return Array.isArray(parse) && parse.length > 0 ? parse : DEFAUT_SYMPTOMES_QUOTIDIENS;
  } catch {
    return DEFAUT_SYMPTOMES_QUOTIDIENS;
  }
}

export function setSymptomesQuotidiens(ids: string[]): void {
  localStorage.setItem(CLE_SYMPTOMES_QUOTIDIENS, JSON.stringify(ids));
}
