import { useState } from "react";
import {
  COMPOSANTES_BEIGHTON,
  LABEL_TRANCHE_AGE_BEIGHTON,
  seuilPositifBeighton,
  type TrancheAgeBeighton,
} from "../../content/ressources";

const TRANCHES: TrancheAgeBeighton[] = ["avant-puberte", "puberte-50-ans", "plus-de-50-ans"];

export function CalculateurBeighton() {
  const [coches, setCoches] = useState<Set<string>>(new Set());
  const [tranche, setTranche] = useState<TrancheAgeBeighton>("puberte-50-ans");

  const basculer = (id: string) => {
    setCoches((prev) => {
      const suivant = new Set(prev);
      if (suivant.has(id)) suivant.delete(id);
      else suivant.add(id);
      return suivant;
    });
  };

  const score = coches.size;
  const seuil = seuilPositifBeighton(tranche);
  const positif = score >= seuil;

  return (
    <div className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4">
      <p className="text-sm text-texte-doux mb-3">
        Coche chaque manœuvre que tu peux réaliser. Ce calculateur est un outil d'auto-évaluation
        informatif — seul un examen réalisé par un·e professionnel·le de santé fait foi.
      </p>

      <div className="flex flex-col gap-2 mb-4">
        {COMPOSANTES_BEIGHTON.map((c) => (
          <label
            key={c.id}
            className="flex items-start gap-3 rounded-xl border border-bordure bg-fond-douce px-3 py-2 cursor-pointer text-sm"
          >
            <input
              type="checkbox"
              checked={coches.has(c.id)}
              onChange={() => basculer(c.id)}
              className="w-5 h-5 mt-0.5 flex-shrink-0 accent-[var(--color-ardoise)]"
            />
            {c.label}
          </label>
        ))}
      </div>

      <div className="mb-3">
        <p className="text-sm font-semibold mb-1">Ta tranche d'âge</p>
        <select
          value={tranche}
          onChange={(e) => setTranche(e.target.value as TrancheAgeBeighton)}
          className="w-full rounded-xl border border-bordure bg-surface px-3 py-2 text-sm cursor-pointer"
        >
          {TRANCHES.map((t) => (
            <option key={t} value={t}>
              {LABEL_TRANCHE_AGE_BEIGHTON[t]}
            </option>
          ))}
        </select>
      </div>

      <div
        className="rounded-xl p-3 text-sm"
        style={{
          background: positif ? "var(--color-terracotta-clair)" : "var(--color-sauge-clair)",
          color: positif ? "var(--color-terracotta-fonce)" : "var(--color-sauge-fonce)",
        }}
      >
        <p className="font-bold text-base mb-1">
          Score : {score} / 9
        </p>
        <p>
          {positif
            ? `Seuil atteint (≥ ${seuil}/9 pour « ${LABEL_TRANCHE_AGE_BEIGHTON[tranche].toLowerCase()} ») : ce critère d'hypermobilité articulaire généralisée est rempli.`
            : `Seuil non atteint (< ${seuil}/9 pour « ${LABEL_TRANCHE_AGE_BEIGHTON[tranche].toLowerCase()} »).`}{" "}
          Ce score seul ne permet pas de conclure à un SEDh : il correspond uniquement au critère 1
          sur 3 de la classification — voir ci-dessous.
        </p>
      </div>
    </div>
  );
}
