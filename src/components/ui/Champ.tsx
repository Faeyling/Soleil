import type { ReactNode } from "react";

interface ChampProps {
  label: string;
  children: ReactNode;
  optionnel?: boolean;
}

export function Champ({ label, children, optionnel = false }: ChampProps) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-semibold mb-1.5 text-texte">
        {label}
        {optionnel && <span className="text-texte-doux font-normal"> (optionnel)</span>}
      </span>
      {children}
    </label>
  );
}

export const classesInput =
  "w-full rounded-[var(--rayon)] border border-bordure bg-surface px-4 py-3 text-base text-texte placeholder:text-texte-doux/60 focus:outline-none focus:ring-2 focus:ring-terracotta";
