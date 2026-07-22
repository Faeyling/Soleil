import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EnTete } from "../../components/ui/EnTete";
import { BarreProgression } from "../../components/ui/BarreProgression";
import { SelecteurSeverite } from "../../components/ui/SelecteurSeverite";
import { SelecteurOuiNon } from "../../components/ui/SelecteurOuiNon";
import { SchemaCorporel } from "../../components/ui/SchemaCorporel";
import { versSeverite, depuisSeverite } from "../../lib/ouinon";
import { Bouton } from "../../components/ui/Bouton";
import { Champ, classesInput } from "../../components/ui/Champ";
import { Mascotte } from "../../components/mascotte/Mascotte";
import { SECTIONS } from "../../lib/sections";
import type { Severite } from "../../lib/severite";
import { getSymptomesQuotidiens, getSuivisQuotidiens } from "../../lib/preferences";
import { trouverSymptome } from "../../content/symptomes";
import { trouverSuivi } from "../../content/autresSuivis";
import { useEntreesDuJour } from "../../hooks/useEntrees";
import { useMedicaments } from "../../hooks/useMedicaments";
import { enregistrerOuMettreAJour, creerEntree } from "../../data/repositories/entreesRepository";
import { dateDuJour, maintenantISO } from "../../lib/date";
import { ID_NOTE_JOURNEE } from "../../lib/libelleEntree";
import type { EntreeSymptome, EntreeSuivi } from "../../data/types";

const TOTAL_ETAPES = 5;

export function ParcoursQuotidienPage() {
  const navigate = useNavigate();
  const dateJour = dateDuJour();
  const entreesJour = useEntreesDuJour(dateJour);
  const medicaments = useMedicaments();

  const [etape, setEtape] = useState(1);
  const [termine, setTermine] = useState(false);
  const [symptomeValeurs, setSymptomeValeurs] = useState<Record<string, Severite | undefined>>({});
  const [localisationValeurs, setLocalisationValeurs] = useState<Record<string, string[]>>({});
  const [humeur, setHumeur] = useState<Severite | undefined>();
  const [medicamentsCoches, setMedicamentsCoches] = useState<Set<string>>(new Set());
  const [medicamentsDejaCoches, setMedicamentsDejaCoches] = useState<Set<string>>(new Set());
  const [suivisValeurs, setSuivisValeurs] = useState<Record<string, string>>({});
  const [noteFin, setNoteFin] = useState("");

  const idsSymptomesQuotidiens = getSymptomesQuotidiens();
  const idsSuivisQuotidiens = getSuivisQuotidiens();

  const [preremplissageFait, setPreremplissageFait] = useState(false);
  if (!preremplissageFait && entreesJour.length > 0) {
    setPreremplissageFait(true);
    const symptomes: Record<string, Severite | undefined> = {};
    const localisations: Record<string, string[]> = {};
    for (const e of entreesJour) {
      if (e.type === "symptom" && idsSymptomesQuotidiens.includes(e.item)) {
        symptomes[e.item] = (e as EntreeSymptome).severity;
        const zones = (e as EntreeSymptome).location;
        if (zones) localisations[e.item] = zones;
      }
    }
    setSymptomeValeurs((prev) => ({ ...prev, ...symptomes }));
    setLocalisationValeurs((prev) => ({ ...prev, ...localisations }));

    const humeurEntree = entreesJour.find((e) => e.type === "track_something" && e.item === "humeur") as
      | EntreeSuivi
      | undefined;
    if (humeurEntree) setHumeur(humeurEntree.severity);

    const suivis: Record<string, string> = {};
    for (const e of entreesJour) {
      if (e.type === "track_something" && idsSuivisQuotidiens.includes(e.item)) {
        const suivi = e as EntreeSuivi;
        suivis[e.item] = suivi.severity ?? (suivi.value != null ? String(suivi.value) : "");
      }
    }
    setSuivisValeurs((prev) => ({ ...prev, ...suivis }));

    const medicamentsPrisAujourdhui = new Set(
      entreesJour.filter((e) => e.type === "medication_intake").map((e) => e.medicationId),
    );
    setMedicamentsCoches(medicamentsPrisAujourdhui);
    setMedicamentsDejaCoches(medicamentsPrisAujourdhui);
  }

  const couleurEtape =
    etape === 1
      ? SECTIONS.symptomes.couleur
      : etape === 3
        ? SECTIONS.medicaments.couleur
        : SECTIONS.suivis.couleur;
  const couleurEtapeClaire =
    etape === 1
      ? SECTIONS.symptomes.couleurClaire
      : etape === 3
        ? SECTIONS.medicaments.couleurClaire
        : etape === 5
          ? "var(--color-fond-douce)"
          : SECTIONS.suivis.couleurClaire;

  const suivant = () => setEtape((e) => Math.min(e + 1, TOTAL_ETAPES));
  const precedent = () => setEtape((e) => Math.max(e - 1, 1));

  const terminerParcours = async () => {
    for (const [item, severity] of Object.entries(symptomeValeurs)) {
      if (!severity) continue;
      const def = trouverSymptome(item);
      await enregistrerOuMettreAJour({
        type: "symptom",
        item,
        severity,
        location: def?.localisable ? localisationValeurs[item] : undefined,
        date: dateJour,
        datetime: maintenantISO(),
      });
    }

    if (humeur) {
      await enregistrerOuMettreAJour({
        type: "track_something",
        item: "humeur",
        severity: humeur,
        date: dateJour,
        datetime: maintenantISO(),
      });
    }

    // Seuls les médicaments nouvellement cochés déclenchent une nouvelle prise :
    // ceux déjà cochés au préremplissage (déjà pris aujourd'hui) ne sont pas
    // relogués simplement parce que la case reste cochée en rouvrant le parcours.
    for (const medicamentId of medicamentsCoches) {
      if (medicamentsDejaCoches.has(medicamentId)) continue;
      const medicament = medicaments.find((m) => m.id === medicamentId);
      if (!medicament) continue;
      await creerEntree({
        type: "medication_intake",
        item: medicament.id,
        medicationId: medicament.id,
        medicationName: medicament.nom,
        date: dateJour,
        datetime: maintenantISO(),
      });
    }

    for (const [item, valeurBrute] of Object.entries(suivisValeurs)) {
      if (!valeurBrute) continue;
      const suivi = trouverSuivi(item);
      if (!suivi) continue;
      await enregistrerOuMettreAJour({
        type: "track_something",
        item,
        severity:
          suivi.typeFormulaire === "severite" || suivi.typeFormulaire === "ouinon"
            ? (valeurBrute as Severite)
            : undefined,
        value: suivi.typeFormulaire === "numerique" ? Number(valeurBrute) : undefined,
        unit: suivi.typeFormulaire === "numerique" ? suivi.unite : undefined,
        date: dateJour,
        datetime: maintenantISO(),
      });
    }

    if (noteFin.trim()) {
      await enregistrerOuMettreAJour({
        type: "track_something",
        item: ID_NOTE_JOURNEE,
        note: noteFin.trim(),
        date: dateJour,
        datetime: maintenantISO(),
      });
    }

    setTermine(true);
  };

  if (termine) {
    return (
      <div className="flex flex-col items-center text-center gap-4 pt-10">
        <Mascotte taille={150} />
        <h1 className="text-xl font-bold">Suivi du jour enregistré !</h1>
        <p className="text-texte-doux max-w-sm">
          Merci d'avoir pris ce moment pour toi. À demain, si tu en as besoin — je serai là.
        </p>
        <Bouton onClick={() => navigate("/")}>Retour à l'accueil</Bouton>
      </div>
    );
  }

  return (
    <div>
      <EnTete titre="Suivi du jour" couleur={couleurEtape} />
      <div className="mb-6">
        <BarreProgression etape={etape} total={TOTAL_ETAPES} couleur={couleurEtape} />
      </div>

      <div className="rounded-[var(--rayon-grand)] p-5 mb-6" style={{ background: couleurEtapeClaire }}>
        <div className="rounded-[var(--rayon-grand)]">
          {etape === 1 && (
            <EtapeSymptomes
              ids={idsSymptomesQuotidiens}
              valeurs={symptomeValeurs}
              onChange={(id, s) => setSymptomeValeurs((prev) => ({ ...prev, [id]: s }))}
              localisations={localisationValeurs}
              onChangeLocalisation={(id, zones) => setLocalisationValeurs((prev) => ({ ...prev, [id]: zones }))}
            />
          )}
          {etape === 2 && <EtapeHumeur valeur={humeur} onChange={setHumeur} />}
          {etape === 3 && (
            <EtapeMedicaments
              medicaments={medicaments.filter((m) => !m.desactive)}
              coches={medicamentsCoches}
              onToggle={(id) =>
                setMedicamentsCoches((prev) => {
                  const suivant = new Set(prev);
                  if (suivant.has(id)) suivant.delete(id);
                  else suivant.add(id);
                  return suivant;
                })
              }
            />
          )}
          {etape === 4 && (
            <EtapeAutresSuivis
              ids={idsSuivisQuotidiens}
              valeurs={suivisValeurs}
              onChange={(id, v) => setSuivisValeurs((prev) => ({ ...prev, [id]: v }))}
            />
          )}
          {etape === 5 && <EtapeNoteFin valeur={noteFin} onChange={setNoteFin} />}
        </div>
      </div>

      <div className="flex gap-3">
        {etape > 1 && (
          <Bouton variante="discret" onClick={precedent}>
            Précédent
          </Bouton>
        )}
        <Bouton variante="discret" className="flex-1" onClick={suivant} style={etape === TOTAL_ETAPES ? { display: "none" } : undefined}>
          Passer l'étape
        </Bouton>
        {etape < TOTAL_ETAPES ? (
          <Bouton couleur={couleurEtape} onClick={suivant}>
            Suivant
          </Bouton>
        ) : (
          <Bouton couleur={couleurEtape} onClick={terminerParcours}>
            Terminer
          </Bouton>
        )}
      </div>
    </div>
  );
}

function EtapeSymptomes({
  ids,
  valeurs,
  onChange,
  localisations,
  onChangeLocalisation,
}: {
  ids: string[];
  valeurs: Record<string, Severite | undefined>;
  onChange: (id: string, s: Severite | undefined) => void;
  localisations: Record<string, string[]>;
  onChangeLocalisation: (id: string, zones: string[]) => void;
}) {
  return (
    <div>
      <h2 className="font-bold text-lg mb-4" style={{ color: SECTIONS.symptomes.couleurFonce }}>
        Comment se sentent tes symptômes aujourd'hui ?
      </h2>
      {ids.length === 0 && (
        <p className="text-sm text-texte-doux">
          Aucun symptôme sélectionné pour ce parcours — personnalise-le depuis Profil.
        </p>
      )}
      <div className="flex flex-col gap-5">
        {ids.map((id) => {
          const def = trouverSymptome(id);
          if (!def || def.desactive) return null;
          const zones = localisations[id] ?? [];
          const basculerZone = (zoneId: string) =>
            onChangeLocalisation(id, zones.includes(zoneId) ? zones.filter((z) => z !== zoneId) : [...zones, zoneId]);
          return (
            <div key={id}>
              <p className="font-semibold text-sm mb-2">
                <span aria-hidden="true">{def.icone}</span> {def.label}
              </p>
              {def.typeFormulaire === "ouinon" ? (
                <SelecteurOuiNon
                  valeur={depuisSeverite(valeurs[id])}
                  onChange={(r) => onChange(id, r ? versSeverite(r) : undefined)}
                  permettreDeselection
                />
              ) : (
                <SelecteurSeverite
                  valeur={valeurs[id]}
                  onChange={(s) => onChange(id, s)}
                  itemId={id}
                  permettreDeselection
                />
              )}
              {def.localisable && valeurs[id] && (
                <div className="mt-3">
                  <span className="block text-xs font-semibold mb-1.5 text-texte-doux">
                    Zone(s) concernée(s) (optionnel)
                  </span>
                  <SchemaCorporel zonesSelectionnees={zones} onToggleZone={basculerZone} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EtapeHumeur({
  valeur,
  onChange,
}: {
  valeur?: Severite;
  onChange: (s: Severite | undefined) => void;
}) {
  return (
    <div>
      <h2 className="font-bold text-lg mb-4" style={{ color: SECTIONS.suivis.couleurFonce }}>
        Et ton humeur ?
      </h2>
      <SelecteurSeverite valeur={valeur} onChange={onChange} itemId="humeur" permettreDeselection />
    </div>
  );
}

function EtapeMedicaments({
  medicaments,
  coches,
  onToggle,
}: {
  medicaments: { id: string; nom: string }[];
  coches: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="font-bold text-lg mb-4" style={{ color: SECTIONS.medicaments.couleurFonce }}>
        Quels médicaments as-tu pris aujourd'hui ?
      </h2>
      {medicaments.length === 0 ? (
        <p className="text-sm text-texte-doux">
          Tu n'as pas encore ajouté de médicament. Tu pourras le faire depuis l'accueil.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {medicaments.map((m) => (
            <label
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-bordure bg-surface px-4 py-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={coches.has(m.id)}
                onChange={() => onToggle(m.id)}
                className="w-5 h-5 accent-[var(--color-ardoise)]"
              />
              <span className="font-medium">{m.nom}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function EtapeAutresSuivis({
  ids,
  valeurs,
  onChange,
}: {
  ids: string[];
  valeurs: Record<string, string>;
  onChange: (id: string, v: string) => void;
}) {
  return (
    <div>
      <h2 className="font-bold text-lg mb-4" style={{ color: SECTIONS.suivis.couleurFonce }}>
        Un dernier tour d'horizon
      </h2>
      {ids.length === 0 && (
        <p className="text-sm text-texte-doux">
          Aucun suivi sélectionné pour ce parcours — personnalise-le depuis Profil.
        </p>
      )}
      <div className="flex flex-col gap-5">
        {ids.map((id) => {
          const def = trouverSuivi(id);
          if (!def || def.desactive) return null;
          return (
            <div key={id}>
              <p className="font-semibold text-sm mb-2">
                <span aria-hidden="true">{def.icone}</span> {def.label}
              </p>
              {def.typeFormulaire === "severite" ? (
                <SelecteurSeverite
                  valeur={valeurs[id] as Severite | undefined}
                  onChange={(s) => onChange(id, s ?? "")}
                  itemId={id}
                  permettreDeselection
                />
              ) : def.typeFormulaire === "ouinon" ? (
                <SelecteurOuiNon
                  valeur={depuisSeverite(valeurs[id] as Severite | undefined)}
                  onChange={(r) => onChange(id, r ? versSeverite(r) : "")}
                  permettreDeselection
                />
              ) : (
                <input
                  type="number"
                  step="0.1"
                  className={classesInput}
                  value={valeurs[id] ?? ""}
                  onChange={(e) => onChange(id, e.target.value)}
                  placeholder={def.placeholder}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EtapeNoteFin({ valeur, onChange }: { valeur: string; onChange: (v: string) => void }) {
  return (
    <div>
      <h2 className="font-bold text-lg mb-4">Ton journal du jour</h2>
      <Champ label="Note libre" optionnel>
        <textarea
          className={classesInput}
          rows={5}
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Comment s'est passée ta journée ?"
        />
      </Champ>
    </div>
  );
}
