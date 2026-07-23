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
  desactiverMedicament,
  reactiverMedicament,
  definirStock,
  definirDoseHabituelle,
  decrementerStock,
} from "../../data/repositories/medicamentsRepository";
import { creerEntree, modifierEntree, supprimerEntree } from "../../data/repositories/entreesRepository";
import { proposerAnnulation } from "../../lib/toastAnnulerStore";
import {
  dateDepuisDatetimeLocal,
  datetimeLocalValue,
  formatDateLisible,
  isoDepuisDatetimeLocal,
  maintenantISO,
} from "../../lib/date";
import type { EntreePriseMedicament, Medicament } from "../../data/types";

export function MedicamentFormPage() {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
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

  return <GestionMedicament medicamentId={id} medicament={medicamentBrut} prises={prises} />;
}

interface GestionMedicamentProps {
  medicamentId: string;
  medicament: Medicament | undefined;
  prises: EntreePriseMedicament[];
}

function GestionMedicament({ medicamentId, medicament, prises }: GestionMedicamentProps) {
  const navigate = useNavigate();
  const [nom, setNom] = useState(medicament?.nom ?? "");
  const [doseHabituelle, setDoseHabituelle] = useState("");
  const [stock, setStock] = useState("");
  const [seuilAlerte, setSeuilAlerte] = useState("");
  const [chargePour, setChargePour] = useState<string | undefined>();

  const [dosePrise, setDosePrise] = useState("");
  const [notePrise, setNotePrise] = useState("");
  const [datetimePrise, setDatetimePrise] = useState(datetimeLocalValue(maintenantISO()));
  const [confirmationPrise, setConfirmationPrise] = useState(false);
  const [enregistrementPriseEnCours, setEnregistrementPriseEnCours] = useState(false);

  if (medicament !== undefined && chargePour !== medicamentId) {
    setChargePour(medicamentId);
    setNom(medicament.nom);
    setDoseHabituelle(medicament.doseHabituelle ?? "");
    setStock(medicament.stock != null ? String(medicament.stock) : "");
    setSeuilAlerte(medicament.seuilAlerte != null ? String(medicament.seuilAlerte) : "");
    setDosePrise(medicament.doseHabituelle ?? "");
  }

  if (medicament === undefined) {
    return <p>Médicament introuvable.</p>;
  }

  const enregistrerNom = async () => {
    if (!nom.trim()) return;
    await renommerMedicament(medicamentId, nom);
  };

  const enregistrerDoseHabituelle = async () => {
    await definirDoseHabituelle(medicamentId, doseHabituelle);
  };

  const enregistrerStock = async () => {
    await definirStock(
      medicamentId,
      stock.trim() === "" ? undefined : Number(stock),
      seuilAlerte.trim() === "" ? undefined : Number(seuilAlerte),
    );
  };

  const basculerActivation = async () => {
    if (medicament.desactive) {
      await reactiverMedicament(medicamentId);
    } else {
      await desactiverMedicament(medicamentId);
    }
  };

  const enregistrerNouvellePrise = async () => {
    if (enregistrementPriseEnCours) return;
    setEnregistrementPriseEnCours(true);
    try {
      // Enregistrer une prise pour un médicament désactivé le réactive
      // implicitement — sinon la prise fraîchement enregistrée référencerait
      // un médicament resté invisible dans "Mes médicaments".
      if (medicament.desactive) await reactiverMedicament(medicamentId);
      const iso = isoDepuisDatetimeLocal(datetimePrise);
      await creerEntree({
        type: "medication_intake",
        item: medicamentId,
        medicationId: medicamentId,
        medicationName: medicament.nom,
        dose: dosePrise.trim() || undefined,
        note: notePrise.trim() || undefined,
        date: dateDepuisDatetimeLocal(datetimePrise),
        datetime: iso,
      });
      await decrementerStock(medicamentId);
      setDosePrise(medicament.doseHabituelle ?? "");
      setNotePrise("");
      setDatetimePrise(datetimeLocalValue(maintenantISO()));
      setConfirmationPrise(true);
      setTimeout(() => setConfirmationPrise(false), 2500);
    } finally {
      setEnregistrementPriseEnCours(false);
    }
  };

  const stockBas =
    medicament.stock != null && medicament.seuilAlerte != null && medicament.stock <= medicament.seuilAlerte;

  return (
    <div>
      <EnTete titre={medicament.nom} couleur={SECTIONS.medicaments.couleurFonce} />

      <Champ label="Nom du médicament">
        <div className="flex gap-2">
          <input className={classesInput} value={nom} onChange={(e) => setNom(e.target.value)} />
          <Bouton couleur={SECTIONS.medicaments.couleur} onClick={enregistrerNom}>
            Renommer
          </Bouton>
        </div>
      </Champ>

      <Champ label="Dose habituelle" optionnel>
        <div className="flex gap-2">
          <input
            className={classesInput}
            value={doseHabituelle}
            onChange={(e) => setDoseHabituelle(e.target.value)}
            placeholder="Ex. 400mg, 2 comprimés, 10 gouttes..."
          />
          <Bouton couleur={SECTIONS.medicaments.couleur} onClick={enregistrerDoseHabituelle}>
            Enregistrer
          </Bouton>
        </div>
        <p className="text-xs text-texte-doux mt-1">
          Préremplit (sans l'imposer) le champ dose à chaque nouvelle prise.
        </p>
      </Champ>

      {stockBas && (
        <div className="mb-4 rounded-xl bg-terracotta-clair text-texte px-4 py-3 text-sm">
          <span aria-hidden="true">⚠️ </span>
          Il reste {medicament.stock} prise{medicament.stock === 1 ? "" : "s"} de "{medicament.nom}" —
          pense à renouveler ton ordonnance.
        </div>
      )}

      <Champ label="Stock restant" optionnel>
        <div className="flex gap-2 items-start flex-wrap">
          <input
            type="number"
            min="0"
            className={`${classesInput} w-28`}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="Ex. 20"
            aria-label="Stock restant"
          />
          <input
            type="number"
            min="0"
            className={`${classesInput} w-36`}
            value={seuilAlerte}
            onChange={(e) => setSeuilAlerte(e.target.value)}
            placeholder="Alerte si moins de"
            aria-label="Seuil d'alerte"
          />
          <Bouton couleur={SECTIONS.medicaments.couleur} onClick={enregistrerStock}>
            Enregistrer
          </Bouton>
        </div>
        <p className="text-xs text-texte-doux mt-1">
          Décrémenté d'une unité à chaque prise enregistrée. Laisse vide pour ne pas suivre le stock.
        </p>
      </Champ>

      <h2 className="font-bold text-lg mt-6 mb-2">Enregistrer une prise</h2>

      {confirmationPrise && (
        <div className="mb-4 rounded-xl bg-sauge-clair text-texte px-4 py-3 text-sm">
          <span aria-hidden="true">✓ </span>
          Prise enregistrée !
        </div>
      )}

      <div className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4 mb-6">
        <Champ label="Dose" optionnel>
          <input
            className={classesInput}
            value={dosePrise}
            onChange={(e) => setDosePrise(e.target.value)}
            placeholder="Ex. 400mg, 2 comprimés, 10 gouttes..."
          />
        </Champ>
        <Champ label="Date et heure de la prise">
          <input
            type="datetime-local"
            className={classesInput}
            value={datetimePrise}
            max={datetimeLocalValue(maintenantISO())}
            onChange={(e) => setDatetimePrise(e.target.value)}
          />
        </Champ>
        <Champ label="Note" optionnel>
          <textarea
            className={classesInput}
            rows={2}
            value={notePrise}
            onChange={(e) => setNotePrise(e.target.value)}
            placeholder="Fréquence, moment de prise, effet ressenti..."
          />
        </Champ>
        <Bouton
          className="w-full"
          couleur={SECTIONS.medicaments.couleur}
          onClick={enregistrerNouvellePrise}
          disabled={enregistrementPriseEnCours}
        >
          Enregistrer la prise
        </Bouton>
      </div>

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
                <span className="block text-sm font-semibold">{formatDateLisible(p.date)}</span>
                {p.dose && <span className="block text-xs text-texte-doux">Dose : {p.dose}</span>}
              </span>
              <span className="text-texte-doux" aria-hidden="true">
                ›
              </span>
            </button>
          ))}
        </div>
      )}

      {medicament.desactive ? (
        <div>
          <p className="text-sm text-texte-doux mb-2">
            Ce médicament est désactivé : il n'apparaît plus dans "Mes médicaments" ni le parcours
            quotidien, mais son historique de prises reste intact.
          </p>
          <Bouton couleur={SECTIONS.medicaments.couleur} onClick={() => void basculerActivation()}>
            Réactiver ce médicament
          </Bouton>
        </div>
      ) : (
        <Bouton variante="contour" couleur={SECTIONS.medicaments.couleur} onClick={() => void basculerActivation()}>
          Désactiver ce médicament
        </Bouton>
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
    proposerAnnulation(entree, `Prise de "${entree.medicationName}" supprimée`);
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
