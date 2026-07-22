import { useMemo, useState } from "react";
import type { Entree } from "../../data/types";
import { useSuivis } from "../../content/autresSuivis";
import { useSymptomes } from "../../content/symptomes";
import { useMedicaments } from "../../hooks/useMedicaments";
import { calculerCorrelation } from "../../lib/correlations";
import { severitesDisponibles } from "../../lib/severite";
import { dateDebutPeriode, type Periode } from "../../lib/periode";
import { libelle } from "../../lib/libelleItem";

const CLE_ACTIVITE = "soleil-correlation-activite";
const CLE_CIBLE = "soleil-correlation-cible";

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
      <p className="text-sm font-bold text-texte">
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
  const symptomesTous = useSymptomes();
  const suivisTous = useSuivis();
  const [activite, setActivite] = useState(() => localStorage.getItem(CLE_ACTIVITE) ?? "kine");
  const [cible, setCible] = useState(() => localStorage.getItem(CLE_CIBLE) ?? "douleur");

  // On ne propose que les éléments qui ont déjà au moins une entrée — pas
  // de comparaison possible (ni intéressante) avec quelque chose que tu n'as
  // jamais enregistré.
  const idsAvecEntrees = useMemo(() => new Set(entrees.map((e) => e.item)), [entrees]);

  const symptomes = symptomesTous.filter((s) => idsAvecEntrees.has(s.id));
  const suivisSelectionnables = suivisTous.filter((s) => !s.masque && idsAvecEntrees.has(s.id));
  const suivisAvecSeverite = suivisTous.filter((s) => s.typeFormulaire === "severite" && idsAvecEntrees.has(s.id));
  const medicamentsAvecEntree = medicaments.filter((m) => idsAvecEntrees.has(m.id));

  const idsActivite = [
    ...symptomes.map((s) => s.id),
    ...suivisSelectionnables.map((s) => s.id),
    ...medicamentsAvecEntree.map((m) => m.id),
  ];
  const idsCible = [...symptomes.map((s) => s.id), ...suivisAvecSeverite.map((s) => s.id)];

  // Si le choix mémorisé (ou par défaut) ne fait plus partie des éléments
  // disponibles, on retombe sur le premier élément qui a des données.
  const activiteAffichee = idsActivite.includes(activite) ? activite : (idsActivite[0] ?? "");
  const cibleAffichee = idsCible.includes(cible) ? cible : (idsCible[0] ?? "");

  const changerActivite = (id: string) => {
    setActivite(id);
    localStorage.setItem(CLE_ACTIVITE, id);
  };
  const changerCible = (id: string) => {
    setCible(id);
    localStorage.setItem(CLE_CIBLE, id);
  };

  const dateDebut = dateDebutPeriode(periode);

  const resultat = calculerCorrelation(entrees, activiteAffichee, cibleAffichee, dateDebut);

  const infoActivite = libelle(activiteAffichee, medicaments);
  const infoCible = libelle(cibleAffichee, medicaments);
  const maxCible = severitesDisponibles(cibleAffichee).length;

  if (idsActivite.length === 0 || idsCible.length === 0) {
    return (
      <p className="text-sm text-texte-doux">
        Enregistre au moins deux éléments différents (une activité et un symptôme ou suivi, par
        exemple) pour voir apparaître des corrélations ici.
      </p>
    );
  }

  return (
    <div>
      <p className="text-xs text-texte-doux mb-3">
        Compare la sévérité moyenne d'un suivi les jours avec/sans une activité, le jour même et le
        lendemain — utile pour repérer un contrecoup après l'effort. Seuls les éléments déjà
        enregistrés au moins une fois sont proposés.
      </p>

      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={activiteAffichee}
          onChange={(e) => changerActivite(e.target.value)}
          className="flex-1 min-w-[140px] rounded-xl border border-bordure bg-surface px-3 py-2 text-sm cursor-pointer"
          aria-label="Activité"
        >
          {symptomes.length > 0 && (
            <optgroup label="Symptômes">
              {symptomes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icone} {s.label}
                </option>
              ))}
            </optgroup>
          )}
          {suivisSelectionnables.length > 0 && (
            <optgroup label="Activités">
              {suivisSelectionnables.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icone} {s.label}
                </option>
              ))}
            </optgroup>
          )}
          {medicamentsAvecEntree.length > 0 && (
            <optgroup label="Médicaments">
              {medicamentsAvecEntree.map((m) => (
                <option key={m.id} value={m.id}>
                  💊 {m.nom}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <select
          value={cibleAffichee}
          onChange={(e) => changerCible(e.target.value)}
          className="flex-1 min-w-[140px] rounded-xl border border-bordure bg-surface px-3 py-2 text-sm cursor-pointer"
          aria-label="Symptôme ou suivi à comparer"
        >
          {symptomes.length > 0 && (
            <optgroup label="Symptômes">
              {symptomes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icone} {s.label}
                </option>
              ))}
            </optgroup>
          )}
          {suivisAvecSeverite.length > 0 && (
            <optgroup label="Activités">
              {suivisAvecSeverite.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icone} {s.label}
                </option>
              ))}
            </optgroup>
          )}
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
