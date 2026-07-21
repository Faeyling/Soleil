import { useMemo, useState } from "react";
import type { Entree } from "../../data/types";
import { trouverSuivi } from "../../content/autresSuivis";
import { trouverSymptome } from "../../content/symptomes";
import { calculerCorrelation } from "../../lib/correlations";
import { dateDebutPeriode, type Periode } from "../../lib/periode";

const ACTIVITES = ["kine", "danse", "travail", "activite"];
const CIBLES = ["douleur", "fatigue", "vertiges", "energie", "sommeil-suivi", "humeur", "stress"];

function libelle(id: string): { label: string; icone: string } {
  const suivi = trouverSuivi(id);
  if (suivi) return { label: suivi.label, icone: suivi.icone };
  const symptome = trouverSymptome(id);
  return { label: symptome?.label ?? id, icone: symptome?.icone ?? "•" };
}

function couleurMoyenne(valeur: number): string {
  if (valeur <= 1.5) return "var(--severite-bas)";
  if (valeur <= 2.5) return "var(--severite-moyen)";
  return "var(--severite-haut)";
}

interface BarreProps {
  label: string;
  valeur: number | null;
}

function Barre({ label, valeur }: BarreProps) {
  if (valeur === null) {
    return (
      <div className="flex-1">
        <p className="text-xs text-texte-doux mb-1">{label}</p>
        <p className="text-xs text-texte-doux">Pas de donnée</p>
      </div>
    );
  }
  return (
    <div className="flex-1">
      <p className="text-xs text-texte-doux mb-1">{label}</p>
      <div className="h-2 rounded-full bg-fond-douce overflow-hidden mb-1">
        <div
          className="h-full rounded-full"
          style={{ width: `${(valeur / 3) * 100}%`, background: couleurMoyenne(valeur) }}
        />
      </div>
      <p className="text-sm font-bold" style={{ color: couleurMoyenne(valeur) }}>
        {valeur.toFixed(1)} / 3
      </p>
    </div>
  );
}

interface CorrelationsProps {
  entrees: Entree[];
  periode: Periode;
}

export function Correlations({ entrees, periode }: CorrelationsProps) {
  const [activite, setActivite] = useState(ACTIVITES[0]);
  const [cible, setCible] = useState(CIBLES[0]);

  const dateDebut = dateDebutPeriode(periode);

  const resultat = useMemo(
    () => calculerCorrelation(entrees, activite, cible, dateDebut),
    [entrees, activite, cible, dateDebut],
  );

  const infoActivite = libelle(activite);
  const infoCible = libelle(cible);

  return (
    <div>
      <p className="text-xs text-texte-doux mb-3">
        Compare la sévérité moyenne d'un suivi les jours avec/sans une activité, le jour même et le
        lendemain — utile pour repérer un contrecoup après l'effort.
      </p>

      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={activite}
          onChange={(e) => setActivite(e.target.value)}
          className="flex-1 min-w-[140px] rounded-xl border border-bordure bg-surface px-3 py-2 text-sm cursor-pointer"
          aria-label="Activité"
        >
          {ACTIVITES.map((id) => {
            const info = libelle(id);
            return (
              <option key={id} value={id}>
                {info.icone} {info.label}
              </option>
            );
          })}
        </select>
        <select
          value={cible}
          onChange={(e) => setCible(e.target.value)}
          className="flex-1 min-w-[140px] rounded-xl border border-bordure bg-surface px-3 py-2 text-sm cursor-pointer"
          aria-label="Symptôme ou suivi à comparer"
        >
          {CIBLES.map((id) => {
            const info = libelle(id);
            return (
              <option key={id} value={id}>
                {info.icone} {info.label}
              </option>
            );
          })}
        </select>
      </div>

      {resultat.nombreJoursAvecActivite === 0 ? (
        <p className="text-sm text-texte-doux">
          Pas encore d'entrée « {infoActivite.label} » sur cette période — enregistre quelques jours
          pour voir apparaître une comparaison.
        </p>
      ) : (
        <div className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4 space-y-4">
          <p className="text-xs text-texte-doux">
            {resultat.nombreJoursAvecActivite} jour{resultat.nombreJoursAvecActivite > 1 ? "s" : ""}{" "}
            avec « {infoActivite.label} » sur cette période — comparaison avec « {infoCible.label} ».
          </p>
          <div>
            <p className="text-sm font-semibold mb-2">Le jour même</p>
            <div className="flex gap-4">
              <Barre label={`Avec ${infoActivite.label}`} valeur={resultat.moyenneJourMemeAvec} />
              <Barre label={`Sans ${infoActivite.label}`} valeur={resultat.moyenneJourMemeSans} />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Le lendemain</p>
            <div className="flex gap-4">
              <Barre label={`Après un jour avec`} valeur={resultat.moyenneLendemainAvec} />
              <Barre label={`Après un jour sans`} valeur={resultat.moyenneLendemainSans} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
