interface MascotteProps {
  taille?: number;
  className?: string;
}

/** Mouton-nuage, mascotte de Soleil. */
export function Mascotte({ taille = 160, className }: MascotteProps) {
  return (
    <img
      src="/icon-512.png"
      width={taille}
      height={taille}
      className={`rounded-[22%] shadow-[0_4px_14px_rgba(58,46,38,0.18)] ${className ?? ""}`}
      alt="Mascotte Soleil, un mouton-nuage"
    />
  );
}
