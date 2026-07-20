import type { ReactNode } from "react";

interface CarteProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Carte({ children, className = "", onClick }: CarteProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`block w-full text-left rounded-[var(--rayon-grand)] bg-surface p-4 shadow-[var(--ombre)] border border-bordure ${
        onClick ? "cursor-pointer transition-transform active:scale-[0.98] hover:shadow-[var(--ombre-forte)]" : ""
      } ${className}`}
    >
      {children}
    </Tag>
  );
}

interface CarteElementProps {
  icone: string;
  label: string;
  couleur: string;
  onClick: () => void;
}

/** Carte compacte icône + libellé, utilisée dans les grilles de sélection. */
export function CarteElement({ icone, label, couleur, onClick }: CarteElementProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 rounded-[var(--rayon)] bg-surface border border-bordure p-4 text-center shadow-[var(--ombre)] transition-transform active:scale-[0.96] hover:shadow-[var(--ombre-forte)] cursor-pointer min-h-[104px]"
    >
      <span
        className="flex items-center justify-center w-11 h-11 rounded-full text-xl"
        style={{ background: couleur }}
      >
        {icone}
      </span>
      <span className="text-sm font-medium leading-tight">{label}</span>
    </button>
  );
}
