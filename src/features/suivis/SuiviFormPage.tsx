import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { trouverSuivi } from "../../content/autresSuivis";
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
import type { EntreeSuivi } from "../../data/types";

export function SuiviFormPage() {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const entreeId = searchParams.get("entreeId") ?? undefined;
  const suivi = trouverSuivi(id);
  const entreeExistante = useEntree(entreeId) as EntreeSuivi | undefined;

  const [severite, setSeverite] = useState<Severite | undefined>();
  const [valeur, setValeur] = useState("");
  const [datetime, setDatetime] = useState(datetimeLocalValue(maintenantISO()));
  const [note, setNote] = useState("");
  const [important, setImportant] = useState(false);
  const [erreur, setErreur] = useState<string | undefined>();
  const [suppressionDemandee, setSuppressionDemandee] = useState(false);
  const [entreeChargeeId, setEntreeChargeeId] = useState<string | undefined>();

  if (entreeExistante && entreeExistante.id !== entreeChargeeId) {
    setEntreeChargeeId(entreeExistante.id);
    setSeverite(entreeExistante.severity);
    setValeur(entreeExistante.value != null ? String(entreeExistante.value) : "");
    setDatetime(datetimeLocalValue(entreeExistante.datetime));
    setNote(entreeExistante.note ?? "");
    setImportant(entreeExistante.important ?? false);
  }

  if (!suivi) {
    return <p>Élément introuvable.</p>;
  }

  const enregistrer = async () => {
    if (suivi.typeFormulaire === "severite" && !severite) {
      setErreur("Choisis un niveau pour continuer.");
      return;
    }
    if (suivi.typeFormulaire === "texte" && !note.trim()) {
      setErreur("Ajoute une petite description avant d'enregistrer.");
      return;
    }
    const iso = isoDepuisDatetimeLocal(datetime);
    const date = iso.slice(0, 10);

    const champs = {
      severity: suivi.typeFormulaire === "severite" ? severite : undefined,
      value: suivi.typeFormulaire === "numerique" && valeur !== "" ? Number(valeur) : undefined,
      unit: suivi.typeFormulaire === "numerique" ? suivi.unite : undefined,
      note: note.trim() || undefined,
      important,
      datetime: iso,
      date,
    };

    if (entreeExistante) {
      await modifierEntree(entreeExistante.id, champs);
      navigate("/");
      return;
    }

    const resultat = await creerEntree({
      type: "track_something",
      item: suivi.id,
      ...champs,
    });

    if (!resultat.creee) {
      setErreur("Tu as déjà une entrée pour cet élément aujourd'hui. Modifie-la plutôt.");
      const existante = resultat.entree as EntreeSuivi;
      setSeverite(existante.severity);
      setValeur(existante.value != null ? String(existante.value) : "");
      setDatetime(datetimeLocalValue(existante.datetime));
      setNote(existante.note ?? "");
      setImportant(existante.important ?? false);
      navigate(`/suivis/${suivi.id}?entreeId=${resultat.entree.id}`, { replace: true });
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
      <EnTete titre={suivi.label} couleur={SECTIONS.suivis.couleurFonce} />

      {erreur && (
        <div className="mb-4 rounded-xl bg-ocre-clair text-ocre-fonce px-4 py-3 text-sm">{erreur}</div>
      )}

      {suivi.typeFormulaire === "severite" && (
        <Champ label="Niveau">
          <SelecteurSeverite valeur={severite} onChange={setSeverite} />
        </Champ>
      )}

      {suivi.typeFormulaire === "numerique" && (
        <Champ label={`Valeur${suivi.unite ? ` (${suivi.unite})` : ""}`}>
          <input
            type="number"
            step="0.1"
            className={classesInput}
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
            placeholder={suivi.placeholder}
          />
        </Champ>
      )}

      {suivi.typeFormulaire === "texte" && (
        <Champ label="Description">
          <textarea
            className={classesInput}
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={suivi.placeholder}
          />
        </Champ>
      )}

      <Champ label="Date et heure">
        <input
          type="datetime-local"
          className={classesInput}
          value={datetime}
          max={datetimeLocalValue(maintenantISO())}
          onChange={(e) => setDatetime(e.target.value)}
        />
      </Champ>

      {suivi.typeFormulaire !== "texte" && (
        <Champ label="Note" optionnel>
          <textarea
            className={classesInput}
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Un détail à préciser ?"
          />
        </Champ>
      )}

      <CaseImportante valeur={important} onChange={setImportant} />

      <div className="flex gap-3 mt-6">
        <Bouton className="flex-1" couleur={SECTIONS.suivis.couleur} onClick={enregistrer}>
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
          message={`Cette entrée de "${suivi.label}" sera définitivement supprimée.`}
          onConfirmer={supprimer}
          onAnnuler={() => setSuppressionDemandee(false)}
        />
      )}
    </div>
  );
}
