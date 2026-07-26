interface SelecteurOuiNonProps {
  valeur?: "oui" | "non";
  onChange: (reponse: "oui" | "non") => void;
  /** Texte affiché à côté de la case (ex. "Oui, aujourd'hui"). */
  label?: string;
}

/** Événement Oui/Non (ex. luxation, subluxation) : une case à cocher pour signaler sa présence — non cochée = non. */
export function SelecteurOuiNon({ valeur, onChange, label = "Oui" }: SelecteurOuiNonProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={valeur === "oui"}
        onChange={(e) => onChange(e.target.checked ? "oui" : "non")}
        className="w-6 h-6 accent-[var(--color-ardoise)]"
      />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}
