import { couleurSeverite } from "../../lib/severite";
import { severiteDepuisEva } from "../../lib/eva";

interface NiveauDouleur {
  eva: number;
  titre: string;
  description: string;
}

/**
 * Ancrages fonctionnels plutôt qu'un chiffre nu à choisir dans l'abstrait —
 * mais chaque niveau garde un sens fixe et objectif, comme une échelle
 * clinique standard (à la manière des échelles couleur utilisées en douleur
 * chronique). Redéfinir un niveau selon "l'habitude" de la personne (ex.
 * faire de 2 sa référence personnelle) rendrait le suivi inutilisable pour
 * repérer une vraie aggravation dans le temps : le "2" dériverait avec le
 * ressenti plutôt que de rester un repère stable sur le graphique et le
 * rapport PDF. Les 11 niveaux (0 à 10) couvrent chaque point de l'échelle,
 * avec un impact mesuré sur la mobilité et le besoin de pause — plus
 * parlant pour le SEDh que la lecture/les écrans d'une première version
 * inspirée de la Functional Pain Scale.
 */
const NIVEAUX_DOULEUR: NiveauDouleur[] = [
  { eva: 0, titre: "Aucune douleur", description: "Pas de douleur du tout." },
  { eva: 1, titre: "Très légère", description: "Douleur à peine perceptible, en arrière-plan." },
  { eva: 2, titre: "Légère", description: "Je la remarque si j'y pense, elle n'empêche aucune activité." },
  { eva: 3, titre: "Légère à modérée", description: "Présente en continu, mais je fais tout comme d'habitude." },
  { eva: 4, titre: "Modérée", description: "Je ne peux plus l'ignorer complètement, je ralentis un peu." },
  { eva: 5, titre: "Modérée à forte", description: "J'évite certains mouvements ou certaines postures." },
  { eva: 6, titre: "Forte", description: "Difficile à ignorer plus de quelques minutes." },
  { eva: 7, titre: "Forte à sévère", description: "Je dois m'arrêter, me poser, revoir mes plans." },
  { eva: 8, titre: "Sévère", description: "Bouger, rester debout ou utiliser mes mains devient très difficile." },
  { eva: 9, titre: "Très sévère", description: "J'ai besoin d'aide, je ne peux presque plus rien faire seul·e." },
  { eva: 10, titre: "Extrême — crise", description: "Douleur insupportable, incapacitante. Besoin d'aide immédiate." },
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
