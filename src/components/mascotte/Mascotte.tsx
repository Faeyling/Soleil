interface MascotteProps {
  taille?: number;
  className?: string;
}

/** Mouton-nuage façon Moulin Roty : laine bouclée crème, cornes caramel, écharpe marine. */
export function Mascotte({ taille = 160, className }: MascotteProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={taille}
      height={taille}
      className={className}
      role="img"
      aria-label="Mascotte Soleil, un mouton-nuage"
    >
      <ellipse cx="100" cy="185" rx="55" ry="8" fill="#3a2e26" opacity="0.06" />

      {/* corps bouclé */}
      <g fill="#f7f0e4" stroke="#e6d5c0" strokeWidth="2">
        <circle cx="60" cy="110" r="26" />
        <circle cx="90" cy="92" r="30" />
        <circle cx="125" cy="98" r="28" />
        <circle cx="150" cy="120" r="24" />
        <circle cx="70" cy="140" r="26" />
        <circle cx="105" cy="150" r="30" />
        <circle cx="140" cy="145" r="24" />
      </g>

      {/* jambes / salopette */}
      <g fill="#5c6570">
        <rect x="75" y="165" width="12" height="20" rx="5" />
        <rect x="120" y="165" width="12" height="20" rx="5" />
      </g>

      {/* tête */}
      <circle cx="100" cy="105" r="34" fill="#fbf6ec" stroke="#e6d5c0" strokeWidth="2" />

      {/* oreilles */}
      <ellipse cx="72" cy="98" rx="8" ry="12" fill="#f0d3c4" transform="rotate(-20 72 98)" />
      <ellipse cx="128" cy="98" rx="8" ry="12" fill="#f0d3c4" transform="rotate(20 128 98)" />

      {/* cornes */}
      <path
        d="M84 82 Q78 68 88 62"
        fill="none"
        stroke="#b9713f"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M116 82 Q122 68 112 62"
        fill="none"
        stroke="#b9713f"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* museau brodé */}
      <ellipse cx="100" cy="118" rx="16" ry="11" fill="#fffaf1" stroke="#e6d5c0" strokeWidth="1.5" />
      <circle cx="100" cy="117" r="3.5" fill="#c96f4a" />

      {/* yeux */}
      <circle cx="90" cy="102" r="2.6" fill="#3a2e26" />
      <circle cx="110" cy="102" r="2.6" fill="#3a2e26" />

      {/* joues */}
      <circle cx="82" cy="112" r="5" fill="#f0d3c4" opacity="0.7" />
      <circle cx="118" cy="112" r="5" fill="#f0d3c4" opacity="0.7" />

      {/* sourire */}
      <path d="M94 122 Q100 126 106 122" fill="none" stroke="#3a2e26" strokeWidth="1.6" strokeLinecap="round" />

      {/* écharpe rayée marine et blanc */}
      <g>
        <path d="M72 128 Q100 142 128 128 L128 138 Q100 152 72 138 Z" fill="#f7f0e4" />
        <path d="M74 130 Q100 143 126 130 L126 134 Q100 147 74 134 Z" fill="#2f3e52" />
        <path d="M76 137 Q100 149 124 137 L124 140 Q100 152 76 140 Z" fill="#2f3e52" />
        <rect x="88" y="136" width="9" height="18" rx="3" fill="#2f3e52" transform="rotate(8 92 145)" />
      </g>
    </svg>
  );
}
