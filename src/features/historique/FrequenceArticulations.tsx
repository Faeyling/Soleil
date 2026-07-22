import { useMemo, useState } from "react";
import type { Entree } from "../../data/types";
import { labelArticulation } from "../../content/symptomes";
import { useSuivis } from "../../content/autresSuivis";
import { useSymptomes } from "../../content/symptomes";
import { useMedicaments } from "../../hooks/useMedicaments";
import { ajouterJours } from "../../lib/date";
import { libelle } from "../../lib/libelleItem";

const ITEMS_ARTICULAIRES = ["douleur", "luxation-articulaire", "subluxation-articulaire"];

type Moment = "meme" | "lendemain";

interface FrequenceArticulationsProps {
  entrees: Entree[];
  dateDebut: string;
}

export function FrequenceArticulations({ entrees, dateDebut }: FrequenceArticulationsProps) {
  const medicaments = useMedicaments();
  const symptomesTous = useSymptomes();
  const suivisTous = useSuivis();
  const [activite, setActivite] = useState("");
  const [moment, setMoment] = useState<Moment>("meme");

  // Seules les activités déjà enregistrées sur la période sont proposées —
  // comme pour les corrélations, comparer avec quelque chose que tu n'as
  // jamais suivi n'aurait pas de sens.
  const idsAvecEntrees = useMemo(
    () => new Set(entrees.filter((e) => e.date >= dateDebut).map((e) => e.item)),
    [entrees, dateDebut],
  );
  const activitesDisponibles = useMemo(() => {
    const ids = [
      ...symptomesTous.filter((s) => idsAvecEntrees.has(s.id)).map((s) => s.id),
      ...suivisTous.filter((s) => !s.masque && idsAvecEntrees.has(s.id)).map((s) => s.id),
      ...medicaments.filter((m) => idsAvecEntrees.has(m.id)).map((m) => m.id),
    ];
    return ids.map((id) => ({ id, ...libelle(id, medicaments) }));
  }, [symptomesTous, suivisTous, medicaments, idsAvecEntrees]);

  const activiteAffichee = activitesDisponibles.some((a) => a.id === activite) ? activite : "";

  const frequences = useMemo(() => {
    const joursActivite = activiteAffichee
      ? new Set(entrees.filter((e) => e.item === activiteAffichee && e.date >= dateDebut).map((e) => e.date))
      : undefined;

    const compteur = new Map<string, number>();
    for (const e of entrees) {
      if (e.type !== "symptom") continue;
      if (!ITEMS_ARTICULAIRES.includes(e.item)) continue;
      if (e.date < dateDebut) continue;
      if (joursActivite) {
        const jourDeReference = moment === "meme" ? e.date : ajouterJours(e.date, -1);
        if (!joursActivite.has(jourDeReference)) continue;
      }
      for (const zone of e.location ?? []) {
        compteur.set(zone, (compteur.get(zone) ?? 0) + 1);
      }
    }
    return [...compteur.entries()].sort((a, b) => b[1] - a[1]);
  }, [entrees, dateDebut, activiteAffichee, moment]);

  return (
    <div>
      {activitesDisponibles.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap items-center">
          <select
            value={activiteAffichee}
            onChange={(e) => setActivite(e.target.value)}
            className="flex-1 min-w-[140px] rounded-xl border border-bordure bg-surface px-3 py-2 text-sm cursor-pointer"
            aria-label="Filtrer par activité"
          >
            <option value="">Toutes les entrées de la période</option>
            {activitesDisponibles.map((a) => (
              <option key={a.id} value={a.id}>
                {a.icone} {a.label}
              </option>
            ))}
          </select>
          {activiteAffichee && (
            <div className="flex gap-1 rounded-full bg-fond-douce p-1">
              <button
                onClick={() => setMoment("meme")}
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  moment === "meme" ? "bg-ardoise text-[var(--color-texte-sur-accent)]" : "text-texte-doux"
                }`}
              >
                Jour même
              </button>
              <button
                onClick={() => setMoment("lendemain")}
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  moment === "lendemain" ? "bg-ardoise text-[var(--color-texte-sur-accent)]" : "text-texte-doux"
                }`}
              >
                Lendemain
              </button>
            </div>
          )}
        </div>
      )}

      {frequences.length === 0 ? (
        <p className="text-sm text-texte-doux">
          {activiteAffichee
            ? `Aucune douleur, luxation ou subluxation localisée n'a été enregistrée ${moment === "meme" ? "le jour même" : "le lendemain"} de « ${libelle(activiteAffichee, medicaments).label} ».`
            : "Aucune douleur, luxation ou subluxation enregistrée sur cette période."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {frequences.map(([zone, nb]) => {
            const max = frequences[0][1];
            return (
              <div key={zone} className="flex items-center gap-3">
                <span className="text-sm w-40 flex-shrink-0 truncate">{labelArticulation(zone)}</span>
                <div className="flex-1 h-3 rounded-full bg-fond-douce overflow-hidden">
                  <div
                    className="h-full rounded-full bg-terracotta"
                    style={{ width: `${(nb / max) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold w-16 text-right">{nb} fois</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
