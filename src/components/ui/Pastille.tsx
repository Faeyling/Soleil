import type { Severite } from "../../lib/severite";
import { COULEUR_SEVERITE, LABEL_SEVERITE } from "../../lib/severite";

interface PastilleProps {
  severite: Severite;
  taille?: number;
  avecLabel?: boolean;
}

export function Pastille({ severite, taille = 12, avecLabel = false }: PastilleProps) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          display: "inline-block",
          width: taille,
          height: taille,
          borderRadius: "999px",
          background: COULEUR_SEVERITE[severite],
          flexShrink: 0,
        }}
        aria-hidden={avecLabel}
        role={avecLabel ? undefined : "img"}
        aria-label={avecLabel ? undefined : `Sévérité : ${LABEL_SEVERITE[severite]}`}
      />
      {avecLabel && (
        <span className="text-sm text-texte-doux">{LABEL_SEVERITE[severite]}</span>
      )}
    </span>
  );
}
