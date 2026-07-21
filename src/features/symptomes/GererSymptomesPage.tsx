import { useState } from "react";
import { EnTete } from "../../components/ui/EnTete";
import { Champ, classesInput } from "../../components/ui/Champ";
import { Bouton } from "../../components/ui/Bouton";
import { Confirmation } from "../../components/ui/Confirmation";
import { SECTIONS } from "../../lib/sections";
import { useSymptomes } from "../../content/symptomes";
import { ajouterSymptome, modifierSymptome, supprimerSymptome } from "../../data/repositories/contenuRepository";
import type { SymptomeDef } from "../../data/types";

interface FormulaireSymptome {
  icone: string;
  label: string;
  localisable: boolean;
}

const FORMULAIRE_VIDE: FormulaireSymptome = { icone: "🩹", label: "", localisable: false };

export function GererSymptomesPage() {
  const symptomes = useSymptomes();
  const [edition, setEdition] = useState<string | "nouveau" | undefined>();
  const [formulaire, setFormulaire] = useState<FormulaireSymptome>(FORMULAIRE_VIDE);
  const [suppressionDemandee, setSuppressionDemandee] = useState<SymptomeDef | undefined>();
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);

  const ouvrirNouveau = () => {
    setFormulaire(FORMULAIRE_VIDE);
    setEdition("nouveau");
  };

  const ouvrirEdition = (s: SymptomeDef) => {
    setFormulaire({ icone: s.icone, label: s.label, localisable: s.localisable ?? false });
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

  const confirmerSuppression = async () => {
    if (!suppressionDemandee) return;
    await supprimerSymptome(suppressionDemandee.id);
    setSuppressionDemandee(undefined);
    if (edition === suppressionDemandee.id) fermer();
  };

  return (
    <div>
      <EnTete titre="Gérer les symptômes" couleur={SECTIONS.symptomes.couleurFonce} />

      <p className="text-sm text-texte-doux mb-4">
        Ajoute, renomme ou retire des symptômes de ta liste. Les entrées déjà enregistrées restent
        conservées même si tu supprimes un symptôme de cette liste.
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
        {symptomes.map((s) => (
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
              onClick={() => setSuppressionDemandee(s)}
              aria-label={`Supprimer ${s.label}`}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-fond-douce cursor-pointer text-base"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {suppressionDemandee && (
        <Confirmation
          titre="Supprimer ce symptôme ?"
          message={`"${suppressionDemandee.label}" sera retiré de ta liste. Les entrées déjà enregistrées avec ce symptôme resteront visibles dans ton historique.`}
          onConfirmer={confirmerSuppression}
          onAnnuler={() => setSuppressionDemandee(undefined)}
        />
      )}
    </div>
  );
}
