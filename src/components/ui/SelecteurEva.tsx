import { couleurSeverite } from "../../lib/severite";
import { severiteDepuisEva } from "../../lib/eva";

interface NiveauDouleur {
  eva: number;
  titre: string;
  description: string;
}

/**
 * Ancrages fonctionnels plutôt qu'un chiffre nu à choisir dans l'abstrait,
 * bâtis autour de la douleur de fond plutôt que d'un "0" rarement atteint en
 * douleur chronique : le niveau 2 sert de référence ("mon niveau habituel"),
 * les suivants décrivent un écart croissant par rapport à cette base plutôt
 * qu'une intensité absolue. Impact mesuré sur la mobilité et le besoin de
 * repos/pause — plus parlant pour le SEDh que la lecture/les écrans (repris
 * d'une première version inspirée de la Functional Pain Scale de Gloth et
 * al., pensée pour un contexte plus proche de la douleur aiguë).
 */
const NIVEAUX_DOULEUR: NiveauDouleur[] = [
  {
    eva: 0,
    titre: "Aucune douleur",
    description: "Vraiment aucune douleur aujourd'hui — rare, mais ça arrive.",
  },
  {
    eva: 2,
    titre: "Mon niveau habituel",
    description: "C'est ma douleur de tous les jours, je vis normalement avec.",
  },
  {
    eva: 4,
    titre: "Plus que d'habitude",
    description: "Je ralentis, j'évite certains mouvements ou certaines postures.",
  },
  {
    eva: 6,
    titre: "Bien plus que d'habitude",
    description: "Je dois m'arrêter, me poser, revoir mes plans de la journée.",
  },
  {
    eva: 8,
    titre: "Débordée par la douleur",
    description: "Bouger, rester debout ou utiliser mes mains devient très difficile.",
  },
  {
    eva: 10,
    titre: "Extrême — crise",
    description: "Douleur insupportable, je ne peux presque plus bouger ni communiquer. Besoin d'aide immédiate.",
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
