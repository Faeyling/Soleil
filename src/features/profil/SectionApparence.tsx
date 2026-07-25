import { useState } from "react";
import { getThemePreference, setThemePreference, type Theme } from "../../lib/theme";
import { getTailleTextePreference, setTailleTextePreference, type TailleTexte } from "../../lib/tailleTexte";

const OPTIONS: { valeur: Theme; label: string }[] = [
  { valeur: "clair", label: "Clair" },
  { valeur: "sombre", label: "Sombre" },
  { valeur: "systeme", label: "Système" },
];

const OPTIONS_TAILLE: { valeur: TailleTexte; label: string }[] = [
  { valeur: "normale", label: "Normale" },
  { valeur: "grande", label: "Grande" },
];

export function SectionApparence() {
  const [theme, setTheme] = useState<Theme>(getThemePreference);
  const [tailleTexte, setTailleTexte] = useState<TailleTexte>(getTailleTextePreference);

  const choisir = (valeur: Theme) => {
    setTheme(valeur);
    setThemePreference(valeur);
  };

  const choisirTaille = (valeur: TailleTexte) => {
    setTailleTexte(valeur);
    setTailleTextePreference(valeur);
  };

  return (
    <section className="mb-8">
      <h2 className="font-bold text-lg mb-3">Apparence</h2>
      <div className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4">
        <p className="text-sm text-texte-doux mb-3">
          Choisis l'apparence de Soleil, ou laisse-le suivre le réglage de ton appareil.
        </p>
        <div className="flex gap-1 rounded-full bg-fond-douce p-1 w-fit mb-4">
          {OPTIONS.map((o) => (
            <button
              key={o.valeur}
              onClick={() => choisir(o.valeur)}
              aria-pressed={theme === o.valeur}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-colors ${
                theme === o.valeur ? "bg-ardoise text-[var(--color-texte-sur-accent)]" : "text-texte-doux"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <p className="text-sm text-texte-doux mb-3">
          Taille du texte et de l'interface, utile en période de fatigue visuelle.
        </p>
        <div className="flex gap-1 rounded-full bg-fond-douce p-1 w-fit">
          {OPTIONS_TAILLE.map((o) => (
            <button
              key={o.valeur}
              onClick={() => choisirTaille(o.valeur)}
              aria-pressed={tailleTexte === o.valeur}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-colors ${
                tailleTexte === o.valeur ? "bg-ardoise text-[var(--color-texte-sur-accent)]" : "text-texte-doux"
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
