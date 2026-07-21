import { useState } from "react";
import type { Entree } from "../../data/types";
import {
  nomMois,
  nbJoursMois,
  decalageLundi,
  toDateStr,
  dateDuJour,
  joursCourts,
} from "../../lib/date";
import { couleurEntree } from "../../lib/couleurEntree";

interface CalendrierMensuelProps {
  entreesParJour: Map<string, Entree[]>;
  jourSelectionne?: string;
  onSelectJour?: (date: string) => void;
}

export function CalendrierMensuel({
  entreesParJour,
  jourSelectionne,
  onSelectJour,
}: CalendrierMensuelProps) {
  const aujourdhui = new Date();
  const [annee, setAnnee] = useState(aujourdhui.getFullYear());
  const [mois, setMois] = useState(aujourdhui.getMonth());

  const changerMois = (delta: number) => {
    let m = mois + delta;
    let a = annee;
    if (m < 0) {
      m = 11;
      a -= 1;
    } else if (m > 11) {
      m = 0;
      a += 1;
    }
    setMois(m);
    setAnnee(a);
  };

  const revenirAujourdhui = () => {
    setAnnee(aujourdhui.getFullYear());
    setMois(aujourdhui.getMonth());
  };

  const nbJours = nbJoursMois(annee, mois);
  const decalage = decalageLundi(annee, mois);
  const cases: (string | null)[] = [
    ...Array(decalage).fill(null),
    ...Array.from({ length: nbJours }, (_, i) => toDateStr(new Date(annee, mois, i + 1))),
  ];
  const auj = dateDuJour();

  return (
    <div className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4 shadow-[var(--ombre)]">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => changerMois(-1)}
          aria-label="Mois précédent"
          className="w-9 h-9 rounded-full hover:bg-fond-douce cursor-pointer text-lg"
        >
          ←
        </button>
        <button
          onClick={revenirAujourdhui}
          className="font-bold text-base capitalize cursor-pointer px-2 py-1 rounded-lg hover:bg-fond-douce"
        >
          {nomMois(mois)} {annee}
        </button>
        <button
          onClick={() => changerMois(1)}
          aria-label="Mois suivant"
          className="w-9 h-9 rounded-full hover:bg-fond-douce cursor-pointer text-lg"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-texte-doux mb-1">
        {joursCourts().map((j) => (
          <div key={j}>{j}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cases.map((date, i) => {
          if (!date) return <div key={`vide-${i}`} />;
          const entrees = entreesParJour.get(date) ?? [];
          const jourNum = Number(date.slice(-2));
          const estAuj = date === auj;
          const estSelectionne = date === jourSelectionne;
          const couleurs = [...new Set(entrees.map(couleurEntree))].slice(0, 4);
          return (
            <button
              key={date}
              onClick={() => onSelectJour?.(date)}
              className={`aspect-square flex flex-col items-center justify-center gap-0.5 rounded-xl text-sm cursor-pointer transition-colors ${
                estSelectionne
                  ? "bg-ardoise text-[var(--color-texte-sur-accent)] font-bold"
                  : estAuj
                    ? "bg-ardoise-clair font-bold"
                    : "hover:bg-fond-douce"
              }`}
            >
              <span>{jourNum}</span>
              {couleurs.length > 0 && (
                <span className="flex gap-0.5">
                  {couleurs.map((c, idx) => (
                    <span
                      key={idx}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: estSelectionne ? "var(--color-texte-sur-accent)" : c }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
