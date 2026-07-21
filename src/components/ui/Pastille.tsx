import type { Severite } from "../../lib/severite";
import { couleurSeverite, labelSeverite } from "../../lib/severite";

interface PastilleProps {
  severite: Severite;
  /** Slug de l'élément suivi (ex. "sommeil") — détermine le libellé personnalisé éventuel. */
  itemId?: string;
  taille?: number;
  avecLabel?: boolean;
}

export function Pastille({ severite, itemId, taille = 12, avecLabel = false }: PastilleProps) {
  const label = labelSeverite(severite, itemId);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          display: "inline-block",
          width: taille,
          height: taille,
          borderRadius: "999px",
          background: couleurSeverite(severite),
          flexShrink: 0,
        }}
        aria-hidden={avecLabel}
        role={avecLabel ? undefined : "img"}
        aria-label={avecLabel ? undefined : `Sévérité : ${label}`}
      />
      {avecLabel && <span className="text-sm text-texte-doux">{label}</span>}
    </span>
  );
}
