import { SEVERITES, LABEL_SEVERITE, COULEUR_SEVERITE, type Severite } from "../../lib/severite";

interface SelecteurSeveriteProps {
  valeur?: Severite;
  onChange: (s: Severite) => void;
}

export function SelecteurSeverite({ valeur, onChange }: SelecteurSeveriteProps) {
  return (
    <div className="flex gap-3" role="radiogroup" aria-label="Sévérité">
      {SEVERITES.map((s) => {
        const actif = valeur === s;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => onChange(s)}
            className="flex-1 flex flex-col items-center gap-2 rounded-[var(--rayon)] border-2 py-3 transition-transform active:scale-95 cursor-pointer"
            style={{
              borderColor: actif ? COULEUR_SEVERITE[s] : "var(--color-bordure)",
              background: actif ? COULEUR_SEVERITE[s] + "22" : "var(--color-surface)",
            }}
          >
            <span
              className="w-6 h-6 rounded-full"
              style={{ background: COULEUR_SEVERITE[s] }}
            />
            <span className="text-sm font-semibold">{LABEL_SEVERITE[s]}</span>
          </button>
        );
      })}
    </div>
  );
}
