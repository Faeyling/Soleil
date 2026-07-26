import { couleurSeverite } from "../../lib/severite";
import { severiteDepuisEva } from "../../lib/eva";

interface NiveauDouleur {
  eva: number;
  titre: string;
  description: string;
}

/**
 * Ancrages fonctionnels plutôt qu'un chiffre nu à choisir dans l'abstrait —
 * inspirés de la Functional Pain Scale (Gloth et al., 2001), conçue
 * justement parce qu'une douleur chronique déjà présente en permanence rend
 * une note 0-10 abstraite difficile à situer. Chaque niveau décrit un impact
 * concret sur la journée plutôt qu'une intensité ressentie dans le vide.
 */
const NIVEAUX_DOULEUR: NiveauDouleur[] = [
  {
    eva: 0,
    titre: "Aucune douleur",
    description: "Pas de douleur aujourd'hui, journée normale.",
  },
  {
    eva: 2,
    titre: "Légère — n'empêche rien",
    description: "Je la sens si j'y pense, mais ça ne change rien à ce que je fais.",
  },
  {
    eva: 4,
    titre: "Modérée — je dois composer avec",
    description: "Je fais l'essentiel, mais j'évite ou je reporte certains gestes, certaines activités.",
  },
  {
    eva: 6,
    titre: "Forte — mais je peux encore me distraire",
    description: "Je peux encore téléphoner, lire ou suivre un écran malgré la douleur.",
  },
  {
    eva: 8,
    titre: "Sévère — je ne peux plus me distraire",
    description: "Impossible de téléphoner, lire ou suivre un écran : la douleur prend toute la place.",
  },
  {
    eva: 10,
    titre: "Extrême — crise",
    description: "La douleur empêche même de parler ou de répondre. Besoin d'aide immédiate.",
  },
];

interface SelecteurEvaProps {
  valeur?: number;
  onChange: (v: number) => void;
}

/** Douleur : sélection par description de l'impact quotidien plutôt que par chiffre — la note EVA (0-10) en est déduite. */
export function SelecteurEva({ valeur, onChange }: SelecteurEvaProps) {
  return (
    <div>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Niveau de douleur, décrit par son impact au quotidien">
        {NIVEAUX_DOULEUR.map((niveau) => {
          const actif = valeur === niveau.eva;
          const couleur = couleurSeverite(severiteDepuisEva(niveau.eva));
          const fondActif = `color-mix(in srgb, ${couleur} 15%, var(--color-surface))`;
          return (
            <button
              key={niveau.eva}
              type="button"
              role="radio"
              aria-checked={actif}
              onClick={() => onChange(niveau.eva)}
              className="flex items-start gap-3 rounded-[var(--rayon)] border-2 px-3 py-2.5 text-left transition-transform active:scale-[0.98] cursor-pointer"
              style={{
                borderColor: actif ? couleur : "var(--color-bordure)",
                background: actif ? fondActif : "var(--color-surface)",
              }}
            >
              <span className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ background: couleur }} aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{niveau.titre}</span>
                <span className="block text-xs text-texte-doux mt-0.5">{niveau.description}</span>
              </span>
            </button>
          );
        })}
      </div>
      {valeur !== undefined && (
        <p className="text-xs text-texte-doux mt-2 text-center">Note EVA enregistrée : {valeur}/10</p>
      )}
    </div>
  );
}
