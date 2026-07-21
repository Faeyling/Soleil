import { liveQuery } from "dexie";
import { db } from "./db";
import { definirSymptomes } from "../content/symptomes";
import { definirSuivis } from "../content/autresSuivis";

/**
 * Relie les tables `symptomes`/`autresSuivis` aux stores réactifs du même nom
 * dans src/content/ — appelé une fois au démarrage (main.tsx), après le
 * premier semis (initialiserContenuSiVide). Toute modification (ajout,
 * édition, suppression) se répercute automatiquement partout où
 * useSymptomes()/useSuivis()/trouverSymptome()/trouverSuivi() sont utilisés.
 */
export function initialiserContenuReactif(): void {
  liveQuery(() => db.symptomes.toArray()).subscribe((liste) => {
    if (liste.length > 0) definirSymptomes(liste);
  });
  liveQuery(() => db.autresSuivis.toArray()).subscribe((liste) => {
    if (liste.length > 0) definirSuivis(liste);
  });
}
