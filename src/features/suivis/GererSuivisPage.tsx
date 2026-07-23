import { useState } from "react";
import { EnTete } from "../../components/ui/EnTete";
import { Champ, classesInput } from "../../components/ui/Champ";
import { Bouton } from "../../components/ui/Bouton";
import { SECTIONS } from "../../lib/sections";
import { useSuivis } from "../../content/autresSuivis";
import { ajouterSuivi, modifierSuivi, deplacerSuivi } from "../../data/repositories/contenuRepository";
import type { SuiviDef, TypeFormulaireSuivi } from "../../data/types";

interface FormulaireSuivi {
  icone: string;
  label: string;
  typeFormulaire: TypeFormulaireSuivi;
  unite: string;
  placeholder: string;
}

const FORMULAIRE_VIDE: FormulaireSuivi = {
  icone: "📈",
  label: "",
  typeFormulaire: "severite",
  unite: "",
  placeholder: "",
};

const LABEL_TYPE: Record<TypeFormulaireSuivi, string> = {
  severite: "Niveau (Bas / Moyen / Haut)",
  ouinon: "Oui / Non",
  numerique: "Valeur numérique",
  texte: "Texte libre",
};

export function GererSuivisPage() {
  const suivisTous = useSuivis();
  const suivisVisibles = suivisTous.filter((s) => !s.masque);
  const suivisActifs = suivisVisibles.filter((s) => !s.desactive);
  const suivisDesactives = suivisVisibles.filter((s) => s.desactive);
  const [edition, setEdition] = useState<string | "nouveau" | undefined>();
  const [formulaire, setFormulaire] = useState<FormulaireSuivi>(FORMULAIRE_VIDE);
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);

  const ouvrirNouveau = () => {
    setFormulaire(FORMULAIRE_VIDE);
    setEdition("nouveau");
  };

  const ouvrirEdition = (s: SuiviDef) => {
    setFormulaire({
      icone: s.icone,
      label: s.label,
      typeFormulaire: s.typeFormulaire,
      unite: s.unite ?? "",
      placeholder: s.placeholder ?? "",
    });
    setEdition(s.id);
  };

  const fermer = () => setEdition(undefined);

  const enregistrer = async () => {
    if (!formulaire.label.trim() || enregistrementEnCours) return;
    setEnregistrementEnCours(true);
    try {
      const donnees = {
        icone: formulaire.icone.trim() || "📈",
        label: formulaire.label.trim(),
        typeFormulaire: formulaire.typeFormulaire,
        unite: formulaire.typeFormulaire === "numerique" ? formulaire.unite.trim() || undefined : undefined,
        placeholder:
          formulaire.typeFormulaire !== "severite" && formulaire.typeFormulaire !== "ouinon"
            ? formulaire.placeholder.trim() || undefined
            : undefined,
      };
      if (edition === "nouveau") {
        await ajouterSuivi(donnees);
      } else if (edition) {
        await modifierSuivi(edition, donnees);
      }
      fermer();
    } finally {
      setEnregistrementEnCours(false);
    }
  };

  const basculerActivation = async (s: SuiviDef) => {
    await modifierSuivi(s.id, { desactive: !s.desactive });
  };

  return (
    <div>
      <EnTete titre="Gérer les activités" couleur={SECTIONS.suivis.couleurFonce} />

      <p className="text-sm text-texte-doux mb-4">
        Ajoute, renomme ou désactive des éléments de tes Activités. Désactiver une activité la
        retire de la grille et du parcours quotidien, mais elle reste modifiable, réactivable à
        tout moment, et les entrées déjà enregistrées restent pleinement visibles dans ton
        historique.
      </p>

      {edition === undefined && (
        <Bouton className="w-full mb-5" couleur={SECTIONS.suivis.couleur} onClick={ouvrirNouveau}>
          <span aria-hidden="true">➕</span> Ajouter une activité
        </Bouton>
      )}

      {edition !== undefined && (
        <div className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4 mb-5">
          <h2 className="font-bold mb-3">{edition === "nouveau" ? "Nouvelle activité" : "Modifier cette activité"}</h2>
          <Champ label="Icône (emoji)">
            <input
              className={classesInput}
              value={formulaire.icone}
              maxLength={4}
              onChange={(e) => setFormulaire((f) => ({ ...f, icone: e.target.value }))}
              placeholder="📈"
            />
          </Champ>
          <Champ label="Nom de l'activité">
            <input
              className={classesInput}
              value={formulaire.label}
              onChange={(e) => setFormulaire((f) => ({ ...f, label: e.target.value }))}
              placeholder="Ex. Séance de piscine"
            />
          </Champ>
          <Champ label="Type de saisie">
            <select
              className={classesInput}
              value={formulaire.typeFormulaire}
              onChange={(e) => setFormulaire((f) => ({ ...f, typeFormulaire: e.target.value as TypeFormulaireSuivi }))}
            >
              {(Object.keys(LABEL_TYPE) as TypeFormulaireSuivi[]).map((t) => (
                <option key={t} value={t}>
                  {LABEL_TYPE[t]}
                </option>
              ))}
            </select>
          </Champ>
          {formulaire.typeFormulaire === "numerique" && (
            <Champ label="Unité" optionnel>
              <input
                className={classesInput}
                value={formulaire.unite}
                onChange={(e) => setFormulaire((f) => ({ ...f, unite: e.target.value }))}
                placeholder="Ex. L, kg, min..."
              />
            </Champ>
          )}
          {formulaire.typeFormulaire !== "severite" && formulaire.typeFormulaire !== "ouinon" && (
            <Champ label="Exemple affiché dans le champ" optionnel>
              <input
                className={classesInput}
                value={formulaire.placeholder}
                onChange={(e) => setFormulaire((f) => ({ ...f, placeholder: e.target.value }))}
                placeholder="Ex. 30 minutes de natation"
              />
            </Champ>
          )}
          <div className="flex gap-3">
            <Bouton
              className="flex-1"
              couleur={SECTIONS.suivis.couleur}
              onClick={enregistrer}
              disabled={!formulaire.label.trim() || enregistrementEnCours}
            >
              Enregistrer
            </Bouton>
            <Bouton variante="contour" couleur={SECTIONS.suivis.couleur} onClick={fermer}>
              Annuler
            </Bouton>
          </div>
        </div>
      )}

      <div className="divide-y divide-bordure">
        {suivisActifs.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 py-3">
            <div className="flex flex-col">
              <button
                onClick={() => void deplacerSuivi(s.id, "haut")}
                disabled={i === 0}
                aria-label={`Monter ${s.label}`}
                className="w-6 h-5 flex items-center justify-center text-texte-doux hover:text-texte cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-xs leading-none"
              >
                ▲
              </button>
              <button
                onClick={() => void deplacerSuivi(s.id, "bas")}
                disabled={i === suivisActifs.length - 1}
                aria-label={`Descendre ${s.label}`}
                className="w-6 h-5 flex items-center justify-center text-texte-doux hover:text-texte cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-xs leading-none"
              >
                ▼
              </button>
            </div>
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

      {suivisDesactives.length > 0 && (
        <section className="mt-8">
          <h2 className="font-bold text-lg mb-1">Désactivées</h2>
          <p className="text-xs text-texte-doux mb-3">
            N'apparaissent plus dans la grille ni le parcours quotidien. Réactive-les à tout
            moment.
          </p>
          <div className="divide-y divide-bordure">
            {suivisDesactives.map((s) => (
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
