import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToutesLesEntrees } from "../../hooks/useEntrees";
import { CHARGEMENT } from "../../hooks/chargement";
import type { Entree } from "../../data/types";
import { ActionRonde } from "../../components/ui/ActionRonde";
import { CalendrierMensuel } from "../../components/ui/CalendrierMensuel";
import { LigneEntree } from "../../components/ui/LigneEntree";
import { Bouton } from "../../components/ui/Bouton";
import { ChargementEcran } from "../../components/ui/ChargementEcran";
import { Mascotte } from "../../components/mascotte/Mascotte";
import { SECTIONS } from "../../lib/sections";
import { formatDateLisible } from "../../lib/date";

// Référence stable (ne change pas d'identité entre les rendus), pour ne pas
// invalider le useMemo ci-dessous à chaque rendu pendant le chargement.
const AUCUNE_ENTREE: Entree[] = [];

export function AccueilPage() {
  const navigate = useNavigate();
  const entreesBrutes = useToutesLesEntrees();
  const [jourSelectionne, setJourSelectionne] = useState<string | undefined>();

  // Retombe sur [] pendant le chargement pour garder les hooks ci-dessous
  // inconditionnels (règle des hooks) ; le rendu "chargement" est décidé
  // après tous les hooks, pour ne jamais confondre "en cours" et "vide".
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

  const symptomes = entrees.filter((e) => e.type === "symptom").slice(0, 5);
  const medicaments = entrees.filter((e) => e.type === "medication_intake").slice(0, 5);
  const suivis = entrees.filter((e) => e.type === "track_something").slice(0, 5);

  const entreesJourSelectionne = jourSelectionne ? entreesParJour.get(jourSelectionne) ?? [] : [];

  if (entreesBrutes === CHARGEMENT) {
    return <ChargementEcran />;
  }

  if (entrees.length === 0) {
    return (
      <div className="flex flex-col items-center text-center gap-4 pt-8">
        <Mascotte taille={150} />
        <h1 className="text-xl font-bold">
          Bienvenue sur Soleil <span aria-hidden="true">🌤️</span>
        </h1>
        <p className="text-texte-doux max-w-sm">
          Je suis là pour t'aider à suivre tes symptômes au jour le jour, en toute
          simplicité. Commence par signaler un symptôme, ajouter un médicament, ou
          remplis le suivi du jour en une fois.
        </p>
        <BoutonsAction />
        <Bouton className="mt-2" onClick={() => navigate("/parcours")}>
          Remplir le suivi du jour
        </Bouton>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <h1 className="text-2xl font-bold mb-4">
        Bonjour <span aria-hidden="true">🌤️</span>
      </h1>

      <div className="flex justify-around mb-6">
        <ActionRonde
          icone="🩹"
          label="Signaler un symptôme"
          couleur={SECTIONS.symptomes.couleur}
          onClick={() => navigate("/symptomes")}
        />
        <ActionRonde
          icone="💊"
          label="Ajouter un médicament"
          couleur={SECTIONS.medicaments.couleur}
          onClick={() => navigate("/medicaments")}
        />
        <ActionRonde
          icone="📈"
          label="Suivre autre chose"
          couleur={SECTIONS.suivis.couleur}
          onClick={() => navigate("/suivis")}
        />
      </div>

      <Bouton className="w-full mb-6" onClick={() => navigate("/parcours")}>
        <span aria-hidden="true">☀️</span> Remplir le suivi du jour
      </Bouton>

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
        <h2 className="font-bold text-lg mb-1" style={{ color: SECTIONS.symptomes.couleur }}>
          Symptômes
        </h2>
        {symptomes.length === 0 ? (
          <p className="text-sm text-texte-doux py-2">Aucun symptôme signalé pour l'instant.</p>
        ) : (
          <div className="divide-y divide-bordure">
            {symptomes.map((e) => (
              <LigneEntree key={e.id} entree={e} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="font-bold text-lg mb-1" style={{ color: SECTIONS.medicaments.couleur }}>
          Médicaments
        </h2>
        {medicaments.length === 0 ? (
          <p className="text-sm text-texte-doux py-2">Aucun médicament ajouté pour l'instant.</p>
        ) : (
          <div className="divide-y divide-bordure">
            {medicaments.map((e) => (
              <LigneEntree key={e.id} entree={e} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="font-bold text-lg mb-1" style={{ color: SECTIONS.suivis.couleur }}>
          Autres suivis
        </h2>
        {suivis.length === 0 ? (
          <p className="text-sm text-texte-doux py-2">Aucun autre suivi pour l'instant.</p>
        ) : (
          <div className="divide-y divide-bordure">
            {suivis.map((e) => (
              <LigneEntree key={e.id} entree={e} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BoutonsAction() {
  const navigate = useNavigate();
  return (
    <div className="flex justify-around w-full">
      <ActionRonde
        icone="🩹"
        label="Signaler un symptôme"
        couleur={SECTIONS.symptomes.couleur}
        onClick={() => navigate("/symptomes")}
      />
      <ActionRonde
        icone="💊"
        label="Ajouter un médicament"
        couleur={SECTIONS.medicaments.couleur}
        onClick={() => navigate("/medicaments")}
      />
      <ActionRonde
        icone="📈"
        label="Suivre autre chose"
        couleur={SECTIONS.suivis.couleur}
        onClick={() => navigate("/suivis")}
      />
    </div>
  );
}
