import { useState } from "react";
import { RUBRIQUES_RESSOURCES, LIENS_EXTERNES, AVERTISSEMENT_RESSOURCES } from "../../content/ressources";
import { Bouton } from "../../components/ui/Bouton";
import { Champ, classesInput } from "../../components/ui/Champ";
import { Confirmation } from "../../components/ui/Confirmation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../data/db";
import {
  ajouterNoteRessource,
  supprimerNoteRessource,
} from "../../data/repositories/ressourcesRepository";
import { formatDateLisible, toDateStr } from "../../lib/date";

export function RessourcesPage() {
  const notes = useLiveQuery(async () => {
    const liste = await db.ressourcesNotes.orderBy("createdAt").toArray();
    return liste.reverse();
  }, []) ?? [];

  const [titre, setTitre] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [aSupprimer, setASupprimer] = useState<string | undefined>();

  const ajouter = async () => {
    if (!titre.trim()) return;
    await ajouterNoteRessource({ titre: titre.trim(), url: url.trim() || undefined, note: note.trim() || undefined });
    setTitre("");
    setUrl("");
    setNote("");
    setAfficherFormulaire(false);
  };

  return (
    <div className="pb-4">
      <h1 className="text-2xl font-bold mb-1">Ressources</h1>
      <p className="text-sm text-texte-doux mb-5">La recherche sur le SEDh en quelques repères</p>

      <div className="flex flex-col gap-4 mb-6">
        {RUBRIQUES_RESSOURCES.map((r) => (
          <div key={r.titre} className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4">
            <h2 className="font-bold text-base mb-1.5" style={{ color: "var(--color-ardoise-fonce)" }}>
              {r.titre}
            </h2>
            <p className="text-sm text-texte leading-relaxed">{r.texte}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[var(--rayon)] bg-fond-douce p-4 mb-6 text-xs text-texte-doux leading-relaxed">
        ℹ️ {AVERTISSEMENT_RESSOURCES}
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
              className="text-ardoise-fonce underline text-sm"
            >
              {lien.titre} ↗
            </a>
          ))}
        </div>
      </section>

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
                  <a href={n.url} target="_blank" rel="noreferrer" className="text-ardoise-fonce underline text-sm block mt-1">
                    {n.url} ↗
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
