import type { ReactNode } from "react";

interface ActionRondeProps {
  icone: ReactNode;
  label: string;
  couleur: string;
  onClick: () => void;
}

export function ActionRonde({ icone, label, couleur, onClick }: ActionRondeProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 cursor-pointer group"
    >
      <span
        className="flex items-center justify-center w-16 h-16 rounded-full text-2xl text-white shadow-[var(--ombre-forte)] transition-transform group-active:scale-90"
        style={{ background: couleur }}
      >
        {icone}
      </span>
      <span className="text-xs font-semibold text-center max-w-[80px] leading-tight">{label}</span>
    </button>
  );
}
