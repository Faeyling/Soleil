import { useState } from "react";
import { getThemePreference, setThemePreference, type Theme } from "../../lib/theme";

const OPTIONS: { valeur: Theme; label: string }[] = [
  { valeur: "clair", label: "Clair" },
  { valeur: "sombre", label: "Sombre" },
  { valeur: "systeme", label: "Système" },
];

export function SectionApparence() {
  const [theme, setTheme] = useState<Theme>(getThemePreference);

  const choisir = (valeur: Theme) => {
    setTheme(valeur);
    setThemePreference(valeur);
  };

  return (
    <section className="mb-8">
      <h2 className="font-bold text-lg mb-3">Apparence</h2>
      <div className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4">
        <p className="text-sm text-texte-doux mb-3">
          Choisis l'apparence de Soleil, ou laisse-le suivre le réglage de ton appareil.
        </p>
        <div className="flex gap-1 rounded-full bg-fond-douce p-1 w-fit">
          {OPTIONS.map((o) => (
            <button
              key={o.valeur}
              onClick={() => choisir(o.valeur)}
              aria-pressed={theme === o.valeur}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-colors ${
                theme === o.valeur ? "bg-terracotta text-[var(--color-texte-sur-accent)]" : "text-texte-doux"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
