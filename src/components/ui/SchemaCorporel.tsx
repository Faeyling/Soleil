import { useState } from "react";
import { labelArticulation } from "../../content/symptomes";
import { SECTIONS } from "../../lib/sections";
import { couleurSeverite } from "../../lib/severite";
import { MAX_ZONES_PLUS_DOULOUREUSES } from "../../lib/zonesDouleur";

type Vue = "face" | "dos";

interface Point {
  id: string;
  x: number;
  y: number;
}

// Repères en coordonnées du viewBox (0 0 200 400), alignés sur les points du
// bonhomme dessiné plus bas — vue "de face" : la gauche/droite est celle du
// patient qui te fait face (comme les schémas des logiciels de kiné), donc
// inversée par rapport à l'image.
const ZONES_FACE: Point[] = [
  { id: "machoire", x: 100, y: 40 },
  { id: "epaule-droite", x: 64, y: 70 },
  { id: "epaule-gauche", x: 136, y: 70 },
  { id: "cotes-droite", x: 75, y: 140 },
  { id: "cotes-gauche", x: 125, y: 140 },
  { id: "ventre", x: 100, y: 175 },
  { id: "bras-droit", x: 55, y: 100 },
  { id: "bras-gauche", x: 145, y: 100 },
  { id: "coude-droit", x: 46, y: 130 },
  { id: "coude-gauche", x: 154, y: 130 },
  { id: "avant-bras-droit", x: 40, y: 158 },
  { id: "avant-bras-gauche", x: 160, y: 158 },
  { id: "poignet-droit", x: 34, y: 185 },
  { id: "poignet-gauche", x: 166, y: 185 },
  { id: "doigts-droit", x: 27, y: 208 },
  { id: "doigts-gauche", x: 173, y: 208 },
  { id: "hanche-droite", x: 78, y: 195 },
  { id: "hanche-gauche", x: 122, y: 195 },
  { id: "cuisse-droite", x: 79, y: 233 },
  { id: "cuisse-gauche", x: 121, y: 233 },
  { id: "genou-droit", x: 80, y: 270 },
  { id: "genou-gauche", x: 120, y: 270 },
  { id: "jambe-droite", x: 81, y: 305 },
  { id: "jambe-gauche", x: 119, y: 305 },
  { id: "cheville-droite", x: 82, y: 340 },
  { id: "cheville-gauche", x: 118, y: 340 },
  { id: "pied-orteils-droit", x: 78, y: 367 },
  { id: "pied-orteils-gauche", x: 122, y: 367 },
];

// Vue "de dos" : ici, le patient te tourne le dos plutôt que de te faire
// face — gauche/droite correspond donc directement à l'image, sans
// inversion (contrairement à la vue de face ci-dessus).
const ZONES_DOS: Point[] = [
  { id: "nuque-cervicales", x: 100, y: 56 },
  { id: "dos", x: 100, y: 150 },
  { id: "sacro-iliaque-gauche", x: 90, y: 185 },
  { id: "sacro-iliaque-droite", x: 110, y: 185 },
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

function Hotspot({
  point,
  actif,
  plusDouloureuse,
  onToggle,
}: {
  point: Point;
  actif: boolean;
  plusDouloureuse: boolean;
  onToggle: (id: string) => void;
}) {
  const couleur = plusDouloureuse ? couleurSeverite("haut") : SECTIONS.symptomes.couleur;
  const label = labelArticulation(point.id);
  const libelleEtat = plusDouloureuse ? `${label} — zone la plus douloureuse de la journée` : label;
  return (
    <button
      type="button"
      onClick={() => onToggle(point.id)}
      aria-pressed={actif}
      aria-label={libelleEtat}
      title={libelleEtat}
      className="absolute w-7 h-7 rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform active:scale-90 flex items-center justify-center"
      style={{
        left: `${(point.x / 200) * 100}%`,
        top: `${(point.y / 400) * 100}%`,
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
  const points = vue === "face" ? ZONES_FACE : ZONES_DOS;
  const autresZonesSelectionnees = zonesSelectionnees.filter((id) => IDS_HORS_SCHEMA.includes(id));
  const avecIntensite = zonesPlusDouloureuses !== undefined && onToggleZonePlusDouloureuse !== undefined;

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
        {points.map((point) => (
          <Hotspot
            key={point.id}
            point={point}
            actif={zonesSelectionnees.includes(point.id)}
            plusDouloureuse={avecIntensite && zonesPlusDouloureuses.includes(point.id)}
            onToggle={avecIntensite ? onToggleZonePlusDouloureuse : onToggleZone}
          />
        ))}
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
          Appui 1 : sélectionne · Appui 2 : ★ zone la plus douloureuse ({zonesPlusDouloureuses.length}/
          {MAX_ZONES_PLUS_DOULOUREUSES} max) · Appui 3 : désélectionne
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
