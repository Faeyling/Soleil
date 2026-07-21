import type { Medicament } from "../data/types";

export function medicamentsStockBas(medicaments: Medicament[]): Medicament[] {
  return medicaments.filter((m) => m.stock != null && m.seuilAlerte != null && m.stock <= m.seuilAlerte);
}
