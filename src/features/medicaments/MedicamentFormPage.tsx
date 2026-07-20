import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { EnTete } from "../../components/ui/EnTete";
import { Champ, classesInput } from "../../components/ui/Champ";
import { Bouton } from "../../components/ui/Bouton";
import { Confirmation } from "../../components/ui/Confirmation";
import { ChargementEcran } from "../../components/ui/ChargementEcran";
import { SECTIONS } from "../../lib/sections";
import { useMedicament } from "../../hooks/useMedicaments";
import { useEntree, usePrisesMedicament } from "../../hooks/useEntrees";
import { CHARGEMENT } from "../../hooks/chargement";
import {
  renommerMedicament,
  supprimerMedicament,
} from "../../data/repositories/medicamentsRepository";
import { modifierEntree, supprimerEntree } from "../../data/repositories/entreesRepository";
import { dateDepuisDatetimeLocal, datetimeLocalValue, formatDateTimeLisible, isoDepuisDatetimeLocal } from "../../lib/date";
import type { EntreePriseMedicament } from "../../data/types";

export function MedicamentFormPage() {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const entreeId = searchParams.get("entreeId") ?? undefined;

  const medicamentBrut = useMedicament(id);
  const entreeBrute = useEntree(entreeId);
  const prises = usePrisesMedicament(id);

  if (medicamentBrut === CHARGEMENT || (entreeId !== undefined && entreeBrute === CHARGEMENT)) {
    return <ChargementEcran />;
  }
  // Narrowing par `type` plutôt qu'un cast : une entreeId pointant vers une
  // entrée d'un autre type ne doit jamais être lue/écrite comme une prise.
  const entree =
    entreeBrute && entreeBrute !== CHARGEMENT && entreeBrute.type === "medication_intake" ? entreeBrute : undefined;

  if (entreeId) {
    return <EditionPrise entree={entree} medicamentNom={medicamentBrut?.nom} />;
  }

  return (
    <GestionMedicament
      medicamentId={id}
      medicamentNom={medicamentBrut?.nom}
      prises={prises}
      onSupprime={() => navigate("/medicaments")}
    />
  );
}

interface GestionMedicamentProps {
  medicamentId: string;
  medicamentNom: string | undefined;
  prises: EntreePriseMedicament[];
  onSupprime: () => void;
}

function GestionMedicament({ medicamentId, medicamentNom, prises, onSupprime }: GestionMedicamentProps) {
  const navigate = useNavigate();
  const [nom, setNom] = useState(medicamentNom ?? "");
  const [suppressionDemandee, setSuppressionDemandee] = useState(false);
  const [nomChargePour, setNomChargePour] = useState<string | undefined>();

  if (medicamentNom !== undefined && nomChargePour !== medicamentId) {
    setNomChargePour(medicamentId);
    setNom(medicamentNom);
  }

  if (medicamentNom === undefined) {
    return <p>Médicament introuvable.</p>;
  }

  const enregistrerNom = async () => {
    if (!nom.trim()) return;
    await renommerMedicament(medicamentId, nom);
  };

  const supprimer = async () => {
    await supprimerMedicament(medicamentId);
    onSupprime();
  };

  return (
    <div>
      <EnTete titre={medicamentNom} couleur={SECTIONS.medicaments.couleurFonce} />

      <Champ label="Nom du médicament">
        <div className="flex gap-2">
          <input className={classesInput} value={nom} onChange={(e) => setNom(e.target.value)} />
          <Bouton couleur={SECTIONS.medicaments.couleur} onClick={enregistrerNom}>
            Renommer
          </Bouton>
        </div>
      </Champ>

      <h2 className="font-bold text-lg mt-6 mb-2">Historique des prises</h2>
      {prises.length === 0 ? (
        <p className="text-sm text-texte-doux mb-4">Aucune prise enregistrée pour ce médicament.</p>
      ) : (
        <div className="divide-y divide-bordure mb-4">
          {prises.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/medicaments/${medicamentId}?entreeId=${p.id}`)}
              className="w-full flex items-center justify-between py-3 text-left cursor-pointer hover:bg-fond-douce rounded-lg px-2"
            >
              <span>
                <span className="block text-sm font-semibold">{formatDateTimeLisible(p.datetime)}</span>
                {p.dose && <span className="block text-xs text-texte-doux">Dose : {p.dose}</span>}
              </span>
              <span className="text-texte-doux" aria-hidden="true">
                ›
              </span>
            </button>
          ))}
        </div>
      )}

      <Bouton variante="danger" onClick={() => setSuppressionDemandee(true)}>
        Supprimer ce médicament
      </Bouton>

      {suppressionDemandee && (
        <Confirmation
          titre="Supprimer ce médicament ?"
          message={`"${medicamentNom}" et tout son historique de prises seront définitivement supprimés.`}
          onConfirmer={supprimer}
          onAnnuler={() => setSuppressionDemandee(false)}
        />
      )}
    </div>
  );
}

interface EditionPriseProps {
  entree: EntreePriseMedicament | undefined;
  medicamentNom: string | undefined;
}

function EditionPrise({ entree, medicamentNom }: EditionPriseProps) {
  const navigate = useNavigate();
  const [dose, setDose] = useState("");
  const [note, setNote] = useState("");
  const [datetime, setDatetime] = useState("");
  const [suppressionDemandee, setSuppressionDemandee] = useState(false);
  const [entreeChargeeId, setEntreeChargeeId] = useState<string | undefined>();
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);

  if (entree && entree.id !== entreeChargeeId) {
    setEntreeChargeeId(entree.id);
    setDose(entree.dose ?? "");
    setNote(entree.note ?? "");
    setDatetime(datetimeLocalValue(entree.datetime));
  }

  if (!entree) {
    return <p>Prise introuvable.</p>;
  }

  const enregistrer = async () => {
    if (enregistrementEnCours) return;
    setEnregistrementEnCours(true);
    try {
      const iso = isoDepuisDatetimeLocal(datetime);
      await modifierEntree(entree.id, {
        dose: dose.trim() || undefined,
        note: note.trim() || undefined,
        datetime: iso,
        date: dateDepuisDatetimeLocal(datetime),
      });
      navigate(-1);
    } finally {
      setEnregistrementEnCours(false);
    }
  };

  const supprimer = async () => {
    await supprimerEntree(entree.id);
    navigate(-1);
  };

  return (
    <div>
      <EnTete titre={`Prise — ${medicamentNom ?? entree.medicationName}`} couleur={SECTIONS.medicaments.couleurFonce} />

      <Champ label="Dose">
        <input className={classesInput} value={dose} onChange={(e) => setDose(e.target.value)} />
      </Champ>
      <Champ label="Date et heure">
        <input
          type="datetime-local"
          className={classesInput}
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
        />
      </Champ>
      <Champ label="Note" optionnel>
        <textarea className={classesInput} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </Champ>

      <div className="flex gap-3 mt-6">
        <Bouton
          className="flex-1"
          couleur={SECTIONS.medicaments.couleur}
          onClick={enregistrer}
          disabled={enregistrementEnCours}
        >
          Enregistrer
        </Bouton>
        <Bouton variante="danger" onClick={() => setSuppressionDemandee(true)}>
          Supprimer
        </Bouton>
      </div>

      {suppressionDemandee && (
        <Confirmation
          titre="Supprimer cette prise ?"
          message="Cette prise sera définitivement supprimée."
          onConfirmer={supprimer}
          onAnnuler={() => setSuppressionDemandee(false)}
        />
      )}
    </div>
  );
}
