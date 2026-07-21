import type { KeyboardEvent } from "react";
import { SEVERITES, LABEL_SEVERITE, couleurSeverite, type Severite } from "../../lib/severite";

interface SelecteurSeveriteProps {
  valeur?: Severite;
  onChange: (s: Severite) => void;
  /** Slug de l'élément suivi (ex. "sommeil") — détermine si l'échelle de couleur est inversée. */
  itemId?: string;
}

export function SelecteurSeverite({ valeur, onChange, itemId }: SelecteurSeveriteProps) {
  // Roving tabindex (pattern ARIA radiogroup) : seule l'option sélectionnée
  // (ou la première à défaut) est atteignable au Tab ; les flèches déplacent
  // le focus — et la sélection — entre les options du groupe.
  const indexActif = valeur ? SEVERITES.indexOf(valeur) : 0;

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowDown" && e.key !== "ArrowLeft" && e.key !== "ArrowUp") {
      return;
    }
    e.preventDefault();
    const direction = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
    const indexSuivant = (index + direction + SEVERITES.length) % SEVERITES.length;
    const suivant = SEVERITES[indexSuivant];
    onChange(suivant);
    (e.currentTarget.parentElement?.children[indexSuivant] as HTMLElement | undefined)?.focus();
  };

  return (
    <div className="flex gap-3" role="radiogroup" aria-label="Sévérité">
      {SEVERITES.map((s, index) => {
        const actif = valeur === s;
        const couleur = couleurSeverite(s, itemId);
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={actif}
            tabIndex={index === indexActif ? 0 : -1}
            onClick={() => onChange(s)}
            onKeyDown={(e) => onKeyDown(e, index)}
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
