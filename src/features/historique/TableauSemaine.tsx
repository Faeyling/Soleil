import type { Entree } from "../../data/types";
import { derniers7Jours, nomJour } from "../../lib/date";
import { libelleEntree, iconeEntree } from "../../lib/libelleEntree";
import { Pastille } from "../../components/ui/Pastille";

interface TableauSemaineProps {
  entrees: Entree[];
}

export function TableauSemaine({ entrees }: TableauSemaineProps) {
  const jours = derniers7Jours();

  const entreesAvecSeverite = entrees.filter(
    (e) => e.date >= jours[0] && "severity" in e && e.severity,
  );

  const cles = new Map<string, { label: string; icone: string }>();
  for (const e of entreesAvecSeverite) {
    const cle = `${e.type}:${e.item}`;
    if (!cles.has(cle)) cles.set(cle, { label: libelleEntree(e), icone: iconeEntree(e) });
  }

  if (cles.size === 0) {
    return <p className="text-sm text-texte-doux">Pas encore assez de données cette semaine.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left font-semibold pb-2 pr-2 sticky left-0 bg-fond">Élément</th>
            {jours.map((j) => (
              <th key={j} className="font-semibold pb-2 px-1 text-center capitalize text-xs">
                {nomJour(new Date(j)).slice(0, 2)}
                <br />
                {j.slice(-2)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...cles.entries()].map(([cle, info]) => {
            const [type, item] = cle.split(":");
            return (
              <tr key={cle} className="border-t border-bordure">
                <td className="py-2 pr-2 whitespace-nowrap sticky left-0 bg-fond">
                  {info.icone} {info.label}
                </td>
                {jours.map((j) => {
                  const entree = entreesAvecSeverite.find(
                    (e) => e.date === j && e.type === type && e.item === item,
                  );
                  return (
                    <td key={j} className="text-center px-1">
                      {entree && "severity" in entree && entree.severity ? (
                        <span className="flex justify-center">
                          <Pastille severite={entree.severity} itemId={entree.item} />
                        </span>
                      ) : (
                        <span className="text-bordure">·</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
