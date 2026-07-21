import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToutesLesEntrees } from "../../hooks/useEntrees";
import { CHARGEMENT } from "../../hooks/chargement";
import type { Entree } from "../../data/types";
import { CalendrierMensuel } from "../../components/ui/CalendrierMensuel";
import { LigneEntree } from "../../components/ui/LigneEntree";
import { Bouton } from "../../components/ui/Bouton";
import { ChargementEcran } from "../../components/ui/ChargementEcran";
import { TableauSemaine } from "./TableauSemaine";
import { GraphiqueEvolution } from "./GraphiqueEvolution";
import { FrequenceArticulations } from "./FrequenceArticulations";
import { PERIODES, dateDebutPeriode, type Periode } from "../../lib/periode";
import { formatDateLisible } from "../../lib/date";

// Référence stable (ne change pas d'identité entre les rendus), pour ne pas
// invalider le useMemo ci-dessous à chaque rendu pendant le chargement.
const AUCUNE_ENTREE: Entree[] = [];

export function HistoriquePage() {
  const navigate = useNavigate();
  const entreesBrutes = useToutesLesEntrees();
  const [periode, setPeriode] = useState<Periode>("30");
  const [jourSelectionne, setJourSelectionne] = useState<string | undefined>();

  // `entrees` retombe sur [] pendant le chargement uniquement pour que les
  // hooks ci-dessous restent appelés à chaque rendu (règle des hooks) ; le
  // rendu "chargement" est décidé plus bas, après tous les hooks.
  const entrees = entreesBrutes === CHARGEMENT ? AUCUNE_ENTREE : entreesBrutes;

  const entreesParJour = useMemo(() => {
    const carte = new Map<string, typeof entrees>();
    for (const e of entrees) {
      const liste = carte.get(e.date) ?? [];
      liste.push(e);
      carte.set(e.date, liste);
    }
    return carte;
  }, [entrees]);

  const dateDebut = dateDebutPeriode(periode);
  const entreesJourSelectionne = jourSelectionne ? entreesParJour.get(jourSelectionne) ?? [] : [];

  if (entreesBrutes === CHARGEMENT) {
    return <ChargementEcran />;
  }

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Historique</h1>
        <Bouton onClick={() => navigate("/profil?export=1")}>Exporter en PDF</Bouton>
      </div>

      <CalendrierMensuel
        entreesParJour={entreesParJour}
        jourSelectionne={jourSelectionne}
        onSelectJour={(d) => setJourSelectionne(d === jourSelectionne ? undefined : d)}
      />

      {jourSelectionne && (
        <div className="mt-4">
          <h2 className="font-bold mb-1">{formatDateLisible(jourSelectionne)}</h2>
          {entreesJourSelectionne.length === 0 ? (
            <p className="text-sm text-texte-doux">Aucune entrée ce jour-là.</p>
          ) : (
            <div className="divide-y divide-bordure">
              {entreesJourSelectionne.map((e) => (
                <LigneEntree key={e.id} entree={e} />
              ))}
            </div>
          )}
        </div>
      )}

      <section className="mt-8">
        <h2 className="font-bold text-lg mb-3">Semaine en un coup d'œil</h2>
        <TableauSemaine entrees={entrees} />
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-bold text-lg">Évolution dans le temps</h2>
          <div className="flex gap-1 rounded-full bg-fond-douce p-1">
            {PERIODES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriode(p.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  periode === p.id ? "bg-terracotta text-[var(--color-texte-sur-accent)]" : "text-texte-doux"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <GraphiqueEvolution entrees={entrees} periode={periode} />
      </section>

      <section className="mt-8">
        <h2 className="font-bold text-lg mb-3">Articulations les plus touchées</h2>
        <p className="text-xs text-texte-doux mb-3">
          Luxations et subluxations, sur la période « {PERIODES.find((p) => p.id === periode)?.label} ».
        </p>
        <FrequenceArticulations entrees={entrees} dateDebut={dateDebut} />
      </section>
    </div>
  );
}
