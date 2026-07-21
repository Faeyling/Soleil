import { SEVERITES, LABEL_SEVERITE, couleurSeverite, type Severite } from "../../lib/severite";

interface SelecteurSeveriteProps {
  valeur?: Severite;
  onChange: (s: Severite) => void;
  /** Slug de l'élément suivi (ex. "sommeil") — détermine si l'échelle de couleur est inversée. */
  itemId?: string;
}

export function SelecteurSeverite({ valeur, onChange, itemId }: SelecteurSeveriteProps) {
  return (
    <div className="flex gap-3" role="radiogroup" aria-label="Sévérité">
      {SEVERITES.map((s) => {
        const actif = valeur === s;
        const couleur = couleurSeverite(s, itemId);
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => onChange(s)}
            className="flex-1 flex flex-col items-center gap-2 rounded-[var(--rayon)] border-2 py-3 transition-transform active:scale-95 cursor-pointer"
            style={{
              borderColor: actif ? couleur : "var(--color-bordure)",
              background: actif ? `color-mix(in srgb, ${couleur} 15%, var(--color-surface))` : "var(--color-surface)",
            }}
          >
            <span className="w-6 h-6 rounded-full" style={{ background: couleur }} />
            <span className="text-sm font-semibold">{LABEL_SEVERITE[s]}</span>
          </button>
        );
      })}
    </div>
  );
}
