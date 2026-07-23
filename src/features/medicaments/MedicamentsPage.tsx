import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EnTete } from "../../components/ui/EnTete";
import { Champ, classesInput } from "../../components/ui/Champ";
import { Bouton } from "../../components/ui/Bouton";
import { SECTIONS } from "../../lib/sections";
import { useMedicaments } from "../../hooks/useMedicaments";
import { ajouterMedicament, reactiverMedicament, deplacerMedicament } from "../../data/repositories/medicamentsRepository";

export function MedicamentsPage() {
  const navigate = useNavigate();
  const medicaments = useMedicaments();
  const medicamentsActifs = medicaments.filter((m) => !m.desactive);
  const medicamentsDesactives = medicaments.filter((m) => m.desactive);

  const [nom, setNom] = useState("");
  const [doseHabituelle, setDoseHabituelle] = useState("");
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);

  const ajouter = async () => {
    if (enregistrementEnCours || !nom.trim()) return;
    setEnregistrementEnCours(true);
    try {
      const medicament = await ajouterMedicament(nom, doseHabituelle);
      setNom("");
      setDoseHabituelle("");
      setAfficherFormulaire(false);
      // La prise elle-même ne se log que depuis la fiche du médicament — on
      // y amène directement pour enchaîner si besoin.
      navigate(`/medicaments/${medicament.id}`);
    } finally {
      setEnregistrementEnCours(false);
    }
  };

  return (
    <div>
      <EnTete titre="Mes médicaments" couleur={SECTIONS.medicaments.couleurFonce} />

      <p className="text-sm text-texte-doux mb-4">
        Ajoute un médicament à ta liste personnelle. Tu pourras ensuite enregistrer une prise,
        suivre ton stock et modifier sa dose habituelle depuis sa fiche.
      </p>

      {afficherFormulaire ? (
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
              {medicamentsActifs.map((m) => (
                <option key={m.id} value={m.nom} />
              ))}
            </datalist>
          </Champ>
          <Champ label="Dose habituelle" optionnel>
            <input
              className={classesInput}
              value={doseHabituelle}
              onChange={(e) => setDoseHabituelle(e.target.value)}
              placeholder="Ex. 400mg, 2 comprimés, 10 gouttes..."
            />
          </Champ>
          <div className="flex gap-3">
            <Bouton
              className="flex-1"
              couleur={SECTIONS.medicaments.couleur}
              onClick={ajouter}
              disabled={!nom.trim() || enregistrementEnCours}
            >
              Ajouter à ma liste
            </Bouton>
            <Bouton variante="contour" couleur={SECTIONS.medicaments.couleur} onClick={() => setAfficherFormulaire(false)}>
              Annuler
            </Bouton>
          </div>
        </div>
      ) : (
        <Bouton className="w-full mb-6" couleur={SECTIONS.medicaments.couleur} onClick={() => setAfficherFormulaire(true)}>
          <span aria-hidden="true">➕</span> Ajouter un médicament
        </Bouton>
      )}

      <h2 className="font-bold text-lg mb-2">Mes médicaments</h2>
      {medicamentsActifs.length === 0 ? (
        <p className="text-sm text-texte-doux">Aucun médicament ajouté pour l'instant.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {medicamentsActifs.map((m, i) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-bordure bg-surface px-4 py-3"
            >
              <div className="flex flex-col">
                <button
                  onClick={() => void deplacerMedicament(m.id, "haut")}
                  disabled={i === 0}
                  aria-label={`Monter ${m.nom}`}
                  className="w-6 h-5 flex items-center justify-center text-texte-doux hover:text-texte cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-xs leading-none"
                >
                  ▲
                </button>
                <button
                  onClick={() => void deplacerMedicament(m.id, "bas")}
                  disabled={i === medicamentsActifs.length - 1}
                  aria-label={`Descendre ${m.nom}`}
                  className="w-6 h-5 flex items-center justify-center text-texte-doux hover:text-texte cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-xs leading-none"
                >
                  ▼
                </button>
              </div>
              <button
                onClick={() => navigate(`/medicaments/${m.id}`)}
                className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer"
              >
                <span className="text-xl" aria-hidden="true">
                  💊
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold">{m.nom}</span>
                  {m.doseHabituelle && <span className="block text-xs text-texte-doux truncate">{m.doseHabituelle}</span>}
                </span>
                <span className="text-texte-doux" aria-hidden="true">
                  ›
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      {medicamentsDesactives.length > 0 && (
        <section className="mt-8">
          <h2 className="font-bold text-lg mb-1">Désactivés</h2>
          <p className="text-xs text-texte-doux mb-3">
            N'apparaissent plus ici ni dans le parcours quotidien. Réactive-les à tout moment, ou
            enregistre simplement une nouvelle prise depuis leur fiche pour les réactiver
            automatiquement.
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
