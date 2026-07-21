import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface EnTeteProps {
  titre: string;
  couleur?: string;
  onRetour?: () => void;
  /** Élément optionnel affiché à droite du titre (ex. bouton "Gérer"). */
  action?: ReactNode;
}

export function EnTete({ titre, couleur, onRetour, action }: EnTeteProps) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3 mb-5">
      <button
        onClick={onRetour ?? (() => navigate(-1))}
        aria-label="Retour"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-surface border border-bordure shadow-[var(--ombre)] cursor-pointer text-lg"
      >
        ←
      </button>
      <h1 className="text-xl font-bold flex-1" style={couleur ? { color: couleur } : undefined}>
        {titre}
      </h1>
      {action}
    </div>
  );
}
