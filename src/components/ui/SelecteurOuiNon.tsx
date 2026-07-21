import type { KeyboardEvent } from "react";
import { couleurSeverite } from "../../lib/severite";
import { versSeverite } from "../../lib/ouinon";

interface SelecteurOuiNonProps {
  valeur?: "oui" | "non";
  onChange: (reponse: "oui" | "non") => void;
}

const OPTIONS: ("oui" | "non")[] = ["oui", "non"];

export function SelecteurOuiNon({ valeur, onChange }: SelecteurOuiNonProps) {
  const indexActif = valeur ? OPTIONS.indexOf(valeur) : 0;

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowDown" && e.key !== "ArrowLeft" && e.key !== "ArrowUp") {
      return;
    }
    e.preventDefault();
    const direction = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
    const indexSuivant = (index + direction + OPTIONS.length) % OPTIONS.length;
    const suivant = OPTIONS[indexSuivant];
    onChange(suivant);
    (e.currentTarget.parentElement?.children[indexSuivant] as HTMLElement | undefined)?.focus();
  };

  return (
    <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Oui ou non">
      {OPTIONS.map((reponse, index) => {
        const actif = valeur === reponse;
        const couleur = couleurSeverite(versSeverite(reponse));
        const fond = `color-mix(in srgb, ${couleur} 15%, var(--color-surface))`;
        return (
          <button
            key={reponse}
            type="button"
            role="radio"
            aria-checked={actif}
            tabIndex={index === indexActif ? 0 : -1}
            onClick={() => onChange(reponse)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className="flex-1 min-w-[70px] flex flex-col items-center gap-2 rounded-[var(--rayon)] border-2 py-3 transition-transform active:scale-95 cursor-pointer"
            style={{
              borderColor: actif ? couleur : "var(--color-bordure)",
              background: actif ? fond : "var(--color-surface)",
            }}
          >
            <span className="w-6 h-6 rounded-full" style={{ background: couleur }} />
            <span className="text-sm font-semibold">{reponse === "oui" ? "Oui" : "Non"}</span>
          </button>
        );
      })}
    </div>
  );
}
