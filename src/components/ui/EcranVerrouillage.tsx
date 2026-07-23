import { useEffect, useState, type ChangeEvent } from "react";
import { Mascotte } from "../mascotte/Mascotte";
import { verifierCode, marquerSessionDeverrouillee } from "../../lib/verrouillage";
import { biometrieActivee, verifierBiometrie } from "../../lib/biometrie";

interface EcranVerrouillageProps {
  onDeverrouille: () => void;
}

export function EcranVerrouillage({ onDeverrouille }: EcranVerrouillageProps) {
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreurEmpreinte, setErreurEmpreinte] = useState(false);

  const tenterEmpreinte = async () => {
    const ok = await verifierBiometrie();
    if (ok) {
      marquerSessionDeverrouillee();
      onDeverrouille();
    } else {
      setErreurEmpreinte(true);
    }
  };

  // Propose l'empreinte automatiquement à l'ouverture de l'écran, si activée
  // — la vérification elle-même (via l'API WebAuthn) est le système externe
  // synchronisé ici ; aucun setState synchrone avant l'attente asynchrone.
  useEffect(() => {
    if (!biometrieActivee()) return;
    let annule = false;
    void verifierBiometrie().then((ok) => {
      if (annule) return;
      if (ok) {
        marquerSessionDeverrouillee();
        onDeverrouille();
      } else {
        setErreurEmpreinte(true);
      }
    });
    return () => {
      annule = true;
    };
  }, [onDeverrouille]);

  const soumettre = async (valeur: string) => {
    setEnCours(true);
    const correct = await verifierCode(valeur);
    setEnCours(false);
    if (correct) {
      marquerSessionDeverrouillee();
      onDeverrouille();
    } else {
      setErreur(true);
      setCode("");
    }
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const valeur = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCode(valeur);
    setErreur(false);
    if (valeur.length === 4) void soumettre(valeur);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 bg-fond text-center">
      <Mascotte taille={120} />
      <div>
        <h1 className="text-xl font-bold mb-1">Soleil est verrouillé</h1>
        <p className="text-texte-doux text-sm">Entre ton code à 4 chiffres pour continuer</p>
      </div>
      <input
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        autoFocus
        maxLength={4}
        value={code}
        disabled={enCours}
        onChange={onChange}
        aria-label="Code de verrouillage"
        aria-invalid={erreur}
        className="w-40 text-center text-3xl tracking-[0.5em] rounded-2xl border-2 py-3 px-4 focus:outline-none"
        style={{ borderColor: erreur ? "var(--color-terracotta)" : "var(--color-bordure)" }}
      />
      <p className="text-sm text-texte h-5" role="alert">
        {erreur ? "Code incorrect, réessaie." : ""}
      </p>

      {biometrieActivee() && (
        <div>
          <button
            type="button"
            onClick={() => {
              setErreurEmpreinte(false);
              void tenterEmpreinte();
            }}
            className="flex items-center gap-2 mx-auto px-4 py-2 rounded-full border border-bordure text-sm font-semibold cursor-pointer hover:bg-fond-douce"
          >
            <span aria-hidden="true">🔓</span> Déverrouiller avec mon empreinte
          </button>
          {erreurEmpreinte && (
            <p className="text-sm text-texte mt-2" role="alert">
              Empreinte non reconnue — réessaie ou utilise ton code.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
