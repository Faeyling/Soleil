import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { EcranVerrouillage } from "../components/ui/EcranVerrouillage";
import { ToastAnnulerEntree } from "../components/ui/ToastAnnulerEntree";
import { NotificationMiseAJour } from "../components/ui/NotificationMiseAJour";
import { estDeverrouille } from "../lib/verrouillage";

const ONGLETS = [
  { to: "/", label: "Accueil", icone: "🏠", fin: true },
  { to: "/historique", label: "Historique", icone: "📅" },
  { to: "/ressources", label: "Ressources", icone: "📖" },
  { to: "/profil", label: "Profil", icone: "👤" },
];

export function Layout() {
  const [deverrouille, setDeverrouille] = useState(estDeverrouille);

  if (!deverrouille) {
    return <EcranVerrouillage onDeverrouille={() => setDeverrouille(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-fond">
      <NotificationMiseAJour />
      <header className="flex items-center gap-2 max-w-2xl w-full mx-auto px-4 pt-4">
        <img
          src="/icon-512.png"
          alt=""
          aria-hidden="true"
          width={32}
          height={32}
          className="rounded-[22%] shadow-[0_1px_4px_rgba(58,46,38,0.18)]"
        />
        <span className="font-bold text-lg" style={{ color: "var(--color-ardoise)" }}>
          Soleil
        </span>
      </header>
      <main className="flex-1 pb-24 max-w-2xl w-full mx-auto px-4 pt-2">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-bordure z-40">
        <div className="max-w-2xl mx-auto flex justify-around">
          {ONGLETS.map((onglet) => (
            <NavLink
              key={onglet.to}
              to={onglet.to}
              end={onglet.fin}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2.5 px-3 flex-1 text-xs font-semibold transition-colors ${
                  isActive ? "text-ardoise" : "text-texte-doux"
                }`
              }
            >
              <span className="text-xl leading-none" aria-hidden="true">
                {onglet.icone}
              </span>
              {onglet.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <ToastAnnulerEntree />
    </div>
  );
}
