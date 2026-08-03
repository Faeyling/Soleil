import { couleurSeverite } from "../../lib/severite";
import { severiteDepuisEva } from "../../lib/eva";

interface NiveauImpact {
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
 * chacun avec un impact fonctionnel mesuré et propre au symptôme (mobilité
 * pour la douleur, énergie pour la fatigue, équilibre pour les vertiges) —
 * plus parlant pour le SEDh qu'un chiffre nu.
 */
const NIVEAUX_DOULEUR: NiveauImpact[] = [
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

const NIVEAUX_FATIGUE: NiveauImpact[] = [
  { eva: 0, titre: "Aucune fatigue", description: "Pas de fatigue du tout." },
  { eva: 1, titre: "Très légère", description: "Fatigue à peine perceptible, en arrière-plan." },
  { eva: 2, titre: "Légère", description: "Je la remarque si j'y pense, elle n'empêche aucune activité." },
  { eva: 3, titre: "Légère à modérée", description: "Présente en continu, mais je fais tout comme d'habitude." },
  { eva: 4, titre: "Modérée", description: "Je ne peux plus l'ignorer complètement, je ralentis un peu." },
  { eva: 5, titre: "Modérée à forte", description: "Je dois faire des pauses régulières dans la journée." },
  { eva: 6, titre: "Forte", description: "Difficile de maintenir une activité plus de quelques minutes." },
  { eva: 7, titre: "Forte à sévère", description: "Je dois annuler ou reporter des activités prévues." },
  { eva: 8, titre: "Sévère", description: "Rester debout, me concentrer ou tenir une conversation devient très difficile." },
  { eva: 9, titre: "Très sévère", description: "J'ai besoin d'aide pour les gestes du quotidien." },
  { eva: 10, titre: "Extrême — épuisement total", description: "Épuisement total, incapable de sortir du lit." },
];

const NIVEAUX_VERTIGES: NiveauImpact[] = [
  { eva: 0, titre: "Aucun vertige", description: "Pas de vertige du tout." },
  { eva: 1, titre: "Très léger", description: "Sensation à peine perceptible, en arrière-plan." },
  { eva: 2, titre: "Léger", description: "Je le remarque si j'y pense, ça n'empêche aucun déplacement." },
  { eva: 3, titre: "Léger à modéré", description: "Présent en continu, mais je me déplace normalement." },
  { eva: 4, titre: "Modéré", description: "Je ralentis mes mouvements et évite de tourner la tête trop vite." },
  { eva: 5, titre: "Modéré à fort", description: "J'évite de me lever brusquement ou de changer de position vite." },
  { eva: 6, titre: "Fort", description: "Je dois m'appuyer ou me tenir à quelque chose pour rester stable." },
  { eva: 7, titre: "Fort à sévère", description: "Je dois m'asseoir ou m'allonger pour que ça passe." },
  { eva: 8, titre: "Sévère", description: "Marcher ou rester debout devient très difficile." },
  { eva: 9, titre: "Très sévère", description: "J'ai besoin d'aide pour me déplacer." },
  { eva: 10, titre: "Extrême — crise", description: "Vertige incapacitant, impossible de bouger sans risque de chute." },
];

const NIVEAUX_PAR_ITEM: Record<string, NiveauImpact[]> = {
  douleur: NIVEAUX_DOULEUR,
  fatigue: NIVEAUX_FATIGUE,
  vertiges: NIVEAUX_VERTIGES,
};

interface SelecteurEvaProps {
  /** Slug du symptôme (ex. "douleur", "fatigue", "vertiges") — détermine le jeu de descriptions ; retombe sur celles de la douleur si l'item n'a pas d'échelle dédiée. */
  itemId: string;
  valeur?: number;
  onChange: (v: number) => void;
}

/** Sélection par description de l'impact quotidien plutôt que par chiffre — la note (0-10) en est déduite. */
export function SelecteurEva({ itemId, valeur, onChange }: SelecteurEvaProps) {
  const niveaux = NIVEAUX_PAR_ITEM[itemId] ?? NIVEAUX_DOULEUR;
  return (
    <div>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Niveau d'impact, décrit par son effet au quotidien">
        {niveaux.map((niveau) => {
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
        <p className="text-xs text-texte-doux mt-2 text-center">Note enregistrée : {valeur}/10</p>
      )}
    </div>
  );
}
