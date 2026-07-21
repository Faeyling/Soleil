import { useEffect, useId, useRef } from "react";
import { Bouton } from "./Bouton";

interface ConfirmationProps {
  titre: string;
  message: string;
  labelConfirmer?: string;
  labelAnnuler?: string;
  onConfirmer: () => void;
  onAnnuler: () => void;
}

export function Confirmation({
  titre,
  message,
  labelConfirmer = "Supprimer",
  labelAnnuler = "Annuler",
  onConfirmer,
  onAnnuler,
}: ConfirmationProps) {
  const titreId = useId();
  const conteneurRef = useRef<HTMLDivElement>(null);
  const boutonAnnulerRef = useRef<HTMLButtonElement>(null);

  // Piège le focus dans la modale (Tab/Shift+Tab bouclent), ferme sur Échap,
  // et restitue le focus à l'élément qui avait le focus avant l'ouverture.
  useEffect(() => {
    const elementActifAvant = document.activeElement as HTMLElement | null;
    boutonAnnulerRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onAnnuler();
        return;
      }
      if (e.key !== "Tab" || !conteneurRef.current) return;

      const focusables = conteneurRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const premier = focusables[0];
      const dernier = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === premier) {
        e.preventDefault();
        dernier.focus();
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault();
        premier.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      elementActifAvant?.focus();
    };
  }, [onAnnuler]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onAnnuler}
    >
      <div
        ref={conteneurRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titreId}
        className="w-full max-w-sm rounded-[var(--rayon-grand)] bg-surface p-6 shadow-[var(--ombre-forte)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titreId} className="text-lg font-bold mb-2">
          {titre}
        </h2>
        <p className="text-texte-doux mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <Bouton ref={boutonAnnulerRef} variante="discret" onClick={onAnnuler}>
            {labelAnnuler}
          </Bouton>
          <Bouton variante="danger" onClick={onConfirmer}>
            {labelConfirmer}
          </Bouton>
        </div>
      </div>
    </div>
  );
}
