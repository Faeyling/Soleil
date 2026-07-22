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
import { joursEntre, ajouterJours, dateDuJour, formatDateLisible } from "../../lib/date";
import { ordreSeverite, LABEL_SEVERITE, labelSeverite, type Severite } from "../../lib/severite";
import { libelleEntree, iconeEntree } from "../../lib/libelleEntree";
import { dateDebutPeriode, type Periode } from "../../lib/periode";

const SEVERITE_PAR_ORDRE: Record<number, Severite> = { 1: "bas", 2: "moyen", 3: "haut", 4: "crise" };

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
  periode: Periode;
}

export function GraphiqueEvolution({ entrees, periode }: GraphiqueEvolutionProps) {
  const [masques, setMasques] = useState<Set<string>>(new Set());
  // Nombre de périodes complètes en arrière par rapport à aujourd'hui (0 =
  // la plus récente). Non applicable à "Tout", qui n'a pas de longueur fixe.
  const [decalage, setDecalage] = useState(0);
  // Revient à la période la plus récente quand on change de longueur de
  // période (7j/30j/3mois/tout) — ajustement d'état pendant le rendu plutôt
  // qu'un effet, pour éviter un rendu supplémentaire.
  const [periodePrecedente, setPeriodePrecedente] = useState(periode);
  if (periode !== periodePrecedente) {
    setPeriodePrecedente(periode);
    setDecalage(0);
  }

  const longueurPeriode = periode === "tout" ? undefined : Number(periode);
  const dateFinSelection = longueurPeriode ? ajouterJours(dateDuJour(), -longueurPeriode * decalage) : dateDuJour();
  const dateDebutSelection = longueurPeriode
    ? ajouterJours(dateFinSelection, -(longueurPeriode - 1))
    : dateDebutPeriode(periode);

  const entreesAvecSeverite = useMemo(
    () =>
      entrees.filter(
        (e) => "severity" in e && e.severity && e.date >= dateDebutSelection && e.date <= dateFinSelection,
      ),
    [entrees, dateDebutSelection, dateFinSelection],
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

  // Pour "tout", on ne remonte pas jusqu'à la borne fixe de dateDebutPeriode
  // (très ancienne) mais jusqu'à la date d'entrée réelle la plus ancienne —
  // sinon le graphique se retrouve arbitrairement tronqué (365 jours) ou, si
  // on retire le plafond, à afficher des décennies de jours vides.
  const jours = useMemo(() => {
    let debut = dateDebutSelection;
    if (periode === "tout") {
      debut =
        entreesAvecSeverite.length > 0
          ? entreesAvecSeverite.reduce((min, e) => (e.date < min ? e.date : min), entreesAvecSeverite[0].date)
          : dateDuJour();
    }
    return joursEntre(debut, dateFinSelection);
  }, [dateDebutSelection, dateFinSelection, periode, entreesAvecSeverite]);

  const donnees = useMemo(() => {
    // Index (date -> item -> sévérité) construit en un seul passage, pour
    // éviter de re-scanner tout `entreesAvecSeverite` à chaque cellule
    // jour × élément (ce qui serait en O(jours × items × entrées)).
    const parJourEtCle = new Map<string, Map<string, number>>();
    for (const e of entreesAvecSeverite) {
      if (!("severity" in e) || !e.severity) continue;
      const parCle = parJourEtCle.get(e.date) ?? new Map<string, number>();
      parCle.set(`${e.type}:${e.item}`, ordreSeverite(e.severity));
      parJourEtCle.set(e.date, parCle);
    }

    return jours.map((jour) => {
      const ligne: Record<string, number | string | null> = { date: jour };
      const parCle = parJourEtCle.get(jour);
      for (const [cle] of items) {
        ligne[cle] = parCle?.get(cle) ?? null;
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

  return (
    <div>
      {longueurPeriode && (
        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            onClick={() => setDecalage((d) => d + 1)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer bg-fond-douce text-texte-doux hover:opacity-80"
          >
            <span aria-hidden="true">◀</span> Période précédente
          </button>
          <p className="text-xs text-texte-doux text-center flex-shrink-0">
            {formatDateLisible(dateDebutSelection)} – {formatDateLisible(dateFinSelection)}
          </p>
          <button
            onClick={() => setDecalage((d) => Math.max(0, d - 1))}
            disabled={decalage === 0}
            className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer bg-fond-douce text-texte-doux hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Période suivante <span aria-hidden="true">▶</span>
          </button>
        </div>
      )}

      {items.size === 0 ? (
        <p className="text-sm text-texte-doux">Pas encore de données à afficher sur cette période.</p>
      ) : (
        <>
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
                background: masque
                  ? "transparent"
                  : `color-mix(in srgb, ${info.couleur} 15%, var(--color-surface))`,
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
            ticks={[1, 2, 3, 4]}
            tickFormatter={(v: number) => (SEVERITE_PAR_ORDRE[v] ? LABEL_SEVERITE[SEVERITE_PAR_ORDRE[v]] : "")}
            tick={{ fontSize: 11 }}
            width={70}
          />
          <Tooltip
            labelFormatter={(d) => formatDateLisible(String(d))}
            formatter={(valeur, nom) => {
              const cle = String(nom);
              const info = items.get(cle);
              const itemId = cle.split(":")[1];
              const n = Number(valeur);
              const label = SEVERITE_PAR_ORDRE[n] ? labelSeverite(SEVERITE_PAR_ORDRE[n], itemId) : "";
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
                connectNulls
                isAnimationActive={false}
              />
            ),
          )}
        </LineChart>
      </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
