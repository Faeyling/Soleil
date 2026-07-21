import { useSyncExternalStore } from "react";
import { restaurerEntree } from "../../data/repositories/entreesRepository";
import {
  sAbonnerToastAnnulation,
  obtenirEtatToastAnnulation,
  effacerToastAnnulation,
} from "../../lib/toastAnnulerStore";

export function ToastAnnulerEntree() {
  const etat = useSyncExternalStore(sAbonnerToastAnnulation, obtenirEtatToastAnnulation);

  if (!etat) return null;

  const annuler = async () => {
    await restaurerEntree(etat.entree);
    effacerToastAnnulation();
  };

  return (
    <div
      role="status"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-full bg-[var(--color-texte)] text-[var(--color-fond)] pl-4 pr-1.5 py-1.5 shadow-lg text-sm max-w-[90vw]"
    >
      <span className="truncate">{etat.texte}</span>
      <button
        type="button"
        onClick={annuler}
        className="font-bold px-3 py-1.5 rounded-full cursor-pointer hover:opacity-80 shrink-0"
      >
        Annuler
      </button>
    </div>
  );
}
