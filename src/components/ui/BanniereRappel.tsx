import type { ReactNode } from "react";

interface BanniereRappelProps {
  icone: ReactNode;
  texte: ReactNode;
  labelAction: string;
  onAction: () => void;
  onIgnorer: () => void;
  couleur: string;
  couleurClaire: string;
}

export function BanniereRappel({
  icone,
  texte,
  labelAction,
  onAction,
  onIgnorer,
  couleur,
  couleurClaire,
}: BanniereRappelProps) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-[var(--rayon-grand)] p-4 mb-4"
      style={{ background: couleurClaire }}
    >
      <span className="text-xl flex-shrink-0" aria-hidden="true">
        {icone}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm mb-2" style={{ color: couleur }}>
          {texte}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onAction}
            className="text-sm font-semibold underline cursor-pointer"
            style={{ color: couleur }}
          >
            {labelAction}
          </button>
          <button
            onClick={onIgnorer}
            className="text-sm text-texte-doux underline cursor-pointer"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
