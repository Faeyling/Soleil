/**
 * Sentinel distinct de `undefined` pour représenter "requête Dexie encore en
 * cours" — `useLiveQuery` renvoie `undefined` à la fois pendant le chargement
 * ET quand la donnée cherchée n'existe vraiment pas, ce qui rend les deux cas
 * indiscernables si on ne les sépare pas explicitement.
 */
export const CHARGEMENT = Symbol("chargement");

export type OuChargement<T> = T | typeof CHARGEMENT;
