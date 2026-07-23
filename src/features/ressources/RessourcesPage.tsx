import { useState } from "react";
import {
  RUBRIQUES_RESSOURCES,
  LIENS_EXTERNES,
  AVERTISSEMENT_RESSOURCES,
  INTRO_CRITERES_HEDS,
  CRITERES_DIAGNOSTIC_HEDS,
} from "../../content/ressources";
import { Bouton } from "../../components/ui/Bouton";
import { Champ, classesInput } from "../../components/ui/Champ";
import { Confirmation } from "../../components/ui/Confirmation";
import { CalculateurBeighton } from "./CalculateurBeighton";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../data/db";
import {
  ajouterNoteRessource,
  supprimerNoteRessource,
} from "../../data/repositories/ressourcesRepository";
import {
  ajouterMedecin,
  modifierMedecin,
  supprimerMedecin,
} from "../../data/repositories/medecinsRepository";
import { formatDateLisible, toDateStr } from "../../lib/date";
import type { MedecinDef } from "../../data/types";

const MEDECIN_VIDE = { nom: "", specialite: "", telephone: "", email: "", adresse: "", note: "" };

export function RessourcesPage() {
  const notes = useLiveQuery(async () => {
    const liste = await db.ressourcesNotes.orderBy("createdAt").toArray();
    return liste.reverse();
  }, []) ?? [];

  const medecins = useLiveQuery(async () => {
    const liste = await db.medecins.orderBy("createdAt").toArray();
    return liste.reverse();
  }, []) ?? [];

  const [titre, setTitre] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [aSupprimer, setASupprimer] = useState<string | undefined>();

  const [formulaireMedecin, setFormulaireMedecin] = useState(MEDECIN_VIDE);
  const [medecinEnEdition, setMedecinEnEdition] = useState<string | undefined>();
  const [afficherFormulaireMedecin, setAfficherFormulaireMedecin] = useState(false);
  const [medecinASupprimer, setMedecinASupprimer] = useState<string | undefined>();

  const ajouter = async () => {
    if (!titre.trim()) return;
    await ajouterNoteRessource({ titre: titre.trim(), url: url.trim() || undefined, note: note.trim() || undefined });
    setTitre("");
    setUrl("");
    setNote("");
    setAfficherFormulaire(false);
  };

  const ouvrirEditionMedecin = (m: MedecinDef) => {
    setMedecinEnEdition(m.id);
    setFormulaireMedecin({
      nom: m.nom,
      specialite: m.specialite ?? "",
      telephone: m.telephone ?? "",
      email: m.email ?? "",
      adresse: m.adresse ?? "",
      note: m.note ?? "",
    });
    setAfficherFormulaireMedecin(true);
  };

  const fermerFormulaireMedecin = () => {
    setAfficherFormulaireMedecin(false);
    setMedecinEnEdition(undefined);
    setFormulaireMedecin(MEDECIN_VIDE);
  };

  const enregistrerMedecin = async () => {
    if (!formulaireMedecin.nom.trim()) return;
    const donnees = {
      nom: formulaireMedecin.nom.trim(),
      specialite: formulaireMedecin.specialite.trim() || undefined,
      telephone: formulaireMedecin.telephone.trim() || undefined,
      email: formulaireMedecin.email.trim() || undefined,
      adresse: formulaireMedecin.adresse.trim() || undefined,
      note: formulaireMedecin.note.trim() || undefined,
    };
    if (medecinEnEdition) {
      await modifierMedecin(medecinEnEdition, donnees);
    } else {
      await ajouterMedecin(donnees);
    }
    fermerFormulaireMedecin();
  };

  return (
    <div className="pb-4">
      <h1 className="text-2xl font-bold mb-1">Ressources</h1>
      <p className="text-sm text-texte-doux mb-5">La recherche sur le SEDh en quelques repères</p>

      <div className="rounded-[var(--rayon)] bg-fond-douce p-4 mb-6 text-xs text-texte-doux leading-relaxed">
        <span aria-hidden="true">ℹ️ </span>
        {AVERTISSEMENT_RESSOURCES}
      </div>

      <section className="mb-8">
        <h2 className="font-bold text-lg mb-2">Calculateur du score de Beighton</h2>
        <CalculateurBeighton />
      </section>

      <section className="mb-8">
        <h2 className="font-bold text-lg mb-2">Critères diagnostiques actuels du SEDh</h2>
        <p className="text-sm text-texte-doux mb-3 leading-relaxed">{INTRO_CRITERES_HEDS}</p>
        <div className="flex flex-col gap-4">
          {CRITERES_DIAGNOSTIC_HEDS.map((c) => (
            <div key={c.titre} className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4">
              <h3 className="font-bold text-base mb-1.5" style={{ color: "var(--color-sauge-fonce)" }}>
                {c.titre}
              </h3>
              <p className="text-sm text-texte leading-relaxed">{c.texte}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-4 mb-6">
        {RUBRIQUES_RESSOURCES.map((r) => (
          <div key={r.titre} className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4">
            <h2 className="font-bold text-base mb-1.5" style={{ color: "var(--color-sauge-fonce)" }}>
              {r.titre}
            </h2>
            <p className="text-sm text-texte leading-relaxed">{r.texte}</p>
          </div>
        ))}
      </div>

      <section className="mb-8">
        <h2 className="font-bold text-lg mb-2">Liens utiles</h2>
        <div className="flex flex-col gap-2">
          {LIENS_EXTERNES.map((lien) => (
            <a
              key={lien.url}
              href={lien.url}
              target="_blank"
              rel="noreferrer"
              className="text-texte underline text-sm"
            >
              {lien.titre}{" "}
              <span className="text-texte-doux text-xs">({lien.langue === "fr" ? "francophone" : "anglophone"})</span>{" "}
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">Mes médecins</h2>
          <Bouton
            variante="discret"
            onClick={() => (afficherFormulaireMedecin ? fermerFormulaireMedecin() : setAfficherFormulaireMedecin(true))}
          >
            {afficherFormulaireMedecin ? "Annuler" : "+ Ajouter"}
          </Bouton>
        </div>

        {afficherFormulaireMedecin && (
          <div className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4 mb-4">
            <Champ label="Nom">
              <input
                className={classesInput}
                value={formulaireMedecin.nom}
                onChange={(e) => setFormulaireMedecin((f) => ({ ...f, nom: e.target.value }))}
                placeholder="Dr. Martin"
              />
            </Champ>
            <Champ label="Spécialité" optionnel>
              <input
                className={classesInput}
                value={formulaireMedecin.specialite}
                onChange={(e) => setFormulaireMedecin((f) => ({ ...f, specialite: e.target.value }))}
                placeholder="Rhumatologue, généraliste..."
              />
            </Champ>
            <Champ label="Téléphone" optionnel>
              <input
                type="tel"
                className={classesInput}
                value={formulaireMedecin.telephone}
                onChange={(e) => setFormulaireMedecin((f) => ({ ...f, telephone: e.target.value }))}
              />
            </Champ>
            <Champ label="Email" optionnel>
              <input
                type="email"
                className={classesInput}
                value={formulaireMedecin.email}
                onChange={(e) => setFormulaireMedecin((f) => ({ ...f, email: e.target.value }))}
              />
            </Champ>
            <Champ label="Adresse" optionnel>
              <input
                className={classesInput}
                value={formulaireMedecin.adresse}
                onChange={(e) => setFormulaireMedecin((f) => ({ ...f, adresse: e.target.value }))}
              />
            </Champ>
            <Champ label="Note" optionnel>
              <textarea
                className={classesInput}
                rows={2}
                value={formulaireMedecin.note}
                onChange={(e) => setFormulaireMedecin((f) => ({ ...f, note: e.target.value }))}
              />
            </Champ>
            <Bouton className="w-full" onClick={enregistrerMedecin} disabled={!formulaireMedecin.nom.trim()}>
              Enregistrer
            </Bouton>
          </div>
        )}

        {medecins.length === 0 ? (
          <p className="text-sm text-texte-doux">Ajoute ici les coordonnées de tes médecins et spécialistes.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {medecins.map((m) => (
              <div key={m.id} className="rounded-[var(--rayon)] bg-surface border border-bordure p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{m.nom}</p>
                    {m.specialite && <p className="text-xs text-texte-doux">{m.specialite}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => ouvrirEditionMedecin(m)}
                      aria-label={`Modifier ${m.nom}`}
                      className="text-texte-doux hover:text-texte cursor-pointer text-lg leading-none"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setMedecinASupprimer(m.id)}
                      aria-label={`Supprimer ${m.nom}`}
                      className="text-texte-doux hover:text-severite-haut cursor-pointer text-lg leading-none"
                    >
                      🗑
                    </button>
                  </div>
                </div>
                {m.telephone && (
                  <a href={`tel:${m.telephone}`} className="text-texte underline text-sm block mt-1">
                    📞 {m.telephone}
                  </a>
                )}
                {m.email && (
                  <a href={`mailto:${m.email}`} className="text-texte underline text-sm block mt-1">
                    ✉️ {m.email}
                  </a>
                )}
                {m.adresse && <p className="text-sm mt-1">{m.adresse}</p>}
                {m.note && <p className="text-sm text-texte-doux mt-1">{m.note}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {medecinASupprimer && (
        <Confirmation
          titre="Supprimer ce médecin ?"
          message="Ces coordonnées seront définitivement supprimées."
          onConfirmer={async () => {
            await supprimerMedecin(medecinASupprimer);
            setMedecinASupprimer(undefined);
          }}
          onAnnuler={() => setMedecinASupprimer(undefined)}
        />
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">Mes notes et liens</h2>
          <Bouton variante="discret" onClick={() => setAfficherFormulaire((v) => !v)}>
            {afficherFormulaire ? "Annuler" : "+ Ajouter"}
          </Bouton>
        </div>

        {afficherFormulaire && (
          <div className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4 mb-4">
            <Champ label="Titre">
              <input className={classesInput} value={titre} onChange={(e) => setTitre(e.target.value)} />
            </Champ>
            <Champ label="Lien" optionnel>
              <input
                className={classesInput}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </Champ>
            <Champ label="Note" optionnel>
              <textarea className={classesInput} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </Champ>
            <Bouton className="w-full" onClick={ajouter} disabled={!titre.trim()}>
              Enregistrer
            </Bouton>
          </div>
        )}

        {notes.length === 0 ? (
          <p className="text-sm text-texte-doux">
            Tu peux ajouter ici tes propres notes de recherche ou des liens utiles.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {notes.map((n) => (
              <div key={n.id} className="rounded-[var(--rayon)] bg-surface border border-bordure p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{n.titre}</p>
                    <p className="text-xs text-texte-doux">{formatDateLisible(toDateStr(new Date(n.createdAt)))}</p>
                  </div>
                  <button
                    onClick={() => setASupprimer(n.id)}
                    aria-label="Supprimer cette note"
                    className="text-texte-doux hover:text-severite-haut cursor-pointer text-lg leading-none"
                  >
                    🗑
                  </button>
                </div>
                {n.url && (
                  <a href={n.url} target="_blank" rel="noreferrer" className="text-texte underline text-sm block mt-1">
                    {n.url} <span aria-hidden="true">↗</span>
                  </a>
                )}
                {n.note && <p className="text-sm mt-1">{n.note}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {aSupprimer && (
        <Confirmation
          titre="Supprimer cette note ?"
          message="Cette note sera définitivement supprimée."
          onConfirmer={async () => {
            await supprimerNoteRessource(aSupprimer);
            setASupprimer(undefined);
          }}
          onAnnuler={() => setASupprimer(undefined)}
        />
      )}
    </div>
  );
}
