interface BarreProgressionProps {
  etape: number;
  total: number;
  couleur: string;
}

export function BarreProgression({ etape, total, couleur }: BarreProgressionProps) {
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold text-texte-doux mb-1.5">
        <span>
          Étape {etape}/{total}
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-fond-douce overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(etape / total) * 100}%`, background: couleur }}
        />
      </div>
    </div>
  );
}
