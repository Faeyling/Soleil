import { useState, type ChangeEvent } from "react";
import { Mascotte } from "../mascotte/Mascotte";
import { verifierCode, marquerSessionDeverrouillee } from "../../lib/verrouillage";

interface EcranVerrouillageProps {
  onDeverrouille: () => void;
}

export function EcranVerrouillage({ onDeverrouille }: EcranVerrouillageProps) {
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState(false);
  const [enCours, setEnCours] = useState(false);

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
      <p className="text-sm text-terracotta-fonce h-5" role="alert">
        {erreur ? "Code incorrect, réessaie." : ""}
      </p>
    </div>
  );
}
