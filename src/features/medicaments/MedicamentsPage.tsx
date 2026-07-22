import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EnTete } from "../../components/ui/EnTete";
import { Champ, classesInput } from "../../components/ui/Champ";
import { Bouton } from "../../components/ui/Bouton";
import { SECTIONS } from "../../lib/sections";
import { useMedicaments } from "../../hooks/useMedicaments";
import { ajouterMedicament, decrementerStock, reactiverMedicament } from "../../data/repositories/medicamentsRepository";
import { creerEntree } from "../../data/repositories/entreesRepository";
import { dateDepuisDatetimeLocal, datetimeLocalValue, isoDepuisDatetimeLocal, maintenantISO } from "../../lib/date";

export function MedicamentsPage() {
  const navigate = useNavigate();
  const medicaments = useMedicaments();
  const medicamentsActifs = medicaments.filter((m) => !m.desactive);
  const medicamentsDesactives = medicaments.filter((m) => m.desactive);

  const [nom, setNom] = useState("");
  const [dose, setDose] = useState("");
  const [note, setNote] = useState("");
  const [datetime, setDatetime] = useState(datetimeLocalValue(maintenantISO()));
  const [confirmation, setConfirmation] = useState(false);
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);

  const enregistrerPrise = async () => {
    if (enregistrementEnCours || !nom.trim()) return;
    setEnregistrementEnCours(true);
    try {
      const medicament = await ajouterMedicament(nom);
      const iso = isoDepuisDatetimeLocal(datetime);
      await creerEntree({
        type: "medication_intake",
        item: medicament.id,
        medicationId: medicament.id,
        medicationName: medicament.nom,
        dose: dose.trim() || undefined,
        note: note.trim() || undefined,
        date: dateDepuisDatetimeLocal(datetime),
        datetime: iso,
      });
      await decrementerStock(medicament.id);
      setNom("");
      setDose("");
      setNote("");
      setDatetime(datetimeLocalValue(maintenantISO()));
      setConfirmation(true);
      setTimeout(() => setConfirmation(false), 2500);
    } finally {
      setEnregistrementEnCours(false);
    }
  };

  return (
    <div>
      <EnTete titre="Ajouter un médicament" couleur={SECTIONS.medicaments.couleurFonce} />

      {confirmation && (
        <div className="mb-4 rounded-xl bg-sauge-clair text-sauge-fonce px-4 py-3 text-sm">
          <span aria-hidden="true">✓ </span>
          Prise enregistrée !
        </div>
      )}

      <div className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4 mb-6">
        <Champ label="Nom du médicament / traitement">
          <input
            className={classesInput}
            list="liste-medicaments"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex. Ibuprofène"
          />
          <datalist id="liste-medicaments">
            {medicaments
              .filter((m) => !m.desactive)
              .map((m) => (
                <option key={m.id} value={m.nom} />
              ))}
          </datalist>
        </Champ>
        <Champ label="Dose" optionnel>
          <input
            className={classesInput}
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            placeholder="Ex. 400mg, 2 comprimés, 10 gouttes..."
          />
        </Champ>
        <Champ label="Date et heure de la prise">
          <input
            type="datetime-local"
            className={classesInput}
            value={datetime}
            max={datetimeLocalValue(maintenantISO())}
            onChange={(e) => setDatetime(e.target.value)}
          />
        </Champ>
        <Champ label="Note" optionnel>
          <textarea
            className={classesInput}
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Fréquence, moment de prise, effet ressenti..."
          />
        </Champ>
        <Bouton
          className="w-full"
          couleur={SECTIONS.medicaments.couleur}
          onClick={enregistrerPrise}
          disabled={!nom.trim() || enregistrementEnCours}
        >
          Enregistrer la prise
        </Bouton>
      </div>

      <h2 className="font-bold text-lg mb-2">Mes médicaments</h2>
      {medicamentsActifs.length === 0 ? (
        <p className="text-sm text-texte-doux">Aucun médicament ajouté pour l'instant.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {medicamentsActifs.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate(`/medicaments/${m.id}`)}
              className="flex items-center gap-3 rounded-xl border border-bordure bg-surface px-4 py-3 text-left cursor-pointer hover:bg-fond-douce"
            >
              <span className="text-xl" aria-hidden="true">
                💊
              </span>
              <span className="font-semibold">{m.nom}</span>
            </button>
          ))}
        </div>
      )}

      {medicamentsDesactives.length > 0 && (
        <section className="mt-8">
          <h2 className="font-bold text-lg mb-1">Désactivés</h2>
          <p className="text-xs text-texte-doux mb-3">
            N'apparaissent plus ici ni dans le parcours quotidien. Réactive-les à tout moment, ou
            enregistre simplement une nouvelle prise pour les réactiver automatiquement.
          </p>
          <div className="grid grid-cols-1 gap-2">
            {medicamentsDesactives.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-bordure bg-surface px-4 py-3 opacity-70"
              >
                <span className="text-xl" aria-hidden="true">
                  💊
                </span>
                <button
                  onClick={() => navigate(`/medicaments/${m.id}`)}
                  className="flex-1 text-left font-semibold cursor-pointer"
                >
                  {m.nom}
                </button>
                <button
                  onClick={() => void reactiverMedicament(m.id)}
                  aria-label={`Réactiver ${m.nom}`}
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
