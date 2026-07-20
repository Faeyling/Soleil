interface CaseImportanteProps {
  valeur: boolean;
  onChange: (v: boolean) => void;
}

export function CaseImportante({ valeur, onChange }: CaseImportanteProps) {
  return (
    <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={valeur}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 accent-[var(--color-terracotta)]"
      />
      <span className="text-sm font-medium">
        ⭐ Marquer comme importante (incluse en priorité dans le rapport pour le médecin)
      </span>
    </label>
  );
}
