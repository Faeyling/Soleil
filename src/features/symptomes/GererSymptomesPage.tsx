import { useState } from "react";
import { EnTete } from "../../components/ui/EnTete";
import { Champ, classesInput } from "../../components/ui/Champ";
import { Bouton } from "../../components/ui/Bouton";
import { SECTIONS } from "../../lib/sections";
import { useSymptomes } from "../../content/symptomes";
import { ajouterSymptome, modifierSymptome } from "../../data/repositories/contenuRepository";
import type { SymptomeDef } from "../../data/types";

type TypeFormulaireSymptome = "severite" | "ouinon" | "texte";

interface FormulaireSymptome {
  icone: string;
  label: string;
  localisable: boolean;
  typeFormulaire: TypeFormulaireSymptome;
}

const FORMULAIRE_VIDE: FormulaireSymptome = { icone: "🩹", label: "", localisable: false, typeFormulaire: "severite" };

const LABEL_TYPE: Record<TypeFormulaireSymptome, string> = {
  severite: "Niveau (Bas / Moyen / Haut)",
  ouinon: "Oui / Non",
  texte: "Texte libre",
};

export function GererSymptomesPage() {
  const symptomesTous = useSymptomes();
  const symptomesActifs = symptomesTous.filter((s) => !s.desactive);
  const symptomesDesactives = symptomesTous.filter((s) => s.desactive);
  const [edition, setEdition] = useState<string | "nouveau" | undefined>();
  const [formulaire, setFormulaire] = useState<FormulaireSymptome>(FORMULAIRE_VIDE);
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);

  const ouvrirNouveau = () => {
    setFormulaire(FORMULAIRE_VIDE);
    setEdition("nouveau");
  };

  const ouvrirEdition = (s: SymptomeDef) => {
    setFormulaire({
      icone: s.icone,
      label: s.label,
      localisable: s.localisable ?? false,
      typeFormulaire: s.typeFormulaire ?? "severite",
    });
    setEdition(s.id);
  };

  const fermer = () => setEdition(undefined);

  const enregistrer = async () => {
    if (!formulaire.label.trim() || enregistrementEnCours) return;
    setEnregistrementEnCours(true);
    try {
      const donnees = {
        icone: formulaire.icone.trim() || "🩹",
        label: formulaire.label.trim(),
        localisable: formulaire.localisable,
        typeFormulaire: formulaire.typeFormulaire,
      };
      if (edition === "nouveau") {
        await ajouterSymptome(donnees);
      } else if (edition) {
        await modifierSymptome(edition, donnees);
      }
      fermer();
    } finally {
      setEnregistrementEnCours(false);
    }
  };

  const basculerActivation = async (s: SymptomeDef) => {
    await modifierSymptome(s.id, { desactive: !s.desactive });
  };

  return (
    <div>
      <EnTete titre="Gérer les symptômes" couleur={SECTIONS.symptomes.couleurFonce} />

      <p className="text-sm text-texte-doux mb-4">
        Ajoute, renomme ou désactive des symptômes de ta liste. Désactiver un symptôme le retire
        de la grille et du parcours quotidien, mais il reste modifiable, réactivable à tout
        moment, et les entrées déjà enregistrées restent pleinement visibles dans ton historique.
      </p>

      {edition === undefined && (
        <Bouton className="w-full mb-5" couleur={SECTIONS.symptomes.couleur} onClick={ouvrirNouveau}>
          <span aria-hidden="true">➕</span> Ajouter un symptôme
        </Bouton>
      )}

      {edition !== undefined && (
        <div className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4 mb-5">
          <h2 className="font-bold mb-3">{edition === "nouveau" ? "Nouveau symptôme" : "Modifier ce symptôme"}</h2>
          <Champ label="Icône (emoji)">
            <input
              className={classesInput}
              value={formulaire.icone}
              maxLength={4}
              onChange={(e) => setFormulaire((f) => ({ ...f, icone: e.target.value }))}
              placeholder="🩹"
            />
          </Champ>
          <Champ label="Nom du symptôme">
            <input
              className={classesInput}
              value={formulaire.label}
              onChange={(e) => setFormulaire((f) => ({ ...f, label: e.target.value }))}
              placeholder="Ex. Migraine"
            />
          </Champ>
          <Champ label="Type de saisie">
            <select
              className={classesInput}
              value={formulaire.typeFormulaire}
              onChange={(e) =>
                setFormulaire((f) => ({ ...f, typeFormulaire: e.target.value as TypeFormulaireSymptome }))
              }
            >
              {(Object.keys(LABEL_TYPE) as TypeFormulaireSymptome[]).map((t) => (
                <option key={t} value={t}>
                  {LABEL_TYPE[t]}
                </option>
              ))}
            </select>
          </Champ>
          <label className="flex items-center gap-2 mb-4 cursor-pointer select-none text-sm">
            <input
              type="checkbox"
              checked={formulaire.localisable}
              onChange={(e) => setFormulaire((f) => ({ ...f, localisable: e.target.checked }))}
              className="w-5 h-5 accent-[var(--color-ardoise)]"
            />
            Propose de choisir des zones du corps concernées
          </label>
          <div className="flex gap-3">
            <Bouton
              className="flex-1"
              couleur={SECTIONS.symptomes.couleur}
              onClick={enregistrer}
              disabled={!formulaire.label.trim() || enregistrementEnCours}
            >
              Enregistrer
            </Bouton>
            <Bouton variante="contour" couleur={SECTIONS.symptomes.couleur} onClick={fermer}>
              Annuler
            </Bouton>
          </div>
        </div>
      )}

      <div className="divide-y divide-bordure">
        {symptomesActifs.map((s) => (
          <div key={s.id} className="flex items-center gap-3 py-3">
            <span className="text-xl" aria-hidden="true">
              {s.icone}
            </span>
            <span className="flex-1 font-medium">{s.label}</span>
            <button
              onClick={() => ouvrirEdition(s)}
              aria-label={`Modifier ${s.label}`}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-fond-douce cursor-pointer text-base"
            >
              ✏️
            </button>
            <button
              onClick={() => void basculerActivation(s)}
              aria-label={`Désactiver ${s.label}`}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-fond-douce cursor-pointer text-base"
            >
              🚫
            </button>
          </div>
        ))}
      </div>

      {symptomesDesactives.length > 0 && (
        <section className="mt-8">
          <h2 className="font-bold text-lg mb-1">Désactivés</h2>
          <p className="text-xs text-texte-doux mb-3">
            N'apparaissent plus dans la grille ni le parcours quotidien. Réactive-les à tout
            moment.
          </p>
          <div className="divide-y divide-bordure">
            {symptomesDesactives.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-3 opacity-70">
                <span className="text-xl" aria-hidden="true">
                  {s.icone}
                </span>
                <span className="flex-1 font-medium">{s.label}</span>
                <button
                  onClick={() => ouvrirEdition(s)}
                  aria-label={`Modifier ${s.label}`}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-fond-douce cursor-pointer text-base"
                >
                  ✏️
                </button>
                <button
                  onClick={() => void basculerActivation(s)}
                  aria-label={`Réactiver ${s.label}`}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-fond-douce cursor-pointer text-base"
                >
                  ✅
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
