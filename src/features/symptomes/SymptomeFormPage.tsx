import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { trouverSymptome, ARTICULATIONS } from "../../content/symptomes";
import { EnTete } from "../../components/ui/EnTete";
import { Champ, classesInput } from "../../components/ui/Champ";
import { SelecteurSeverite } from "../../components/ui/SelecteurSeverite";
import { Bouton } from "../../components/ui/Bouton";
import { Confirmation } from "../../components/ui/Confirmation";
import { CaseImportante } from "../../components/ui/CaseImportante";
import { ChargementEcran } from "../../components/ui/ChargementEcran";
import { SECTIONS } from "../../lib/sections";
import type { Severite } from "../../lib/severite";
import { dateDepuisDatetimeLocal, datetimeLocalValue, isoDepuisDatetimeLocal, maintenantISO } from "../../lib/date";
import {
  creerEntree,
  modifierEntreeAvecUnicite,
  supprimerEntree,
} from "../../data/repositories/entreesRepository";
import { useEntree } from "../../hooks/useEntrees";
import { CHARGEMENT } from "../../hooks/chargement";

export function SymptomeFormPage() {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const entreeId = searchParams.get("entreeId") ?? undefined;
  const symptome = trouverSymptome(id);
  const entreeBrute = useEntree(entreeId);

  const [severite, setSeverite] = useState<Severite | undefined>();
  const [datetime, setDatetime] = useState(datetimeLocalValue(maintenantISO()));
  const [localisation, setLocalisation] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [important, setImportant] = useState(false);
  const [erreur, setErreur] = useState<string | undefined>();
  const [suppressionDemandee, setSuppressionDemandee] = useState(false);
  const [entreeChargeeId, setEntreeChargeeId] = useState<string | undefined>();
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);

  if (entreeId && entreeBrute === CHARGEMENT) {
    return <ChargementEcran />;
  }
  // Narrowing par `type` plutôt qu'un cast : une entreeId pointant vers une
  // entrée d'un autre type ne doit jamais être lue/écrite comme un symptôme.
  const entreeExistante = entreeBrute && entreeBrute !== CHARGEMENT && entreeBrute.type === "symptom" ? entreeBrute : undefined;

  if (entreeExistante && entreeExistante.id !== entreeChargeeId) {
    setEntreeChargeeId(entreeExistante.id);
    setSeverite(entreeExistante.severity);
    setDatetime(datetimeLocalValue(entreeExistante.datetime));
    setLocalisation(entreeExistante.location ?? []);
    setNote(entreeExistante.note ?? "");
    setImportant(entreeExistante.important ?? false);
  }

  if (!symptome) {
    return <p>Symptôme introuvable.</p>;
  }

  const basculerZone = (zoneId: string) => {
    setLocalisation((prev) =>
      prev.includes(zoneId) ? prev.filter((z) => z !== zoneId) : [...prev, zoneId],
    );
  };

  const enregistrer = async () => {
    if (enregistrementEnCours) return;
    if (!severite) {
      setErreur("Choisis une sévérité pour continuer.");
      return;
    }
    setEnregistrementEnCours(true);
    try {
      const iso = isoDepuisDatetimeLocal(datetime);
      const date = dateDepuisDatetimeLocal(datetime);

      if (entreeExistante) {
        const resultat = await modifierEntreeAvecUnicite(entreeExistante, {
          severity: severite,
          datetime: iso,
          date,
          location: symptome.localisable ? localisation : undefined,
          note: note.trim() || undefined,
          important,
        });
        if (!resultat.modifiee && resultat.conflit) {
          setErreur(
            "Tu as déjà une entrée pour ce symptôme à cette date. Voici cette entrée-là plutôt.",
          );
          navigate(`/symptomes/${symptome.id}?entreeId=${resultat.conflit.id}`, { replace: true });
          return;
        }
        navigate("/");
        return;
      }

      const resultat = await creerEntree({
        type: "symptom",
        item: symptome.id,
        date,
        datetime: iso,
        severity: severite,
        location: symptome.localisable ? localisation : undefined,
        note: note.trim() || undefined,
        important,
      });

      if (!resultat.creee) {
        setErreur(
          "Tu as déjà une entrée pour ce symptôme aujourd'hui. Modifie-la plutôt que d'en créer une nouvelle.",
        );
        if (resultat.entree.type === "symptom") {
          setSeverite(resultat.entree.severity);
          setDatetime(datetimeLocalValue(resultat.entree.datetime));
          setLocalisation(resultat.entree.location ?? []);
          setNote(resultat.entree.note ?? "");
          setImportant(resultat.entree.important ?? false);
        }
        navigate(`/symptomes/${symptome.id}?entreeId=${resultat.entree.id}`, { replace: true });
        return;
      }
      navigate("/");
    } finally {
      setEnregistrementEnCours(false);
    }
  };

  const supprimer = async () => {
    if (entreeExistante) {
      await supprimerEntree(entreeExistante.id);
    }
    navigate("/");
  };

  return (
    <div>
      <EnTete titre={symptome.label} couleur={SECTIONS.symptomes.couleurFonce} />

      {erreur && (
        <div className="mb-4 rounded-xl bg-terracotta-clair text-terracotta-fonce px-4 py-3 text-sm">
          {erreur}
        </div>
      )}

      <Champ label="Sévérité">
        <SelecteurSeverite valeur={severite} onChange={setSeverite} itemId={symptome.id} />
      </Champ>

      <Champ label="Date et heure">
        <input
          type="datetime-local"
          className={classesInput}
          value={datetime}
          max={datetimeLocalValue(maintenantISO())}
          onChange={(e) => setDatetime(e.target.value)}
        />
      </Champ>

      {symptome.localisable && (
        <Champ label="Zone(s) concernée(s)" optionnel>
          <div className="flex flex-wrap gap-2">
            {ARTICULATIONS.map((a) => {
              const actif = localisation.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => basculerZone(a.id)}
                  className="px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors"
                  style={{
                    borderColor: SECTIONS.symptomes.couleur,
                    background: actif ? SECTIONS.symptomes.couleur : "transparent",
                    color: actif ? "white" : SECTIONS.symptomes.couleurFonce,
                  }}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        </Champ>
      )}

      <Champ label="Note" optionnel>
        <textarea
          className={classesInput}
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Décris ce que tu ressens, le contexte..."
        />
      </Champ>

      <CaseImportante valeur={important} onChange={setImportant} />

      <div className="flex gap-3 mt-6">
        <Bouton
          className="flex-1"
          couleur={SECTIONS.symptomes.couleur}
          onClick={enregistrer}
          disabled={enregistrementEnCours}
        >
          Enregistrer
        </Bouton>
        {entreeExistante && (
          <Bouton variante="danger" onClick={() => setSuppressionDemandee(true)}>
            Supprimer
          </Bouton>
        )}
      </div>

      {suppressionDemandee && (
        <Confirmation
          titre="Supprimer cette entrée ?"
          message={`Cette entrée de "${symptome.label}" sera définitivement supprimée.`}
          onConfirmer={supprimer}
          onAnnuler={() => setSuppressionDemandee(false)}
        />
      )}
    </div>
  );
}
