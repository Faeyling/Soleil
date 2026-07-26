import { couleurSeverite } from "../../lib/severite";
import { severiteDepuisEva, EVA_MIN, EVA_MAX } from "../../lib/eva";

interface SelecteurEvaProps {
  valeur?: number;
  onChange: (v: number) => void;
}

/** Échelle Visuelle Analogique (EVA) : curseur de 0 à 10, la note de douleur standard en pratique clinique. */
export function SelecteurEva({ valeur, onChange }: SelecteurEvaProps) {
  const actif = valeur !== undefined;
  const couleur = actif ? couleurSeverite(severiteDepuisEva(valeur)) : "var(--color-bordure)";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-texte-doux">Échelle Visuelle Analogique (EVA)</span>
        <span className="text-lg font-bold tabular-nums" style={{ color: couleur }}>
          {actif ? valeur : "—"} / 10
        </span>
      </div>
      <input
        type="range"
        min={EVA_MIN}
        max={EVA_MAX}
        step={1}
        value={valeur ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: couleur, width: "100%" }}
        aria-label="Douleur, échelle EVA de 0 à 10"
        aria-valuetext={actif ? `${valeur} sur 10` : "Pas encore répondu"}
      />
      <div className="flex justify-between text-[10px] text-texte-doux mt-1">
        <span>0 · Aucune douleur</span>
        <span>10 · Pire douleur imaginable</span>
      </div>
    </div>
  );
}
