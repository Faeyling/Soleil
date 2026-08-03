export const MAX_ZONES_PLUS_DOULOUREUSES = 2;
export const MAX_ZONES_SELECTIONNEES = 6;

export interface EtatZonesDouleur {
  zonesSelectionnees: string[];
  zonesPlusDouloureuses: string[];
}

/**
 * Fait avancer une zone dans le cycle sélectionnée → la plus douloureuse de
 * la journée → désélectionnée à chaque appui (un 4e appui revient donc au
 * même état qu'un 1er). Le nombre de zones "les plus douloureuses" est
 * plafonné à MAX_ZONES_PLUS_DOULOUREUSES, et le nombre total de zones
 * sélectionnées à MAX_ZONES_SELECTIONNEES : au-delà de l'un ou l'autre
 * plafond, un appui supplémentaire reste sans effet tant qu'une zone
 * existante n'a pas été désélectionnée — force à prioriser plutôt que de
 * tout cocher, ce qui noierait l'information utile.
 */
export function cyclerZoneDouleur(zoneId: string, etat: EtatZonesDouleur): EtatZonesDouleur {
  const { zonesSelectionnees, zonesPlusDouloureuses } = etat;
  const estSelectionnee = zonesSelectionnees.includes(zoneId);
  const estPlusDouloureuse = zonesPlusDouloureuses.includes(zoneId);

  if (!estSelectionnee) {
    if (zonesSelectionnees.length >= MAX_ZONES_SELECTIONNEES) {
      return etat;
    }
    return { zonesSelectionnees: [...zonesSelectionnees, zoneId], zonesPlusDouloureuses };
  }
  if (!estPlusDouloureuse) {
    if (zonesPlusDouloureuses.length >= MAX_ZONES_PLUS_DOULOUREUSES) {
      return etat;
    }
    return { zonesSelectionnees, zonesPlusDouloureuses: [...zonesPlusDouloureuses, zoneId] };
  }
  return {
    zonesSelectionnees: zonesSelectionnees.filter((z) => z !== zoneId),
    zonesPlusDouloureuses: zonesPlusDouloureuses.filter((z) => z !== zoneId),
  };
}
