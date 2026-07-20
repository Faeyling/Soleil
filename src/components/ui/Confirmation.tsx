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
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onAnnuler}
    >
      <div
        className="w-full max-w-sm rounded-[var(--rayon-grand)] bg-surface p-6 shadow-[var(--ombre-forte)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-2">{titre}</h2>
        <p className="text-texte-doux mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <Bouton variante="discret" onClick={onAnnuler}>
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
