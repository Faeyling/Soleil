import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Entree } from "../../data/types";
import { joursDepuis, dateDuJour, formatDateLisible } from "../../lib/date";
import { ordreSeverite, LABEL_SEVERITE } from "../../lib/severite";
import { libelleEntree, iconeEntree } from "../../lib/libelleEntree";

const PALETTE = [
  "var(--color-terracotta)",
  "var(--color-ardoise)",
  "var(--color-ocre-fonce)",
  "var(--color-sauge)",
  "var(--color-caramel)",
  "var(--color-marine)",
];

interface GraphiqueEvolutionProps {
  entrees: Entree[];
  dateDebut: string;
}

export function GraphiqueEvolution({ entrees, dateDebut }: GraphiqueEvolutionProps) {
  const [masques, setMasques] = useState<Set<string>>(new Set());

  const entreesAvecSeverite = useMemo(
    () => entrees.filter((e) => "severity" in e && e.severity && e.date >= dateDebut),
    [entrees, dateDebut],
  );

  const items = useMemo(() => {
    const carte = new Map<string, { label: string; icone: string; couleur: string }>();
    let i = 0;
    for (const e of entreesAvecSeverite) {
      const cle = `${e.type}:${e.item}`;
      if (!carte.has(cle)) {
        carte.set(cle, { label: libelleEntree(e), icone: iconeEntree(e), couleur: PALETTE[i % PALETTE.length] });
        i++;
      }
    }
    return carte;
  }, [entreesAvecSeverite]);

  const jours = useMemo(() => {
    const nbJoursDiff = Math.min(
      365,
      Math.max(1, Math.round((new Date(dateDuJour()).getTime() - new Date(dateDebut).getTime()) / 86400000) + 1),
    );
    return joursDepuis(nbJoursDiff);
  }, [dateDebut]);

  const donnees = useMemo(() => {
    return jours.map((jour) => {
      const ligne: Record<string, number | string | null> = { date: jour };
      for (const [cle] of items) {
        const [type, item] = cle.split(":");
        const entree = entreesAvecSeverite.find((e) => e.date === jour && e.type === type && e.item === item);
        ligne[cle] = entree && "severity" in entree && entree.severity ? ordreSeverite(entree.severity) : null;
      }
      return ligne;
    });
  }, [jours, items, entreesAvecSeverite]);

  const basculer = (cle: string) => {
    setMasques((prev) => {
      const suivant = new Set(prev);
      if (suivant.has(cle)) suivant.delete(cle);
      else suivant.add(cle);
      return suivant;
    });
  };

  if (items.size === 0) {
    return <p className="text-sm text-texte-doux">Pas encore de données à afficher sur cette période.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {[...items.entries()].map(([cle, info]) => {
          const masque = masques.has(cle);
          return (
            <button
              key={cle}
              onClick={() => basculer(cle)}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer transition-opacity"
              style={{
                borderColor: info.couleur,
                color: masque ? "var(--color-texte-doux)" : info.couleur,
                opacity: masque ? 0.45 : 1,
                background: masque ? "transparent" : `${info.couleur}18`,
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: masque ? "var(--color-texte-doux)" : info.couleur }}
              />
              {info.icone} {info.label}
            </button>
          );
        })}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={donnees} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-bordure)" />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => d.slice(5)}
            tick={{ fontSize: 11 }}
            minTickGap={20}
          />
          <YAxis
            domain={[0, 4]}
            ticks={[1, 2, 3]}
            tickFormatter={(v: number) => LABEL_SEVERITE[v === 1 ? "bas" : v === 2 ? "moyen" : "haut"]}
            tick={{ fontSize: 11 }}
            width={70}
          />
          <Tooltip
            labelFormatter={(d) => formatDateLisible(String(d))}
            formatter={(valeur, nom) => {
              const cle = String(nom);
              const info = items.get(cle);
              const n = Number(valeur);
              const label = n === 1 ? "Bas" : n === 2 ? "Moyen" : n === 3 ? "Haut" : "";
              return [label, info?.label ?? cle];
            }}
          />
          {[...items.entries()].map(([cle, info]) =>
            masques.has(cle) ? null : (
              <Line
                key={cle}
                type="monotone"
                dataKey={cle}
                name={cle}
                stroke={info.couleur}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ),
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
