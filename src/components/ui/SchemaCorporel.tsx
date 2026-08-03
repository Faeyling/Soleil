import { useState } from "react";
import { labelArticulation } from "../../content/symptomes";
import { SECTIONS } from "../../lib/sections";
import { couleurSeverite } from "../../lib/severite";
import { MAX_ZONES_PLUS_DOULOUREUSES, MAX_ZONES_SELECTIONNEES } from "../../lib/zonesDouleur";

type Vue = "face" | "dos";

interface ZonePoint {
  type: "point";
  id: string;
  x: number;
  y: number;
  /** Rayon plus grand pour les zones qui représentent une grande région (dos, tête) plutôt qu'une petite articulation. */
  grande?: boolean;
}

interface ZoneMembre {
  type: "membre";
  id: string;
  /** Tracé du membre, du tronc vers l'extrémité — épouse le coude/genou pour rester lisible sur le bonhomme. */
  trace: [number, number][];
}

type ZoneCorporelle = ZonePoint | ZoneMembre;

// Repères en coordonnées du viewBox (0 0 200 400), alignés sur le bonhomme
// dessiné plus bas — vue "de face" : la gauche/droite est celle du patient
// qui te fait face (comme les schémas des logiciels de kiné), donc inversée
// par rapport à l'image. Zones fusionnées par grande région (bras, jambe...)
// plutôt qu'articulation par articulation, pour rester lisible même sur une
// journée à plusieurs endroits douloureux (6 zones max, voir zonesDouleur.ts).
const ZONES_FACE: ZoneCorporelle[] = [
  { type: "point", id: "tete-machoire", x: 100, y: 32, grande: true },
  { type: "point", id: "epaule-droite", x: 64, y: 70 },
  { type: "point", id: "epaule-gauche", x: 136, y: 70 },
  { type: "point", id: "torse", x: 100, y: 150, grande: true },
  { type: "membre", id: "bras-droit", trace: [[64, 70], [46, 130], [34, 185]] },
  { type: "membre", id: "bras-gauche", trace: [[136, 70], [154, 130], [166, 185]] },
  { type: "point", id: "main-droite", x: 27, y: 208 },
  { type: "point", id: "main-gauche", x: 173, y: 208 },
  { type: "point", id: "hanche-droite", x: 78, y: 195 },
  { type: "point", id: "hanche-gauche", x: 122, y: 195 },
  { type: "membre", id: "jambe-droite", trace: [[78, 195], [80, 270], [82, 340]] },
  { type: "membre", id: "jambe-gauche", trace: [[122, 195], [120, 270], [118, 340]] },
  { type: "point", id: "pied-droit", x: 78, y: 367 },
  { type: "point", id: "pied-gauche", x: 122, y: 367 },
];

// Vue "de dos" : ici, le patient te tourne le dos plutôt que de te faire
// face — gauche/droite correspond donc directement à l'image, sans
// inversion (contrairement à la vue de face ci-dessus).
const ZONES_DOS: ZoneCorporelle[] = [
  { type: "point", id: "nuque", x: 100, y: 56 },
  { type: "point", id: "dos", x: 100, y: 150, grande: true },
  { type: "point", id: "sacro-iliaque", x: 100, y: 185 },
];

const IDS_HORS_SCHEMA = ["autre-zone"];

interface SchemaCorporelProps {
  zonesSelectionnees: string[];
  onToggleZone: (id: string) => void;
  /**
   * Active un 2e niveau "zone la plus douloureuse de la journée" (2 maximum)
   * sur un cycle à 3 états par appui : sélectionnée → la plus douloureuse →
   * désélectionnée. Laisser absent désactive ce niveau (ex. luxation,
   * subluxation — un événement n'a pas d'intensité à situer).
   */
  zonesPlusDouloureuses?: string[];
  onToggleZonePlusDouloureuse?: (id: string) => void;
}

function couleurZone(plusDouloureuse: boolean): string {
  return plusDouloureuse ? couleurSeverite("haut") : SECTIONS.symptomes.couleur;
}

function libelleEtatZone(id: string, plusDouloureuse: boolean): string {
  const label = labelArticulation(id);
  return plusDouloureuse ? `${label} — zone la plus douloureuse de la journée` : label;
}

function PointHotspot({
  zone,
  actif,
  plusDouloureuse,
  onToggle,
}: {
  zone: ZonePoint;
  actif: boolean;
  plusDouloureuse: boolean;
  onToggle: (id: string) => void;
}) {
  const couleur = couleurZone(plusDouloureuse);
  const libelleEtat = libelleEtatZone(zone.id, plusDouloureuse);
  const taille = zone.grande ? "w-11 h-11" : "w-7 h-7";
  return (
    <button
      type="button"
      onClick={() => onToggle(zone.id)}
      aria-pressed={actif}
      aria-label={libelleEtat}
      title={libelleEtat}
      className={`absolute ${taille} rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform active:scale-90 flex items-center justify-center`}
      style={{
        left: `${(zone.x / 200) * 100}%`,
        top: `${(zone.y / 400) * 100}%`,
        border: `${plusDouloureuse ? 3 : 2}px solid ${couleur}`,
        background: actif ? couleur : "var(--color-surface)",
        boxShadow: "0 1px 4px rgba(58,46,38,0.2)",
      }}
    >
      {plusDouloureuse && (
        <span aria-hidden="true" className="text-[10px] leading-none text-[var(--color-texte-sur-accent)]">
          ★
        </span>
      )}
    </button>
  );
}

/** Style d'une barre reliant deux points du tracé, en pixels dérivés du viewBox (200x400) — la largeur/hauteur en % sont calculées sur la même échelle que le positionnement des points, donc la rotation reste cohérente quel que soit le ratio d'affichage réel. */
function styleSegment(x1: number, y1: number, x2: number, y2: number, epaisseur: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const longueur = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return {
    left: `${((x1 + x2) / 2 / 200) * 100}%`,
    top: `${((y1 + y2) / 2 / 400) * 100}%`,
    width: `${(longueur / 200) * 100}%`,
    height: `${(epaisseur / 400) * 100}%`,
    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
  };
}

/**
 * Rapproche les deux extrémités d'un tracé vers son intérieur, pour que la
 * cible tactile du membre ne recouvre pas les points (épaule, hanche...) qui
 * se trouvent exactement à ces extrémités — sans ce retrait, le bouton
 * invisible du membre passe au-dessus du hotspot du point voisin et bloque
 * son clic.
 */
function retirerExtremites(trace: [number, number][], retrait: number): [number, number][] {
  if (trace.length < 2) return trace;
  const resultat = trace.map((p) => [...p] as [number, number]);
  const rapprocher = (depuis: [number, number], vers: [number, number]) => {
    const dx = vers[0] - depuis[0];
    const dy = vers[1] - depuis[1];
    const longueur = Math.hypot(dx, dy);
    const t = Math.min(retrait, longueur / 2) / longueur;
    return [depuis[0] + dx * t, depuis[1] + dy * t] as [number, number];
  };
  resultat[0] = rapprocher(resultat[0], resultat[1]);
  const derniere = resultat.length - 1;
  resultat[derniere] = rapprocher(resultat[derniere], resultat[derniere - 1]);
  return resultat;
}

/** Zone "membre" (bras, jambe) : colorie le tracé entier plutôt qu'un simple point sur une articulation. Chaque segment porte sa propre cible tactile (au lieu d'un rectangle englobant, qui recouvrirait les points voisins comme l'épaule ou la hanche). */
function MembreZone({
  zone,
  actif,
  plusDouloureuse,
  onToggle,
}: {
  zone: ZoneMembre;
  actif: boolean;
  plusDouloureuse: boolean;
  onToggle: (id: string) => void;
}) {
  const couleur = couleurZone(plusDouloureuse);
  const libelleEtat = libelleEtatZone(zone.id, plusDouloureuse);
  const [xMilieu, yMilieu] = zone.trace[Math.floor(zone.trace.length / 2)];
  const traceCible = retirerExtremites(zone.trace, 18);

  return (
    <>
      {actif &&
        zone.trace.slice(0, -1).map(([x1, y1], i) => {
          const [x2, y2] = zone.trace[i + 1];
          return (
            <div
              key={i}
              aria-hidden="true"
              className="absolute rounded-full pointer-events-none"
              style={{ ...styleSegment(x1, y1, x2, y2, 15), background: couleur, opacity: 0.85 }}
            />
          );
        })}
      {plusDouloureuse && (
        <span
          aria-hidden="true"
          className="absolute -translate-x-1/2 -translate-y-1/2 text-xs pointer-events-none text-[var(--color-texte-sur-accent)]"
          style={{ left: `${(xMilieu / 200) * 100}%`, top: `${(yMilieu / 400) * 100}%` }}
        >
          ★
        </span>
      )}
      {traceCible.slice(0, -1).map(([x1, y1], i) => {
        const [x2, y2] = traceCible[i + 1];
        return (
          <button
            key={i}
            type="button"
            onClick={() => onToggle(zone.id)}
            aria-pressed={actif}
            aria-label={libelleEtat}
            title={libelleEtat}
            className="absolute cursor-pointer"
            style={{ ...styleSegment(x1, y1, x2, y2, 24), background: "transparent" }}
          />
        );
      })}
    </>
  );
}

function Silhouette({ vue }: { vue: Vue }) {
  const trait = "var(--color-bordure)";
  const remplissage = "var(--color-fond-douce)";
  return (
    <svg viewBox="0 0 200 400" className="w-full h-full" aria-hidden="true">
      {vue === "face" ? (
        <>
          <path d="M78 195 L80 270 L82 340 L78 367" stroke={trait} strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M122 195 L120 270 L118 340 L122 367" stroke={trait} strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M64 70 L136 70 L122 195 L78 195 Z" fill={remplissage} stroke={trait} strokeWidth="3" />
          <path d="M64 70 L46 130 L34 185 L27 208" stroke={trait} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M136 70 L154 130 L166 185 L173 208" stroke={trait} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      ) : (
        <>
          <path d="M78 195 L80 270 L82 340 L78 367" stroke={trait} strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M122 195 L120 270 L118 340 L122 367" stroke={trait} strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M64 70 L136 70 L122 195 L78 195 Z" fill={remplissage} stroke={trait} strokeWidth="3" />
          <path d="M64 70 L52 140 L48 195" stroke={trait} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M136 70 L148 140 L152 195" stroke={trait} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      )}
      <rect x="92" y="46" width="16" height="16" fill={remplissage} stroke={trait} strokeWidth="3" />
      <circle cx="100" cy="26" r="20" fill={remplissage} stroke={trait} strokeWidth="3" />
    </svg>
  );
}

/** Sélecteur de zones corporelles par schéma cliquable (face/dos), façon logiciel de kiné. */
export function SchemaCorporel({
  zonesSelectionnees,
  onToggleZone,
  zonesPlusDouloureuses,
  onToggleZonePlusDouloureuse,
}: SchemaCorporelProps) {
  const [vue, setVue] = useState<Vue>("face");
  const zones = vue === "face" ? ZONES_FACE : ZONES_DOS;
  const autresZonesSelectionnees = zonesSelectionnees.filter((id) => IDS_HORS_SCHEMA.includes(id));
  const avecIntensite = zonesPlusDouloureuses !== undefined && onToggleZonePlusDouloureuse !== undefined;
  const onToggle = avecIntensite ? onToggleZonePlusDouloureuse : onToggleZone;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1 rounded-full bg-fond-douce p-1 w-fit">
          {(["face", "dos"] as Vue[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVue(v)}
              aria-pressed={vue === v}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-colors ${
                vue === v ? "bg-ardoise text-[var(--color-texte-sur-accent)]" : "text-texte-doux"
              }`}
            >
              Vue de {v === "face" ? "face" : "dos"}
            </button>
          ))}
        </div>
      </div>

      <div
        role="group"
        aria-label={`Zones concernées, vue de ${vue}`}
        className="relative mx-auto rounded-[var(--rayon-grand)] bg-surface border border-bordure"
        style={{ width: "min(220px, 100%)", aspectRatio: "1 / 2" }}
      >
        <Silhouette vue={vue} />
        {zones.map((zone) =>
          zone.type === "point" ? (
            <PointHotspot
              key={zone.id}
              zone={zone}
              actif={zonesSelectionnees.includes(zone.id)}
              plusDouloureuse={avecIntensite && zonesPlusDouloureuses.includes(zone.id)}
              onToggle={onToggle}
            />
          ) : (
            <MembreZone
              key={zone.id}
              zone={zone}
              actif={zonesSelectionnees.includes(zone.id)}
              plusDouloureuse={avecIntensite && zonesPlusDouloureuses.includes(zone.id)}
              onToggle={onToggle}
            />
          ),
        )}
      </div>

      <div className="flex justify-center mt-3">
        <button
          type="button"
          onClick={() => onToggleZone("autre-zone")}
          aria-pressed={autresZonesSelectionnees.length > 0}
          className="px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors"
          style={{
            borderColor: SECTIONS.symptomes.couleur,
            background: autresZonesSelectionnees.length > 0 ? SECTIONS.symptomes.couleur : "transparent",
            color:
              autresZonesSelectionnees.length > 0
                ? "var(--color-texte-sur-accent)"
                : "var(--color-texte)",
          }}
        >
          Autre zone
        </button>
      </div>

      {avecIntensite && (
        <p className="text-xs text-texte-doux mt-3 text-center">
          Appui 1 : sélectionne ({zonesSelectionnees.length}/{MAX_ZONES_SELECTIONNEES} max) · Appui 2 : ★
          zone la plus douloureuse ({zonesPlusDouloureuses.length}/{MAX_ZONES_PLUS_DOULOUREUSES} max) · Appui
          3 : désélectionne
        </p>
      )}

      {zonesSelectionnees.length > 0 && (
        <p className="text-sm text-texte-doux mt-2 text-center">
          Zone{zonesSelectionnees.length > 1 ? "s" : ""} sélectionnée{zonesSelectionnees.length > 1 ? "s" : ""} :{" "}
          {zonesSelectionnees.map((id) => labelArticulation(id)).join(", ")}
        </p>
      )}

      {avecIntensite && zonesPlusDouloureuses.length > 0 && (
        <p className="text-sm text-texte-doux mt-1 text-center">
          ★ La plus douloureuse : {zonesPlusDouloureuses.map((id) => labelArticulation(id)).join(", ")}
        </p>
      )}
    </div>
  );
}
