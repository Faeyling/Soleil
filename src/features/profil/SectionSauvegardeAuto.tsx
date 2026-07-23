import { useEffect, useState } from "react";
import { Bouton } from "../../components/ui/Bouton";
import {
  supporteFileSystemAccess,
  choisirFichierSauvegardeAuto,
  desactiverSauvegardeAuto,
  nomFichierSauvegardeAuto,
  etatPermissionSauvegardeAuto,
  autoriserEtEcrireSauvegardeAuto,
  type EtatPermissionSauvegardeAuto,
} from "../../lib/sauvegardeAuto";

export function SectionSauvegardeAuto() {
  const [nomFichier, setNomFichier] = useState<string | undefined>();
  const [etatPermission, setEtatPermission] = useState<EtatPermissionSauvegardeAuto>("non-configuree");
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  const rafraichir = async () => {
    setNomFichier(await nomFichierSauvegardeAuto());
    setEtatPermission(await etatPermissionSauvegardeAuto());
  };

  useEffect(() => {
    if (!supporteFileSystemAccess()) return;
    let annule = false;
    void (async () => {
      const [nom, etat] = await Promise.all([nomFichierSauvegardeAuto(), etatPermissionSauvegardeAuto()]);
      if (!annule) {
        setNomFichier(nom);
        setEtatPermission(etat);
      }
    })();
    return () => {
      annule = true;
    };
  }, []);

  if (!supporteFileSystemAccess()) {
    return (
      <section className="mb-8">
        <h2 className="font-bold text-lg mb-3">Sauvegarde automatique</h2>
        <div className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4">
          <p className="text-sm text-texte-doux">
            Non disponible sur ce navigateur — cette fonctionnalité fonctionne sur Chrome, Edge et
            les navigateurs basés sur Chromium. Tu peux toujours exporter manuellement ci-dessus.
          </p>
        </div>
      </section>
    );
  }

  const choisir = async () => {
    setEnCours(true);
    try {
      const choisi = await choisirFichierSauvegardeAuto();
      if (choisi) {
        setMessage(undefined);
        await rafraichir();
      }
    } finally {
      setEnCours(false);
    }
  };

  const autoriser = async () => {
    setEnCours(true);
    try {
      const reussi = await autoriserEtEcrireSauvegardeAuto();
      setMessage(reussi ? "Sauvegarde écrite avec succès." : "Permission refusée.");
      await rafraichir();
    } finally {
      setEnCours(false);
    }
  };

  const desactiver = async () => {
    await desactiverSauvegardeAuto();
    setMessage(undefined);
    await rafraichir();
  };

  return (
    <section className="mb-8">
      <h2 className="font-bold text-lg mb-3">Sauvegarde automatique</h2>
      <div className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4 flex flex-col gap-3">
        <p className="text-sm text-texte-doux">
          Choisis un fichier local dans lequel Soleil réécrit automatiquement une sauvegarde à jour,
          sans que tu aies à penser à l'exporter toi-même.
        </p>

        {!nomFichier && (
          <Bouton variante="contour" onClick={choisir} disabled={enCours}>
            Choisir un fichier de sauvegarde automatique
          </Bouton>
        )}

        {nomFichier && (
          <>
            <p className="text-sm">
              Fichier configuré : <span className="font-semibold">{nomFichier}</span>
            </p>
            {etatPermission === "accordee" && (
              <p className="text-sm rounded-xl px-3 py-2 bg-sauge-clair text-texte">
                <span aria-hidden="true">✓ </span>
                Sauvegarde automatique active.
              </p>
            )}
            {etatPermission === "a-demander" && (
              <Bouton variante="contour" onClick={autoriser} disabled={enCours}>
                Autoriser l'écriture automatique
              </Bouton>
            )}
            {etatPermission === "refusee" && (
              <p className="text-sm rounded-xl px-3 py-2 bg-terracotta-clair text-texte">
                Permission refusée par le navigateur. Choisis à nouveau un fichier pour réessayer.
              </p>
            )}
            <div className="flex gap-2 flex-wrap">
              <Bouton variante="contour" onClick={choisir} disabled={enCours}>
                Changer de fichier
              </Bouton>
              <Bouton variante="danger" onClick={desactiver} disabled={enCours}>
                Désactiver
              </Bouton>
            </div>
          </>
        )}

        {message && <p className="text-sm text-texte-doux">{message}</p>}
      </div>
    </section>
  );
}
