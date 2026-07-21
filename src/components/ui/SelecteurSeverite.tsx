import type { KeyboardEvent } from "react";
import { labelSeverite, descriptionSeverite, couleurSeverite, severitesDisponibles, type Severite } from "../../lib/severite";

interface SelecteurSeveriteProps {
  valeur?: Severite;
  onChange: (s: Severite) => void;
  /** Slug de l'élément suivi (ex. "sommeil") — détermine le libellé personnalisé et l'ajout du niveau "Crise". */
  itemId?: string;
}

export function SelecteurSeverite({ valeur, onChange, itemId }: SelecteurSeveriteProps) {
  const options = severitesDisponibles(itemId);
  const description = descriptionSeverite(itemId);

  // Roving tabindex (pattern ARIA radiogroup) : seule l'option sélectionnée
  // (ou la première à défaut) est atteignable au Tab ; les flèches déplacent
  // le focus — et la sélection — entre les options du groupe.
  const indexActif = valeur ? options.indexOf(valeur) : 0;

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowDown" && e.key !== "ArrowLeft" && e.key !== "ArrowUp") {
      return;
    }
    e.preventDefault();
    const direction = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
    const indexSuivant = (index + direction + options.length) % options.length;
    const suivant = options[indexSuivant];
    onChange(suivant);
    (e.currentTarget.parentElement?.children[indexSuivant] as HTMLElement | undefined)?.focus();
  };

  return (
    <div>
      <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Sévérité">
        {options.map((s, index) => {
          const actif = valeur === s;
          const couleur = couleurSeverite(s);
          // "Crise" a son propre fond clair dédié (rose de la palette) plutôt
          // que la teinte automatique dérivée de sa couleur, pour rester
          // lisible sans virer au magenta.
          const fondActif =
            s === "crise" ? "var(--color-crise-clair)" : `color-mix(in srgb, ${couleur} 15%, var(--color-surface))`;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={actif}
              tabIndex={index === indexActif ? 0 : -1}
              onClick={() => onChange(s)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className="flex-1 min-w-[70px] flex flex-col items-center gap-2 rounded-[var(--rayon)] border-2 py-3 transition-transform active:scale-95 cursor-pointer"
              style={{
                borderColor: actif ? couleur : "var(--color-bordure)",
                background: actif ? fondActif : "var(--color-surface)",
              }}
            >
              <span className="w-6 h-6 rounded-full" style={{ background: couleur }} />
              <span className="text-sm font-semibold">{labelSeverite(s, itemId)}</span>
            </button>
          );
        })}
      </div>
      {description && <p className="text-xs text-texte-doux mt-2">{description}</p>}
    </div>
  );
}
