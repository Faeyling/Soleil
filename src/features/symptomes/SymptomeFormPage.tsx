import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { trouverSymptome, ARTICULATIONS } from "../../content/symptomes";
import { EnTete } from "../../components/ui/EnTete";
import { Champ, classesInput } from "../../components/ui/Champ";
import { SelecteurSeverite } from "../../components/ui/SelecteurSeverite";
import { Bouton } from "../../components/ui/Bouton";
import { Confirmation } from "../../components/ui/Confirmation";
import { CaseImportante } from "../../components/ui/CaseImportante";
import { SECTIONS } from "../../lib/sections";
import type { Severite } from "../../lib/severite";
import { datetimeLocalValue, isoDepuisDatetimeLocal, maintenantISO } from "../../lib/date";
import { creerEntree, modifierEntree, supprimerEntree } from "../../data/repositories/entreesRepository";
import { useEntree } from "../../hooks/useEntrees";
import type { EntreeSymptome } from "../../data/types";

export function SymptomeFormPage() {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const entreeId = searchParams.get("entreeId") ?? undefined;
  const symptome = trouverSymptome(id);
  const entreeExistante = useEntree(entreeId) as EntreeSymptome | undefined;

  const [severite, setSeverite] = useState<Severite | undefined>();
  const [datetime, setDatetime] = useState(datetimeLocalValue(maintenantISO()));
  const [localisation, setLocalisation] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [important, setImportant] = useState(false);
  const [erreur, setErreur] = useState<string | undefined>();
  const [suppressionDemandee, setSuppressionDemandee] = useState(false);
  const [entreeChargeeId, setEntreeChargeeId] = useState<string | undefined>();

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
    if (!severite) {
      setErreur("Choisis une sévérité pour continuer.");
      return;
    }
    const iso = isoDepuisDatetimeLocal(datetime);
    const date = iso.slice(0, 10);

    if (entreeExistante) {
      await modifierEntree(entreeExistante.id, {
        severity: severite,
        datetime: iso,
        date,
        location: symptome.localisable ? localisation : undefined,
        note: note.trim() || undefined,
        important,
      });
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
        <SelecteurSeverite valeur={severite} onChange={setSeverite} />
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
        <Bouton className="flex-1" couleur={SECTIONS.symptomes.couleur} onClick={enregistrer}>
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

