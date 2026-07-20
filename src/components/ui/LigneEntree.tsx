import { useNavigate } from "react-router-dom";
import type { Entree } from "../../data/types";
import { libelleEntree, iconeEntree, sousTitreEntree } from "../../lib/libelleEntree";
import { formatDateTimeLisible } from "../../lib/date";
import { Pastille } from "./Pastille";

interface LigneEntreeProps {
  entree: Entree;
}

function cheminEdition(entree: Entree): string {
  if (entree.type === "symptom") return `/symptomes/${entree.item}?entreeId=${entree.id}`;
  if (entree.type === "track_something") return `/suivis/${entree.item}?entreeId=${entree.id}`;
  return `/medicaments/${entree.medicationId}?entreeId=${entree.id}`;
}

export function LigneEntree({ entree }: LigneEntreeProps) {
  const navigate = useNavigate();
  const sousTitre = sousTitreEntree(entree);

  return (
    <button
      onClick={() => navigate(cheminEdition(entree))}
      className="w-full flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-fond-douce transition-colors text-left cursor-pointer"
    >
      <span
        className="text-xl w-9 h-9 flex items-center justify-center rounded-full bg-fond-douce flex-shrink-0"
        aria-hidden="true"
      >
        {iconeEntree(entree)}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold text-sm truncate">{libelleEntree(entree)}</span>
        <span className="block text-xs text-texte-doux truncate">
          {formatDateTimeLisible(entree.datetime)}
          {sousTitre ? ` · ${sousTitre}` : ""}
        </span>
      </span>
      {"severity" in entree && entree.severity && <Pastille severite={entree.severity} />}
    </button>
  );
}
