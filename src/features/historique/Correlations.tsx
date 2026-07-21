import { useMemo, useState } from "react";
import type { Entree, Medicament } from "../../data/types";
import { AUTRES_SUIVIS, trouverSuivi } from "../../content/autresSuivis";
import { SYMPTOMES, trouverSymptome } from "../../content/symptomes";
import { useMedicaments } from "../../hooks/useMedicaments";
import { calculerCorrelation } from "../../lib/correlations";
import { severitesDisponibles } from "../../lib/severite";
import { dateDebutPeriode, type Periode } from "../../lib/periode";

const CLE_ACTIVITE = "soleil-correlation-activite";
const CLE_CIBLE = "soleil-correlation-cible";

// "Activité" (l'influence testée) : tout ce qui peut être enregistré un jour
// donné — symptômes, autres suivis (quel que soit leur type de formulaire) et
// médicaments — puisqu'on ne teste que sa présence ce jour-là, pas sa valeur.
const SUIVIS_SELECTIONNABLES = AUTRES_SUIVIS.filter((s) => !s.masque);

// "Cible" (ce qu'on compare) : seuls les éléments notés par sévérité ont une
// valeur moyennable — symptômes (toujours notés en sévérité) et suivis dont
// le formulaire est "severite".
const SUIVIS_AVEC_SEVERITE = AUTRES_SUIVIS.filter((s) => s.typeFormulaire === "severite");

function libelle(id: string, medicaments: Medicament[]): { label: string; icone: string } {
  const suivi = trouverSuivi(id);
  if (suivi) return { label: suivi.label, icone: suivi.icone };
  const symptome = trouverSymptome(id);
  if (symptome) return { label: symptome.label, icone: symptome.icone };
  const medicament = medicaments.find((m) => m.id === id);
  if (medicament) return { label: medicament.nom, icone: "💊" };
  return { label: id, icone: "•" };
}

function couleurMoyenne(valeur: number, max: number): string {
  if (valeur <= max * 0.5) return "var(--severite-bas)";
  if (valeur <= max * (2.5 / 3)) return "var(--severite-moyen)";
  return "var(--severite-haut)";
}

interface BarreProps {
  label: string;
  valeur: number | null;
  max: number;
}

function Barre({ label, valeur, max }: BarreProps) {
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
          style={{ width: `${(valeur / max) * 100}%`, background: couleurMoyenne(valeur, max) }}
        />
      </div>
      <p className="text-sm font-bold" style={{ color: couleurMoyenne(valeur, max) }}>
        {valeur.toFixed(1)} / {max}
      </p>
    </div>
  );
}

interface CorrelationsProps {
  entrees: Entree[];
  periode: Periode;
}

export function Correlations({ entrees, periode }: CorrelationsProps) {
  const medicaments = useMedicaments();
  const [activite, setActivite] = useState(() => localStorage.getItem(CLE_ACTIVITE) ?? "kine");
  const [cible, setCible] = useState(() => localStorage.getItem(CLE_CIBLE) ?? "douleur");

  const changerActivite = (id: string) => {
    setActivite(id);
    localStorage.setItem(CLE_ACTIVITE, id);
  };
  const changerCible = (id: string) => {
    setCible(id);
    localStorage.setItem(CLE_CIBLE, id);
  };

  const dateDebut = dateDebutPeriode(periode);

  const resultat = useMemo(
    () => calculerCorrelation(entrees, activite, cible, dateDebut),
    [entrees, activite, cible, dateDebut],
  );

  const infoActivite = libelle(activite, medicaments);
  const infoCible = libelle(cible, medicaments);
  const maxCible = severitesDisponibles(cible).length;

  return (
    <div>
      <p className="text-xs text-texte-doux mb-3">
        Compare la sévérité moyenne d'un suivi les jours avec/sans une activité, le jour même et le
        lendemain — utile pour repérer un contrecoup après l'effort. Choisis n'importe quelle paire
        d'éléments que tu suis.
      </p>

      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={activite}
          onChange={(e) => changerActivite(e.target.value)}
          className="flex-1 min-w-[140px] rounded-xl border border-bordure bg-surface px-3 py-2 text-sm cursor-pointer"
          aria-label="Activité"
        >
          <optgroup label="Symptômes">
            {SYMPTOMES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icone} {s.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Autres suivis">
            {SUIVIS_SELECTIONNABLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icone} {s.label}
              </option>
            ))}
          </optgroup>
          {medicaments.length > 0 && (
            <optgroup label="Médicaments">
              {medicaments.map((m) => (
                <option key={m.id} value={m.id}>
                  💊 {m.nom}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <select
          value={cible}
          onChange={(e) => changerCible(e.target.value)}
          className="flex-1 min-w-[140px] rounded-xl border border-bordure bg-surface px-3 py-2 text-sm cursor-pointer"
          aria-label="Symptôme ou suivi à comparer"
        >
          <optgroup label="Symptômes">
            {SYMPTOMES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icone} {s.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Autres suivis">
            {SUIVIS_AVEC_SEVERITE.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icone} {s.label}
              </option>
            ))}
          </optgroup>
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
              <Barre label={`Avec ${infoActivite.label}`} valeur={resultat.moyenneJourMemeAvec} max={maxCible} />
              <Barre label={`Sans ${infoActivite.label}`} valeur={resultat.moyenneJourMemeSans} max={maxCible} />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Le lendemain</p>
            <div className="flex gap-4">
              <Barre label={`Après un jour avec`} valeur={resultat.moyenneLendemainAvec} max={maxCible} />
              <Barre label={`Après un jour sans`} valeur={resultat.moyenneLendemainSans} max={maxCible} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
