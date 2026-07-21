import { useRef, useState } from "react";
import { useToutesLesEntrees } from "../../hooks/useEntrees";
import { CHARGEMENT } from "../../hooks/chargement";
import { useMedicaments } from "../../hooks/useMedicaments";
import { Bouton } from "../../components/ui/Bouton";
import { Confirmation } from "../../components/ui/Confirmation";
import { PERIODES, dateDebutPeriode, type Periode } from "../../lib/periode";
import { dateDuJour } from "../../lib/date";
import { genererRapportPDF } from "../../lib/exportPdf";
import { telechargerCSV } from "../../lib/exportCsv";
import { SYMPTOMES } from "../../content/symptomes";
import { AUTRES_SUIVIS } from "../../content/autresSuivis";
import {
  getSymptomesQuotidiens,
  setSymptomesQuotidiens,
  getSuivisQuotidiens,
  setSuivisQuotidiens,
} from "../../lib/preferences";
import { SECTIONS } from "../../lib/sections";
import { marquerSauvegardeExportee } from "../../lib/rappels";
import { SectionSecurite } from "./SectionSecurite";
import { SectionApparence } from "./SectionApparence";
import { SectionSauvegardeAuto } from "./SectionSauvegardeAuto";
import {
  exporterDonnees,
  telechargerSauvegardeJSON,
  estSauvegardeValide,
  importerDonnees,
  supprimerToutesLesDonnees,
} from "../../data/repositories/sauvegardeRepository";

export function ProfilPage() {
  const entreesBrutes = useToutesLesEntrees();
  const entrees = entreesBrutes === CHARGEMENT ? [] : entreesBrutes;
  const medicaments = useMedicaments();
  const fichierRef = useRef<HTMLInputElement>(null);

  const [periode, setPeriode] = useState<Periode>("30");
  const [inclureSymptomes, setInclureSymptomes] = useState(true);
  const [inclureMedicaments, setInclureMedicaments] = useState(true);
  const [inclureEvenements, setInclureEvenements] = useState(true);
  const [inclureNotesImportantes, setInclureNotesImportantes] = useState(true);

  const [messageImport, setMessageImport] = useState<{ texte: string; erreur: boolean } | undefined>();
  const [confirmationImport, setConfirmationImport] = useState<File | undefined>();
  const [confirmationSuppression, setConfirmationSuppression] = useState(false);

  const [symptomesQuotidiens, setSymptomesQuotidiensEtat] = useState<string[]>(getSymptomesQuotidiens);
  const [suivisQuotidiens, setSuivisQuotidiensEtat] = useState<string[]>(getSuivisQuotidiens);

  const basculerSymptomeQuotidien = (id: string) => {
    const suivant = symptomesQuotidiens.includes(id)
      ? symptomesQuotidiens.filter((s) => s !== id)
      : [...symptomesQuotidiens, id];
    setSymptomesQuotidiensEtat(suivant);
    setSymptomesQuotidiens(suivant);
  };

  const basculerSuiviQuotidien = (id: string) => {
    const suivant = suivisQuotidiens.includes(id)
      ? suivisQuotidiens.filter((s) => s !== id)
      : [...suivisQuotidiens, id];
    setSuivisQuotidiensEtat(suivant);
    setSuivisQuotidiens(suivant);
  };

  const genererPdf = () => {
    const doc = genererRapportPDF(entrees, medicaments, {
      inclureSymptomes,
      inclureMedicaments,
      inclureEvenements,
      inclureNotesImportantes,
      dateDebut: dateDebutPeriode(periode),
      dateFin: dateDuJour(),
    });
    doc.save(`soleil-rapport-${dateDuJour()}.pdf`);
  };

  const exporterJSON = async () => {
    const sauvegarde = await exporterDonnees();
    telechargerSauvegardeJSON(sauvegarde);
    marquerSauvegardeExportee();
  };

  const declencherImport = () => fichierRef.current?.click();

  const fichierChoisi = (fichier: File | null) => {
    if (!fichier) return;
    setConfirmationImport(fichier);
  };

  const confirmerImport = async () => {
    const fichier = confirmationImport;
    setConfirmationImport(undefined);
    if (!fichier) return;
    try {
      const texte = await fichier.text();
      const data = JSON.parse(texte);
      if (!estSauvegardeValide(data)) {
        setMessageImport({ texte: "Ce fichier ne semble pas être une sauvegarde Soleil valide.", erreur: true });
        return;
      }
      await importerDonnees(data);
      setMessageImport({ texte: "Importation réussie ! Tes données ont été restaurées.", erreur: false });
    } catch {
      setMessageImport({
        texte: "Impossible de lire ce fichier. Vérifie qu'il s'agit bien d'un export Soleil.",
        erreur: true,
      });
    } finally {
      if (fichierRef.current) fichierRef.current.value = "";
    }
  };

  const supprimerTout = async () => {
    await supprimerToutesLesDonnees();
    setConfirmationSuppression(false);
  };

  return (
    <div className="pb-4">
      <h1 className="text-2xl font-bold mb-4">Profil & données</h1>

      <div className="rounded-[var(--rayon-grand)] bg-sauge-clair text-sauge-fonce p-4 mb-6 text-sm">
        <span aria-hidden="true">🔒 </span>
        Toutes tes données restent sur cet appareil, dans ton navigateur. Rien n'est jamais
        envoyé à un serveur. Pense à faire une sauvegarde régulière si tu changes d'appareil.
      </div>

      <SectionApparence />

      <SectionSecurite />

      <section className="mb-8">
        <h2 className="font-bold text-lg mb-3">Rapport pour ton médecin</h2>
        <div className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4">
          <p className="text-sm font-semibold mb-2">Période à couvrir</p>
          <div className="flex gap-1 rounded-full bg-fond-douce p-1 mb-4 w-fit">
            {PERIODES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriode(p.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  periode === p.id ? "bg-ardoise text-[var(--color-texte-sur-accent)]" : "text-texte-doux"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <p className="text-sm font-semibold mb-2">Sections à inclure</p>
          <div className="flex flex-col gap-2 mb-4">
            <CaseSection label="Symptômes (fréquence et sévérité)" valeur={inclureSymptomes} onChange={setInclureSymptomes} />
            <CaseSection label="Médicaments et doses" valeur={inclureMedicaments} onChange={setInclureMedicaments} />
            <CaseSection label="Événements notables (subluxations, hématomes...)" valeur={inclureEvenements} onChange={setInclureEvenements} />
            <CaseSection label="Notes marquées importantes" valeur={inclureNotesImportantes} onChange={setInclureNotesImportantes} />
          </div>

          <Bouton className="w-full" onClick={genererPdf}>
            <span aria-hidden="true">📄</span> Générer le rapport PDF
          </Bouton>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-bold text-lg mb-3">Sauvegarde de mes données</h2>
        <div className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4 flex flex-col gap-3">
          <p className="text-sm text-texte-doux">
            Exporte toutes tes données au format JSON pour les conserver ou les transférer sur un
            autre appareil.
          </p>
          <Bouton variante="contour" onClick={exporterJSON}>
            Exporter mes données (JSON)
          </Bouton>
          <Bouton variante="contour" onClick={() => telechargerCSV(entrees)}>
            Exporter en CSV (tableur)
          </Bouton>
          <Bouton variante="contour" onClick={declencherImport}>
            Importer une sauvegarde
          </Bouton>
          <input
            ref={fichierRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => fichierChoisi(e.target.files?.[0] ?? null)}
          />
          {messageImport && (
            <p
              className={`text-sm rounded-xl px-3 py-2 ${
                messageImport.erreur ? "bg-terracotta-clair text-terracotta-fonce" : "bg-sauge-clair text-sauge-fonce"
              }`}
            >
              {!messageImport.erreur && <span aria-hidden="true">✓ </span>}
              {messageImport.texte}
            </p>
          )}
        </div>
      </section>

      <SectionSauvegardeAuto />

      <section className="mb-8">
        <h2 className="font-bold text-lg mb-3">Personnaliser le parcours quotidien</h2>
        <div className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4 flex flex-col gap-5">
          <div>
            <p className="text-sm font-semibold mb-2">
              Symptômes proposés à l'étape 1 (« Suivi du jour »)
            </p>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMES.map((s) => {
                const actif = symptomesQuotidiens.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => basculerSymptomeQuotidien(s.id)}
                    aria-pressed={actif}
                    className="px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors"
                    style={{
                      borderColor: SECTIONS.symptomes.couleur,
                      background: actif ? SECTIONS.symptomes.couleur : "transparent",
                      color: actif ? "var(--color-texte-sur-accent)" : SECTIONS.symptomes.couleurFonce,
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">
              Autres suivis proposés à l'étape 4
            </p>
            <div className="flex flex-wrap gap-2">
              {AUTRES_SUIVIS.filter((s) => !s.masque).map((s) => {
                const actif = suivisQuotidiens.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => basculerSuiviQuotidien(s.id)}
                    aria-pressed={actif}
                    className="px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors"
                    style={{
                      borderColor: SECTIONS.suivis.couleur,
                      background: actif ? SECTIONS.suivis.couleur : "transparent",
                      color: actif ? "var(--color-texte-sur-accent)" : SECTIONS.suivis.couleurFonce,
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-texte-doux">
            Les éléments non sélectionnés restent accessibles depuis « Signaler un symptôme » et
            « Suivre autre chose » — ils sont juste retirés du parcours guidé quotidien.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-bold text-lg mb-3">Zone de danger</h2>
        <div className="rounded-[var(--rayon-grand)] bg-surface border border-bordure overflow-hidden">
          <div
            className="h-3"
            aria-hidden="true"
            style={{
              background:
                "repeating-linear-gradient(135deg, var(--color-severite-haut) 0 12px, var(--color-texte) 12px 24px)",
            }}
          />
          <div className="p-4">
            <p className="text-sm text-texte-doux mb-3">
              Supprime définitivement toutes tes entrées, médicaments et notes de cet appareil.
              Cette action est irréversible — pense à exporter tes données avant si besoin.
            </p>
            <Bouton variante="danger" onClick={() => setConfirmationSuppression(true)}>
              Supprimer toutes mes données
            </Bouton>
          </div>
        </div>
      </section>

      {confirmationImport && (
        <Confirmation
          titre="Importer cette sauvegarde ?"
          message="Toutes tes données actuelles seront remplacées par le contenu de ce fichier. Cette action est irréversible."
          labelConfirmer="Importer"
          onConfirmer={confirmerImport}
          onAnnuler={() => {
            setConfirmationImport(undefined);
            if (fichierRef.current) fichierRef.current.value = "";
          }}
        />
      )}

      {confirmationSuppression && (
        <Confirmation
          titre="Supprimer toutes les données ?"
          message="Toutes tes entrées, médicaments et notes seront définitivement supprimés de cet appareil."
          onConfirmer={supprimerTout}
          onAnnuler={() => setConfirmationSuppression(false)}
        />
      )}
    </div>
  );
}

function CaseSection({
  label,
  valeur,
  onChange,
}: {
  label: string;
  valeur: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm">
      <input
        type="checkbox"
        checked={valeur}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 accent-[var(--color-ardoise)]"
      />
      {label}
    </label>
  );
}
