import { useState, type ChangeEvent } from "react";
import { Bouton } from "../../components/ui/Bouton";
import { classesInput } from "../../components/ui/Champ";
import {
  codeEstDefini,
  definirCode,
  verifierCode,
  supprimerCode,
  verrouillerMaintenant,
} from "../../lib/verrouillage";

type Etape =
  | { type: "repos" }
  | { type: "verifier-avant"; suite: "modifier" | "desactiver" }
  | { type: "nouveau" }
  | { type: "confirmer"; nouveauCode: string };

export function SectionSecurite() {
  const [actif, setActif] = useState(codeEstDefini);
  const [etape, setEtape] = useState<Etape>({ type: "repos" });
  const [saisie, setSaisie] = useState("");
  const [erreur, setErreur] = useState<string | undefined>();
  const [succes, setSucces] = useState<string | undefined>();

  const reinitialiser = () => {
    setEtape({ type: "repos" });
    setSaisie("");
    setErreur(undefined);
  };

  const traiterSaisieComplete = async (valeur: string) => {
    setErreur(undefined);

    if (etape.type === "verifier-avant") {
      const correct = await verifierCode(valeur);
      if (!correct) {
        setErreur("Code incorrect.");
        setSaisie("");
        return;
      }
      if (etape.suite === "desactiver") {
        supprimerCode();
        setActif(false);
        setSucces("Verrouillage désactivé.");
        reinitialiser();
        return;
      }
      setEtape({ type: "nouveau" });
      setSaisie("");
      return;
    }

    if (etape.type === "nouveau") {
      setEtape({ type: "confirmer", nouveauCode: valeur });
      setSaisie("");
      return;
    }

    if (etape.type === "confirmer") {
      if (valeur !== etape.nouveauCode) {
        setErreur("Les deux codes ne correspondent pas, recommence.");
        setEtape({ type: "nouveau" });
        setSaisie("");
        return;
      }
      await definirCode(valeur);
      setActif(true);
      setSucces("Code de verrouillage enregistré.");
      reinitialiser();
    }
  };

  const onChangeSaisie = (e: ChangeEvent<HTMLInputElement>) => {
    const valeur = e.target.value.replace(/\D/g, "").slice(0, 4);
    setSaisie(valeur);
    if (valeur.length === 4) void traiterSaisieComplete(valeur);
  };

  const verrouillerEtRecharger = () => {
    verrouillerMaintenant();
    window.location.href = "/";
  };

  const libelleEtape = (() => {
    switch (etape.type) {
      case "verifier-avant":
        return "Entre ton code actuel";
      case "nouveau":
        return "Choisis un nouveau code à 4 chiffres";
      case "confirmer":
        return "Confirme le nouveau code";
      default:
        return null;
    }
  })();

  return (
    <section className="mb-8">
      <h2 className="font-bold text-lg mb-3">Sécurité</h2>
      <div className="rounded-[var(--rayon-grand)] bg-surface border border-bordure p-4 flex flex-col gap-3">
        <p className="text-sm text-texte-doux">
          Protège l'accès à Soleil par un code à 4 chiffres demandé à chaque nouvelle ouverture de
          l'application. Ce code reste uniquement sur cet appareil, sous forme chiffrée.
        </p>

        {succes && (
          <p className="text-sm rounded-xl px-3 py-2 bg-sauge-clair text-sauge-fonce">
            <span aria-hidden="true">✓ </span>
            {succes}
          </p>
        )}

        {libelleEtape ? (
          <div>
            <label className="block text-sm font-semibold mb-1.5">{libelleEtape}</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus
              maxLength={4}
              value={saisie}
              onChange={onChangeSaisie}
              className={`${classesInput} text-center text-2xl tracking-[0.5em] max-w-[10rem]`}
              aria-label={libelleEtape}
            />
            {erreur && <p className="text-sm text-terracotta-fonce mt-2">{erreur}</p>}
            <Bouton variante="discret" className="mt-3" onClick={reinitialiser}>
              Annuler
            </Bouton>
          </div>
        ) : actif ? (
          <div className="flex flex-wrap gap-3">
            <Bouton
              variante="contour"
              onClick={() => {
                setSucces(undefined);
                setEtape({ type: "verifier-avant", suite: "modifier" });
              }}
            >
              Modifier le code
            </Bouton>
            <Bouton variante="contour" onClick={verrouillerEtRecharger}>
              Verrouiller maintenant
            </Bouton>
            <Bouton
              variante="danger"
              onClick={() => {
                setSucces(undefined);
                setEtape({ type: "verifier-avant", suite: "desactiver" });
              }}
            >
              Désactiver
            </Bouton>
          </div>
        ) : (
          <Bouton
            onClick={() => {
              setSucces(undefined);
              setEtape({ type: "nouveau" });
            }}
          >
            Activer un code de verrouillage
          </Bouton>
        )}
      </div>
    </section>
  );
}
