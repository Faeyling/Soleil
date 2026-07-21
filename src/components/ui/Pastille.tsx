import type { Severite } from "../../lib/severite";
import { couleurSeverite, LABEL_SEVERITE } from "../../lib/severite";

interface PastilleProps {
  severite: Severite;
  /** Slug de l'élément suivi (ex. "sommeil") — détermine si l'échelle de couleur est inversée. */
  itemId?: string;
  taille?: number;
  avecLabel?: boolean;
}

export function Pastille({ severite, itemId, taille = 12, avecLabel = false }: PastilleProps) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          display: "inline-block",
          width: taille,
          height: taille,
          borderRadius: "999px",
          background: couleurSeverite(severite, itemId),
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
