import type { ButtonHTMLAttributes, ReactNode } from "react";

interface BoutonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "plein" | "contour" | "discret" | "danger";
  couleur?: string;
  children: ReactNode;
}

export function Bouton({
  variante = "plein",
  couleur = "var(--color-terracotta)",
  className = "",
  style,
  children,
  ...props
}: BoutonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold text-base transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 cursor-pointer";

  let styleVariante: React.CSSProperties = {};
  if (variante === "plein") {
    styleVariante = { background: couleur, color: "white" };
  } else if (variante === "contour") {
    styleVariante = { background: "transparent", color: couleur, border: `2px solid ${couleur}` };
  } else if (variante === "discret") {
    styleVariante = { background: "var(--color-fond-douce)", color: "var(--color-texte)" };
  } else if (variante === "danger") {
    styleVariante = { background: "var(--color-severite-haut)", color: "white" };
  }

  return (
    <button className={`${base} ${className}`} style={{ ...styleVariante, ...style }} {...props}>
      {children}
    </button>
  );
}
