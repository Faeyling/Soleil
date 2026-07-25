import { useMemo, useState } from "react";
import type { Entree, Marqueur } from "../../data/types";
import { useSuivis } from "../../content/autresSuivis";
import { useSymptomes } from "../../content/symptomes";
import { useMedicaments } from "../../hooks/useMedicaments";
import { calculerComparaisonMarqueur, FENETRE_JOURS_COMPARAISON_MARQUEUR } from "../../lib/correlations";
import { severitesDisponibles } from "../../lib/severite";
import { formatDateLisible } from "../../lib/date";
import { libelle } from "../../lib/libelleItem";

const CLE_MARQUEUR = "soleil-comparaison-marqueur";
const CLE_CIBLE = "soleil-comparaison-cible";

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

interface ComparaisonMarqueurProps {
  entrees: Entree[];
  marqueurs: Marqueur[];
}

export function ComparaisonMarqueur({ entrees, marqueurs }: ComparaisonMarqueurProps) {
  const medicaments = useMedicaments();
  const symptomesTous = useSymptomes();
  const suivisTous = useSuivis();
  const [marqueurId, setMarqueurId] = useState(() => localStorage.getItem(CLE_MARQUEUR) ?? marqueurs[0]?.id ?? "");
  const [cible, setCible] = useState(() => localStorage.getItem(CLE_CIBLE) ?? "douleur");

  const idsAvecEntrees = useMemo(() => new Set(entrees.map((e) => e.item)), [entrees]);
  const symptomes = symptomesTous.filter((s) => idsAvecEntrees.has(s.id));
  const suivisAvecSeverite = suivisTous.filter((s) => s.typeFormulaire === "severite" && idsAvecEntrees.has(s.id));
  const idsCible = [...symptomes.map((s) => s.id), ...suivisAvecSeverite.map((s) => s.id)];

  const marqueurAffiche = marqueurs.find((m) => m.id === marqueurId) ?? marqueurs[0];
  const cibleAffichee = idsCible.includes(cible) ? cible : (idsCible[0] ?? "");

  const changerMarqueur = (id: string) => {
    setMarqueurId(id);
    localStorage.setItem(CLE_MARQUEUR, id);
  };
  const changerCible = (id: string) => {
    setCible(id);
    localStorage.setItem(CLE_CIBLE, id);
  };

  if (idsCible.length === 0 || !marqueurAffiche) {
    return (
      <p className="text-sm text-texte-doux">
        Enregistre au moins un symptôme ou suivi avec sévérité pour voir apparaître une comparaison
        ici.
      </p>
    );
  }

  const resultat = calculerComparaisonMarqueur(entrees, cibleAffichee, marqueurAffiche.date);
  const infoCible = libelle(cibleAffichee, medicaments);
  const maxCible = severitesDisponibles(cibleAffichee).length;

  return (
    <div>
      <p className="text-xs text-texte-doux mb-3">
        Compare la sévérité moyenne d'un symptôme ou suivi sur les {FENETRE_JOURS_COMPARAISON_MARQUEUR}{" "}
        jours avant et après un marqueur — utile pour objectiver l'effet d'un traitement.
      </p>

      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={marqueurAffiche.id}
          onChange={(e) => changerMarqueur(e.target.value)}
          className="flex-1 min-w-[140px] rounded-xl border border-bordure bg-surface px-3 py-2 text-sm cursor-pointer"
          aria-label="Marqueur"
        >
          {marqueurs.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} · {formatDateLisible(m.date)}
            </option>
          ))}
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

      {resultat.nombreEntreesAvant === 0 && resultat.nombreEntreesApres === 0 ? (
        <p className="text-sm text-texte-doux">
          Pas encore de données sur « {infoCible.label} » autour de ce marqueur.
        </p>
      ) : (
        <div className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4">
          <p className="text-xs text-texte-doux mb-3">
            Autour de « {marqueurAffiche.label} » du {formatDateLisible(marqueurAffiche.date)} —
            comparaison sur « {infoCible.label} ».
          </p>
          <div className="flex gap-4">
            <Barre
              label={`${resultat.nombreEntreesAvant} jour${resultat.nombreEntreesAvant > 1 ? "s" : ""} avant`}
              valeur={resultat.moyenneAvant}
              max={maxCible}
            />
            <Barre
              label={`${resultat.nombreEntreesApres} jour${resultat.nombreEntreesApres > 1 ? "s" : ""} après`}
              valeur={resultat.moyenneApres}
              max={maxCible}
            />
          </div>
        </div>
      )}
    </div>
  );
}
