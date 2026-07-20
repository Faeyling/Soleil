import { useMemo } from "react";
import type { Entree } from "../../data/types";
import { labelArticulation } from "../../content/symptomes";

interface FrequenceArticulationsProps {
  entrees: Entree[];
  dateDebut: string;
}

export function FrequenceArticulations({ entrees, dateDebut }: FrequenceArticulationsProps) {
  const frequences = useMemo(() => {
    const compteur = new Map<string, number>();
    for (const e of entrees) {
      if (e.type !== "symptom") continue;
      if (e.item !== "luxation-articulaire" && e.item !== "subluxation-articulaire") continue;
      if (e.date < dateDebut) continue;
      for (const zone of e.location ?? []) {
        compteur.set(zone, (compteur.get(zone) ?? 0) + 1);
      }
    }
    return [...compteur.entries()].sort((a, b) => b[1] - a[1]);
  }, [entrees, dateDebut]);

  if (frequences.length === 0) {
    return (
      <p className="text-sm text-texte-doux">
        Aucune luxation ou subluxation enregistrée sur cette période.
      </p>
    );
  }

  const max = frequences[0][1];

  return (
    <div className="flex flex-col gap-2">
      {frequences.map(([zone, nb]) => (
        <div key={zone} className="flex items-center gap-3">
          <span className="text-sm w-40 flex-shrink-0 truncate">{labelArticulation(zone)}</span>
          <div className="flex-1 h-3 rounded-full bg-fond-douce overflow-hidden">
            <div
              className="h-full rounded-full bg-terracotta"
              style={{ width: `${(nb / max) * 100}%` }}
            />
          </div>
          <span className="text-sm font-semibold w-16 text-right">
            {nb} fois
          </span>
        </div>
      ))}
    </div>
  );
}
